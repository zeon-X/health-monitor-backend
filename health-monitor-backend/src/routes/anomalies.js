/**
 * Anomaly Routes
 * Endpoints for managing and viewing anomaly detections
 */

const express = require("express");
const router = express.Router();
const { Anomaly } = require("../models");

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
      { new: true }
    );

    if (!anomaly) {
      return res.status(404).json({ error: "Anomaly not found" });
    }

    res.json(anomaly);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
