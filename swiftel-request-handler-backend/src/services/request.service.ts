import { pool } from '../config/database';
import { Decision, Request as DBRequest } from '../models/database';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { createNotification } from './notification.service';

export const updateRequestStatus = async (requestId: number, connection: any) => {
    const [requestRows] = await connection.execute('SELECT created_by, status, type, title FROM requests WHERE id = ?', [requestId]);
    if (requestRows.length === 0) return;

    const request = requestRows[0] as DBRequest & { created_by: number, title: string };
    const currentStatus = request.status;
    const requestType = request.type;
    const employeeId = request.created_by;

    let finalStatus: DBRequest['status'] = 'pending';

    // Non-monetary requests are approved/rejected by the first decision
    if (requestType !== 'monetary') {
        const [decisions] = await connection.execute('SELECT decision FROM decisions WHERE request_id = ?', [requestId]);
        if (decisions.length > 0) {
            finalStatus = (decisions[0] as Decision).decision;
        }
    } else {
    // Monetary requests require unanimous decision from all board members
        const [boardMembers] = await connection.execute(
            "SELECT COUNT(id) as count FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'board_member')"
        );
        const totalBoardMembers = boardMembers[0].count as number;

        if (totalBoardMembers > 0) {
            const [decisions] = await connection.execute('SELECT decision FROM decisions WHERE request_id = ?', [requestId]);
            const decisionCount = decisions.length;

            if (decisionCount === totalBoardMembers) {
                const firstDecision = (decisions[0] as Decision).decision;
                const allSame = decisions.every((d: any) => d.decision === firstDecision);
                if (allSame) {
                    finalStatus = firstDecision;
                } else {
                    finalStatus = 'pending'; // Remains pending for debate if not unanimous
                }
            } else {
                finalStatus = 'pending'; // Remains pending if not all board members have decided
            }
        }
    }

    // Only update and notify if the status has changed
    if (finalStatus !== currentStatus) {
        await connection.execute('UPDATE requests SET status = ? WHERE id = ?', [finalStatus, requestId]);

        // Create a notification for the employee who made the request
        const message = `Your request "${request.title}" has been ${finalStatus}.`;
        await createNotification(employeeId, message, connection);
    }
};

export const processDecision = async (requestId: number, userId: number, decision: 'approved' | 'rejected', isAdminOverride: boolean = false, adminId?: number) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        if (isAdminOverride) {
            // Admin is overriding or making a decision on behalf of a board member
            const boardMemberId = userId;
            await connection.execute(
                'REPLACE INTO decisions (request_id, board_member_id, decision) VALUES (?, ?, ?)',
                [requestId, boardMemberId, decision]
            );
        } else {
            // A board member is making their own decision, check status first
            const [request] = await connection.execute('SELECT status FROM requests WHERE id = ?', [requestId]);
            if (request.length > 0 && (request[0] as DBRequest).status !== 'pending') {
                throw new Error('This request is already finalized and cannot be changed.');
            }
            await connection.execute(
                'REPLACE INTO decisions (request_id, board_member_id, decision) VALUES (?, ?, ?)',
                [requestId, userId, decision]
            );
        }

        await updateRequestStatus(requestId, connection);
        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
