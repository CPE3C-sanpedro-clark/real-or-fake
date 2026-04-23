/* MODELS/ACTIVITY.JS - USER ACTIVITY TRACKING */

import pool from '../dbconfig.js';

export default class Activity {
    // Log a user activity
    static async log({
        userId,
        sessionId,
        activityType,
        queryText = null,
        articleTitle = null,
        articleUrl = null,
        sourceName = null,
        verdict = null,
        fakeNewsScore = null,
        sentimentScore = null,
        responseTimeMs = null,
        metadata = null
    }) {
        const [result] = await pool.query(
            `INSERT INTO user_activities 
             (user_id, session_id, activity_type, query_text, article_title, 
              article_url, source_name, verdict, fake_news_score, 
              sentiment_score, response_time_ms, metadata) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, sessionId, activityType, queryText, articleTitle,
                articleUrl, sourceName, verdict, fakeNewsScore,
                sentimentScore, responseTimeMs, metadata ? JSON.stringify(metadata) : null
            ]
        );
        
        // Also save to checks table for backward compatibility
        if (activityType === 'search' || activityType === 'url_check') {
            await pool.query(
                `INSERT INTO checks (user_id, session_id, query, verdict, check_type) 
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, sessionId, queryText || articleUrl, verdict || 'mixed', activityType]
            );
        }
        
        return result.insertId;
    }
    
    // Get activities for a user with pagination and filters
    static async getUserActivities(userId, options = {}) {
        const {
            sessionId = null,
            activityType = null,
            limit = 20,
            offset = 0,
            fromDate = null,
            toDate = null,
            verdict = null
        } = options;
        
        let query = `
            SELECT a.*, s.session_name,
                   CASE 
                       WHEN a.activity_type IN ('search', 'url_check') THEN COALESCE(a.query_text, a.article_url)
                       ELSE a.article_title
                   END as display_text
            FROM user_activities a
            LEFT JOIN user_sessions s ON a.session_id = s.id
            WHERE a.user_id = ?
        `;
        const params = [userId];
        
        if (sessionId) {
            query += ` AND a.session_id = ?`;
            params.push(sessionId);
        }
        
        if (activityType) {
            query += ` AND a.activity_type = ?`;
            params.push(activityType);
        }
        
        if (verdict) {
            query += ` AND a.verdict = ?`;
            params.push(verdict);
        }
        
        if (fromDate) {
            query += ` AND DATE(a.created_at) >= ?`;
            params.push(fromDate);
        }
        
        if (toDate) {
            query += ` AND DATE(a.created_at) <= ?`;
            params.push(toDate);
        }
        
        query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        const [activities] = await pool.query(query, params);
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM user_activities WHERE user_id = ?`;
        const countParams = [userId];
        
        if (sessionId) {
            countQuery += ` AND session_id = ?`;
            countParams.push(sessionId);
        }
        
        if (activityType) {
            countQuery += ` AND activity_type = ?`;
            countParams.push(activityType);
        }
        
        const [countResult] = await pool.query(countQuery, countParams);
        
        return {
            activities,
            total: countResult[0].total,
            limit,
            offset,
            hasMore: offset + limit < countResult[0].total
        };
    }
    
    // Get activity by ID
    static async getActivityById(activityId, userId) {
        const [activities] = await pool.query(
            `SELECT a.*, s.session_name
             FROM user_activities a
             LEFT JOIN user_sessions s ON a.session_id = s.id
             WHERE a.id = ? AND a.user_id = ?`,
            [activityId, userId]
        );
        return activities[0] || null;
    }
    
    // Get activity statistics for a user
    static async getUserStats(userId) {
        const [stats] = await pool.query(
            `SELECT 
                COUNT(*) as total_activities,
                COUNT(DISTINCT DATE(created_at)) as active_days,
                SUM(CASE WHEN activity_type = 'search' THEN 1 ELSE 0 END) as total_searches,
                SUM(CASE WHEN activity_type = 'url_check' THEN 1 ELSE 0 END) as total_url_checks,
                SUM(CASE WHEN verdict = 'verified' THEN 1 ELSE 0 END) as verified_claims,
                SUM(CASE WHEN verdict = 'disputed' THEN 1 ELSE 0 END) as disputed_claims,
                SUM(CASE WHEN verdict = 'mixed' THEN 1 ELSE 0 END) as mixed_claims,
                AVG(fake_news_score) as avg_fake_score,
                AVG(response_time_ms) as avg_response_time
             FROM user_activities
             WHERE user_id = ?`,
            [userId]
        );
        return stats[0];
    }
    
    // Get recent unique searches
    static async getRecentUniqueSearches(userId, limit = 10) {
        const [searches] = await pool.query(
            `SELECT DISTINCT 
                query_text as search_term,
                MAX(created_at) as last_searched,
                verdict,
                COUNT(*) as search_count
             FROM user_activities
             WHERE user_id = ? AND activity_type IN ('search', 'url_check')
               AND query_text IS NOT NULL
             GROUP BY query_text, verdict
             ORDER BY last_searched DESC
             LIMIT ?`,
            [userId, limit]
        );
        return searches;
    }
}