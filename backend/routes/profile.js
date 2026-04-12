const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/:id', auth, async (req, res) => {
    try {
        const userId = req.params.id;
        const profile = await pool.query(`
            SELECT u.id, u.name, u.email, u.profile_picture, u.bio, u.location, u.is_admin,
            (SELECT status FROM verifications WHERE user_id = u.id LIMIT 1) as v_status,
            COALESCE((SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = u.id), 0) as avg_rating,
            (SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = u.id) as review_count,
            (SELECT COUNT(*) FROM errands WHERE helper_id = u.id AND status = 'completed') as jobs_done,
            (SELECT COUNT(*) FROM errands WHERE customer_id = u.id AND status = 'completed') as errands_posted,
            COALESCE((SELECT SUM(budget) FROM errands WHERE customer_id = u.id AND status = 'completed'), 0) as total_spent,
            COALESCE((SELECT SUM(budget * 0.85) FROM errands WHERE helper_id = u.id AND status = 'completed'), 0) as total_earned
            FROM users u WHERE u.id = $1
        `, [userId]);

        const reviews = await pool.query(`
            SELECT r.*, u.name as reviewer_name, u.profile_picture as reviewer_pic 
            FROM reviews r JOIN users u ON r.reviewer_id = u.id 
            WHERE r.reviewed_user_id = $1 ORDER BY r.created_at DESC
        `, [userId]);

        if (profile.rows.length === 0) return res.status(404).json({ msg: "User not found" });
        res.json({ ...profile.rows[0], reviews: reviews.rows });
    } catch (err) { 
        console.error(err.message);
        res.status(500).send('Server Error'); 
    }
});

// Update Profile Details (Bio/Location)
router.put('/update', auth, async (req, res) => {
    const { bio, location } = req.body;
    try {
        await pool.query(
            'UPDATE users SET bio = $1, location = $2 WHERE id = $3',
            [bio, location, req.user.id]
        );
        res.json({ msg: 'Profile updated' });
    } catch (err) { res.status(500).send('Server Error'); }
});

// Update Profile Picture
router.put('/picture', auth, async (req, res) => {
    const { url } = req.body;
    try {
        await pool.query('UPDATE users SET profile_picture = $1 WHERE id = $2', [url, req.user.id]);
        res.json({ msg: 'Picture updated' });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;