const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// ==========================================
// 🛡️ SUBMIT VERIFICATION DOCUMENTS
// ==========================================
router.post('/verify', auth, async (req, res) => {
    const { idUrl, selfieUrl } = req.body;
    try {
        const newVerification = await pool.query(
            `INSERT INTO verifications (user_id, id_url, selfie_url, status, created_at) 
             VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP)
             RETURNING *`,
            [req.user.id, idUrl, selfieUrl]
        );

        await pool.query(`UPDATE users SET v_status = 'pending' WHERE id = $1`, [req.user.id]);

        // 🔔 ALERT: Notify all Admins that a new ID is in the queue!
        const admins = await pool.query(`SELECT id FROM users WHERE system_role IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR')`);
        
        for (let admin of admins.rows) {
            await pool.query(
                `INSERT INTO alerts (user_id, type, message, link_url) VALUES ($1, $2, $3, $4)`,
                [admin.id, 'verification_pending', `A new identity verification request has been submitted.`, '/admin']
            );
        }

        res.json(newVerification.rows[0]);
    } catch (err) { 
        console.error("Verification Submit Error:", err.message);
        res.status(500).send('Server Error'); 
    }
});

// ==========================================
// ⭐ SUBMIT REVIEW
// ==========================================
router.post('/review', auth, async (req, res) => {
    const { reviewedUserId, errandId, rating, comment } = req.body;
    try {
        // FIX: Changed "completed" to 'completed' (Single quotes for strings in SQL!)
        const check = await pool.query("SELECT * FROM errands WHERE id = $1 AND status = 'completed'", [errandId]);
        if(check.rows.length === 0) return res.status(400).json({ msg: 'Errand not completed' });

        await pool.query(
            'INSERT INTO reviews (reviewer_id, reviewed_user_id, errand_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, reviewedUserId, errandId, rating, comment]
        );
        res.json({ msg: 'Review submitted' });
    } catch (err) { 
        console.error("Review Submit Error:", err.message);
        res.status(500).send('Server Error'); 
    }
});

module.exports = router;