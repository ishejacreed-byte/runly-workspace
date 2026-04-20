const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/rbac'); // The RBAC middleware we created

// ==========================================
// 🛡️ VERIFICATION QUEUE ROUTES
// ==========================================

// GET: Fetch all pending verifications
// Allowed: SUPER_ADMIN, ADMIN, MODERATOR
router.get('/verifications', [auth, authorizeRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')], async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT v.*, u.name, u.email 
            FROM verifications v
            JOIN users u ON v.user_id = u.id
            WHERE v.status = 'pending'
            ORDER BY v.created_at ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Verifications Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// PUT: Approve or Reject a verification
// Allowed: SUPER_ADMIN, ADMIN, MODERATOR
router.put('/verify/:id', [auth, authorizeRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')], async (req, res) => {
    const { status } = req.body; // 'verified' or 'rejected'
    const verificationId = req.params.id;

    try {
        const verifyUpdate = await pool.query(
            'UPDATE verifications SET status = $1, reviewed_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING user_id',
            [status, req.user.id, verificationId]
        );

        if (verifyUpdate.rows.length === 0) return res.status(404).json({ msg: "Verification request not found" });
        const userId = verifyUpdate.rows[0].user_id;

        // Update the actual user's profile
        if (status === 'verified') {
            await pool.query('UPDATE users SET v_status = $1 WHERE id = $2', ['verified', userId]);
        } else if (status === 'rejected') {
            await pool.query('UPDATE users SET v_status = $1 WHERE id = $2', ['unverified', userId]); // Reset so they can try again
        }

        // 🔔 ALERT: Tell the user their outcome!
        const alertMessage = status === 'verified' 
            ? "Congratulations! Your identity verification has been approved. You now have the Verified badge."
            : "Your identity verification was rejected. Please check your submitted documents and try again.";
        
        await pool.query(
            `INSERT INTO alerts (user_id, type, message, link_url) VALUES ($1, $2, $3, $4)`,
            [userId, 'verification', alertMessage, '/profile']
        );

        res.json({ msg: `User successfully ${status}` });
    } catch (err) {
        console.error("Verification Update Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 👥 USER DIRECTORY ROUTES
// ==========================================

// GET: Fetch all users for the directory
// Allowed: SUPER_ADMIN, ADMIN
router.get('/users', [auth, authorizeRole('SUPER_ADMIN', 'ADMIN')], async (req, res) => {
    try {
        const users = await pool.query(`
            SELECT id, name, email, v_status, system_role, trust_score, is_banned, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json(users.rows);
    } catch (err) {
        console.error("Fetch Users Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// PUT: Ban or Unban a user
// Allowed: SUPER_ADMIN ONLY (Admins shouldn't ban people without permission yet)
router.put('/users/:id/ban', [auth, authorizeRole('SUPER_ADMIN')], async (req, res) => {
    const { is_banned } = req.body;
    const targetUserId = req.params.id;

    try {
        // Prevent the Super Admin from accidentally banning themselves
        if (targetUserId === req.user.id) {
            return res.status(400).json({ msg: "You cannot ban yourself." });
        }

        const result = await pool.query(
            'UPDATE users SET is_banned = $1 WHERE id = $2 RETURNING id, name, is_banned',
            [is_banned, targetUserId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("User Ban Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;