/**
 * Alert Log Schema
 * Tracks when alerts were triggered and actions taken
 */

const mongoose = require("mongoose");

const alertLogSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    alertType: String,
    message: String,
    severity: String,
    actionTaken: String,
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AlertLog", alertLogSchema);
