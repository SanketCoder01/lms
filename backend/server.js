const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Database
const pool = require("./config/db");

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

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require('path');

// Explicitly set CSP to allow connections and prevent "default-src 'none'" errors
app.use((req, res, next) => {
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
// Ownership routes registered - Restart Trigger 7 (Path Fix)

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
   SERVER START
========================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);

});

