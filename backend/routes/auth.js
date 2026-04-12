const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// 🟢 REGISTER ROUTE
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    // 1. Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists!' });
    }

    // 2. Hash the password (encrypt it)
    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // 3. Insert the new user into the database
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, verification_status',
      [email, bcryptPassword, name, role || 'user']
    );

    // 4. Generate a JWT Token
    const token = jwt.sign({ id: newUser.rows[0].id, role: newUser.rows[0].role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// 🔵 LOGIN ROUTE
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    const user = userResult.rows[0];

    // 2. Check if password matches
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    // 3. Generate a JWT Token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Remove the password hash before sending user data back
    delete user.password_hash;

    res.json({ token, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;