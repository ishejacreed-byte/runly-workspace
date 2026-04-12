const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// 🚩 POST: Submit a new report (User level)
router.post('/', auth, async (req, res) => {
    const { reportedUserId, category, description } = req.body;
    try {
        const newReport = await pool.query(
            `INSERT INTO reports (reporter_id, reported_user_id, category, description, status) 
             VALUES ($1, $2, $3, $4, 'open') RETURNING *`,
            [req.user.id, reportedUserId, category, description]
        );
        res.json({ msg: "Report submitted successfully. Our team will review it.", report: newReport.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 📋 GET: Fetch all reports (Admin level - requires your specific admin check)
router.get('/admin/all', auth, async (req, res) => {
    try {
        // You should add: if (!req.user.isAdmin) return res.status(403)...
        const allReports = await pool.query('SELECT * FROM admin_reports_view ORDER BY created_at DESC');
        res.json(allReports.rows);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;