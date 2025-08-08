import { RowDataPacket } from 'mysql2/promise';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../models/types';
import { pool } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { generateToken } from '../utils/jwt.utils';
import { User, Role } from '../models/database';
import { z } from 'zod';

const registerSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
});

export const registerUser = async (req: AuthenticatedRequest, res: Response) => {
    console.log("Attempting to register with body:", req.body);
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
        console.error("Registration validation failed:", validation.error.issues);
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
    }

    const { username, email, password } = validation.data;

    const connection = await pool.getConnection();
    try {
        const [employeeRoleRows] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['employee']);

        if (!employeeRole) {
            console.error("Default 'employee' role not found in the database.");
            return res.status(500).json({ message: 'Server configuration error.' });
        }
        const roleId = employeeRole.id;

        const hashedPassword = await hashPassword(password);
        await connection.execute(
            'INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, roleId]
        );

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error: any) {
        console.error('Registration Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }
        res.status(500).json({ message: 'An internal error occurred during registration.' });
    } finally {
        connection.release();
    }
};

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    rememberMe: z.boolean().optional(),
});

export const loginUser = async (req: AuthenticatedRequest, res: Response) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
    }

    const { email, password, rememberMe } = validation.data;

    const connection = await pool.getConnection();
    try {
        const [userRows] = await connection.execute(
            'SELECT u.id, u.password, u.username, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
            [email]
        );

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await comparePassword(password, user.password!);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken(user.id, user.role, user.username, rememberMe || false);

        res.json({
            token,
            user: { id: user.id, role: user.role, username: user.username, email: email },
        });
    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'An internal error occurred during login.' });
    } finally {
        connection.release();
    }
};
