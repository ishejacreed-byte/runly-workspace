// Inside backend/middleware/rbac.js
const pool = require('../db');

const authorizeRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ error: "Access denied. No valid session." });
            }

            const userRes = await pool.query('SELECT email, system_role FROM users WHERE id = $1', [req.user.id]);
            
            if (userRes.rows.length === 0) {
                return res.status(403).json({ error: "User not found in database." });
            }

            const currentUser = userRes.rows[0];
            const currentRole = currentUser.system_role;

            // 🟢 ADD THESE TWO LINES 🟢
            console.log(`🚨 RBAC CHECK | Email: ${currentUser.email} | Role in DB: ${currentRole}`);
            console.log(`🚨 ALLOWED ROLES FOR THIS ROUTE:`, allowedRoles);

            if (!currentRole || !allowedRoles.includes(currentRole)) {
                return res.status(403).json({ error: "Access denied. Insufficient clearance level." });
            }

            req.user.system_role = currentRole;
            next();

        } catch (err) {
            res.status(500).json({ error: "Server error during authorization check." });
        }
    };
};

module.exports = authorizeRole;