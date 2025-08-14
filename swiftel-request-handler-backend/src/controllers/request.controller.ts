import { Response } from 'express';
import { AuthenticatedRequest } from '../models/types';
import { pool } from '../config/database';
import { processDecision } from '../services/request.service';
import { z } from 'zod';
import { Request as DBRequest } from '../models/database';
import { RowDataPacket } from 'mysql2/promise';

import { createNotification } from '../services/notification.service';

const requestSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    type: z.enum(['monetary', 'non-monetary']),
    amount: z.number().positive().optional(),
}).refine(data => data.type !== 'monetary' || (data.type === 'monetary' && data.amount !== undefined), {
    message: "A valid amount is required for monetary requests.",
    path: ["amount"],
});

export const createRequest = async (req: AuthenticatedRequest, res: Response) => {
    const validation = requestSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
    }

    const { title, description, type, amount } = validation.data;
    const { id: userId, username } = req.user!;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.execute<any>(
            'INSERT INTO requests (created_by, title, description, type, amount) VALUES (?, ?, ?, ?, ?)',
            [userId, title, description, type, amount || null]
        );
        const requestId = result.insertId;

        // Notify admins and board members
        const [usersToNotify] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM users WHERE role_id IN (SELECT id FROM roles WHERE name IN (?, ?))',
            ['admin', 'board_member']
        );

        const message = `${username} submitted a new request: "${title}"`;
        const link = `/requests`;

        for (const user of usersToNotify) {
            await createNotification(user.id, message, link, connection);
        }

        await connection.commit();
        res.status(201).json({ message: 'Request created successfully.' });
    } catch (error: any) {
        await connection.rollback();
        console.error('Create Request Error:', error);
        res.status(500).json({ message: 'An internal error occurred while creating the request.' });
    } finally {
        connection.release();
    }
};

export const getMyRequests = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    try {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, title, description, type, amount, status, created_at FROM requests WHERE created_by = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(rows as DBRequest[]);
    } catch (error: any) {
        console.error('Get My Requests Error:', error);
        res.status(500).json({ message: 'An internal error occurred while fetching your requests.' });
    }
};

export const getAllRequests = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { status, type, sortBy, sortOrder } = req.query;

        let query = `
            SELECT 
                r.id, r.title, r.description, r.type, r.amount, r.status, r.created_at,
                u.username as employee_username,
                (SELECT JSON_ARRAYAGG(JSON_OBJECT('board_member_id', d.board_member_id, 'username', bu.username, 'decision', d.decision))
                 FROM decisions d
                 JOIN users bu ON d.board_member_id = bu.id
                 WHERE d.request_id = r.id) as decisions
            FROM requests r
            JOIN users u ON r.created_by = u.id
        `;
        
        const whereClauses = [];
        const queryParams = [];

        if (status && typeof status === 'string') {
            whereClauses.push('r.status = ?');
            queryParams.push(status);
        }
        if (type && typeof type === 'string') {
            whereClauses.push('r.type = ?');
            queryParams.push(type);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        const validSortBy = ['created_at', 'title', 'status'];
        const validSortOrder = ['ASC', 'DESC'];
        
        let orderBy = 'ORDER BY r.created_at DESC'; // Default sort
        if (sortBy && typeof sortBy === 'string' && validSortBy.includes(sortBy)) {
            const order = (sortOrder && typeof sortOrder === 'string' && validSortOrder.includes(sortOrder.toUpperCase())) ? sortOrder.toUpperCase() : 'DESC';
            orderBy = `ORDER BY r.${sortBy} ${order}`;
        }
        
        query += ` ${orderBy}`;

        const [rows] = await pool.execute<RowDataPacket[]>(query, queryParams);
        res.json(rows);
    } catch (error: any) {
        console.error('Get All Requests Error:', error);
        res.status(500).json({ message: 'An internal error occurred while fetching all requests.' });
    }
};

const decisionSchema = z.object({
    decision: z.enum(['approved', 'rejected']),
    boardMemberId: z.number().optional(), 
});

export const makeDecision = async (req: AuthenticatedRequest, res: Response) => {
    const requestId = Number(req.params.id);
    const validation = decisionSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
    }

    const { decision, boardMemberId } = validation.data;
    const { id: userId, role: userRole } = req.user!;

    try {
        const isAdmin = userRole === 'admin';
        const finalUserId = isAdmin && boardMemberId ? boardMemberId : userId;
        
        await processDecision(requestId, finalUserId, decision, isAdmin, isAdmin ? userId : undefined);
        res.json({ message: 'Decision recorded successfully.' });

    } catch (error: any) {
        console.error('Make Decision Error:', error);
        if (error.message.includes('finalized')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'An internal error occurred while processing the decision.' });
    }
};



export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    const { id, role } = req.user!;

    try {
        let stats;
        if (role === 'employee') {
            const [myRequests] = await pool.execute<RowDataPacket[]>(
                'SELECT status, COUNT(id) as count FROM requests WHERE created_by = ? GROUP BY status',
                [id]
            );
            stats = {
                totalRequests: myRequests.reduce((acc: any, r: any) => acc + r.count, 0),
                approved: myRequests.find((r: any) => r.status === 'approved')?.count || 0,
                rejected: myRequests.find((r: any) => r.status === 'rejected')?.count || 0,
                pending: myRequests.find((r: any) => r.status === 'pending')?.count || 0,
            };
        } else { // Admin or Board Member
            const [globalStats] = await pool.execute<RowDataPacket[]>(
                `SELECT
                    (SELECT COUNT(id) FROM requests) as totalRequests,
                    (SELECT COUNT(id) FROM requests WHERE status='pending') as pendingRequests,
                    (SELECT COUNT(id) FROM requests WHERE status='approved') as approvedRequests,
                    (SELECT COUNT(id) FROM requests WHERE status='rejected') as rejectedRequests,
                    (SELECT COUNT(id) FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'employee')) as totalEmployees`
            );
            stats = globalStats[0];
        }
        res.json(stats);
    } catch (error: any) {
        console.error('Get Dashboard Stats Error:', error);
        res.status(500).json({ message: 'An internal error occurred while fetching dashboard stats.' });
    }
};

export const getRequestById = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { id: userId, role } = req.user!;

    try {
        const query = `
            SELECT 
                r.id, r.title, r.description, r.type, r.amount, r.status, r.created_at,
                r.created_by,
                u.username as employee_username,
                (SELECT JSON_ARRAYAGG(JSON_OBJECT('board_member_id', d.board_member_id, 'username', bu.username, 'decision', d.decision))
                 FROM decisions d
                 JOIN users bu ON d.board_member_id = bu.id
                 WHERE d.request_id = r.id) as decisions
            FROM requests r
            JOIN users u ON r.created_by = u.id
            WHERE r.id = ?
        `;
        const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        const request = rows[0] as any;

        if (role === 'employee' && request.created_by !== userId) {
            return res.status(403).json({ message: 'You are not authorized to view this request.' });
        }

        res.json(request);
    } catch (error: any) {
        console.error('Get Request By ID Error:', error);
        res.status(500).json({ message: 'An internal error occurred while fetching the request.' });
    }
};

export const updateRequest = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const validation = requestSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
    }

    const { title, description, type, amount } = validation.data;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [requestRows] = await connection.execute<RowDataPacket[]>('SELECT created_by, status FROM requests WHERE id = ? FOR UPDATE', [id]);
        if (requestRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Request not found.' });
        }

        const request = requestRows[0] as DBRequest & { created_by: number };
        if (request.created_by !== userId) {
            await connection.rollback();
            return res.status(403).json({ message: 'You are not authorized to edit this request.' });
        }
        if (request.status !== 'pending') {
            await connection.rollback();
            return res.status(403).json({ message: 'You can only edit pending requests.' });
        }

        await connection.execute(
            'UPDATE requests SET title = ?, description = ?, type = ?, amount = ? WHERE id = ?',
            [title, description, type, amount || null, id]
        );

        await connection.commit();
        res.json({ message: 'Request updated successfully.' });
    } catch (error: any) {
        await connection.rollback();
        console.error('Update Request Error:', error);
        res.status(500).json({ message: 'An internal error occurred while updating the request.' });
    } finally {
        connection.release();
    }
};

export const adminUpdateRequest = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const validation = requestSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
    }

    const { title, description, type, amount } = validation.data;

    try {
        const [requestRows] = await pool.execute<RowDataPacket[]>('SELECT id FROM requests WHERE id = ?', [id]);
        if (requestRows.length === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        await pool.execute(
            'UPDATE requests SET title = ?, description = ?, type = ?, amount = ? WHERE id = ?',
            [title, description, type, amount || null, id]
        );

        res.json({ message: 'Request updated successfully by admin.' });
    } catch (error: any) {
        console.error('Admin Update Request Error:', error);
        res.status(500).json({ message: 'An internal error occurred while updating the request.' });
    }
};

export const deleteRequest = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [requestRows] = await connection.execute<RowDataPacket[]>('SELECT created_by, status FROM requests WHERE id = ? FOR UPDATE', [id]);
        if (requestRows.length === 0) {
            await connection.rollback();
            return res.status(204).send();
        }

        const request = requestRows[0] as DBRequest & { created_by: number };
        if (request.created_by !== userId) {
            await connection.rollback();
            return res.status(403).json({ message: 'You are not authorized to delete this request.' });
        }
        if (request.status !== 'pending') {
            await connection.rollback();
            return res.status(403).json({ message: 'You can only delete pending requests.' });
        }

        await connection.execute('DELETE FROM requests WHERE id = ?', [id]);
        await connection.commit();

        res.status(204).send();
    } catch (error: any) {
        await connection.rollback();
        console.error('Delete Request Error:', error);
        res.status(500).json({ message: 'An internal error occurred while deleting the request.' });
    } finally {
        connection.release();
    }
};

export const adminDeleteRequest = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
        const [result] = await pool.execute<any>('DELETE FROM requests WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        res.status(204).send();
    } catch (error: any) {
        console.error('Admin Delete Request Error:', error);
        res.status(500).json({ message: 'An internal error occurred while deleting the request.' });
    }
};
