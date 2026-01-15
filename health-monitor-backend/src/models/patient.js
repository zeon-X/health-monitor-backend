/**
 * Patient Profile Schema
 * Stores patient demographics, conditions, and baseline health data
 */

const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true },
    age: Number,
    conditions: [String],
    medications: [String],
    riskFactors: [String],
    baselineVitals: mongoose.Schema.Types.Mixed,
    alertThresholds: mongoose.Schema.Types.Mixed,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
