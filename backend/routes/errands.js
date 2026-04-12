const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// 🟢 POST: Create a new errand
router.post('/', auth, async (req, res) => {
  const { title, description, category, urgency, pickup_location, dropoff_location, budget } = req.body;
  const platform_fee = (budget * 0.15).toFixed(2);
  const helper_earnings = (budget * 0.85).toFixed(2);

  try {
    const newErrand = await pool.query(
      `INSERT INTO errands 
      (customer_id, title, description, category, urgency, pickup_location, dropoff_location, budget, platform_fee, helper_earnings, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open') RETURNING *`,
      [req.user.id, title, description, category, urgency, pickup_location, dropoff_location, budget, platform_fee, helper_earnings]
    );
    res.json(newErrand.rows[0]);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 🟡 GET: Fetch logged-in customer's OWN errands
router.get('/me', auth, async (req, res) => {
  try {
    const myErrands = await pool.query('SELECT * FROM errands WHERE customer_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(myErrands.rows);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 🟠 GET: Fetch logged-in helper's JOBS
router.get('/jobs', auth, async (req, res) => {
  try {
    const jobs = await pool.query('SELECT * FROM errands WHERE helper_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(jobs.rows);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 🔵 GET: Fetch available open errands
router.get('/', auth, async (req, res) => {
  try {
    const errands = await pool.query(`
      SELECT e.*, u.name as customer_name 
      FROM errands e 
      JOIN users u ON e.customer_id = u.id 
      WHERE e.status = 'open' AND e.customer_id != $1
      ORDER BY e.created_at DESC`, [req.user.id]
    );
    res.json(errands.rows);
  } catch (err) { res.status(500).send('Server Error'); }
});

// ⚪ GET: Single Errand Details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    
    const errand = await pool.query(`
      SELECT e.*, c.name as customer_name, h.name as helper_name 
      FROM errands e 
      JOIN users c ON e.customer_id = c.id 
      LEFT JOIN users h ON e.helper_id = h.id 
      WHERE e.id = $1`, [id]
    );
    if (errand.rows.length === 0) return res.status(404).json({ msg: 'Errand not found' });
    res.json(errand.rows[0]);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 🔴 DELETE: Remove an errand (STRICTLY SECURED)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const errand = await pool.query('SELECT * FROM errands WHERE id = $1', [id]);
    
    if (errand.rows.length === 0) return res.status(404).json({ error: 'Errand not found' });

    if (Number(errand.rows[0].customer_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to delete' });
    }

    await pool.query('DELETE FROM messages WHERE errand_id = $1', [id]);
    await pool.query('DELETE FROM errands WHERE id = $1', [id]);
    res.json({ msg: 'Errand successfully removed' });
  } catch (err) { res.status(500).send('Server Error'); }
});

// 🟣 PUT: Update Errand Status (The 500 Fix is here)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const userId = Number(req.user.id);

    const errandRes = await pool.query('SELECT * FROM errands WHERE id = $1', [id]);
    if (errandRes.rows.length === 0) return res.status(404).json({ msg: 'Errand not found' });
    const errand = errandRes.rows[0];

    let query = '';
    let values = [];

    if (status === 'accepted') {
      if (errand.status !== 'open') return res.status(400).json({ msg: 'Errand no longer available' });
      query = 'UPDATE errands SET status = $1, helper_id = $2 WHERE id = $3 RETURNING *';
      values = [status, userId, id];
    } 
    else if (status === 'in_progress' || status === 'delivered') {
      if (Number(errand.helper_id) !== userId) return res.status(403).json({ msg: 'Unauthorized helper' });
      query = 'UPDATE errands SET status = $1 WHERE id = $2 RETURNING *';
      values = [status, id];
    } 
    else if (status === 'completed') {
      if (Number(errand.customer_id) !== userId) return res.status(403).json({ msg: 'Unauthorized customer' });
      query = 'UPDATE errands SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
      values = [status, id];

      // Send the payment notification
      await pool.query(
        'INSERT INTO notifications (user_id, content, type) VALUES ($1, $2, $3)',
        [errand.helper_id, `Payment released for "${errand.title}"!`, 'payment']
      );
    } else {
      return res.status(400).json({ msg: 'Invalid status transition' });
    }

    const updated = await pool.query(query, values);
    res.json(updated.rows[0]);
  } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;