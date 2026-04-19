/**
 * middleware/companyAuth.js
 * 
 * Reads the JWT from Authorization header and extracts company_id.
 * Sets req.companyId for use in all controllers.
 * 
 * - Company user tokens (type: 'company_user') → req.companyId = user's ID
 * - All other tokens (legacy admin, no token) → req.companyId = null
 * 
 * SAFE: Never blocks requests. Always calls next().
 * If company_id column doesn't exist in DB yet, the controller 
 * simply gets null and shows all data (no crash).
 */
const jwt = require('jsonwebtoken');

const COMPANY_JWT_SECRET = process.env.COMPANY_JWT_SECRET || 'COMPANY_USER_JWT_SECRET_2024';

const companyAuth = (req, _res, next) => {
  req.companyId = null; // Default: no isolation

  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) return next();

    // Verify as company user token (different secret from legacy admin JWT)
    try {
      const decoded = jwt.verify(token, COMPANY_JWT_SECRET);
      if (decoded && decoded.type === 'company_user' && decoded.company_id) {
        req.companyId = decoded.company_id;
        req.companyUser = decoded; // Full payload available to controllers
      }
    } catch {
      // Not a company user token — could be legacy admin token, that's fine
      req.companyId = null;
    }
  } catch {
    req.companyId = null;
  }

  next();
};

module.exports = companyAuth;
