/**
 * Vitals Routes
 * Endpoints for fetching patient vital signs and health records
 */

const express = require("express");
const router = express.Router();
const { HealthRecord } = require("../models");

/**
 * GET /api/vitals/:patientId/latest
 * Get latest vital signs for a patient
 */
router.get("/:patientId/latest", async (req, res) => {
  try {
    const record = await HealthRecord.findOne({
      patientId: req.params.patientId,
    })
      .sort({ recordedAt: -1 })
      .lean();

    if (!record) {
      return res.status(404).json({ error: "No vital signs found" });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vitals/:patientId/history
 * Get vital signs history (last 24 hours or specified period)
 * Query params: ?limit=100&hours=24
 */
router.get("/:patientId/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100000;
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const records = await HealthRecord.find({
      patientId: req.params.patientId,
      recordedAt: { $gte: since },
    })
      .sort({ recordedAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      patientId: req.params.patientId,
      period: `Last ${hours} hours`,
      count: records.length,
      records,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
