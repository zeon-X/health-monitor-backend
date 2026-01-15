/**
 * Anomaly Record Schema
 * Stores detected health anomalies and alerts for patients
 */

const mongoose = require("mongoose");

const anomalySchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    severity: {
      type: String,
      enum: ["normal", "warning", "critical"],
      required: true,
    },
    alerts: [
      {
        type: { type: String },
        category: String,
        message: String,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    anomalyScore: Number,
    recordId: mongoose.Schema.Types.ObjectId, // Reference to health record
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: String,
    acknowledgedAt: Date,
    detectedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Anomaly", anomalySchema);
