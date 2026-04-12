const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Middleware to block non-admins
const adminOnly = (req, res, next) => {
    if (!req.user.is_admin) return res.status(403).json({ msg: "Admin access denied" });
    next();
};

// GET: All pending verifications
router.get('/verifications', auth, async (req, res) => {
    try {
        if (!req.user.is_admin) return res.status(403).json({ msg: "Admin only" });
        const result = await pool.query(`
            SELECT v.*, u.name, u.email 
            FROM verifications v 
            JOIN users u ON v.user_id = u.id 
            WHERE v.status = 'pending'
            ORDER BY v.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).send('Server Error'); }
});

// PUT: Approve/Reject Verification
router.put('/verify/:id', auth, adminOnly, async (req, res) => {
    const { status } = req.body; // 'verified' or 'rejected'
    await pool.query('UPDATE verifications SET status = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2', [status, req.params.id]);
    res.json({ msg: `User ${status}` });
});

module.exports = router;