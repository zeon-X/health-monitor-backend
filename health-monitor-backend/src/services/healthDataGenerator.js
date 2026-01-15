/**
 * Realistic Health Data Generator
 * Simulates wearable device data for elderly patients with realistic patterns
 */

const PATIENTS = require("../config/patients");

class HealthDataGenerator {
  constructor() {
    this.lastValues = {}; // Track last vital signs for smooth transitions
    this.activityPatterns = {}; // Track daily activity patterns
    this.initPatientState();
  }

  initPatientState() {
    PATIENTS.forEach((patient) => {
      this.lastValues[patient.id] = {
        hr: patient.baselineVitals.hr.normal,
        systolic: patient.baselineVitals.systolic.normal,
        diastolic: patient.baselineVitals.diastolic.normal,
        spo2: patient.baselineVitals.spo2.normal,
        temp: patient.baselineVitals.temp.normal,
        motionLevel: 0.2,
        isFalling: false,
      };

      this.activityPatterns[patient.id] = {
        lastActivityTime: Date.now(),
        sleepMode: this.isNightTime(),
        activityTrend: "normal",
      };
    });
  }

  isNightTime() {
    const hour = new Date().getHours();
    return hour >= 22 || hour <= 6;
  }

  /**
   * Generate realistic vital signs with temporal coherence
   * Mimics real wearable sensors with gradual changes
   */
  generateVitals(patientId) {
    const patient = PATIENTS.find((p) => p.id === patientId);
    if (!patient) throw new Error(`Patient ${patientId} not found`);

    const lastVitals = this.lastValues[patientId];
    const baseline = patient.baselineVitals;

    // Heart Rate: Gaussian distribution around baseline with memory
    const hrChange = (Math.random() - 0.5) * 8; // ±4 bpm change
    let hr = Math.round(
      lastVitals.hr * 0.85 + (baseline.hr.normal + hrChange) * 0.15
    );
    hr = Math.max(baseline.hr.min - 5, Math.min(baseline.hr.max + 10, hr));

    // Blood Pressure: Correlated with HR and time of day
    const bpVariation = Math.random() < 0.15 ? Math.random() * 20 - 10 : 0; // 15% chance of spike
    let systolic = Math.round(
      lastVitals.systolic * 0.8 + (baseline.systolic.normal + bpVariation) * 0.2
    );
    systolic = Math.max(
      baseline.systolic.min - 10,
      Math.min(baseline.systolic.max + 20, systolic)
    );

    // Diastolic correlates with systolic
    const diastolicBase =
      baseline.diastolic.normal + (systolic - baseline.systolic.normal) * 0.3;
    let diastolic = Math.round(
      lastVitals.diastolic * 0.8 + diastolicBase * 0.2
    );
    diastolic = Math.max(
      baseline.diastolic.min,
      Math.min(baseline.diastolic.max, diastolic)
    );

    // SpO2: Usually stable, but drops with activity
    const activityEffect = this.lastValues[patientId].motionLevel * 2;
    let spo2 = Math.round(
      lastVitals.spo2 * 0.95 + (baseline.spo2.normal - activityEffect) * 0.05
    );
    spo2 = Math.max(baseline.spo2.min - 5, Math.min(baseline.spo2.max, spo2));

    // Body Temperature: Relatively stable, slight diurnal variation
    const hourOfDay = new Date().getHours();
    const diurnalVariation = Math.sin((hourOfDay / 24) * Math.PI * 2) * 0.3;
    let temp = +(
      lastVitals.temp * 0.9 +
      (baseline.temp.normal + diurnalVariation + (Math.random() - 0.5) * 0.2) *
        0.1
    ).toFixed(1);
    temp = Math.max(baseline.temp.min, Math.min(baseline.temp.max + 2, temp)); // Allow fever

    // Motion Level: Activity pattern based on time of day
    const isNight = this.isNightTime();
    let motionLevel = isNight ? Math.random() * 0.3 : Math.random() * 0.8;

    // 10% chance of sudden activity (getting up, walking)
    if (Math.random() < 0.1) motionLevel = Math.random() * 1.0;

    // Smooth transition
    motionLevel = lastVitals.motionLevel * 0.7 + motionLevel * 0.3;
    motionLevel = Math.max(0, Math.min(1, motionLevel));

    // Fall Detection: Low motion + sudden HR spike
    const isFalling = this.detectFall(patientId, hr, motionLevel);

    // Update last values
    this.lastValues[patientId] = {
      hr,
      systolic,
      diastolic,
      spo2,
      temp,
      motionLevel,
      isFalling,
    };

    return {
      patientId,
      heartRate: hr,
      bloodPressure: `${systolic}/${diastolic}`,
      spo2,
      bodyTemperature: temp,
      motionLevel: +motionLevel.toFixed(2),
      fallRiskScore: isFalling
        ? 95
        : this.calculateFallRisk(motionLevel, hr, baseline.hr.normal),
      timestamp: new Date().toISOString(),
      sensorId: `sensor-${patientId}`,
    };
  }

  /**
   * Detect potential falls based on motion and heart rate patterns
   */
  detectFall(patientId, hr, motionLevel) {
    const lastMotion = this.lastValues[patientId].motionLevel;
    const lastHr = this.lastValues[patientId].hr;

    // Sudden motion drop + HR spike = possible fall
    const suddenMotionDrop = lastMotion > 0.5 && motionLevel < 0.1;
    const hrSpike = hr > lastHr + 15;

    return suddenMotionDrop && hrSpike && Math.random() < 0.05; // 5% chance when conditions met
  }

  /**
   * Calculate fall risk score (0-100) based on vital signs and motion
   */
  calculateFallRisk(motionLevel, hr, baselineHr) {
    let risk = 0;

    // Low motion increases risk
    risk += (1 - motionLevel) * 30;

    // Heart rate deviation
    risk += Math.abs(hr - baselineHr) / 10;

    // Normalize to 0-100
    return Math.max(0, Math.min(100, risk));
  }
}

module.exports = HealthDataGenerator;
