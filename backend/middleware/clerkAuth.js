// middleware/clerkAuth.js
const { verifyToken, users } = require('@clerk/clerk-sdk-node');

const clerkAuth = async (req, res, next) => {
  try {
    // Grab the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT – Clerk's built-in method
    const decoded = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    
    // Fetch the full user from Clerk because the token might not include publicMetadata.role
    const clerkUser = await users.getUser(decoded.sub);
    const role = clerkUser.publicMetadata?.role || 'student';

    const email = decoded.email || clerkUser.emailAddresses[0]?.emailAddress;
    // Name is optional at signup — fall back to username, then the email prefix,
    // so a user is never just shown as "User" in tables/dashboards.
    const nameFromClerk = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
    const fullName = nameFromClerk || clerkUser.username || (email ? email.split('@')[0] : 'User');

    // Attach the user object so downstream endpoints (like machine status update) know who's calling
    req.user = {
      clerkId: decoded.sub,
      email,
      fullName,
      role: role
    };
    
    next();
  } catch (err) {
    console.error('Clerk auth error:', err.message);
    return res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
  }
};

module.exports = { clerkAuth };