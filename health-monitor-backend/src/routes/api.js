/**
 * REST API Routes Index
 * Combines all route modules into a single router
 */

const express = require("express");
const router = express.Router();

// Import route modules
const patientsRouter = require("./patients");
const vitalsRouter = require("./vitals");
const anomaliesRouter = require("./anomalies");
const dashboardRouter = require("./dashboard");
const alertsRouter = require("./alerts");

// Mount route modules
router.use("/patients", patientsRouter);
router.use("/vitals", vitalsRouter);
router.use("/anomalies", anomaliesRouter);
router.use("/dashboard", dashboardRouter);
router.use("/alerts", alertsRouter);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
