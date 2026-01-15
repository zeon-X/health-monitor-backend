/**
 * Test Datasets for Health Monitor Backend
 * Contains normal cases, edge cases, and corner cases for comprehensive testing
 */

const PATIENTS = require("../../src/config/patients");

/**
 * NORMAL CASES - Typical vitals within healthy ranges
 */
const NORMAL_VITALS = {
  // Elderly patient (70+ years)
  elderly_normal: {
    patientId: PATIENTS[0].id, // Margaret Chen (72)
    heartRate: 68,
    bloodPressure: "135/85",
    spo2: 97,
    bodyTemperature: 36.6,
    motionLevel: 0.25,
    fallRiskScore: 15,
    timestamp: new Date().toISOString(),
  },

  // Middle-aged patient (40-60 years)
  middleAge_normal: {
    patientId: PATIENTS[1].id, // James Wilson (58)
    heartRate: 75,
    bloodPressure: "125/80",
    spo2: 98,
    bodyTemperature: 36.8,
    motionLevel: 0.5,
    fallRiskScore: 8,
    timestamp: new Date().toISOString(),
  },

  // Young adult (20-40 years)
  youngAdult_normal: {
    patientId: PATIENTS[2].id, // Sarah Martinez (45)
    heartRate: 72,
    bloodPressure: "118/75",
    spo2: 99,
    bodyTemperature: 36.7,
    motionLevel: 0.6,
    fallRiskScore: 5,
    timestamp: new Date().toISOString(),
  },

  // At rest (minimal activity)
  atRest_normal: {
    patientId: PATIENTS[3].id, // Robert Lee (63)
    heartRate: 62,
    bloodPressure: "120/78",
    spo2: 98,
    bodyTemperature: 36.5,
    motionLevel: 0.1,
    fallRiskScore: 10,
    timestamp: new Date().toISOString(),
  },

  // Light activity
  lightActivity_normal: {
    patientId: PATIENTS[4].id, // Emily Thompson (51)
    heartRate: 85,
    bloodPressure: "128/82",
    spo2: 97,
    bodyTemperature: 36.9,
    motionLevel: 0.7,
    fallRiskScore: 12,
    timestamp: new Date().toISOString(),
  },
};

/**
 * EDGE CASES - Boundary values that are still technically normal but near thresholds
 */
const EDGE_CASE_VITALS = {
  // Heart rate at lower boundary (just above bradycardia)
  hr_lowerBoundary: {
    patientId: PATIENTS[0].id,
    heartRate: 51, // Just above 50 threshold
    bloodPressure: "130/85",
    spo2: 97,
    bodyTemperature: 36.6,
    motionLevel: 0.2,
    fallRiskScore: 10,
    timestamp: new Date().toISOString(),
  },

  // Heart rate at upper boundary (just below tachycardia)
  hr_upperBoundary: {
    patientId: PATIENTS[1].id,
    heartRate: 119, // Just below 120 threshold
    bloodPressure: "130/85",
    spo2: 97,
    bodyTemperature: 36.6,
    motionLevel: 0.8,
    fallRiskScore: 8,
    timestamp: new Date().toISOString(),
  },

  // SpO2 at lower boundary (just above hypoxemia)
  spo2_lowerBoundary: {
    patientId: PATIENTS[2].id,
    heartRate: 72,
    bloodPressure: "120/80",
    spo2: 91, // Just above 90 threshold
    bodyTemperature: 36.7,
    motionLevel: 0.4,
    fallRiskScore: 7,
    timestamp: new Date().toISOString(),
  },

  // Blood pressure at upper boundary (pre-hypertensive)
  bp_upperBoundary: {
    patientId: PATIENTS[3].id,
    heartRate: 70,
    bloodPressure: "179/109", // Just below 180/110 critical threshold
    spo2: 98,
    bodyTemperature: 36.6,
    motionLevel: 0.3,
    fallRiskScore: 11,
    timestamp: new Date().toISOString(),
  },

  // Temperature at upper boundary (sub-febrile)
  temp_upperBoundary: {
    patientId: PATIENTS[4].id,
    heartRate: 78,
    bloodPressure: "125/82",
    spo2: 97,
    bodyTemperature: 37.8, // Just below 38 fever threshold
    motionLevel: 0.4,
    fallRiskScore: 9,
    timestamp: new Date().toISOString(),
  },

  // Temperature at lower boundary
  temp_lowerBoundary: {
    patientId: PATIENTS[0].id,
    heartRate: 65,
    bloodPressure: "130/85",
    spo2: 98,
    bodyTemperature: 35.5, // Just above 35 hypothermia threshold
    motionLevel: 0.2,
    fallRiskScore: 14,
    timestamp: new Date().toISOString(),
  },

  // Fall risk just below detection
  fallRisk_boundary: {
    patientId: PATIENTS[1].id,
    heartRate: 72,
    bloodPressure: "128/83",
    spo2: 97,
    bodyTemperature: 36.7,
    motionLevel: 0.3,
    fallRiskScore: 79, // Just below 80 threshold
    timestamp: new Date().toISOString(),
  },
};

/**
 * CORNER CASES - Critical/abnormal values and special scenarios
 */
const CORNER_CASE_VITALS = {
  // Severe bradycardia
  severe_bradycardia: {
    patientId: PATIENTS[0].id,
    heartRate: 35,
    bloodPressure: "110/70",
    spo2: 95,
    bodyTemperature: 36.5,
    motionLevel: 0.1,
    fallRiskScore: 20,
    timestamp: new Date().toISOString(),
  },

  // Severe tachycardia
  severe_tachycardia: {
    patientId: PATIENTS[1].id,
    heartRate: 155,
    bloodPressure: "145/95",
    spo2: 94,
    bodyTemperature: 37.2,
    motionLevel: 0.9,
    fallRiskScore: 15,
    timestamp: new Date().toISOString(),
  },

  // Critical hypoxemia
  critical_hypoxemia: {
    patientId: PATIENTS[2].id,
    heartRate: 95,
    bloodPressure: "135/88",
    spo2: 82,
    bodyTemperature: 36.8,
    motionLevel: 0.2,
    fallRiskScore: 25,
    timestamp: new Date().toISOString(),
  },

  // Hypertensive crisis
  hypertensive_crisis: {
    patientId: PATIENTS[3].id,
    heartRate: 88,
    bloodPressure: "195/115",
    spo2: 96,
    bodyTemperature: 36.9,
    motionLevel: 0.3,
    fallRiskScore: 18,
    timestamp: new Date().toISOString(),
  },

  // High fever
  high_fever: {
    patientId: PATIENTS[4].id,
    heartRate: 102,
    bloodPressure: "130/85",
    spo2: 96,
    bodyTemperature: 39.5,
    motionLevel: 0.2,
    fallRiskScore: 22,
    timestamp: new Date().toISOString(),
  },

  // Severe hypothermia
  severe_hypothermia: {
    patientId: PATIENTS[0].id,
    heartRate: 48,
    bloodPressure: "105/65",
    spo2: 93,
    bodyTemperature: 33.8,
    motionLevel: 0.05,
    fallRiskScore: 30,
    timestamp: new Date().toISOString(),
  },

  // Fall detected
  fall_detected: {
    patientId: PATIENTS[1].id,
    heartRate: 110,
    bloodPressure: "150/92",
    spo2: 94,
    bodyTemperature: 36.8,
    motionLevel: 0.95,
    fallRiskScore: 98,
    timestamp: new Date().toISOString(),
  },

  // Multiple concurrent critical conditions
  multipleAnomalies: {
    patientId: PATIENTS[2].id,
    heartRate: 145, // Tachycardia
    bloodPressure: "185/112", // Hypertensive crisis
    spo2: 86, // Hypoxemia
    bodyTemperature: 39.2, // Fever
    motionLevel: 0.15,
    fallRiskScore: 35,
    timestamp: new Date().toISOString(),
  },

  // Extreme values (unrealistic but tests limits)
  extreme_values: {
    patientId: PATIENTS[3].id,
    heartRate: 200,
    bloodPressure: "250/140",
    spo2: 70,
    bodyTemperature: 41.5,
    motionLevel: 1.0,
    fallRiskScore: 100,
    timestamp: new Date().toISOString(),
  },

  // Minimal vitals (very low but conscious)
  minimal_vitals: {
    patientId: PATIENTS[4].id,
    heartRate: 30,
    bloodPressure: "80/50",
    spo2: 85,
    bodyTemperature: 34.0,
    motionLevel: 0.01,
    fallRiskScore: 5,
    timestamp: new Date().toISOString(),
  },

  // Zero motion (completely still)
  zero_motion: {
    patientId: PATIENTS[0].id,
    heartRate: 65,
    bloodPressure: "128/82",
    spo2: 97,
    bodyTemperature: 36.6,
    motionLevel: 0.0,
    fallRiskScore: 12,
    timestamp: new Date().toISOString(),
  },

  // Maximum motion (vigorous activity)
  maximum_motion: {
    patientId: PATIENTS[1].id,
    heartRate: 115,
    bloodPressure: "140/88",
    spo2: 96,
    bodyTemperature: 37.5,
    motionLevel: 1.0,
    fallRiskScore: 45,
    timestamp: new Date().toISOString(),
  },
};

/**
 * INVALID DATA CASES - For testing error handling
 */
const INVALID_VITALS = {
  // Missing required fields
  missing_heartRate: {
    patientId: PATIENTS[0].id,
    // heartRate missing
    bloodPressure: "120/80",
    spo2: 97,
    bodyTemperature: 36.7,
    motionLevel: 0.3,
    fallRiskScore: 10,
    timestamp: new Date().toISOString(),
  },

  // Invalid data types
  invalid_types: {
    patientId: PATIENTS[1].id,
    heartRate: "seventy-two", // Should be number
    bloodPressure: 120, // Should be string
    spo2: "98%", // Should be number
    bodyTemperature: null,
    motionLevel: "low",
    fallRiskScore: undefined,
    timestamp: "not-a-date",
  },

  // Out of range values (impossible vitals)
  out_of_range: {
    patientId: PATIENTS[2].id,
    heartRate: -50, // Negative
    bloodPressure: "300/200", // Impossible
    spo2: 150, // Above 100%
    bodyTemperature: 50.0, // Impossible for living
    motionLevel: -0.5, // Negative
    fallRiskScore: 150, // Above 100
    timestamp: new Date().toISOString(),
  },

  // Null patient ID
  null_patientId: {
    patientId: null,
    heartRate: 72,
    bloodPressure: "120/80",
    spo2: 97,
    bodyTemperature: 36.7,
    motionLevel: 0.3,
    fallRiskScore: 10,
    timestamp: new Date().toISOString(),
  },

  // Empty object
  empty: {},
};

/**
 * TIME-SERIES DATA - For testing trend detection
 */
const TIME_SERIES_SCENARIOS = {
  // Gradually declining SpO2 (concerning trend)
  declining_spo2: Array.from({ length: 10 }, (_, i) => ({
    patientId: PATIENTS[0].id,
    heartRate: 70 + i,
    bloodPressure: "130/85",
    spo2: 98 - i * 0.8, // Declining from 98 to 90.8
    bodyTemperature: 36.7,
    motionLevel: 0.3,
    fallRiskScore: 10,
    timestamp: new Date(Date.now() - (10 - i) * 300000).toISOString(), // 5-min intervals
  })),

  // Increasing heart rate (exercise or distress)
  increasing_heartRate: Array.from({ length: 8 }, (_, i) => ({
    patientId: PATIENTS[1].id,
    heartRate: 65 + i * 8, // Rising from 65 to 121
    bloodPressure: "125/80",
    spo2: 97,
    bodyTemperature: 36.8,
    motionLevel: 0.4 + i * 0.07,
    fallRiskScore: 8,
    timestamp: new Date(Date.now() - (8 - i) * 300000).toISOString(),
  })),

  // Temperature spike (fever onset)
  temperature_spike: Array.from({ length: 6 }, (_, i) => ({
    patientId: PATIENTS[2].id,
    heartRate: 75 + i * 3,
    bloodPressure: "122/78",
    spo2: 97,
    bodyTemperature: 36.8 + i * 0.5, // Rising from 36.8 to 39.3
    motionLevel: 0.3 - i * 0.04,
    fallRiskScore: 7,
    timestamp: new Date(Date.now() - (6 - i) * 300000).toISOString(),
  })),

  // Stable vitals (no anomalies)
  stable_vitals: Array.from({ length: 12 }, (_, i) => ({
    patientId: PATIENTS[3].id,
    heartRate: 68 + ((i % 3) - 1), // Minor variation: 67-69
    bloodPressure: "128/82",
    spo2: 98,
    bodyTemperature: 36.7,
    motionLevel: 0.25 + (i % 4) * 0.05,
    fallRiskScore: 10,
    timestamp: new Date(Date.now() - (12 - i) * 300000).toISOString(),
  })),

  // Erratic vitals (unstable patient)
  erratic_vitals: Array.from({ length: 10 }, (_, i) => ({
    patientId: PATIENTS[4].id,
    heartRate: 70 + (i % 2 ? 20 : -15), // Swinging between 55 and 90
    bloodPressure: i % 2 ? "145/92" : "110/70",
    spo2: 95 + (i % 3),
    bodyTemperature: 36.5 + (i % 4) * 0.3,
    motionLevel: Math.random(),
    fallRiskScore: 15 + (i % 5) * 5,
    timestamp: new Date(Date.now() - (10 - i) * 300000).toISOString(),
  })),
};

/**
 * DATABASE QUERY TEST DATA
 * Pre-formatted for testing various query scenarios
 */
const QUERY_TEST_SCENARIOS = {
  // 24-hour history (288 readings at 5-min intervals)
  last_24_hours: Array.from({ length: 288 }, (_, i) => ({
    patientId: PATIENTS[0].id,
    heartRate: 68 + Math.sin(i / 24) * 8, // Natural circadian variation
    bloodPressure: "130/85",
    spo2: 97 + Math.floor(Math.random() * 2),
    bodyTemperature: 36.6 + Math.sin(i / 48) * 0.4,
    motionLevel: i % 96 < 64 ? 0.3 : 0.1, // More active during day
    fallRiskScore: 12,
    recordedAt: new Date(Date.now() - (288 - i) * 300000),
  })),

  // Sparse data (only 10 readings in 24 hours)
  sparse_data: Array.from({ length: 10 }, (_, i) => ({
    patientId: PATIENTS[1].id,
    heartRate: 72 + i,
    bloodPressure: "125/80",
    spo2: 98,
    bodyTemperature: 36.7,
    motionLevel: 0.4,
    fallRiskScore: 8,
    recordedAt: new Date(Date.now() - (10 - i) * 8640000), // ~2.4 hour gaps
  })),

  // Dense data (reading every minute for 1 hour)
  dense_data: Array.from({ length: 60 }, (_, i) => ({
    patientId: PATIENTS[2].id,
    heartRate: 75 + Math.sin(i / 10) * 5,
    bloodPressure: "120/78",
    spo2: 98,
    bodyTemperature: 36.8,
    motionLevel: 0.5,
    fallRiskScore: 7,
    recordedAt: new Date(Date.now() - (60 - i) * 60000),
  })),
};

module.exports = {
  NORMAL_VITALS,
  EDGE_CASE_VITALS,
  CORNER_CASE_VITALS,
  INVALID_VITALS,
  TIME_SERIES_SCENARIOS,
  QUERY_TEST_SCENARIOS,
  PATIENTS, // Re-export for convenience
};
