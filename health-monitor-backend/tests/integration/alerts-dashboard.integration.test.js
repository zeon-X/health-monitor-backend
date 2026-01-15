/**
 * Integration Tests for Alerts and Dashboard API Endpoints
 * Tests alert history and dashboard summary functionality
 */

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const {
  AlertLog,
  Patient,
  HealthRecord,
  Anomaly,
} = require("../../src/models");
const alertsRouter = require("../../src/routes/alerts");
const dashboardRouter = require("../../src/routes/dashboard");
const { NORMAL_VITALS, PATIENTS } = require("../fixtures/testDatasets");

// Create express app for testing
const app = express();
app.use(express.json());
app.use("/api/alerts", alertsRouter);
app.use("/api/dashboard", dashboardRouter);

describe("Alerts & Dashboard API Integration Tests", () => {
  // Database setup
  beforeAll(async () => {
    const mongoUri =
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

  describe("GET /api/alerts/history", () => {
    describe("Normal Cases", () => {
      test("should return alert history with default limit (50)", async () => {
        // Insert 30 alerts
        const alerts = Array.from({ length: 30 }, (_, i) => ({
          patientId: PATIENTS[0].id,
          type: i % 2 === 0 ? "critical" : "warning",
          category: "bradycardia",
          message: `Test alert ${i}`,
          value: 45,
          threshold: 50,
          timestamp: new Date(Date.now() - (30 - i) * 60000), // 1-min intervals
        }));
        await AlertLog.insertMany(alerts);

        const response = await request(app).get("/api/alerts/history");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(30);

        // Verify descending order (most recent first)
        const timestamps = response.body.map((a) =>
          new Date(a.timestamp).getTime(),
        );
        for (let i = 1; i < timestamps.length; i++) {
          expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1]);
        }
      });

      test("should filter alerts by patientId", async () => {
        // Insert alerts for different patients
        await AlertLog.create({
          patientId: PATIENTS[0].id,
          type: "critical",
          category: "bradycardia",
          message: "Patient 0 alert",
          value: 45,
          threshold: 50,
          timestamp: new Date(),
        });

        await AlertLog.create({
          patientId: PATIENTS[1].id,
          type: "warning",
          category: "tachycardia",
          message: "Patient 1 alert",
          value: 125,
          threshold: 120,
          timestamp: new Date(),
        });

        const response = await request(app).get(
          `/api/alerts/history?patientId=${PATIENTS[0].id}`,
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].patientId).toBe(PATIENTS[0].id);
        expect(response.body[0].message).toContain("Patient 0");
      });

      test("should respect custom limit parameter", async () => {
        const alerts = Array.from({ length: 100 }, (_, i) => ({
          patientId: PATIENTS[0].id,
          type: "critical",
          category: "bradycardia",
          message: `Alert ${i}`,
          value: 45,
          threshold: 50,
          timestamp: new Date(Date.now() - i * 1000),
        }));
        await AlertLog.insertMany(alerts);

        const response = await request(app).get("/api/alerts/history?limit=10");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(10);
      });

      test("should return empty array when no alerts exist", async () => {
        const response = await request(app).get("/api/alerts/history");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
      });
    });

    describe("Edge Cases", () => {
      test("should handle exactly 50 alerts (default limit)", async () => {
        const alerts = Array.from({ length: 50 }, (_, i) => ({
          patientId: PATIENTS[0].id,
          type: "critical",
          category: "hypoxemia",
          message: `Alert ${i}`,
          value: 88,
          threshold: 90,
          timestamp: new Date(Date.now() - i * 1000),
        }));
        await AlertLog.insertMany(alerts);

        const response = await request(app).get("/api/alerts/history");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(50);
      });

      test("should limit to specified amount when more exist", async () => {
        const alerts = Array.from({ length: 200 }, (_, i) => ({
          patientId: PATIENTS[1].id,
          type: "warning",
          category: "hr_anomaly",
          message: `Alert ${i}`,
          value: 110,
          threshold: 100,
          timestamp: new Date(Date.now() - i * 1000),
        }));
        await AlertLog.insertMany(alerts);

        const response = await request(app).get("/api/alerts/history?limit=50");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(50);
      });

      test("should handle limit=1 (minimum)", async () => {
        await AlertLog.insertMany([
          {
            patientId: PATIENTS[0].id,
            type: "critical",
            category: "bradycardia",
            message: "First alert",
            value: 45,
            threshold: 50,
            timestamp: new Date(Date.now() - 60000),
          },
          {
            patientId: PATIENTS[0].id,
            type: "critical",
            category: "bradycardia",
            message: "Second alert",
            value: 44,
            threshold: 50,
            timestamp: new Date(),
          },
        ]);

        const response = await request(app).get("/api/alerts/history?limit=1");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].message).toBe("Second alert"); // Most recent
      });
    });

    describe("Corner Cases", () => {
      test("should handle mixed alert types (critical, warning, info)", async () => {
        await AlertLog.insertMany([
          {
            patientId: PATIENTS[0].id,
            type: "critical",
            category: "bradycardia",
            message: "Critical alert",
            value: 35,
            threshold: 50,
            timestamp: new Date(Date.now() - 3000),
          },
          {
            patientId: PATIENTS[0].id,
            type: "warning",
            category: "hr_anomaly",
            message: "Warning alert",
            value: 110,
            threshold: 100,
            timestamp: new Date(Date.now() - 2000),
          },
          {
            patientId: PATIENTS[0].id,
            type: "info",
            category: "spo2_declining",
            message: "Info alert",
            value: 94,
            threshold: 95,
            timestamp: new Date(Date.now() - 1000),
          },
        ]);

        const response = await request(app).get("/api/alerts/history");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(3);

        const types = response.body.map((a) => a.type);
        expect(types).toContain("critical");
        expect(types).toContain("warning");
        expect(types).toContain("info");
      });

      test("should handle alerts with multiple patients", async () => {
        for (let i = 0; i < 5; i++) {
          await AlertLog.create({
            patientId: PATIENTS[i].id,
            type: "critical",
            category: "bradycardia",
            message: `Alert for patient ${i}`,
            value: 45,
            threshold: 50,
            timestamp: new Date(Date.now() - i * 1000),
          });
        }

        const response = await request(app).get("/api/alerts/history");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(5);

        const uniquePatients = [
          ...new Set(response.body.map((a) => a.patientId)),
        ];
        expect(uniquePatients).toHaveLength(5);
      });
    });

    describe("Error Cases", () => {
      test("should handle invalid limit parameter gracefully", async () => {
        const response = await request(app).get(
          "/api/alerts/history?limit=invalid",
        );

        expect(response.status).toBe(200);
        // Should use default limit
      });

      test("should handle negative limit parameter", async () => {
        await AlertLog.create({
          patientId: PATIENTS[0].id,
          type: "critical",
          category: "bradycardia",
          message: "Test alert",
          value: 45,
          threshold: 50,
          timestamp: new Date(),
        });

        const response = await request(app).get(
          "/api/alerts/history?limit=-10",
        );

        expect(response.status).toBe(200);
      });

      test("should return empty array for non-existent patientId", async () => {
        await AlertLog.create({
          patientId: PATIENTS[0].id,
          type: "critical",
          category: "bradycardia",
          message: "Test alert",
          value: 45,
          threshold: 50,
          timestamp: new Date(),
        });

        const response = await request(app).get(
          "/api/alerts/history?patientId=NON_EXISTENT",
        );

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
      });
    });
  });

  describe("GET /api/dashboard/summary", () => {
    describe("Normal Cases", () => {
      test("should return complete dashboard summary with all metrics", async () => {
        // Setup: Create patients
        await Patient.insertMany([
          { ...PATIENTS[0], isActive: true },
          { ...PATIENTS[1], isActive: true },
        ]);

        // Setup: Create anomalies
        await Anomaly.insertMany([
          {
            patientId: PATIENTS[0].id,
            severity: "critical",
            acknowledged: false,
            detectedAt: new Date(Date.now() - 60000),
            alerts: [{ type: "critical", category: "bradycardia" }],
          },
          {
            patientId: PATIENTS[1].id,
            severity: "warning",
            acknowledged: false,
            detectedAt: new Date(),
            alerts: [{ type: "warning", category: "hr_anomaly" }],
          },
        ]);

        // Setup: Create health records
        await HealthRecord.insertMany([
          {
            ...NORMAL_VITALS.elderly_normal,
            patientId: PATIENTS[0].id,
            recordedAt: new Date(),
          },
          {
            ...NORMAL_VITALS.middleAge_normal,
            patientId: PATIENTS[1].id,
            recordedAt: new Date(),
          },
        ]);

        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("summary");
        expect(response.body).toHaveProperty("recentAnomalies");
        expect(response.body).toHaveProperty("latestVitals");
        expect(response.body).toHaveProperty("timestamp");

        // Verify summary metrics
        expect(response.body.summary.totalPatients).toBe(2);
        expect(response.body.summary.activeAnomalies).toBe(2);
        expect(response.body.summary.criticalCount).toBe(1);
        expect(response.body.summary.warningCount).toBe(1);

        // Verify recent anomalies
        expect(response.body.recentAnomalies).toHaveLength(2);

        // Verify latest vitals
        expect(response.body.latestVitals).toHaveLength(2);
        expect(response.body.latestVitals[0]).toHaveProperty("patientName");
        expect(response.body.latestVitals[0]).toHaveProperty("heartRate");
      });

      test("should exclude inactive patients from count", async () => {
        await Patient.insertMany([
          { ...PATIENTS[0], isActive: true },
          { ...PATIENTS[1], isActive: false }, // Inactive
          { ...PATIENTS[2], isActive: true },
        ]);

        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.summary.totalPatients).toBe(2); // Only active
      });

      test("should exclude acknowledged anomalies from counts", async () => {
        await Anomaly.insertMany([
          {
            patientId: PATIENTS[0].id,
            severity: "critical",
            acknowledged: false,
            detectedAt: new Date(),
            alerts: [],
          },
          {
            patientId: PATIENTS[1].id,
            severity: "critical",
            acknowledged: true, // Acknowledged
            detectedAt: new Date(),
            alerts: [],
          },
        ]);

        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.summary.activeAnomalies).toBe(1);
        expect(response.body.summary.criticalCount).toBe(1);
      });

      test("should limit recent anomalies to 5", async () => {
        const anomalies = Array.from({ length: 10 }, (_, i) => ({
          patientId: PATIENTS[0].id,
          severity: "critical",
          acknowledged: false,
          detectedAt: new Date(Date.now() - i * 60000),
          alerts: [],
        }));
        await Anomaly.insertMany(anomalies);

        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.recentAnomalies).toHaveLength(5);
      });
    });

    describe("Edge Cases", () => {
      test("should handle zero patients", async () => {
        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.summary.totalPatients).toBe(0);
        expect(response.body.summary.activeAnomalies).toBe(0);
        expect(response.body.latestVitals).toEqual([]);
      });

      test("should handle patients with no vital records", async () => {
        await Patient.create({ ...PATIENTS[0], isActive: true });

        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.summary.totalPatients).toBe(1);
        expect(response.body.latestVitals).toEqual([]);
      });

      test("should handle exactly 5 recent anomalies", async () => {
        const anomalies = Array.from({ length: 5 }, (_, i) => ({
          patientId: PATIENTS[0].id,
          severity: "warning",
          acknowledged: false,
          detectedAt: new Date(Date.now() - i * 60000),
          alerts: [],
        }));
        await Anomaly.insertMany(anomalies);

        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.recentAnomalies).toHaveLength(5);
      });

      test("should handle all critical anomalies", async () => {
        await Anomaly.insertMany([
          {
            patientId: PATIENTS[0].id,
            severity: "critical",
            acknowledged: false,
            detectedAt: new Date(),
            alerts: [],
          },
          {
            patientId: PATIENTS[1].id,
            severity: "critical",
            acknowledged: false,
            detectedAt: new Date(),
            alerts: [],
          },
        ]);

        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.summary.activeAnomalies).toBe(2);
        expect(response.body.summary.criticalCount).toBe(2);
        expect(response.body.summary.warningCount).toBe(0);
      });
    });

    describe("Corner Cases", () => {
      test("should handle multiple vitals per patient (return latest)", async () => {
        await Patient.create({ ...PATIENTS[0], isActive: true });

        await HealthRecord.insertMany([
          {
            ...NORMAL_VITALS.elderly_normal,
            patientId: PATIENTS[0].id,
            heartRate: 65,
            recordedAt: new Date(Date.now() - 3600000), // 1 hour ago
          },
          {
            ...NORMAL_VITALS.elderly_normal,
            patientId: PATIENTS[0].id,
            heartRate: 72, // Latest
            recordedAt: new Date(),
          },
        ]);

        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.latestVitals).toHaveLength(1);
        expect(response.body.latestVitals[0].heartRate).toBe(72); // Should get latest
      });

      test("should handle mixed severity anomalies", async () => {
        await Anomaly.insertMany([
          {
            patientId: PATIENTS[0].id,
            severity: "critical",
            acknowledged: false,
            detectedAt: new Date(Date.now() - 3000),
            alerts: [],
          },
          {
            patientId: PATIENTS[1].id,
            severity: "warning",
            acknowledged: false,
            detectedAt: new Date(Date.now() - 2000),
            alerts: [],
          },
          {
            patientId: PATIENTS[2].id,
            severity: "info",
            acknowledged: false,
            detectedAt: new Date(Date.now() - 1000),
            alerts: [],
          },
        ]);

        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.summary.activeAnomalies).toBe(3);
        expect(response.body.summary.criticalCount).toBe(1);
        expect(response.body.summary.warningCount).toBe(1);
        // Note: info anomalies are counted in activeAnomalies but not separately
      });

      test("should order recent anomalies by most recent first", async () => {
        await Anomaly.insertMany([
          {
            patientId: PATIENTS[0].id,
            severity: "critical",
            acknowledged: false,
            detectedAt: new Date(Date.now() - 10000),
            alerts: [{ category: "oldest" }],
          },
          {
            patientId: PATIENTS[1].id,
            severity: "warning",
            acknowledged: false,
            detectedAt: new Date(),
            alerts: [{ category: "newest" }],
          },
        ]);

        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.recentAnomalies[0].alerts[0].category).toBe(
          "newest",
        );
        expect(response.body.recentAnomalies[1].alerts[0].category).toBe(
          "oldest",
        );
      });

      test("should include patient name in latest vitals", async () => {
        await Patient.create({
          ...PATIENTS[0],
          name: "Test Patient Name",
          isActive: true,
        });

        await HealthRecord.create({
          ...NORMAL_VITALS.elderly_normal,
          patientId: PATIENTS[0].id,
          recordedAt: new Date(),
        });

        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.latestVitals[0].patientName).toBe(
          "Test Patient Name",
        );
      });
    });

    describe("Timestamp Validation", () => {
      test("should return valid ISO timestamp", async () => {
        const response = await request(app).get("/api/dashboard/summary");

        expect(response.status).toBe(200);
        expect(response.body.timestamp).toBeDefined();
        expect(new Date(response.body.timestamp).toISOString()).toBe(
          response.body.timestamp,
        );
      });
    });
  });
});
