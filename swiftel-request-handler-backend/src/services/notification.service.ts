import { pool } from '../config/database';
import { PoolConnection } from 'mysql2/promise';
import { Notification } from '../models/types';

import { sendNotificationToClient } from '../websocket';

const getExecutor = (connection?: any) => connection || pool;

/**
 * Creates a new notification for a user.
 * Can be used with a transaction connection.
 */
export const createNotification = async (userId: number, message: string, link: string | null, connection?: any): Promise<void> => {
  const executor = getExecutor(connection);
  const [result] = await executor.execute(
    'INSERT INTO notifications (user_id, message, link, is_read) VALUES (?, ?, ?, ?)',
    [userId, message, link, false]
  );
  const [notification] = await executor.execute('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  sendNotificationToClient(userId, notification[0]);
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

export const markAllAsRead = async (userId: number): Promise<void> => {
    await pool.execute(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
        [userId]
    );
};
