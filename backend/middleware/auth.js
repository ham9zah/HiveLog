const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 */
async function authenticate(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid authentication' });
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid authentication token' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Check if user is admin
 */
function isAdmin(req, res, next) {
  if (req.user && req.user.isAdminRole()) {
    next();
  } else {
    res.status(403).json({ message: 'يجب أن تكون أدمن للوصول لهذه الميزة' });
  }
}

/**
 * Check if user is super admin
 */
function isSuperAdmin(req, res, next) {
  if (req.user && req.user.role === 'super_admin') {
    next();
  } else {
    res.status(403).json({ message: 'يجب أن تكون سوبر أدمن للوصول لهذه الميزة' });
  }
}

/**
 * Check if user is moderator or admin
 */
function isModerator(req, res, next) {
  if (req.user && req.user.isModeratorRole()) {
    next();
  } else {
    res.status(403).json({ message: 'يجب أن تكون مشرف أو أدمن للوصول لهذه الميزة' });
  }
}

/**
 * Check if user has specific permission
 */
function hasPermission(permission) {
  return (req, res, next) => {
    if (req.user && req.user.hasPermission(permission)) {
      next();
    } else {
      res.status(403).json({ message: `ليس لديك صلاحية: ${permission}` });
    }
  };
}

/**
 * Check if user is not banned
 */
function isNotBanned(req, res, next) {
  if (req.user && req.user.isBanned) {
    return res.status(403).json({ 
      message: 'تم حظرك من المنصة',
      reason: req.user.banReason,
      bannedAt: req.user.bannedAt
    });
  }
  next();
}

module.exports = {
  authenticate,
  optionalAuth,
  isAdmin,
  isSuperAdmin,
  isModerator,
  hasPermission,
  isNotBanned
};
