const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.userId }, // Still using userId from token for compatibility
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!tenant) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.tenant = tenant;
    req.user = tenant; // Keep for compatibility
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

const subscriptionAuth = (requiredPlans = []) => {
  return (req, res, next) => {
    if (req.user.subscriptionStatus !== 'ACTIVE' && req.user.subscriptionStatus !== 'TRIAL') {
      return res.status(403).json({ error: 'Active subscription required.' });
    }

    if (requiredPlans.length > 0 && !requiredPlans.includes(req.user.subscriptionPlan)) {
      return res.status(403).json({ error: 'Subscription plan upgrade required.' });
    }

    next();
  };
};

module.exports = { auth, adminAuth, subscriptionAuth };