const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET all alerts for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await pool.query(
      'SELECT * FROM alerts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(alerts.rows);
  } catch (err) { res.status(500).send('Server Error'); }
});

// PUT mark alert as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    await pool.query('UPDATE alerts SET is_read = TRUE WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ msg: 'Marked as read' });
  } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;