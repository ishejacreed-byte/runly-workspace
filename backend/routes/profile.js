const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

console.log('Loaded profile routes');

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
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).send('Server Error');
  }
});

// PUT /api/profile/update-username
router.put('/update-username', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    const cleanName = name.trim();

    // Fetch current username_changed_at for cooldown check
    const cur = await pool.query(
      'SELECT username_changed_at FROM users WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (cur.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { username_changed_at } = cur.rows[0];

    // Cooldown: 14 days (in milliseconds)
    const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

    if (username_changed_at) {
      const lastChanged = new Date(username_changed_at).getTime();
      const now = Date.now();
      const diff = now - lastChanged;
      if (diff < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - diff;
        const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        return res.status(403).json({
          error: 'Username change cooldown active',
          message: `You can change your username again in ${remainingDays} day(s).`
        });
      }
    }

    // Uniqueness check
    const conflict = await pool.query(
      'SELECT id FROM users WHERE LOWER(name) = LOWER($1) AND id != $2 LIMIT 1',
      [cleanName, userId]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Update username and set username_changed_at to now
    const result = await pool.query(
      `UPDATE users
       SET name = $1, username_changed_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, profile_picture, bio, location, system_role`,
      [cleanName, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile username update error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


// Update Profile Picture
router.put('/picture', auth, async (req, res) => {
  const { url } = req.body;
  try {
    await pool.query('UPDATE users SET profile_picture = $1 WHERE id = $2', [url, req.user.id]);
    res.json({ msg: 'Picture updated' });
  } catch (err) {
    console.error('Profile picture update error:', err);
    res.status(500).send('Server Error');
  }
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
    console.error('Review insert error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
