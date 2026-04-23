/* ROUTES/SESSIONS.JS - SESSION MANAGEMENT ROUTES */

import express from 'express';
import Session from '../models/Session.js';
import Activity from '../models/Activity.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get all user sessions
router.get('/', authMiddleware, async (req, res) => {
    try {
        const sessions = await Session.getUserSessions(req.user.id);
        res.json({ success: true, data: sessions });
    } catch (err) {
        console.error('Get sessions error:', err.message);
        res.status(500).json({ error: 'failed to fetch sessions' });
    }
});

// Get current session details
router.get('/current', authMiddleware, async (req, res) => {
    try {
        if (!req.session) {
            return res.status(404).json({ error: 'no active session found' });
        }
        res.json({ success: true, data: req.session });
    } catch (err) {
        console.error('Get current session error:', err.message);
        res.status(500).json({ error: 'failed to fetch current session' });
    }
});

// Rename a session
router.put('/:sessionId/rename', authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { name } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'session name is required' });
        }
        
        const success = await Session.renameSession(sessionId, name.trim());
        
        if (!success) {
            return res.status(404).json({ error: 'session not found' });
        }
        
        res.json({ success: true, message: 'session renamed successfully' });
    } catch (err) {
        console.error('Rename session error:', err.message);
        res.status(500).json({ error: 'failed to rename session' });
    }
});

// End a session (logout from that session)
router.post('/:sessionId/end', authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const success = await Session.endSession(sessionId);
        
        if (!success) {
            return res.status(404).json({ error: 'session not found' });
        }
        
        res.json({ success: true, message: 'session ended successfully' });
    } catch (err) {
        console.error('End session error:', err.message);
        res.status(500).json({ error: 'failed to end session' });
    }
});

// Get activities for a specific session
router.get('/:sessionId/activities', authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        const result = await Activity.getUserActivities(req.user.id, {
            sessionId: parseInt(sessionId),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Get session activities error:', err.message);
        res.status(500).json({ error: 'failed to fetch session activities' });
    }
});

export default router;