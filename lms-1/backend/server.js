const express = require("express");
const cors = require("cors");
const path = require('path');

// Load .env only in local development (Vercel loads env vars automatically)
if (process.env.NODE_ENV !== 'production') {
  require("dotenv").config({ path: path.join(__dirname, '.env') });
}

// Database (Supabase client)
const supabase = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const leaseRoutes = require("./routes/leaseRoutes");
const managementRoutes = require("./routes/managementRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const unitRoutes = require("./routes/unitRoutes");
const userRoutes = require("./routes/userRoutes"); // New Route

const roleRoutes = require("./routes/roleRoutes");
const partyRoutes = require("./routes/partyRoutes");
const ownershipRoutes = require("./routes/ownershipRoutes");
const filterOptionsRoutes = require("./routes/filterOptionsRoutes");
const companyAuthRoutes = require("./routes/companyAuthRoutes");  // Company login/register/heartbeat
const superAdminRoutes = require("./routes/superAdminRoutes");   // Super admin panel API
const projectUserRoutes = require("./routes/projectUserRoutes"); // Project-specific users

const app = express();
const PORT = process.env.PORT || 5000;

// Multi-tenant company isolation middleware
// Reads JWT → sets req.companyId (null for legacy/admin tokens)
const companyAuth = require('./middleware/companyAuth');

/* =========================
   MIDDLEWARE
========================= */
// CORS - Allow all origins for Vercel deployment
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CSP Headers - Allow all necessary resources
app.use((req, res, next) => {
  // Skip CSP for API routes to avoid interference
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https:; connect-src * 'unsafe-inline'; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; img-src 'self' data: https: blob:;"
  );
  next();
});

// Serve uploads from root directory (sibling to backend) if running from backend folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   DATABASE CHECK DEPRECATED (See config/db.js)
========================= */

/* =========================
   DEVTOOLS CHECK (Silence 404)
========================= */
app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(200).json({});
});

/* =========================
   ROOT ROUTE (IMPORTANT)
========================= */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend API is running 🚀"
  });
});

/* =========================
   API ROUTES
========================= */
// Apply multi-tenant isolation to all API routes
const applyRoutes = (prefix) => {
  app.use(`${prefix}`, companyAuth); // Company isolation middleware

  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/projects`, projectRoutes);
  app.use(`${prefix}/units`, unitRoutes);
  app.use(`${prefix}/tenants`, tenantRoutes);
  app.use(`${prefix}/leases`, leaseRoutes);
  app.use(`${prefix}/owners`, ownerRoutes);
  app.use(`${prefix}/management`, managementRoutes);
  app.use(`${prefix}/settings`, settingsRoutes);
  app.use(`${prefix}/activity`, activityLogRoutes);
  app.use(`${prefix}/roles`, roleRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/parties`, partyRoutes);
  app.use(`${prefix}/ownerships`, ownershipRoutes);
  app.use(`${prefix}/filters`, filterOptionsRoutes);
  app.use(`${prefix}/locations`, require("./routes/locationRoutes"));
  app.use(`${prefix}/company-auth`, companyAuthRoutes);
  app.use(`${prefix}/super-admin`, superAdminRoutes);
  app.use(`${prefix}/project-users`, projectUserRoutes);
};

// Mount on /api (Standard)
applyRoutes('/api');

// Mount on root / (For cPanel Passenger if it strips the /api prefix)
applyRoutes('');

/* =========================
   REACT FRONTEND INTEGRATION
   (Serves the frontend from the backend so they can share dmaicpro.com)
========================= */
const frontendBuildPath = path.join(__dirname, 'build');
app.use(express.static(frontendBuildPath));

// Catch-all route for React client-side routing (Express 5 compatible)
app.get(/^(.*)$/, (req, res) => {
  // If the request is for the API and wasn't caught above, return 404 JSON, not HTML
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  
  res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).send('React frontend build not found. Please upload the "build" folder into the backend directory.');
    }
  });
});

/* =========================
   SERVER START (LOCAL & VERCEL)
========================= */
if (process.env.NODE_ENV !== 'production' || require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless function
module.exports = app;
