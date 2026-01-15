/**
 * Integration Tests for Retrospective Anomaly Detection API
 * Tests the POST /api/anomalies/retrospective endpoint
 */

require("./setup"); // Import test setup (timeouts, etc.)

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const {
  AlertLog,
  Patient,
  HealthRecord,
  Anomaly,
} = require("../../src/models");
const anomaliesRouter = require("../../src/routes/anomalies");
const { NORMAL_VITALS, PATIENTS } = require("../fixtures/testDatasets");

// Create express app for testing
const app = express();
app.use(express.json());
app.use("/api/anomalies", anomaliesRouter);

describe("Retrospective Anomaly Detection API Integration Tests", () => {
  // Database setup
  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_COMPLETE_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/health-monitor-test";
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await AlertLog.deleteMany({});
    await Patient.deleteMany({});
    await HealthRecord.deleteMany({});
    await Anomaly.deleteMany({});
  });

  describe("POST /api/anomalies/retrospective", () => {
    describe("Normal Cases", () => {
      test("should detect anomalies in historical records for all patients", async () => {
        // Setup: Create patients
        await Patient.insertMany([
          { ...PATIENTS[0], isActive: true },
          { ...PATIENTS[1], isActive: true },
        ]);

        // Setup: Create health records with anomalous vitals
        const now = new Date();
        await HealthRecord.insertMany([
          {
            patientId: PATIENTS[0].id,
            heartRate: 40, // Bradycardia - below threshold of 45
            bloodPressure: "130/85",
            spo2: 98,
            bodyTemperature: 36.8,
            motionLevel: 0.3,
            fallRiskScore: 15,
            recordedAt: new Date(now - 3600000), // 1 hour ago
          },
          {
            patientId: PATIENTS[1].id,
            heartRate: 75,
            bloodPressure: "195/95", // Hypertensive crisis - above threshold of 160
            spo2: 98,
            bodyTemperature: 36.7,
            motionLevel: 0.4,
            fallRiskScore: 20,
            recordedAt: new Date(now - 3000000), // 50 minutes ago
          },
        ]);

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.recordsProcessed).toBe(2);
        expect(response.body.results.newAnomaliesDetected).toBeGreaterThan(0);
        expect(response.body.results.patientsSummary).toHaveProperty(
          PATIENTS[0].id,
        );
        expect(response.body.results.patientsSummary).toHaveProperty(
          PATIENTS[1].id,
        );

        // Verify anomalies were saved to database
        const savedAnomalies = await Anomaly.find({});
        expect(savedAnomalies.length).toBeGreaterThan(0);
        expect(savedAnomalies[0].metadata.retrospective).toBe(true);
      });

      test("should detect anomalies for a specific patient", async () => {
        // Setup: Create patients
        await Patient.insertMany([
          { ...PATIENTS[0], isActive: true },
          { ...PATIENTS[1], isActive: true },
        ]);

        // Setup: Create anomalous records for both patients
        const now = new Date();
        await HealthRecord.insertMany([
          {
            patientId: PATIENTS[0].id,
            heartRate: 35, // Critical bradycardia
            bloodPressure: "130/85",
            spo2: 98,
            bodyTemperature: 36.8,
            motionLevel: 0.3,
            fallRiskScore: 15,
            recordedAt: new Date(now - 3600000),
          },
          {
            patientId: PATIENTS[1].id,
            heartRate: 135, // Critical tachycardia
            bloodPressure: "140/90",
            spo2: 98,
            bodyTemperature: 36.7,
            motionLevel: 0.4,
            fallRiskScore: 20,
            recordedAt: new Date(now - 3000000),
          },
        ]);

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({ patientId: PATIENTS[0].id });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.recordsProcessed).toBe(1);
        expect(response.body.results.patientsSummary).toHaveProperty(
          PATIENTS[0].id,
        );
        expect(response.body.results.patientsSummary).not.toHaveProperty(
          PATIENTS[1].id,
        );
      });

      test("should filter records by date range", async () => {
        // Setup: Create patient
        await Patient.create({ ...PATIENTS[0], isActive: true });

        const now = new Date();
        const startDate = new Date(now - 7 * 24 * 3600000); // 7 days ago
        const endDate = new Date(now - 3 * 24 * 3600000); // 3 days ago

        // Create records: some within range, some outside
        await HealthRecord.insertMany([
          {
            patientId: PATIENTS[0].id,
            heartRate: 40, // Anomalous
            bloodPressure: "130/85",
            spo2: 98,
            bodyTemperature: 36.8,
            motionLevel: 0.3,
            fallRiskScore: 15,
            recordedAt: new Date(now - 10 * 24 * 3600000), // 10 days ago - outside range
          },
          {
            patientId: PATIENTS[0].id,
            heartRate: 38, // Anomalous
            bloodPressure: "130/85",
            spo2: 98,
            bodyTemperature: 36.8,
            motionLevel: 0.3,
            fallRiskScore: 15,
            recordedAt: new Date(now - 5 * 24 * 3600000), // 5 days ago - within range
          },
          {
            patientId: PATIENTS[0].id,
            heartRate: 42, // Anomalous
            bloodPressure: "130/85",
            spo2: 98,
            bodyTemperature: 36.8,
            motionLevel: 0.3,
            fallRiskScore: 15,
            recordedAt: new Date(now - 1 * 24 * 3600000), // 1 day ago - outside range
          },
        ]);

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.recordsProcessed).toBe(1); // Only middle record
      });

      test("should not save to database when updateDatabase is false", async () => {
        // Setup: Create patient
        await Patient.create({ ...PATIENTS[0], isActive: true });

        // Setup: Create anomalous record
        await HealthRecord.create({
          patientId: PATIENTS[0].id,
          heartRate: 35, // Critical bradycardia
          bloodPressure: "130/85",
          spo2: 98,
          bodyTemperature: 36.8,
          motionLevel: 0.3,
          fallRiskScore: 15,
          recordedAt: new Date(Date.now() - 3600000),
        });

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({ updateDatabase: false });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.newAnomaliesDetected).toBeGreaterThan(0);

        // Verify no anomalies were saved
        const savedAnomalies = await Anomaly.find({});
        expect(savedAnomalies.length).toBe(0);

        const savedAlerts = await AlertLog.find({});
        expect(savedAlerts.length).toBe(0);
      });
    });

    describe("Edge Cases", () => {
      test("should handle no health records in database", async () => {
        // Setup: Create patient but no health records
        await Patient.create({ ...PATIENTS[0], isActive: true });

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.recordsProcessed).toBe(0);
        expect(response.body.results.newAnomaliesDetected).toBe(0);
      });

      test("should handle no patients in database", async () => {
        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.recordsProcessed).toBe(0);
        expect(response.body.results.newAnomaliesDetected).toBe(0);
      });

      test("should handle non-existent patient ID", async () => {
        await Patient.create({ ...PATIENTS[0], isActive: true });

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({ patientId: "NON_EXISTENT" });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.recordsProcessed).toBe(0);
        expect(response.body.results.newAnomaliesDetected).toBe(0);
      });

      test("should not create duplicate anomalies for existing detected anomalies", async () => {
        // Setup: Create patient
        await Patient.create({ ...PATIENTS[0], isActive: true });

        const recordTime = new Date(Date.now() - 3600000);

        // Setup: Create anomalous health record
        await HealthRecord.create({
          patientId: PATIENTS[0].id,
          heartRate: 35, // Critical bradycardia
          bloodPressure: "130/85",
          spo2: 98,
          bodyTemperature: 36.8,
          motionLevel: 0.3,
          fallRiskScore: 15,
          recordedAt: recordTime,
        });

        // Create existing anomaly for same time
        await Anomaly.create({
          patientId: PATIENTS[0].id,
          severity: "critical",
          detectedAt: recordTime,
          alerts: [
            {
              type: "critical",
              category: "bradycardia",
              message: "Existing anomaly",
            },
          ],
          acknowledged: false,
        });

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.recordsProcessed).toBe(1);
        expect(response.body.results.newAnomaliesDetected).toBe(0); // Should not create duplicate

        // Verify only one anomaly exists
        const anomalies = await Anomaly.find({});
        expect(anomalies.length).toBe(1);
      });

      test("should handle all normal vitals (no anomalies)", async () => {
        // Setup: Create patient
        await Patient.create({ ...PATIENTS[0], isActive: true });

        // Setup: Create normal health records
        await HealthRecord.insertMany([
          {
            ...NORMAL_VITALS.elderly_normal,
            patientId: PATIENTS[0].id,
            recordedAt: new Date(Date.now() - 7200000),
          },
          {
            ...NORMAL_VITALS.elderly_normal,
            patientId: PATIENTS[0].id,
            recordedAt: new Date(Date.now() - 3600000),
          },
        ]);

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.recordsProcessed).toBe(2);
        expect(response.body.results.newAnomaliesDetected).toBe(0);
      });
    });

    describe("Corner Cases", () => {
      test("should detect multiple anomaly types in single record", async () => {
        // Setup: Create patient
        await Patient.create({ ...PATIENTS[0], isActive: true });

        // Setup: Create record with multiple anomalies
        await HealthRecord.create({
          patientId: PATIENTS[0].id,
          heartRate: 35, // Critical bradycardia
          bloodPressure: "195/110", // Hypertensive crisis
          spo2: 88, // Hypoxemia
          bodyTemperature: 36.8,
          motionLevel: 0.3,
          fallRiskScore: 15,
          recordedAt: new Date(Date.now() - 3600000),
        });

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.newAnomaliesDetected).toBe(1);
        expect(response.body.results.criticalAnomalies).toBe(1);

        // Verify multiple alerts in the anomaly
        const anomaly = await Anomaly.findOne({});
        expect(anomaly).toBeTruthy();
        expect(anomaly.alerts.length).toBeGreaterThan(1);
        expect(anomaly.severity).toBe("critical");
      });

      test("should handle large batch of records efficiently", async () => {
        // Setup: Create patient
        await Patient.create({ ...PATIENTS[0], isActive: true });

        // Setup: Create 100 records (mix of normal and anomalous)
        const records = [];
        const baseTime = Date.now();
        for (let i = 0; i < 100; i++) {
          records.push({
            patientId: PATIENTS[0].id,
            heartRate: i % 10 === 0 ? 35 : 72, // Every 10th record is anomalous
            bloodPressure: "130/85",
            spo2: 98,
            bodyTemperature: 36.8,
            motionLevel: 0.3,
            fallRiskScore: 15,
            recordedAt: new Date(baseTime - i * 300000), // 5 min intervals
          });
        }
        await HealthRecord.insertMany(records);

        const startTime = Date.now();
        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});
        const duration = Date.now() - startTime;

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.recordsProcessed).toBe(100);
        expect(response.body.results.newAnomaliesDetected).toBe(10); // 10 anomalous records
        expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      });

      test("should handle inactive patients when no patientId specified", async () => {
        // Setup: Create active and inactive patients
        await Patient.insertMany([
          { ...PATIENTS[0], isActive: true },
          { ...PATIENTS[1], isActive: false }, // Inactive
        ]);

        // Create anomalous records for both
        await HealthRecord.insertMany([
          {
            patientId: PATIENTS[0].id,
            heartRate: 35,
            bloodPressure: "130/85",
            spo2: 98,
            bodyTemperature: 36.8,
            motionLevel: 0.3,
            fallRiskScore: 15,
            recordedAt: new Date(Date.now() - 3600000),
          },
          {
            patientId: PATIENTS[1].id,
            heartRate: 35,
            bloodPressure: "130/85",
            spo2: 98,
            bodyTemperature: 36.8,
            motionLevel: 0.3,
            fallRiskScore: 15,
            recordedAt: new Date(Date.now() - 3000000),
          },
        ]);

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Should only process active patient
        expect(response.body.results.patientsSummary).toHaveProperty(
          PATIENTS[0].id,
        );
        expect(response.body.results.patientsSummary).not.toHaveProperty(
          PATIENTS[1].id,
        );
      });

      test("should process inactive patient when specific patientId provided", async () => {
        // Setup: Create inactive patient
        await Patient.create({ ...PATIENTS[1], isActive: false });

        // Create anomalous record
        await HealthRecord.create({
          patientId: PATIENTS[1].id,
          heartRate: 35,
          bloodPressure: "130/85",
          spo2: 98,
          bodyTemperature: 36.8,
          motionLevel: 0.3,
          fallRiskScore: 15,
          recordedAt: new Date(Date.now() - 3600000),
        });

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({ patientId: PATIENTS[1].id });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.recordsProcessed).toBe(1);
        expect(response.body.results.patientsSummary).toHaveProperty(
          PATIENTS[1].id,
        );
      });

      test("should create AlertLog entries for detected anomalies", async () => {
        // Setup: Create patient
        await Patient.create({ ...PATIENTS[0], isActive: true });

        // Setup: Create anomalous record
        await HealthRecord.create({
          patientId: PATIENTS[0].id,
          heartRate: 35,
          bloodPressure: "130/85",
          spo2: 98,
          bodyTemperature: 36.8,
          motionLevel: 0.3,
          fallRiskScore: 15,
          recordedAt: new Date(Date.now() - 3600000),
        });

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify AlertLog was created
        const alertLogs = await AlertLog.find({});
        expect(alertLogs.length).toBeGreaterThan(0);
        expect(alertLogs[0].metadata.retrospective).toBe(true);
        expect(alertLogs[0].patientId).toBe(PATIENTS[0].id);
      });
    });

    describe("Error Cases", () => {
      test("should return error for invalid startDate format", async () => {
        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({ startDate: "invalid-date" });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Invalid startDate");
      });

      test("should return error for invalid endDate format", async () => {
        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({ endDate: "not-a-date" });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Invalid endDate");
      });

      test("should return error when startDate is after endDate", async () => {
        const startDate = new Date();
        const endDate = new Date(Date.now() - 7 * 24 * 3600000);

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain(
          "startDate cannot be after endDate",
        );
      });

      test("should handle database errors gracefully", async () => {
        // Close database connection to simulate error
        await mongoose.connection.close();

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();

        // Reconnect for cleanup
        const mongoUri =
          process.env.MONGODB_COMPLETE_URI ||
          process.env.MONGODB_URI ||
          "mongodb://localhost:27017/health-monitor-test";
        await mongoose.connect(mongoUri);
      });
    });

    describe("Response Format Validation", () => {
      test("should return properly formatted response", async () => {
        await Patient.create({ ...PATIENTS[0], isActive: true });

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success");
        expect(response.body).toHaveProperty("message");
        expect(response.body).toHaveProperty("results");
        expect(response.body).toHaveProperty("timestamp");

        expect(response.body.results).toHaveProperty("recordsProcessed");
        expect(response.body.results).toHaveProperty("newAnomaliesDetected");
        expect(response.body.results).toHaveProperty("criticalAnomalies");
        expect(response.body.results).toHaveProperty("warningAnomalies");
        expect(response.body.results).toHaveProperty("patientsSummary");
        expect(response.body.results).toHaveProperty("errors");

        // Verify timestamp is valid ISO string
        expect(new Date(response.body.timestamp).toISOString()).toBe(
          response.body.timestamp,
        );
      });

      test("should include patient name in summary", async () => {
        await Patient.create({
          ...PATIENTS[0],
          name: "Test Patient Name",
          isActive: true,
        });

        await HealthRecord.create({
          patientId: PATIENTS[0].id,
          heartRate: 35,
          bloodPressure: "130/85",
          spo2: 98,
          bodyTemperature: 36.8,
          motionLevel: 0.3,
          fallRiskScore: 15,
          recordedAt: new Date(Date.now() - 3600000),
        });

        const response = await request(app)
          .post("/api/anomalies/retrospective")
          .send({});

        expect(response.status).toBe(200);
        const patientSummary =
          response.body.results.patientsSummary[PATIENTS[0].id];
        expect(patientSummary).toBeDefined();
        expect(patientSummary.patientName).toBe("Test Patient Name");
        expect(patientSummary.recordsProcessed).toBeGreaterThan(0);
      });
    });
  });
});
