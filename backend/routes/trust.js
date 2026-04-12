const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Submit Verification
router.post('/verify', auth, async (req, res) => {
    const { idUrl, selfieUrl } = req.body;
    try {
        await pool.query(
            'INSERT INTO verifications (user_id, id_url, selfie_url, status) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET status = $4',
            [req.user.id, idUrl, selfieUrl, 'pending']
        );
        res.json({ msg: 'Verification submitted' });
    } catch (err) { res.status(500).send('Server Error'); }
});

// Submit Review
router.post('/review', auth, async (req, res) => {
    const { reviewedUserId, errandId, rating, comment } = req.body;
    try {
        // Only allow review if errand is completed
        const check = await pool.query('SELECT * FROM errands WHERE id = $1 AND status = "completed"', [errandId]);
        if(check.rows.length === 0) return res.status(400).json({ msg: 'Errand not completed' });

        await pool.query(
            'INSERT INTO reviews (reviewer_id, reviewed_user_id, errand_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, reviewedUserId, errandId, rating, comment]
        );
        res.json({ msg: 'Review submitted' });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;