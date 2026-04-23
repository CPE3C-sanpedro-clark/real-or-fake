/* ROUTES/ACTIVITIES.JS - USER ACTIVITY ROUTES */

import express from 'express';
import Activity from '../models/Activity.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get user activities with filters
router.get('/', authMiddleware, async (req, res) => {
    try {
        const {
            sessionId,
            activityType,
            limit = 50,
            offset = 0,
            fromDate,
            toDate,
            verdict
        } = req.query;
        
        const result = await Activity.getUserActivities(req.user.id, {
            sessionId: sessionId ? parseInt(sessionId) : null,
            activityType,
            limit: parseInt(limit),
            offset: parseInt(offset),
            fromDate,
            toDate,
            verdict
        });
        
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Get activities error:', err.message);
        res.status(500).json({ error: 'failed to fetch activities' });
    }
});

// Get activity statistics
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const stats = await Activity.getUserStats(req.user.id);
        res.json({ success: true, data: stats });
    } catch (err) {
        console.error('Get activity stats error:', err.message);
        res.status(500).json({ error: 'failed to fetch stats' });
    }
});

// Get recent unique searches
router.get('/recent-searches', authMiddleware, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const searches = await Activity.getRecentUniqueSearches(req.user.id, parseInt(limit));
        res.json({ success: true, data: searches });
    } catch (err) {
        console.error('Get recent searches error:', err.message);
        res.status(500).json({ error: 'failed to fetch recent searches' });
    }
});

// Get activity by ID
router.get('/:activityId', authMiddleware, async (req, res) => {
    try {
        const { activityId } = req.params;
        const activity = await Activity.getActivityById(parseInt(activityId), req.user.id);
        
        if (!activity) {
            return res.status(404).json({ error: 'activity not found' });
        }
        
        res.json({ success: true, data: activity });
    } catch (err) {
        console.error('Get activity error:', err.message);
        res.status(500).json({ error: 'failed to fetch activity' });
    }
});

export default router;