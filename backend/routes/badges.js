const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET unread counts for the Bottom Nav Badges
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        // 1. Count unread messages (assuming your messages table has an is_read column)
        const msgRes = await pool.query(
            'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false', 
            [userId]
        );
        
        // 2. Count unread alerts (This powers the new Bell icon!)
        const alertRes = await pool.query(
            'SELECT COUNT(*) FROM alerts WHERE user_id = $1 AND is_read = false', 
            [userId]
        );

        res.json({
            unreadMessages: parseInt(msgRes.rows[0].count),
            unreadAlerts: parseInt(alertRes.rows[0].count)
        });
    } catch (err) {
        console.error("Badges Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;