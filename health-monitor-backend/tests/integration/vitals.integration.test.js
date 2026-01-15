/**
 * Integration Tests for Vitals API Endpoints
 * Tests GET /api/vitals/:patientId/latest and /api/vitals/:patientId/history
 */

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { HealthRecord } = require("../../src/models");
const vitalsRouter = require("../../src/routes/vitals");
const {
  NORMAL_VITALS,
  EDGE_CASE_VITALS,
  CORNER_CASE_VITALS,
  QUERY_TEST_SCENARIOS,
  PATIENTS,
} = require("../fixtures/testDatasets");

// Create express app for testing
const app = express();
app.use(express.json());
app.use("/api/vitals", vitalsRouter);

describe("Vitals API Integration Tests", () => {
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
    // Clear health records before each test
    await HealthRecord.deleteMany({});
  });

  describe("GET /api/vitals/:patientId/latest", () => {
    describe("Normal Cases", () => {
      test("should return latest vital signs for existing patient", async () => {
        // Insert test data
        const testRecord = {
          ...NORMAL_VITALS.elderly_normal,
          recordedAt: new Date(),
        };
        await HealthRecord.create(testRecord);

        const response = await request(app).get(
          `/api/vitals/${PATIENTS[0].id}/latest`,
        );

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          patientId: PATIENTS[0].id,
          heartRate: 68,
          bloodPressure: "135/85",
          spo2: 97,
        });
        expect(response.body).toHaveProperty("_id");
        expect(response.body).toHaveProperty("recordedAt");
      });

      test("should return most recent record when multiple exist", async () => {
        const patientId = PATIENTS[1].id;

        // Insert older record
        await HealthRecord.create({
          ...NORMAL_VITALS.middleAge_normal,
          patientId,
          heartRate: 70,
          recordedAt: new Date(Date.now() - 3600000), // 1 hour ago
        });

        // Insert newer record
        await HealthRecord.create({
          ...NORMAL_VITALS.middleAge_normal,
          patientId,
          heartRate: 78,
          recordedAt: new Date(), // Now
        });

        const response = await request(app).get(
          `/api/vitals/${patientId}/latest`,
        );

        expect(response.status).toBe(200);
        expect(response.body.heartRate).toBe(78); // Should get the newer record
      });

      test("should handle patient with normal vitals at rest", async () => {
        await HealthRecord.create({
          ...NORMAL_VITALS.atRest_normal,
          recordedAt: new Date(),
        });

        const response = await request(app).get(
          `/api/vitals/${PATIENTS[3].id}/latest`,
        );

        expect(response.status).toBe(200);
        expect(response.body.heartRate).toBe(62);
        expect(response.body.motionLevel).toBe(0.1);
      });
    });

    describe("Edge Cases", () => {
      test("should return vitals at lower HR boundary", async () => {
        await HealthRecord.create({
          ...EDGE_CASE_VITALS.hr_lowerBoundary,
          recordedAt: new Date(),
        });

        const response = await request(app).get(
          `/api/vitals/${PATIENTS[0].id}/latest`,
        );

        expect(response.status).toBe(200);
        expect(response.body.heartRate).toBe(51);
      });

      test("should return vitals at upper HR boundary", async () => {
        await HealthRecord.create({
          ...EDGE_CASE_VITALS.hr_upperBoundary,
          recordedAt: new Date(),
        });

        const response = await request(app).get(
          `/api/vitals/${PATIENTS[1].id}/latest`,
        );

        expect(response.status).toBe(200);
        expect(response.body.heartRate).toBe(119);
      });

      test("should return vitals at SpO2 lower boundary", async () => {
        await HealthRecord.create({
          ...EDGE_CASE_VITALS.spo2_lowerBoundary,
          recordedAt: new Date(),
        });

        const response = await request(app).get(
          `/api/vitals/${PATIENTS[2].id}/latest`,
        );

        expect(response.status).toBe(200);
        expect(response.body.spo2).toBe(91);
      });
    });

    describe("Corner Cases", () => {
      test("should return critical bradycardia vitals", async () => {
        await HealthRecord.create({
          ...CORNER_CASE_VITALS.severe_bradycardia,
          recordedAt: new Date(),
        });

        const response = await request(app).get(
          `/api/vitals/${PATIENTS[0].id}/latest`,
        );

        expect(response.status).toBe(200);
        expect(response.body.heartRate).toBe(35);
      });

      test("should return vitals with multiple anomalies", async () => {
        await HealthRecord.create({
          ...CORNER_CASE_VITALS.multipleAnomalies,
          recordedAt: new Date(),
        });

        const response = await request(app).get(
          `/api/vitals/${PATIENTS[2].id}/latest`,
        );

        expect(response.status).toBe(200);
        expect(response.body.heartRate).toBe(145);
        expect(response.body.spo2).toBe(86);
        expect(response.body.bloodPressure).toBe("185/112");
      });

      test("should return fall detection scenario", async () => {
        await HealthRecord.create({
          ...CORNER_CASE_VITALS.fall_detected,
          recordedAt: new Date(),
        });

        const response = await request(app).get(
          `/api/vitals/${PATIENTS[1].id}/latest`,
        );

        expect(response.status).toBe(200);
        expect(response.body.fallRiskScore).toBe(98);
      });

      test("should handle zero motion scenario", async () => {
        await HealthRecord.create({
          ...CORNER_CASE_VITALS.zero_motion,
          recordedAt: new Date(),
        });

        const response = await request(app).get(
          `/api/vitals/${PATIENTS[0].id}/latest`,
        );

        expect(response.status).toBe(200);
        expect(response.body.motionLevel).toBe(0.0);
      });
    });

    describe("Error Cases", () => {
      test("should return 404 when no vitals exist for patient", async () => {
        const response = await request(app).get(
          `/api/vitals/${PATIENTS[0].id}/latest`,
        );

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toContain("No vital signs found");
      });

      test("should return 404 for non-existent patient ID", async () => {
        const response = await request(app).get(
          "/api/vitals/nonexistent-patient-id/latest",
        );

        expect(response.status).toBe(404);
      });
    });
  });

  describe("GET /api/vitals/:patientId/history", () => {
    describe("Normal Cases", () => {
      test("should return vitals history with default parameters (24h, limit 100)", async () => {
        const patientId = PATIENTS[0].id;

        // Insert 50 records over last 24 hours
        const records = Array.from({ length: 50 }, (_, i) => ({
          ...NORMAL_VITALS.elderly_normal,
          patientId,
          heartRate: 68 + (i % 10),
          recordedAt: new Date(Date.now() - (50 - i) * 1800000), // 30-min intervals
        }));
        await HealthRecord.insertMany(records);

        const response = await request(app).get(
          `/api/vitals/${patientId}/history`,
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("patientId", patientId);
        expect(response.body).toHaveProperty("period", "Last 24 hours");
        expect(response.body).toHaveProperty("count", 50);
        expect(response.body.records).toHaveLength(50);

        // Verify chronological order (oldest first)
        expect(response.body.records[0].heartRate).toBe(68);
        expect(response.body.records[49].heartRate).toBe(77);
      });

      test("should respect custom limit parameter", async () => {
        const patientId = PATIENTS[1].id;

        // Insert 100 records
        const records = Array.from({ length: 100 }, (_, i) => ({
          ...NORMAL_VITALS.middleAge_normal,
          patientId,
          recordedAt: new Date(Date.now() - (100 - i) * 300000),
        }));
        await HealthRecord.insertMany(records);

        const response = await request(app).get(
          `/api/vitals/${patientId}/history?limit=20`,
        );

        expect(response.status).toBe(200);
        expect(response.body.records).toHaveLength(20);
        expect(response.body.count).toBe(20);
      });

      test("should respect custom hours parameter", async () => {
        const patientId = PATIENTS[2].id;

        // Insert records at different times
        await HealthRecord.create({
          ...NORMAL_VITALS.youngAdult_normal,
          patientId,
          heartRate: 70,
          recordedAt: new Date(Date.now() - 7200000), // 2 hours ago
        });

        await HealthRecord.create({
          ...NORMAL_VITALS.youngAdult_normal,
          patientId,
          heartRate: 80,
          recordedAt: new Date(Date.now() - 10800000), // 3 hours ago
        });

        await HealthRecord.create({
          ...NORMAL_VITALS.youngAdult_normal,
          patientId,
          heartRate: 90,
          recordedAt: new Date(Date.now() - 14400000), // 4 hours ago
        });

        // Query for last 3 hours only
        const response = await request(app).get(
          `/api/vitals/${patientId}/history?hours=3`,
        );

        expect(response.status).toBe(200);
        expect(response.body.period).toBe("Last 3 hours");
        expect(response.body.count).toBe(2); // Should only get 2 hour and 3 hour records
      });

      test("should return empty array when no history exists", async () => {
        const response = await request(app).get(
          `/api/vitals/${PATIENTS[3].id}/history`,
        );

        expect(response.status).toBe(200);
        expect(response.body.records).toEqual([]);
        expect(response.body.count).toBe(0);
      });
    });

    describe("Edge Cases", () => {
      test("should handle exactly 100 records (default limit)", async () => {
        const patientId = PATIENTS[4].id;

        const records = Array.from({ length: 100 }, (_, i) => ({
          ...NORMAL_VITALS.lightActivity_normal,
          patientId,
          recordedAt: new Date(Date.now() - (100 - i) * 300000),
        }));
        await HealthRecord.insertMany(records);

        const response = await request(app).get(
          `/api/vitals/${patientId}/history`,
        );

        expect(response.status).toBe(200);
        expect(response.body.records).toHaveLength(100);
      });

      test("should limit to 100 when more records exist", async () => {
        const patientId = PATIENTS[0].id;

        const records = Array.from({ length: 150 }, (_, i) => ({
          ...NORMAL_VITALS.elderly_normal,
          patientId,
          recordedAt: new Date(Date.now() - (150 - i) * 300000),
        }));
        await HealthRecord.insertMany(records);

        const response = await request(app).get(
          `/api/vitals/${patientId}/history`,
        );

        expect(response.status).toBe(200);
        expect(response.body.records).toHaveLength(100);
      });

      test("should handle limit=1 (minimum)", async () => {
        const patientId = PATIENTS[1].id;

        await HealthRecord.insertMany([
          {
            ...NORMAL_VITALS.middleAge_normal,
            patientId,
            recordedAt: new Date(Date.now() - 3600000),
          },
          {
            ...NORMAL_VITALS.middleAge_normal,
            patientId,
            recordedAt: new Date(),
          },
        ]);

        const response = await request(app).get(
          `/api/vitals/${patientId}/history?limit=1`,
        );

        expect(response.status).toBe(200);
        expect(response.body.records).toHaveLength(1);
      });

      test("should handle hours=1 (minimum time range)", async () => {
        const patientId = PATIENTS[2].id;

        await HealthRecord.create({
          ...NORMAL_VITALS.youngAdult_normal,
          patientId,
          recordedAt: new Date(Date.now() - 1800000), // 30 min ago
        });

        await HealthRecord.create({
          ...NORMAL_VITALS.youngAdult_normal,
          patientId,
          recordedAt: new Date(Date.now() - 7200000), // 2 hours ago (outside range)
        });

        const response = await request(app).get(
          `/api/vitals/${patientId}/history?hours=1`,
        );

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(1);
      });
    });

    describe("Corner Cases - Time Series Scenarios", () => {
      test("should handle declining SpO2 trend data", async () => {
        const patientId = PATIENTS[0].id;
        const records = QUERY_TEST_SCENARIOS.last_24_hours
          .slice(0, 20)
          .map((r) => ({ ...r, patientId }));

        await HealthRecord.insertMany(records);

        const response = await request(app).get(
          `/api/vitals/${patientId}/history?limit=20`,
        );

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(20);

        // Verify order (should be chronologically sorted)
        const timestamps = response.body.records.map((r) =>
          new Date(r.recordedAt).getTime(),
        );
        for (let i = 1; i < timestamps.length; i++) {
          expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
        }
      });

      test("should handle sparse data (large gaps)", async () => {
        const patientId = PATIENTS[1].id;
        const sparseRecords = QUERY_TEST_SCENARIOS.sparse_data.map((r) => ({
          ...r,
          patientId,
        }));

        await HealthRecord.insertMany(sparseRecords);

        const response = await request(app).get(
          `/api/vitals/${patientId}/history?hours=24`,
        );

        expect(response.status).toBe(200);
        expect(response.body.count).toBeLessThanOrEqual(10);
      });

      test("should handle dense data (high frequency readings)", async () => {
        const patientId = PATIENTS[2].id;
        const denseRecords = QUERY_TEST_SCENARIOS.dense_data.map((r) => ({
          ...r,
          patientId,
        }));

        await HealthRecord.insertMany(denseRecords);

        const response = await request(app).get(
          `/api/vitals/${patientId}/history?hours=2&limit=100`,
        );

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(60);
      });
    });

    describe("Error Cases", () => {
      test("should handle invalid limit parameter (non-numeric)", async () => {
        const response = await request(app).get(
          `/api/vitals/${PATIENTS[0].id}/history?limit=invalid`,
        );

        expect(response.status).toBe(200);
        // Should fallback to default limit
        expect(response.body).toHaveProperty("count");
      });

      test("should handle invalid hours parameter (non-numeric)", async () => {
        const response = await request(app).get(
          `/api/vitals/${PATIENTS[1].id}/history?hours=invalid`,
        );

        expect(response.status).toBe(200);
        // Should fallback to default 24 hours
        expect(response.body.period).toContain("24");
      });

      test("should handle extremely large limit gracefully", async () => {
        const response = await request(app).get(
          `/api/vitals/${PATIENTS[2].id}/history?limit=999999`,
        );

        expect(response.status).toBe(200);
        expect(response.body.records).toBeDefined();
      });

      test("should handle negative parameters", async () => {
        const response = await request(app).get(
          `/api/vitals/${PATIENTS[3].id}/history?limit=-50&hours=-10`,
        );

        expect(response.status).toBe(200);
        // Should handle gracefully, likely using defaults
      });
    });
  });

  describe("Cross-Endpoint Consistency", () => {
    test("latest endpoint should return same data as most recent in history", async () => {
      const patientId = PATIENTS[0].id;

      const records = Array.from({ length: 10 }, (_, i) => ({
        ...NORMAL_VITALS.elderly_normal,
        patientId,
        heartRate: 60 + i,
        recordedAt: new Date(Date.now() - (10 - i) * 300000),
      }));
      await HealthRecord.insertMany(records);

      const latestResponse = await request(app).get(
        `/api/vitals/${patientId}/latest`,
      );

      const historyResponse = await request(app).get(
        `/api/vitals/${patientId}/history?limit=1`,
      );

      expect(latestResponse.status).toBe(200);
      expect(historyResponse.status).toBe(200);

      // Latest record should have heartRate = 69 (last in series)
      expect(latestResponse.body.heartRate).toBe(69);

      // History's last record should match (when sorted descending)
      const historyLatest =
        historyResponse.body.records[historyResponse.body.records.length - 1];
      expect(historyLatest.heartRate).toBe(69);
    });
  });
});
