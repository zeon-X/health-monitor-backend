/**
 * Dashboard Routes
 * Endpoints for dashboard summary and statistics
 */

const express = require("express");
const router = express.Router();
const { Patient, HealthRecord, Anomaly } = require("../models");

/**
 * GET /api/dashboard/summary
 * Get dashboard summary statistics
 */
router.get("/summary", async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments({ isActive: true });
    const activeAnomalies = await Anomaly.countDocuments({
      acknowledged: false,
    });
    const criticalAnomalies = await Anomaly.countDocuments({
      severity: "critical",
      acknowledged: false,
    });
    const warningAnomalies = await Anomaly.countDocuments({
      severity: "warning",
      acknowledged: false,
    });

    const recentAnomalies = await Anomaly.find({ acknowledged: false })
      .sort({ detectedAt: -1 })
      .limit(5)
      .lean();

    // Get latest vitals for each patient
    const patients = await Patient.find({ isActive: true }).lean();
    const latestVitals = [];

    for (const patient of patients) {
      const record = await HealthRecord.findOne({
        patientId: patient.patientId,
      })
        .sort({ recordedAt: -1 })
        .lean();
      if (record) {
        latestVitals.push({
          patientId: patient.patientId,
          patientName: patient.name,
          ...record,
        });
      }
    }

    res.json({
      summary: {
        totalPatients,
        activeAnomalies,
        criticalCount: criticalAnomalies,
        warningCount: warningAnomalies,
      },
      recentAnomalies,
      latestVitals,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
