/* MODELS/SESSION.JS - USER SESSION DATABASE OPERATIONS */

import pool from '../dbconfig.js';
import crypto from 'crypto';

export default class Session {
    // Create a new session for a user
    static async create(userId, sessionName = null, ipAddress = null, userAgent = null) {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const name = sessionName || `Session ${new Date().toLocaleString()}`;
        
        const [result] = await pool.query(
            `INSERT INTO user_sessions (user_id, session_token, session_name, ip_address, user_agent) 
             VALUES (?, ?, ?, ?, ?)`,
            [userId, sessionToken, name, ipAddress, userAgent]
        );
        
        return {
            id: result.insertId,
            userId,
            sessionToken,
            sessionName: name,
            ipAddress,
            userAgent,
            startedAt: new Date(),
            isActive: true
        };
    }
    
    // Get active session by token
    static async getActiveSession(sessionToken) {
        const [sessions] = await pool.query(
            `SELECT * FROM user_sessions 
             WHERE session_token = ? AND is_active = 1 
             AND (ended_at IS NULL OR ended_at > NOW())`,
            [sessionToken]
        );
        return sessions[0] || null;
    }
    
    // Get all sessions for a user
    static async getUserSessions(userId, limit = 20) {
        const [sessions] = await pool.query(
            `SELECT id, session_token, session_name, started_at, ended_at, 
                    last_activity_at, is_active,
                    (SELECT COUNT(*) FROM user_activities WHERE session_id = user_sessions.id) as activity_count
             FROM user_sessions 
             WHERE user_id = ? 
             ORDER BY last_activity_at DESC 
             LIMIT ?`,
            [userId, limit]
        );
        return sessions;
    }
    
    // End a session
    static async endSession(sessionId) {
        const [result] = await pool.query(
            `UPDATE user_sessions 
             SET ended_at = NOW(), is_active = 0 
             WHERE id = ?`,
            [sessionId]
        );
        return result.affectedRows > 0;
    }
    
    // Update session last activity
    static async updateActivity(sessionId) {
        await pool.query(
            `UPDATE user_sessions 
             SET last_activity_at = NOW() 
             WHERE id = ?`,
            [sessionId]
        );
    }
    
    // Rename session
    static async renameSession(sessionId, newName) {
        const [result] = await pool.query(
            `UPDATE user_sessions 
             SET session_name = ? 
             WHERE id = ?`,
            [newName, sessionId]
        );
        return result.affectedRows > 0;
    }
}