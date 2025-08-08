import mysql from 'mysql2/promise';
import { env } from './environment';

export const pool = mysql.createPool(env.DATABASE_URL);

pool.getConnection()
    .then((connection: any) => {
        console.log('Successfully connected to the database.');
        connection.release();
    })
    .catch((err: any) => {
        console.error('Error connecting to the database:', err);
    });
