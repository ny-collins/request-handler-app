import { Response } from 'express';
import { AuthenticatedRequest } from '../models/types';
import * as UserService from '../services/user.service';
import { pool } from '../config/database';
import { hashPassword } from '../utils/password.utils';
import { z } from 'zod';
import { User } from '../models/database';
import { RowDataPacket } from 'mysql2';

export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = await UserService.getAllUsers();
        res.json(users);
    } catch (error: any) {
        console.error('Get All Users Error:', error);
        res.status(500).json({ message: 'An internal error occurred while fetching users.' });
    }
};

export const getRoles = async (req: AuthenticatedRequest, res: Response) => {
     try {
        const roles = await UserService.getRoles();
        res.json(roles);
    } catch (error: any) {
        console.error('Get Roles Error:', error);
        res.status(500).json({ message: 'An internal error occurred while fetching roles.' });
    }
}

const updateUserSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    role: z.string(), // Further validation in service layer
});

export const updateUserByAdmin = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
    }

    const { username, email, role } = validation.data;
    try {
        const result = await UserService.updateUserByAdmin(Number(id), username, email, role);
        res.json(result);
    } catch (error: any) {
        console.error('Update User by Admin Error:', error);
        if (error.message.includes('not found') || error.message.includes('Invalid role')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Cannot modify an admin')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'An internal error occurred while updating the user.' });
    }
};

export const getMyAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT id, username, email FROM users WHERE id = ?', [req.user!.id]);
        if (rows.length === 0) return res.status(404).json({ message: "User not found" });
        res.json(rows[0] as User);
    } catch (error: any) {
        console.error('Get My Account Error:', error);
        res.status(500).json({ message: 'An internal error occurred while fetching account details.' });
    }
};

const updateMyAccountSchema = z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
}).refine(data => !!data.username || !!data.email || !!data.password, { message: 'No fields to update.' });

export const updateMyAccount = async (req: AuthenticatedRequest, res: Response) => {
    const validation = updateMyAccountSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
    }

    const { username, email, password } = validation.data;
    const userId = req.user!.id;

    let query = 'UPDATE users SET ';
    const params = [];
    if (username) {
        query += 'username = ?, ';
        params.push(username);
    }
    if (email) {
        query += 'email = ?, ';
        params.push(email);
    }
    if (password) {
        const hashedPassword = await hashPassword(password);
        query += 'password = ?, ';
        params.push(hashedPassword);
    }

    query = query.slice(0, -2); // Remove trailing comma and space
    query += ' WHERE id = ?';
    params.push(userId);
    
    try {
        await pool.execute(query, params);
        res.json({ message: 'Account updated successfully.' });
    } catch (error: any) {
        console.error('Update My Account Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Username or email already exists.' });
        }
        res.status(500).json({ message: 'An internal error occurred while updating your account.' });
    }
};

export const deleteUserByAdmin = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
        const result = await UserService.deleteUserByAdmin(Number(id));
        res.json(result);
    } catch (error: any) {
        console.error('Delete User by Admin Error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Cannot delete an admin')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'An internal error occurred while deleting the user.' });
    }
};
