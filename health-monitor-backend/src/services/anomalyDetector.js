/**
 * Realistic Anomaly Detection Engine
 * Uses statistical methods (z-score) with patient-specific thresholds
 * Detects: Critical vitals, falls, abnormal patterns, behavioral changes
 */

class AnomalyDetector {
  constructor() {
    this.dataWindow = {}; // 24-hour rolling window of vitals per patient
    this.anomalyHistory = {}; // Track anomalies for pattern detection
    this.HealthRecord = null; // Will be injected
  }

  /**
   * Initialize with database model (dependency injection)
   */
  setHealthRecordModel(HealthRecord) {
    this.HealthRecord = HealthRecord;
  }

  /**
   * Load historical data from database for a patient
   * Loads last 288 records (24 hours at 5-min intervals)
   */
  async loadHistoricalData(patientId) {
    if (!this.HealthRecord) {
      console.warn(
        "⚠️ HealthRecord model not injected, skipping historical data load",
      );
      return;
    }

    try {
      const records = await this.HealthRecord.find({ patientId })
        .sort({ recordedAt: -1 })
        .limit(288)
        .lean();

      if (records.length === 0) {
        console.log(`ℹ️ No historical data found for ${patientId}`);
        return;
      }

      // Reverse to get chronological order (oldest first)
      records.reverse();

      // Initialize data window if not exists
      if (!this.dataWindow[patientId]) {
        this.dataWindow[patientId] = [];
      }

      // Load records into window
      for (const record of records) {
        this.dataWindow[patientId].push({
          heartRate: record.heartRate,
          bloodPressure: record.bloodPressure,
          spo2: record.spo2,
          bodyTemperature: record.bodyTemperature,
          motionLevel: record.motionLevel,
          fallRiskScore: record.fallRiskScore,
          timestamp: record.recordedAt,
        });
      }

      console.log(
        `✅ Loaded ${records.length} historical records for ${patientId}`,
      );
    } catch (error) {
      console.error(
        `❌ Error loading historical data for ${patientId}:`,
        error.message,
      );
    }
  }

  /**
   * Add vital to rolling window (keep last 288 readings = 24 hours at 5-min intervals)
   */
  addToWindow(patientId, vitals) {
    if (!this.dataWindow[patientId]) {
      this.dataWindow[patientId] = [];
    }

    this.dataWindow[patientId].push(vitals);

    // Keep only 24-hour window (288 readings at 5-min intervals)
    if (this.dataWindow[patientId].length > 288) {
      this.dataWindow[patientId].shift();
    }
  }

  /**
   * Detect anomalies in vital signs
   * Returns: { isAnomaly, severity, alerts[] }
   */
  detectAnomalies(patientId, vitals, patientProfile) {
    const alerts = [];
    let severity = "normal"; // normal, warning, critical

    // 1. Critical Vitals (immediate alerts)
    const criticalAlerts = this.checkCriticalVitals(vitals, patientProfile);
    alerts.push(...criticalAlerts);
    if (criticalAlerts.some((a) => a.type === "critical")) {
      severity = "critical";
    }

    // 2. Fall Detection
    if (vitals.fallRiskScore > 80) {
      alerts.push({
        type: "critical",
        category: "fall_detected",
        message: `🚨 FALL DETECTED: Patient ${patientId} - Risk Score ${vitals.fallRiskScore}%`,
        value: vitals.fallRiskScore,
      });
      severity = "critical";
    }

    // 3. Statistical Anomalies (z-score)
    const statAlerts = this.checkStatisticalAnomalies(patientId, vitals);
    alerts.push(...statAlerts);
    if (statAlerts.some((a) => a.type === "critical")) {
      severity = "critical";
    } else if (statAlerts.length > 0 && severity !== "critical") {
      severity = "warning";
    }

    // 4. Behavioral Changes
    const behavioralAlerts = this.checkBehavioralChanges(patientId, vitals);
    alerts.push(...behavioralAlerts);
    if (behavioralAlerts.some((a) => a.type === "critical")) {
      severity = "critical";
    }

    // Store anomaly history
    if (alerts.length > 0) {
      if (!this.anomalyHistory[patientId]) {
        this.anomalyHistory[patientId] = [];
      }
      this.anomalyHistory[patientId].push({
        timestamp: vitals.timestamp,
        alerts,
        severity,
      });

      // Keep last 100 anomalies
      if (this.anomalyHistory[patientId].length > 100) {
        this.anomalyHistory[patientId].shift();
      }
    }

    this.addToWindow(patientId, vitals);

    return {
      isAnomaly: alerts.length > 0,
      severity,
      alerts,
      normalizedScore: this.calculateAnomalyScore(alerts),
    };
  }

  /**
   * 1. Check for critical vital sign thresholds
   */
  checkCriticalVitals(vitals, patient) {
    const alerts = [];
    const { alertThresholds } = patient;
    // baselineVitals available if needed for future use

    // Heart Rate
    if (vitals.heartRate < alertThresholds.hrCritical[0]) {
      alerts.push({
        type: "critical",
        category: "bradycardia",
        message: `⚠️ BRADYCARDIA: HR ${vitals.heartRate} bpm (< ${alertThresholds.hrCritical[0]})`,
        value: vitals.heartRate,
      });
    } else if (vitals.heartRate > alertThresholds.hrCritical[1]) {
      alerts.push({
        type: "critical",
        category: "tachycardia",
        message: `⚠️ TACHYCARDIA: HR ${vitals.heartRate} bpm (> ${alertThresholds.hrCritical[1]})`,
        value: vitals.heartRate,
      });
    }

    // Blood Pressure
    const [systolic, _diastolic] = vitals.bloodPressure
      .split("/")
      .map((x) => parseInt(x));

    if (systolic > alertThresholds.bpCritical[0]) {
      alerts.push({
        type: "critical",
        category: "hypertensive_crisis",
        message: `🔴 HYPERTENSIVE CRISIS: BP ${vitals.bloodPressure} (Systolic > ${alertThresholds.bpCritical[0]})`,
        value: systolic,
      });
    } else if (systolic < alertThresholds.bpCritical[1]) {
      alerts.push({
        type: "critical",
        category: "hypotension",
        message: `🔴 HYPOTENSION: BP ${vitals.bloodPressure} (Systolic < ${alertThresholds.bpCritical[1]})`,
        value: systolic,
      });
    }

    // SpO2 (Oxygen Saturation)
    if (vitals.spo2 < alertThresholds.spo2Critical) {
      alerts.push({
        type: "critical",
        category: "hypoxemia",
        message: `🔴 HYPOXEMIA: SpO₂ ${vitals.spo2}% (< ${alertThresholds.spo2Critical}%)`,
        value: vitals.spo2,
      });
    }

    // Temperature (fever/hypothermia)
    if (vitals.bodyTemperature > 38.5) {
      alerts.push({
        type: "warning",
        category: "fever",
        message: `🌡️ FEVER: Temperature ${vitals.bodyTemperature}°C`,
        value: vitals.bodyTemperature,
      });
    } else if (vitals.bodyTemperature < 35.0) {
      alerts.push({
        type: "critical",
        category: "hypothermia",
        message: `❄️ HYPOTHERMIA: Temperature ${vitals.bodyTemperature}°C`,
        value: vitals.bodyTemperature,
      });
    }

    return alerts;
  }

  /**
   * 2. Statistical anomalies (z-score analysis)
   */
  checkStatisticalAnomalies(patientId, currentVitals) {
    const alerts = [];
    const window = this.dataWindow[patientId];

    if (!window || window.length < 12) {
      return alerts;
    } // Need at least 1 hour of data

    // Calculate z-score for HR
    const hrValues = window.map((v) => v.heartRate);
    const hrMean = hrValues.reduce((a, b) => a + b) / hrValues.length;
    const hrStd = Math.sqrt(
      hrValues.reduce((sum, v) => sum + Math.pow(v - hrMean, 2), 0) /
        hrValues.length,
    );
    const hrZScore = (currentVitals.heartRate - hrMean) / (hrStd || 1);

    if (Math.abs(hrZScore) > 2.5) {
      alerts.push({
        type: hrZScore > 0 ? "warning" : "warning",
        category: "hr_anomaly",
        message: `⚠️ ABNORMAL HR: ${
          currentVitals.heartRate
        } bpm (Z-score: ${hrZScore.toFixed(2)})`,
        value: hrZScore,
      });
    }

    // SpO2 trend analysis (gradual decline = concerning)
    const spo2Values = window.slice(-12).map((v) => v.spo2); // Last 1 hour
    const spo2Trend = spo2Values[spo2Values.length - 1] - spo2Values[0];

    if (spo2Trend < -5) {
      alerts.push({
        type: "warning",
        category: "spo2_declining",
        message: `⚠️ DECLINING SpO₂: Down ${Math.abs(spo2Trend).toFixed(
          1,
        )}% in last hour`,
        value: spo2Trend,
      });
    }

    return alerts;
  }

  /**
   * 3. Behavioral anomalies (activity patterns, nocturnal activity)
   */
  checkBehavioralChanges(patientId, vitals) {
    const alerts = [];
    const window = this.dataWindow[patientId];

    if (!window || window.length < 6) {
      return alerts;
    } // Need at least 30 min of data

    const recentMotion = window.slice(-6).map((v) => v.motionLevel);
    const avgRecentMotion =
      recentMotion.reduce((a, b) => a + b) / recentMotion.length;
    const currentHour = new Date().getHours();
    const isNight = currentHour >= 22 || currentHour <= 6;

    // Sustained inactivity during day hours
    if (!isNight && avgRecentMotion < 0.1 && window.length > 24) {
      const lastHourMotion = window
        .slice(-12)
        .every((v) => v.motionLevel < 0.15);
      if (lastHourMotion) {
        alerts.push({
          type: "warning",
          category: "sustained_inactivity",
          message:
            "⚠️ SUSTAINED INACTIVITY: No movement for > 1 hour during active hours",
          value: avgRecentMotion,
        });
      }
    }

    // Nocturnal activity (wandering, confusion risk)
    if (isNight && vitals.motionLevel > 0.6) {
      const nightActivityCount = window
        .slice(-12)
        .filter((v) => v.motionLevel > 0.5).length;
      if (nightActivityCount > 6) {
        alerts.push({
          type: "warning",
          category: "nocturnal_activity",
          message:
            "⚠️ NOCTURNAL WANDERING: Unusual activity during night hours",
          value: nightActivityCount,
        });
      }
    }

    return alerts;
  }

  /**
   * Calculate overall anomaly score (0-100)
   * Higher = more severe/concerning
   */
  calculateAnomalyScore(alerts) {
    if (alerts.length === 0) {
      return 0;
    }

    const criticalCount = alerts.filter((a) => a.type === "critical").length;
    const warningCount = alerts.filter((a) => a.type === "warning").length;

    return Math.min(100, criticalCount * 30 + warningCount * 10);
  }

  getAnomalyHistory(patientId, limit = 20) {
    return (this.anomalyHistory[patientId] || []).slice(-limit);
  }

  resetPatient(patientId) {
    delete this.dataWindow[patientId];
    delete this.anomalyHistory[patientId];
  }
}

module.exports = AnomalyDetector;
