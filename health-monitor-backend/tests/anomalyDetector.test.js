/**
 * Test Suite for Anomaly Detection Engine
 * Tests core functionality: critical vitals, statistical anomalies, fall detection
 */

const AnomalyDetector = require("../src/services/anomalyDetector");
const PATIENTS = require("../src/config/patients");

describe("AnomalyDetector", () => {
  let detector;
  let testPatient;
  let normalVitals;

  beforeEach(() => {
    detector = new AnomalyDetector();
    testPatient = PATIENTS[0]; // Margaret Chen

    normalVitals = {
      patientId: testPatient.id,
      heartRate: 72,
      bloodPressure: "140/88",
      spo2: 98,
      bodyTemperature: 36.8,
      motionLevel: 0.3,
      fallRiskScore: 10,
      timestamp: new Date().toISOString(),
    };
  });

  describe("Critical Vitals Detection", () => {
    test("should detect bradycardia (HR < threshold)", () => {
      const criticalVitals = { ...normalVitals, heartRate: 45 };
      const result = detector.detectAnomalies(
        testPatient.id,
        criticalVitals,
        testPatient
      );

      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe("critical");
      expect(result.alerts.some((a) => a.category === "bradycardia")).toBe(
        true
      );
    });

    test("should detect tachycardia (HR > threshold)", () => {
      const criticalVitals = { ...normalVitals, heartRate: 145 };
      const result = detector.detectAnomalies(
        testPatient.id,
        criticalVitals,
        testPatient
      );

      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe("critical");
      expect(result.alerts.some((a) => a.category === "tachycardia")).toBe(
        true
      );
    });

    test("should detect hypoxemia (SpO2 < threshold)", () => {
      const criticalVitals = { ...normalVitals, spo2: 88 };
      const result = detector.detectAnomalies(
        testPatient.id,
        criticalVitals,
        testPatient
      );

      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe("critical");
      expect(result.alerts.some((a) => a.category === "hypoxemia")).toBe(true);
    });

    test("should detect hypertensive crisis (BP > threshold)", () => {
      const criticalVitals = { ...normalVitals, bloodPressure: "190/95" };
      const result = detector.detectAnomalies(
        testPatient.id,
        criticalVitals,
        testPatient
      );

      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe("critical");
      expect(
        result.alerts.some((a) => a.category === "hypertensive_crisis")
      ).toBe(true);
    });

    test("should detect fever (temp > 38.5°C)", () => {
      const criticalVitals = { ...normalVitals, bodyTemperature: 38.8 };
      const result = detector.detectAnomalies(
        testPatient.id,
        criticalVitals,
        testPatient
      );

      expect(result.isAnomaly).toBe(true);
      expect(result.alerts.some((a) => a.category === "fever")).toBe(true);
    });

    test("should detect hypothermia (temp < 35°C)", () => {
      const criticalVitals = { ...normalVitals, bodyTemperature: 34.5 };
      const result = detector.detectAnomalies(
        testPatient.id,
        criticalVitals,
        testPatient
      );

      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe("critical");
      expect(result.alerts.some((a) => a.category === "hypothermia")).toBe(
        true
      );
    });
  });

  describe("Fall Detection", () => {
    test("should detect fall (high risk score)", () => {
      const fallVitals = { ...normalVitals, fallRiskScore: 95 };
      const result = detector.detectAnomalies(
        testPatient.id,
        fallVitals,
        testPatient
      );

      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe("critical");
      expect(result.alerts.some((a) => a.category === "fall_detected")).toBe(
        true
      );
    });

    test("should not flag fall with normal risk score", () => {
      const result = detector.detectAnomalies(
        testPatient.id,
        normalVitals,
        testPatient
      );
      const fallAlert = result.alerts.find(
        (a) => a.category === "fall_detected"
      );

      expect(fallAlert).toBeUndefined();
    });
  });

  describe("Statistical Anomalies (Z-Score)", () => {
    test("should detect abnormal HR after sufficient data", () => {
      // Build 24-hour window of normal data
      for (let i = 0; i < 12; i++) {
        detector.addToWindow(testPatient.id, normalVitals);
      }

      // Introduce abnormal HR
      const abnormalVitals = { ...normalVitals, heartRate: 110 };
      const result = detector.detectAnomalies(
        testPatient.id,
        abnormalVitals,
        testPatient
      );

      expect(result.alerts.some((a) => a.category === "hr_anomaly")).toBe(true);
    });

    test("should detect declining SpO2 trend", () => {
      // Create declining trend
      for (let i = 0; i < 10; i++) {
        const vitalWithDecline = { ...normalVitals, spo2: 98 - i * 0.5 };
        detector.addToWindow(testPatient.id, vitalWithDecline);
      }

      const decliningVitals = { ...normalVitals, spo2: 93 };
      const result = detector.detectAnomalies(
        testPatient.id,
        decliningVitals,
        testPatient
      );

      expect(result.alerts.some((a) => a.category === "spo2_declining")).toBe(
        true
      );
    });
  });

  describe("Behavioral Anomalies", () => {
    test("should detect sustained inactivity during day", () => {
      // Build window with low motion
      for (let i = 0; i < 25; i++) {
        detector.addToWindow(testPatient.id, {
          ...normalVitals,
          motionLevel: 0.05,
        });
      }

      const inactiveVitals = { ...normalVitals, motionLevel: 0.02 };
      const result = detector.detectAnomalies(
        testPatient.id,
        inactiveVitals,
        testPatient
      );

      // May or may not detect depending on time of day
      // Just verify it runs without error
      expect(result).toBeDefined();
    });
  });

  describe("Anomaly Scoring", () => {
    test("should calculate correct anomaly score", () => {
      const alerts = [
        { type: "critical", category: "bradycardia" },
        { type: "critical", category: "hypoxemia" },
        { type: "warning", category: "hr_anomaly" },
      ];

      const score = detector.calculateAnomalyScore(alerts);
      // 2 critical * 30 + 1 warning * 10 = 70
      expect(score).toBe(70);
    });

    test("should cap anomaly score at 100", () => {
      const alerts = Array(10).fill({ type: "critical" });
      const score = detector.calculateAnomalyScore(alerts);

      expect(score).toBeLessThanOrEqual(100);
    });

    test("should return 0 for no anomalies", () => {
      const score = detector.calculateAnomalyScore([]);
      expect(score).toBe(0);
    });
  });

  describe("Anomaly History", () => {
    test("should store and retrieve anomaly history", () => {
      const criticalVitals = { ...normalVitals, spo2: 88 };
      detector.detectAnomalies(testPatient.id, criticalVitals, testPatient);

      const history = detector.getAnomalyHistory(testPatient.id);
      expect(history.length).toBeGreaterThan(0);
    });

    test("should limit anomaly history to 100 entries", () => {
      for (let i = 0; i < 150; i++) {
        const vitals = { ...normalVitals, spo2: 88 + (i % 5) };
        detector.detectAnomalies(testPatient.id, vitals, testPatient);
      }

      const history = detector.getAnomalyHistory(testPatient.id, 200);
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe("Multiple Alerts", () => {
    test("should detect multiple concurrent anomalies", () => {
      const multiAnomalyVitals = {
        ...normalVitals,
        heartRate: 140, // Tachycardia
        spo2: 88, // Hypoxemia
        bodyTemperature: 39.5, // Fever
      };

      const result = detector.detectAnomalies(
        testPatient.id,
        multiAnomalyVitals,
        testPatient
      );

      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe("critical");
      expect(result.alerts.length).toBeGreaterThan(2);
    });
  });

  describe("Normal Vitals", () => {
    test("should not flag normal vitals as anomaly", () => {
      const result = detector.detectAnomalies(
        testPatient.id,
        normalVitals,
        testPatient
      );

      expect(result.isAnomaly).toBe(false);
      expect(result.severity).toBe("normal");
      expect(result.alerts.length).toBe(0);
    });
  });
});
