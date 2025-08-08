import { Request, Response } from 'express';
import { pool } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { generateToken } from '../utils/jwt.utils';
import { User, Role } from '../models/database';
import { z } from 'zod';
import { RowDataPacket } from 'mysql2';

const registerSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
});

export const registerUser = async (req: Request, res: Response) => {
    console.log("Attempting to register with body:", req.body);
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
        console.error("Registration validation failed:", validation.error.issues);
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
    }

    const { name, email, password } = validation.data;

    const connection = await pool.getConnection();
    try {
        const [employeeRole] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['employee']);
        if ((employeeRole as any).length === 0) {
            console.error("Default 'employee' role not found in the database.");
            return res.status(500).json({ message: 'Server configuration error.' });
        }
        const roleId = (employeeRole as any)[0].id;

        const hashedPassword = await hashPassword(password);
        await connection.execute(
            'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, roleId]
        );

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error: any) {
        console.error('Registration Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Name or email already exists.' });
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

export const loginUser = async (req: Request, res: Response) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
    }

    const { email, password, rememberMe } = validation.data;

    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT u.id, u.password, u.name, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
            [email]
        );

        if ((rows as any).length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = rows[0] as User & { role: string, name: string };
        const isMatch = await comparePassword(password, user.password!);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken(user.id, user.role, user.name, rememberMe || false);

        res.json({
            token,
            user: { id: user.id, role: user.role, name: user.name, email: email },
        });
    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'An internal error occurred during login.' });
    } finally {
        connection.release();
    }
};
