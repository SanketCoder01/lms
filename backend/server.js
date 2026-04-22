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
const superAdminRoutes  = require("./routes/superAdminRoutes");   // Super admin panel API
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
  origin: '*',
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
// Apply multi-tenant isolation to all API routes (safe: graceful if no token)
app.use('/api', companyAuth);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/leases", leaseRoutes);
app.use("/api/owners", ownerRoutes); // Updated Owner Route
app.use("/api/management", managementRoutes); // Management Rep Routes
// app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/activity", activityLogRoutes);
app.use("/api/roles", roleRoutes); // Mounted Route
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/parties", partyRoutes);
app.use("/api/ownerships", ownershipRoutes);
app.use("/api/filters", filterOptionsRoutes);
app.use("/api/locations", require("./routes/locationRoutes"));
// Company auth: login, register, heartbeat, announcements
app.use("/api/company-auth", companyAuthRoutes);
// Super admin panel API
app.use("/api/super-admin", superAdminRoutes);
// Project-specific users API
app.use("/api/project-users", projectUserRoutes);
// Ownership routes registered

/* =========================
   HEALTH CHECK (RENDER)
========================= */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server health check passed ✅"
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
