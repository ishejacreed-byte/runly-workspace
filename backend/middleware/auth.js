const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from the header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  // Check if it's a Bearer token
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adds the user ID and role to the request
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};