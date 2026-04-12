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
const getNextPayoutDate = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
  const daysUntilMonday = (1 - dayOfWeek + 7) % 7;
  
  // If today is Monday, we show next Monday (add 7 days) 
  // or keep it 0 if you pay out same-day. Let's assume next Monday:
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
  
  return targetDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
};
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

router.post('/review/:id', auth, async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const reviewedUserId = req.params.id;
    const { rating, comment } = req.body;

    await pool.query(
      `INSERT INTO reviews (reviewer_id, reviewed_user_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [reviewerId, reviewedUserId, rating, comment]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});





module.exports = router;