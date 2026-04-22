/**
 * middleware/companyAuth.js
 * 
 * Reads the JWT from Authorization header and extracts company_id.
 * Sets req.companyId for use in all controllers.
 * 
 * - Company user tokens (type: 'company_user') -> req.companyId = user's ID
 * - Module user tokens (type: 'module_user') -> req.isModuleUser = true
 * - Project user tokens (type: 'project_user') -> req.isProjectUser = true, req.projectId
 * - All other tokens (legacy admin, no token) -> req.companyId = null
 * 
 * SAFE: Never blocks requests. Always calls next().
 * If company_id column doesn't exist in DB yet, the controller 
 * simply gets null and shows all data (no crash).
 */
const jwt = require('jsonwebtoken');

const COMPANY_JWT_SECRET = process.env.COMPANY_JWT_SECRET || 'COMPANY_USER_JWT_SECRET_2024';

const companyAuth = (req, _res, next) => {
  req.companyId     = null;
  req.companyUser   = null;
  req.isModuleUser  = false;
  req.isProjectUser = false;
  req.moduleName    = null;
  req.projectId     = null;
  req.permissions   = {};

  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) return next();

    try {
      const decoded = jwt.verify(token, COMPANY_JWT_SECRET);
      if (decoded && decoded.company_id) {
        req.companyId   = decoded.company_id;
        req.companyUser = decoded;

        if (decoded.type === 'module_user') {
          req.isModuleUser = true;
          req.moduleName   = decoded.module_name || null;
          req.permissions  = decoded.permissions || {};
        }

        if (decoded.type === 'project_user') {
          req.isProjectUser = true;
          req.projectId     = decoded.project_id || null;
          req.permissions   = decoded.permissions || {};
        }
      }
    } catch {
      req.companyId = null;
    }
  } catch {
    req.companyId = null;
  }

  next();
};

module.exports = companyAuth;
