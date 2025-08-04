import mysql from 'mysql2/promise';
import { env } from './environment';

export const pool = mysql.createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

pool.getConnection()
    .then((connection: any) => {
        console.log('Successfully connected to the database.');
        connection.release();
    })
    .catch((err: any) => {
        console.error('Error connecting to the database:', err);
    });
