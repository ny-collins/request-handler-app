import { pool } from '../config/database';
import { User, Role } from '../models/database';
import { RowDataPacket } from 'mysql2/promise';

export const getAllUsers = async (): Promise<User[]> => {
    const [rows] = await pool.execute(
        'SELECT u.id, u.username, u.email, r.name as role, u.created_at FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC'
    );
    return rows as User[];
};

export const updateUserByAdmin = async (userId: number, username: string, email: string, roleName: string) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [targetUserRole] = await connection.execute(
            'SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
            [userId]
        );
        if (targetUserRole.length === 0) throw new Error('User not found.');
        if ((targetUserRole[0] as any).role === 'admin') throw new Error('Cannot modify an admin account.');

        const [role] = await connection.execute('SELECT id FROM roles WHERE name = ?', [roleName]);
        if (role.length === 0) throw new Error('Invalid role specified.');
        const roleId = (role[0] as Role).id;

        await connection.execute(
            'UPDATE users SET username = ?, email = ?, role_id = ? WHERE id = ?',
            [username, email, roleId, userId]
        );

        await connection.commit();
        return { message: 'User updated successfully.' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const getRoles = async (): Promise<Pick<Role, 'name'>[]> => {
    const [rows] = await pool.execute('SELECT name FROM roles WHERE name != "admin"');
    return rows as Pick<Role, 'name'>[];
}
