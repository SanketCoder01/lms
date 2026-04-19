/**
 * middleware/superAdminAuth.js
 * Verifies the super-admin JWT on protected /api/super-admin/* routes
 */
const jwt = require('jsonwebtoken');

const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || 'SUPER_ADMIN_STATIC_SECRET_2024';

const superAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Super admin token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SUPER_ADMIN_SECRET);
    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    req.superAdmin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired super admin token' });
  }
};

module.exports = superAdminAuth;
