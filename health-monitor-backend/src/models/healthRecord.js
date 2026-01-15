/**
 * Health Record Schema
 * Stores health data collected every 5 minutes from patient sensors
 */

const mongoose = require("mongoose");

const healthRecordSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    heartRate: Number,
    bloodPressure: String,
    spo2: Number,
    bodyTemperature: Number,
    motionLevel: Number,
    fallRiskScore: Number,
    sensorId: String,
    httpbinResponse: mongoose.Schema.Types.Mixed, // Store httpbin response data
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("HealthRecord", healthRecordSchema);
