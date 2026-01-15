/**
 * Health Monitoring Service
 * Coordinates: Data generation, HTTP posting to httpbin, Anomaly detection, Storage
 */

const axios = require("axios");
const HealthDataGenerator = require("./healthDataGenerator");
const AnomalyDetector = require("./anomalyDetector");
const { HealthRecord, Anomaly, AlertLog, Patient } = require("../models");
const PATIENTS = require("../config/patients");

class HealthMonitoringService {
  constructor(io) {
    this.io = io; // Socket.io instance for real-time broadcasting
    this.dataGenerator = new HealthDataGenerator();
    this.anomalyDetector = new AnomalyDetector();
    // Inject database model for historical data loading
    this.anomalyDetector.setHealthRecordModel(HealthRecord);
    this.httpbinEndpoint =
      process.env.HTTPBIN_ENDPOINT || "https://httpbin.org/anything";
    this.isMonitoring = false;
  }

  /**
   * Start the health monitoring cycle
   * Runs every 5 minutes for each patient
   */
  async startMonitoring() {
    console.log("🏥 Health Monitoring Service Started");
    this.isMonitoring = true;

    // Initialize patients in database
    await this.initializePatients();

    // Run health check every 5 minutes
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, process.env.HEALTH_CHECK_INTERVAL || 300000); // 5 minutes default

    // Run first check immediately
    await this.performHealthCheck();
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.isMonitoring = false;
    console.log("🛑 Health Monitoring Service Stopped");
  }

  /**
   * Initialize patient profiles in database
   * Only inserts patients if they don't exist, preserves existing data
   * Also loads historical health records for anomaly detection
   */
  async initializePatients() {
    try {
      let newPatients = 0;
      let existingPatients = 0;

      for (const patientData of PATIENTS) {
        // Check if patient exists
        const existingPatient = await Patient.findOne({ patientId: patientData.id });
        
        if (!existingPatient) {
          // Create new patient
          await Patient.create(patientData);
          newPatients++;
          console.log(`➕ Created new patient: ${patientData.id} (${patientData.name})`);
        } else {
          existingPatients++;
          console.log(`✓ Patient exists: ${patientData.id} (${existingPatient.name})`);
        }

        // Load historical data for anomaly detection
        await this.anomalyDetector.loadHistoricalData(patientData.id);
      }

      console.log(`✅ Patient initialization complete: ${newPatients} new, ${existingPatients} existing`);
    } catch (error) {
      console.error("Error initializing patients:", error);
    }
  }

  /**
   * Perform health check for all patients
   * 1. Generate realistic vitals
   * 2. POST to httpbin
   * 3. Store in database
   * 4. Detect anomalies
   * 5. Broadcast to clients
   */
  async performHealthCheck() {
    console.log(
      `📊 [${new Date().toISOString()}] Performing health check for ${
        PATIENTS.length
      } patients...`
    );

    for (const patient of PATIENTS) {
      try {
        // 1. Generate health data
        const vitals = this.dataGenerator.generateVitals(patient.id);

        // 2. POST to httpbin (simulate wearable device upload)
        const httpbinResponse = await this.postToHttpbin(patient.id, vitals);

        // 3. Store health record
        const healthRecord = await this.saveHealthRecord(
          patient,
          vitals,
          httpbinResponse
        );

        // 4. Detect anomalies (with error handling for insufficient data)
        let anomalyResult;
        try {
          anomalyResult = this.anomalyDetector.detectAnomalies(
            patient.id,
            vitals,
            patient
          );
        } catch (anomalyError) {
          console.warn(
            `⚠️ Anomaly detection skipped for ${patient.id}: ${anomalyError.message}`
          );
          anomalyResult = {
            isAnomaly: false,
            alerts: [],
            severity: "normal",
            normalizedScore: 0,
          };
        }

        // 5. Handle anomalies
        if (anomalyResult.isAnomaly) {
          await this.handleAnomaly(patient.id, healthRecord._id, anomalyResult);
        }

        // 6. Broadcast to connected clients
        this.broadcastVitalUpdate(patient.id, vitals, anomalyResult);

        console.log(
          `✅ ${patient.id} (${patient.name}): HR=${vitals.heartRate}, BP=${
            vitals.bloodPressure
          }, SpO₂=${vitals.spo2}%${
            anomalyResult.isAnomaly ? " ⚠️ ANOMALY DETECTED" : ""
          }`
        );
      } catch (error) {
        console.error(
          `❌ Error processing patient ${patient.id}:`,
          error.message
        );
      }
    }
  }

  /**
   * POST patient vitals to httpbin
   * Simulates wearable device sending data to cloud
   */
  async postToHttpbin(patientId, vitals) {
    try {
      const response = await axios.post(this.httpbinEndpoint, {
        ...vitals,
        deviceType: "wearable-health-sensor",
        encryptionLevel: "AES-256",
        version: "2.1",
      });

      return {
        statusCode: response.status,
        timestamp: response.data.timestamp,
        headers: response.data.headers,
        ip: response.data.origin,
      };
    } catch (error) {
      console.error(`httpbin POST error for ${patientId}:`, error.message);
      return { statusCode: 500, error: error.message };
    }
  }

  /**
   * Save health record to MongoDB
   */
  async saveHealthRecord(patient, vitals, httpbinResponse) {
    try {
      const record = new HealthRecord({
        patientId: patient.id,
        heartRate: vitals.heartRate,
        bloodPressure: vitals.bloodPressure,
        spo2: vitals.spo2,
        bodyTemperature: vitals.bodyTemperature,
        motionLevel: vitals.motionLevel,
        fallRiskScore: vitals.fallRiskScore,
        sensorId: vitals.sensorId,
        httpbinResponse,
        recordedAt: new Date(vitals.timestamp),
      });

      return await record.save();
    } catch (error) {
      console.error(`Database error for ${patient.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Handle detected anomalies
   */
  async handleAnomaly(patientId, healthRecordId, anomalyResult) {
    try {
      // 1. Save anomaly record
      const anomaly = new Anomaly({
        patientId,
        severity: anomalyResult.severity,
        alerts: anomalyResult.alerts,
        anomalyScore: anomalyResult.normalizedScore,
        recordId: healthRecordId,
      });

      const savedAnomaly = await anomaly.save();

      // 2. Log critical alerts
      for (const alert of anomalyResult.alerts) {
        await new AlertLog({
          patientId,
          alertType: alert.category,
          message: alert.message,
          severity: alert.type,
          actionTaken: "alert_triggered",
        }).save();
      }

      // 3. Broadcast anomaly to clients (real-time alert)
      this.broadcastAnomaly(patientId, anomalyResult);

      return savedAnomaly;
    } catch (error) {
      console.error(`Error handling anomaly for ${patientId}:`, error.message);
      throw error;
    }
  }

  /**
   * Broadcast vital update via WebSocket
   */
  broadcastVitalUpdate(patientId, vitals, anomalyResult) {
    if (!this.io) return;

    this.io.emit("vital_update", {
      patientId,
      vitals,
      anomaly: anomalyResult.isAnomaly ? anomalyResult : null,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast anomaly alert via WebSocket
   */
  broadcastAnomaly(patientId, anomalyResult) {
    if (!this.io) return;

    const patient = PATIENTS.find((p) => p.id === patientId);

    this.io.emit("anomaly_alert", {
      patientId,
      patientName: patient?.name || "Unknown",
      severity: anomalyResult.severity,
      alerts: anomalyResult.alerts,
      score: anomalyResult.normalizedScore,
      timestamp: new Date().toISOString(),
    });

    // Also emit to patient-specific room
    this.io.to(`patient_${patientId}`).emit("critical_alert", {
      message: `⚠️ Health Alert for ${patient?.name}`,
      severity: anomalyResult.severity,
      alerts: anomalyResult.alerts,
    });
  }

  /**
   * Get patient health summary
   */
  async getPatientSummary(patientId) {
    try {
      const patient = await Patient.findOne({ patientId });
      const latestRecord = await HealthRecord.findOne({ patientId })
        .sort({ recordedAt: -1 })
        .lean();
      const recentAnomalies = await Anomaly.find({ patientId })
        .sort({ detectedAt: -1 })
        .limit(10)
        .lean();

      return {
        patient,
        latestVitals: latestRecord,
        recentAnomalies,
      };
    } catch (error) {
      console.error(`Error getting summary for ${patientId}:`, error);
      throw error;
    }
  }
}

module.exports = HealthMonitoringService;
