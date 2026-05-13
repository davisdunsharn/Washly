// config/clerk.js — Clerk SDK initialization
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  throw new Error('Missing Clerk secret key in .env');
}

module.exports = { clerkSecretKey };
