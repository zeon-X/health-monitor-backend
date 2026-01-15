/**
 * Patient Routes
 * Endpoints for managing patient data
 */

const express = require("express");
const router = express.Router();
const { Patient } = require("../models");

/**
 * GET /api/patients
 * List all patients
 */
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find({ isActive: true }).lean();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/patients/:patientId
 * Get specific patient details
 */
router.get("/:patientId", async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
