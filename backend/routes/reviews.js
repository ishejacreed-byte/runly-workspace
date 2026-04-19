const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth'); 

// ==========================================
// 📝 SUBMIT A REVIEW (Requires Login)
// ==========================================
router.post('/', auth, async (req, res) => {
    try {
        const { targetUserId, rating, comment } = req.body;
        const reviewerId = req.user.id; 

        if (targetUserId === reviewerId) {
            return res.status(400).json({ msg: "You cannot review your own profile." });
        }

        // 🟢 CHANGED: Now uses reviewed_user_id
        const newReview = await pool.query(
            `INSERT INTO reviews (reviewed_user_id, reviewer_id, rating, comment, created_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             RETURNING *`,
            [targetUserId, reviewerId, rating, comment]
        );

        const userQuery = await pool.query('SELECT name FROM users WHERE id = $1', [reviewerId]);
        
        const reviewWithDetails = {
            ...newReview.rows[0],
            reviewer_name: userQuery.rows[0].name
        };

        res.json(reviewWithDetails);
    } catch (err) {
        console.error("Submit Review Error:", err.message);
        res.status(500).json({ msg: "Server Error during submission." });
    }
});

// ==========================================
// ⭐️ GET LATEST REVIEWS FOR PROFILE (Public)
// ==========================================
router.get('/latest/:targetUserId', async (req, res) => {
    try {
        // 🟢 CHANGED: Now uses r.reviewed_user_id
        const reviews = await pool.query(
            `SELECT r.*, u.name as reviewer_name
             FROM reviews r
             JOIN users u ON r.reviewer_id = u.id
             WHERE r.reviewed_user_id = $1
             ORDER BY r.created_at DESC
             LIMIT 3`, 
            [req.params.targetUserId]
        );
        res.json(reviews.rows);
    } catch (err) {
        console.error("Fetch Latest Reviews Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 🔍 GET ALL REVIEWS FOR A USER (Requires Login)
// ==========================================
router.get('/:targetUserId', auth, async (req, res) => {
    try {
        // 🟢 CHANGED: Now uses r.reviewed_user_id
        const reviews = await pool.query(
            `SELECT r.*, u.name as reviewer_name
             FROM reviews r
             JOIN users u ON r.reviewer_id = u.id
             WHERE r.reviewed_user_id = $1
             ORDER BY r.created_at DESC`,
            [req.params.targetUserId]
        );
        res.json(reviews.rows);
    } catch (err) {
        console.error("Fetch All Reviews Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 🗑️ DELETE A REVIEW (OWNER ONLY)
// ==========================================
router.delete('/:id', auth, async (req, res) => {
    try {
        const reviewId = req.params.id;
        const currentUserId = req.user.id;

        const deleteResult = await pool.query(
            'DELETE FROM reviews WHERE id = $1 AND reviewer_id = $2 RETURNING *',
            [reviewId, currentUserId]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(403).json({ msg: "Action denied. You can only delete your own reviews." });
        }

        res.json({ msg: "Review deleted securely." });
    } catch (err) {
        console.error("Delete Review Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;