import { pool } from '../config/database';
import { PoolConnection } from 'mysql2/promise';
import { Notification } from '../models/types';

const getExecutor = (connection?: PoolConnection) => connection || pool;

/**
 * Creates a new notification for a user.
 * Can be used with a transaction connection.
 */
export const createNotification = async (userId: number, message: string, connection?: PoolConnection): Promise<void> => {
  const executor = getExecutor(connection);
  await executor.execute(
    'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
    [userId, message, false]
  );
};

export const getNotifications = async (userId: number): Promise<Notification[]> => {
  const [rows] = await pool.execute(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows as Notification[];
};

export const markAsRead = async (notificationId: number): Promise<Notification> => {
  await pool.execute(
    'UPDATE notifications SET is_read = TRUE WHERE id = ?',
    [notificationId]
  );
  const [rows] = await pool.execute(
    'SELECT * FROM notifications WHERE id = ?',
    [notificationId]
  );
  return (rows as Notification[])[0];
};
