// Vercel Serverless Function Entry Point
// Vercel automatically injects environment variables in production
// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
}

const app = require('../backend/server');

// Export the Express app for Vercel serverless functions
// Vercel automatically wraps Express apps as serverless handlers
module.exports = app;
