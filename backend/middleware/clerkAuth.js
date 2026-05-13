// middleware/clerkAuth.js — Verify Clerk JWT on protected routes
const { verifyToken } = require('@clerk/clerk-sdk-node');

const clerkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    
    req.user = {
      clerkId: decoded.sub,
      email: decoded.email,
      role: decoded.publicMetadata?.role || 'student'
    };
    
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = { clerkAuth };
