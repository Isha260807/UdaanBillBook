const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const logAuth = (message) => {
  try {
    const logPath = path.join(__dirname, '..', 'auth_debug.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
  } catch (err) {
    console.error('Failed to write auth debug log:', err);
  }
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      logAuth(`Received token: ${token.slice(0, 15)}... for path: ${req.originalUrl}`);

      // Verify token
      const secret = process.env.JWT_SECRET || 'udaanbillbook_secret_key_12345';
      const decoded = jwt.verify(token, secret);
      logAuth(`Token decoded successfully. User ID: ${decoded.id}`);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        logAuth(`User not found in DB for ID: ${decoded.id}`);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      logAuth(`Authenticated user: ${req.user.email} (Role: ${req.user.role})`);
      next();
    } catch (error) {
      logAuth(`JWT Verification error: ${error.message}`);
      res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    logAuth(`No token provided in headers for path: ${req.originalUrl}`);
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to restrict routes to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

const permissionMapping = {
  'create_invoice': 'billing',
  'view_reports': 'reports',
  'manage_payments': 'accounting',
  'manage_parties': 'parties',
  'manage_items': 'inventory',
  'manage_expenses': 'expenses'
};

// Middleware to check if staff has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.user.role === 'admin' || req.user.role === 'vendor' || req.user.role === 'superadmin') {
      return next(); // Admins bypass permission checks
    }
    
    const mappedSection = permissionMapping[permission];
    
    if (req.user.role === 'staff' && req.user.permissions) {
      if (
        req.user.permissions.includes(permission) || 
        (mappedSection && req.user.permissions.includes(mappedSection))
      ) {
        return next();
      }
    }
    
    return res.status(403).json({ message: `Access denied. Requires '${permission}' permission.` });
  };
};

module.exports = { protect, restrictTo, requirePermission };
