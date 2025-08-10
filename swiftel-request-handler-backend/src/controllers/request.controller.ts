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
        const query = `
            SELECT 
                r.id, r.title, r.description, r.type, r.amount, r.status, r.created_at,
                u.username as employee_username,
                (SELECT JSON_ARRAYAGG(JSON_OBJECT('board_member_id', d.board_member_id, 'username', bu.username, 'decision', d.decision))
                 FROM decisions d
                 JOIN users bu ON d.board_member_id = bu.id
                 WHERE d.request_id = r.id) as decisions
            FROM requests r
            JOIN users u ON r.created_by = u.id
            ORDER BY r.created_at DESC
        `;
        const [rows] = await pool.execute<RowDataPacket[]>(query);
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
        
        await processDecision(requestId, finalUserId, decision, isAdmin);
        res.json({ message: 'Decision recorded successfully.' });

    } catch (error: any) {
        console.error('Make Decision Error:', error);
        if (error.message.includes('finalized')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'An internal error occurred while processing the decision.' });
    }
};

const adminUpdateDecisionSchema = z.object({
    requestId: z.number(),
    boardMemberId: z.number(),
    decision: z.enum(['approved', 'rejected'])
});

export const adminUpdateDecision = async (req: AuthenticatedRequest, res: Response) => {
    const validation = adminUpdateDecisionSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
    }

    const { requestId, boardMemberId, decision } = validation.data;
    
    try {
        await processDecision(requestId, boardMemberId, decision, true, req.user!.id);
        res.json({ message: 'Admin successfully updated decision.' });
    } catch (error: any) {
        console.error('Admin Update Decision Error:', error);
        res.status(500).json({ message: 'An internal error occurred during the admin decision update.' });
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
    try {
        const query = `
            SELECT 
                r.id, r.title, r.description, r.type, r.amount, r.status, r.created_at,
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
        res.json(rows[0]);
    } catch (error: any) {
        console.error('Get Request By ID Error:', error);
        res.status(500).json({ message: 'An internal error occurred while fetching the request.' });
    }
};
