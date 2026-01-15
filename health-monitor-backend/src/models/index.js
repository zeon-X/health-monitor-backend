/**
 * MongoDB Database Models Index
 * Central export point for all database models
 */

const Patient = require("./patient");
const HealthRecord = require("./healthRecord");
const Anomaly = require("./anomaly");
const AlertLog = require("./alertLog");
const DashboardSummary = require("./dashboardSummary");

module.exports = {
  Patient,
  HealthRecord,
  Anomaly,
  AlertLog,
  DashboardSummary,
};
