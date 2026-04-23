// api/routes/checks.js
import express from 'express';
import pool from '../dbconfig.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Save a check - WITH DUPLICATE PREVENTION
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { query, verdict, check_type, fake_news_score, sources_checked } = req.body;
    const user_id = req.user.id;
    const session_id = req.session ? req.session.id : null;
    
    // Check for duplicate in last 5 minutes (same user, same query)
    const [existing] = await pool.execute(
      `SELECT id, verdict, fake_news_score FROM checks 
       WHERE user_id = ? AND query = ? 
       AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
       ORDER BY created_at DESC LIMIT 1`,
      [user_id, query]
    );
    
    if (existing.length > 0) {
      // Update existing record instead of creating new one
      await pool.execute(
        `UPDATE checks 
         SET verdict = ?, check_type = ?, fake_news_score = ?, sources_checked = ?, session_id = ?
         WHERE id = ?`,
        [verdict || 'mixed', check_type || 'text', fake_news_score || null, sources_checked || 0, session_id, existing[0].id]
      );
      return res.json({ success: true, id: existing[0].id, updated: true });
    }
    
    // Create new check
    const [result] = await pool.execute(
      `INSERT INTO checks (user_id, session_id, query, verdict, check_type, fake_news_score, sources_checked) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, session_id, query, verdict || 'mixed', check_type || 'text', fake_news_score || null, sources_checked || 0]
    );
    res.json({ success: true, id: result.insertId, updated: false });
  } catch (err) {
    console.error('Save check error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get recent checks for logged in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 1000;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    
    // First, get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM checks WHERE user_id = ?`,
      [user_id]
    );
    const total = countResult[0].total;
    
    // Then get the checks with session info
    const [rows] = await pool.execute(
      `SELECT c.*, s.session_name 
       FROM checks c
       LEFT JOIN user_sessions s ON c.session_id = s.id
       WHERE c.user_id = ? 
       ORDER BY c.created_at DESC 
       LIMIT ? OFFSET ?`,
      [user_id, limit, offset]
    );
    
    res.json({ 
      success: true, 
      data: rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (err) {
    console.error('Get checks error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get a single check by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const [rows] = await pool.execute(
      `SELECT c.*, s.session_name 
       FROM checks c
       LEFT JOIN user_sessions s ON c.session_id = s.id
       WHERE c.id = ? AND c.user_id = ?`,
      [id, user_id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Check not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Get check error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update verdict for most recent check with this query
router.post('/update-verdict', authMiddleware, async (req, res) => {
  try {
    const { query, verdict, fake_news_score, sources_checked } = req.body;
    const user_id = req.user.id;
    
    let updateFields = 'verdict = ?';
    let params = [verdict];
    
    if (fake_news_score !== undefined) {
      updateFields += ', fake_news_score = ?';
      params.push(fake_news_score);
    }
    
    if (sources_checked !== undefined) {
      updateFields += ', sources_checked = ?';
      params.push(sources_checked);
    }
    
    const [result] = await pool.execute(
      `UPDATE checks SET ${updateFields} 
       WHERE user_id = ? AND query = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [...params, user_id, query]
    );
    
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Update verdict error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a check
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const [result] = await pool.execute(
      'DELETE FROM checks WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Check not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Delete check error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;