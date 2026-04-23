/* DBCONFIG.JS - DATABASE CONFIGURATION FOR RAILWAY */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Railway provides these specific variable names for MySQL
const dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'realDB',
    port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test connection on startup
pool.getConnection()
    .then(conn => {
        console.log('✅ Database connected successfully');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

export default pool;