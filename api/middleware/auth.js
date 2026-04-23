/* MIDDLEWARE/AUTH.JS - JWT TOKEN VERIFICATION WITH SESSION HANDLING */

import jwt from 'jsonwebtoken';
import config from '../config.js';
import Session from '../models/Session.js';

export default async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'no token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Get session token from header (optional)
    const sessionToken = req.headers['x-session-token'];

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        
        req.user = decoded;
        
        // Handle session if provided
        if (sessionToken) {
            const session = await Session.getActiveSession(sessionToken);
            if (session && session.user_id === decoded.id) {
                req.session = session;
                // Update last activity
                await Session.updateActivity(session.id);
            } else if (sessionToken && !session) {
                // Session expired or invalid
                console.log(`Invalid or expired session token: ${sessionToken}`);
            }
        }
        
        // If no session token but user is authenticated, create a new session
        if (!sessionToken && !req.session) {
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const session = await Session.create(decoded.id, null, ipAddress, userAgent);
            req.session = session;
            // Set response header to return new session token to client
            res.setHeader('X-Session-Token', session.sessionToken);
        }

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'token expired' });
        }
        return res.status(401).json({ error: 'invalid token' });
    }
}