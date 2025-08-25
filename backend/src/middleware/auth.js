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
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
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