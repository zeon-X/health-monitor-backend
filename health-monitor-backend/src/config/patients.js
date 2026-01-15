/**
 * Patient Profiles - Realistic Elderly Patient Database
 * Represents patients with common age-related health conditions
 */

const PATIENTS = [
  {
    id: "P001",
    name: "Margaret Chen",
    age: 78,
    conditions: ["Hypertension", "Cardiac Arrhythmia"],
    baselineVitals: {
      hr: { min: 60, max: 80, normal: 72 },
      systolic: { min: 130, max: 150, normal: 140 },
      diastolic: { min: 80, max: 95, normal: 88 },
      spo2: { min: 97, max: 100, normal: 98 },
      temp: { min: 36.4, max: 37.2, normal: 36.8 },
    },
    riskFactors: ["heart_arrhythmia", "hypertensive_crisis"],
    medications: ["Lisinopril", "Metoprolol"],
    alertThresholds: {
      hrCritical: [45, 130],
      bpCritical: [180, 90],
      spo2Critical: 92,
    },
  },
  {
    id: "P002",
    name: "Robert Williams",
    age: 82,
    conditions: ["Type 2 Diabetes", "Mobility Issues", "Neuropathy"],
    baselineVitals: {
      hr: { min: 68, max: 88, normal: 76 },
      systolic: { min: 120, max: 140, normal: 130 },
      diastolic: { min: 75, max: 90, normal: 82 },
      spo2: { min: 96, max: 100, normal: 98 },
      temp: { min: 36.3, max: 37.1, normal: 36.7 },
    },
    riskFactors: ["fall", "circulation_issue", "low_oxygen"],
    medications: ["Metformin", "Amlodipine"],
    alertThresholds: {
      hrCritical: [50, 120],
      bpCritical: [160, 100],
      spo2Critical: 93,
    },
  },
  {
    id: "P003",
    name: "Helen Martinez",
    age: 75,
    conditions: ["COPD", "Sleep Apnea", "Anxiety"],
    baselineVitals: {
      hr: { min: 65, max: 85, normal: 74 },
      systolic: { min: 110, max: 135, normal: 123 },
      diastolic: { min: 70, max: 85, normal: 78 },
      spo2: { min: 93, max: 97, normal: 95 }, // Lower baseline due to COPD
      temp: { min: 36.2, max: 37.0, normal: 36.6 },
    },
    riskFactors: ["apnea_episode", "oxygen_drop", "respiratory_distress"],
    medications: ["Albuterol", "Sertraline"],
    alertThresholds: {
      hrCritical: [55, 125],
      bpCritical: [170, 95],
      spo2Critical: 91, // Lower threshold due to COPD
    },
  },
  {
    id: "P004",
    name: "James Thompson",
    age: 81,
    conditions: ["Atrial Fibrillation", "Hypertension"],
    baselineVitals: {
      hr: { min: 55, max: 95, normal: 72 }, // AFib = variable
      systolic: { min: 125, max: 155, normal: 138 },
      diastolic: { min: 78, max: 95, normal: 86 },
      spo2: { min: 97, max: 100, normal: 99 },
      temp: { min: 36.5, max: 37.3, normal: 37.0 },
    },
    riskFactors: ["irregular_rhythm", "stroke_risk", "bp_spike"],
    medications: ["Warfarin", "Atenolol"],
    alertThresholds: {
      hrCritical: [40, 140],
      bpCritical: [180, 90],
      spo2Critical: 94,
    },
  },
  {
    id: "P005",
    name: "Dorothy Brown",
    age: 79,
    conditions: ["Osteoporosis", "Arthritis", "Depression"],
    baselineVitals: {
      hr: { min: 62, max: 82, normal: 70 },
      systolic: { min: 115, max: 135, normal: 127 },
      diastolic: { min: 72, max: 88, normal: 80 },
      spo2: { min: 97, max: 100, normal: 98 },
      temp: { min: 36.4, max: 37.1, normal: 36.7 },
    },
    riskFactors: ["fall", "fracture", "immobility"],
    medications: ["Vitamin D", "Sertraline"],
    alertThresholds: {
      hrCritical: [50, 115],
      bpCritical: [160, 95],
      spo2Critical: 94,
    },
  },
];

module.exports = PATIENTS;
