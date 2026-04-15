const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const http = require('http'); 
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app); 

// ==========================================
// 🚀 ROUTE IMPORTS
// ==========================================
const authRoutes = require('./routes/auth');
const errandRoutes = require('./routes/errands');
const uploadRoutes = require('./routes/upload'); 
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const trustRoutes = require('./routes/trust');
const reportRoutes = require('./routes/reports');

// ==========================================
// ⚙️ MIDDLEWARE & SOCKET CONFIG
// ==========================================
const io = new Server(server, { 
 cors: {  
   origin: ["http://localhost:5173", "http://localhost:5174"], 
   methods: ["GET", "POST"] 
 }});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ==========================================
// 🔗 API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/errands', errandRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/reports', reportRoutes);
// Add this near your other routes in server.js
app.use('/api/admin', require('./routes/admin'));

// ==========================================
// 🔔 GLOBAL NOTIFICATIONS & CHAT ROUTES
// ==========================================

// 1. Fetch Real Conversations (Unified Thread Logic)
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT e.id as errand_id, e.title as task, e.customer_id, e.helper_id,
             c.name as customer_name, h.name as helper_name,
             m.content as last_message, m.image_url, m.audio_url, m.created_at as date, m.sender_id,
             (SELECT COUNT(*) FROM messages WHERE errand_id = e.id AND sender_id != $1 AND is_read = false) as unread
      FROM errands e
      JOIN users c ON e.customer_id = c.id
      LEFT JOIN users h ON e.helper_id = h.id
      JOIN messages m ON m.id = (
          SELECT id FROM messages WHERE errand_id = e.id ORDER BY created_at DESC LIMIT 1
      )
      WHERE e.customer_id = $1 OR e.helper_id = $1
      ORDER BY m.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 1.5 Fetch UNIFIED Chat History between two specific users
app.get('/api/messages/unified/:userA/:userB', async (req, res) => {
  try {
    const { userA, userB } = req.params;
    const messages = await pool.query(`
      SELECT m.*, e.title as context_title
      FROM messages m
      JOIN errands e ON m.errand_id = e.id
      WHERE (e.customer_id = $1 AND e.helper_id = $2)
         OR (e.customer_id = $2 AND e.helper_id = $1)
      ORDER BY m.created_at ASC
    `, [userA, userB]);
    res.json(messages.rows);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 2. Fetch Real Alerts
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.params.userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Get Total Unread Counts
app.get('/api/badges/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const msgCount = await pool.query(`SELECT COUNT(*) FROM messages m JOIN errands e ON m.errand_id = e.id WHERE (e.customer_id = $1 OR e.helper_id = $1) AND m.sender_id != $1 AND m.is_read = false`, [userId]);
    const notifCount = await pool.query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`, [userId]);
    
    res.json({
      unreadMessages: parseInt(msgCount.rows[0].count),
      unreadAlerts: parseInt(notifCount.rows[0].count)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Mark UNIFIED Messages as Read
app.put('/api/conversations/read-unified/:partnerId/:userId', async (req, res) => {
  try {
    await pool.query(`
      UPDATE messages 
      SET is_read = true 
      FROM errands e 
      WHERE messages.errand_id = e.id 
      AND messages.sender_id = $1 
      AND (e.customer_id = $2 OR e.helper_id = $2)
    `, [req.params.partnerId, req.params.userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Mark Notification as Read
app.put('/api/notifications/read/:id', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET Chat History & Single Errand Details
app.get('/api/messages/:errandId', async (req, res) => {
  try {
    const messages = await pool.query('SELECT * FROM messages WHERE errand_id = $1 ORDER BY created_at ASC', [req.params.errandId]);
    res.json(messages.rows);
  } catch (err) { res.status(500).send('Server Error'); }
});

app.get('/api/errands/:id', async (req, res) => {
  try {
    const errand = await pool.query(
      `SELECT e.*, c.name as customer_name, h.name as helper_name 
       FROM errands e JOIN users c ON e.customer_id = c.id LEFT JOIN users h ON e.helper_id = h.id 
       WHERE e.id = $1`, [req.params.id]
    );
    if (errand.rows.length === 0) return res.status(404).json({ msg: 'Errand not found' });
    res.json(errand.rows[0]);
  } catch (err) { res.status(500).send('Server Error'); }
});

// ==========================================
// ⚡ WEBSOCKET ENGINE
// ==========================================
io.on('connection', (socket) => {
  socket.on('join_chat', (roomId) => socket.join(roomId));
  
  socket.on('send_message', async (data) => {
    const { errandId, senderId, text, imageUrl, audioUrl, unifiedRoomId } = data;
    try {
      const newMsg = await pool.query(
        `INSERT INTO messages (errand_id, sender_id, content, image_url, audio_url, is_read) 
         VALUES ($1, $2, $3, $4, $5, false) RETURNING *`,
        [errandId, senderId, text, imageUrl, audioUrl]
      );
      io.to(unifiedRoomId).emit('receive_message', newMsg.rows[0]);
    } catch (err) { console.error('❌ CRITICAL SOCKET ERROR:', err.message); }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));