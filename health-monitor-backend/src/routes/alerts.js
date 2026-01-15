/**
 * Alert Routes
 * Endpoints for viewing alert log history
 */

const express = require("express");
const router = express.Router();
const { AlertLog } = require("../models");

/**
 * GET /api/alerts/history
 * Get alert log history
 * Query params: ?limit=50&patientId=P001
 */
router.get("/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const query = {};

    if (req.query.patientId) {
      query.patientId = req.query.patientId;
    }

    const alerts = await AlertLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
