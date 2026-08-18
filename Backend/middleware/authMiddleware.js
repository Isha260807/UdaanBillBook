const jwt = require('jsonwebtoken');
const User = require('../models/User');

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=').map(c => c.trim());
    if (key && value) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies.token;
  }

  if (token) {
    try {
      // Verify token
      const secret = process.env.JWT_SECRET || 'udaanbillbook_secret_key_12345';
      const decoded = jwt.verify(token, secret);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
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
