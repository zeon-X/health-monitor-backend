/**
 * Dashboard Summary Schema
 * Stores real-time statistics for the monitoring dashboard
 */

const mongoose = require("mongoose");

const dashboardSummarySchema = new mongoose.Schema(
  {
    totalPatients: Number,
    activeAlerts: Number,
    criticalCount: Number,
    warningCount: Number,
    recentAnomalies: [mongoose.Schema.Types.Mixed],
    lastUpdate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DashboardSummary", dashboardSummarySchema);
