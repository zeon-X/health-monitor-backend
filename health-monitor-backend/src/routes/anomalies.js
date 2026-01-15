/**
 * Anomaly Routes
 * Endpoints for managing and viewing anomaly detections
 */

const express = require("express");
const router = express.Router();
const { Anomaly } = require("../models");
const AnomalyDetector = require("../services/anomalyDetector");
const { HealthRecord } = require("../models");

// Create detector instance for retrospective analysis
const retrospectiveDetector = new AnomalyDetector();
retrospectiveDetector.setHealthRecordModel(HealthRecord);

/**
 * GET /api/anomalies/patient/:patientId
 * Get anomalies for a patient
 * Query params: ?limit=20&severity=critical
 */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const severity = req.query.severity;

    const query = { patientId: req.params.patientId };
    if (severity) {
      query.severity = severity;
    }

    const anomalies = await Anomaly.find(query)
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean();

    res.json(anomalies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/anomalies/active
 * Get all currently active (unacknowledged) anomalies
 */
router.get("/active", async (req, res) => {
  try {
    const anomalies = await Anomaly.find({ acknowledged: false })
      .sort({ detectedAt: -1 })
      .lean();

    res.json(anomalies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/anomalies/:anomalyId/acknowledge
 * Acknowledge an anomaly (mark as reviewed)
 */
router.post("/:anomalyId/acknowledge", async (req, res) => {
  try {
    const { acknowledgedBy = "system" } = req.body;

    const anomaly = await Anomaly.findByIdAndUpdate(
      req.params.anomalyId,
      {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
      { new: true },
    );

    if (!anomaly) {
      return res.status(404).json({ error: "Anomaly not found" });
    }

    res.json(anomaly);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/anomalies/retrospective
 * Run retrospective anomaly detection on historical health records
 * Useful after system upgrades or threshold changes
 *
 * Request body:
 * {
 *   patientId: "P001" (optional - specific patient or null for all),
 *   startDate: "2024-01-01" (optional - ISO date string),
 *   endDate: "2024-12-31" (optional - ISO date string),
 *   updateDatabase: true (optional - default true, whether to save detected anomalies)
 * }
 */
router.post("/retrospective", async (req, res) => {
  try {
    const {
      patientId = null,
      startDate = null,
      endDate = null,
      updateDatabase = true,
    } = req.body;

    // Validate and parse dates
    const options = {
      patientId,
      updateDatabase,
    };

    if (startDate) {
      options.startDate = new Date(startDate);
      if (isNaN(options.startDate.getTime())) {
        return res.status(400).json({ error: "Invalid startDate format" });
      }
    }

    if (endDate) {
      options.endDate = new Date(endDate);
      if (isNaN(options.endDate.getTime())) {
        return res.status(400).json({ error: "Invalid endDate format" });
      }
    }

    // Validate date range
    if (
      options.startDate &&
      options.endDate &&
      options.startDate > options.endDate
    ) {
      return res
        .status(400)
        .json({ error: "startDate cannot be after endDate" });
    }

    console.log("🔄 Starting retrospective anomaly detection...", options);

    // Run retrospective detection
    const results = await retrospectiveDetector.detectRetrospectiveAnomalies(
      options,
    );

    // Return results
    res.json({
      success: true,
      message: `Retrospective analysis completed. Processed ${results.processed} records, detected ${results.newAnomaliesDetected} new anomalies.`,
      results: {
        recordsProcessed: results.processed,
        newAnomaliesDetected: results.newAnomaliesDetected,
        criticalAnomalies: results.criticalCount,
        warningAnomalies: results.warningCount,
        patientsSummary: results.patientsSummary,
        errors: results.errors,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Retrospective detection error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
