# 🗄️ Database Schema & Design

## MongoDB Collections Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     HEALTH MONITOR DATABASE                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│     PATIENTS         │ ← Patient profiles (5 records)
├──────────────────────┤
│ patientId (Index)    │
│ name                 │
│ age                  │
│ conditions[]         │
│ medications[]        │
│ baselineVitals {}    │
│ alertThresholds {}   │
└──────────────────────┘
         │
         ├──→ ┌──────────────────────┐
         │    │  HEALTHRECORDS       │ ← Vitals every 5 min
         │    ├──────────────────────┤    (~288/day per patient)
         │    │ patientId (Index)    │
         │    │ heartRate            │
         │    │ bloodPressure        │
         │    │ spo2                 │
         │    │ bodyTemperature      │
         │    │ motionLevel          │
         │    │ fallRiskScore        │
         │    │ recordedAt (Index)   │
         │    │ httpbinResponse {}   │
         │    └──────────────────────┘
         │
         ├──→ ┌──────────────────────┐
         │    │   ANOMALIES          │ ← Detected anomalies
         │    ├──────────────────────┤
         │    │ patientId (Index)    │
         │    │ severity             │
         │    │ alerts[] {}          │
         │    │ anomalyScore         │
         │    │ recordId (ref)       │
         │    │ acknowledged         │
         │    │ detectedAt (Index)   │
         │    └──────────────────────┘
         │
         └──→ ┌──────────────────────┐
              │   ALERTLOGS          │ ← Historical alerts
              ├──────────────────────┤
              │ patientId (Index)    │
              │ alertType            │
              │ message              │
              │ severity             │
              │ timestamp (Index)    │
              └──────────────────────┘
```

---

## 📋 Detailed Collection Schemas

### 1. PATIENTS Collection

```javascript
{
  _id: ObjectId,

  // Identification
  patientId: "P001",  // Index: unique
  name: "Margaret Chen",
  age: 78,

  // Medical Information
  conditions: [
    "Hypertension",
    "Cardiac Arrhythmia"
  ],
  medications: [
    "Lisinopril (10mg daily)",
    "Metoprolol (50mg twice daily)"
  ],
  riskFactors: [
    "heart_arrhythmia",
    "hypertensive_crisis",
    "stroke_risk"
  ],

  // Baseline Vital Signs (for this patient)
  baselineVitals: {
    hr: {
      min: 60,
      max: 80,
      normal: 72
    },
    systolic: {
      min: 130,
      max: 150,
      normal: 140
    },
    diastolic: {
      min: 80,
      max: 95,
      normal: 88
    },
    spo2: {
      min: 97,
      max: 100,
      normal: 98
    },
    temp: {
      min: 36.4,
      max: 37.2,
      normal: 36.8
    }
  },

  // Patient-Specific Alert Thresholds
  alertThresholds: {
    hrCritical: [45, 130],        // [low, high]
    bpCritical: [180, 90],        // [systolic_high, systolic_low]
    spo2Critical: 92              // absolute minimum
  },

  // Status
  isActive: true,

  // Timestamps
  createdAt: ISODate("2026-01-15T10:00:00Z"),
  updatedAt: ISODate("2026-01-15T10:00:00Z")
}
```

**Indexes:**

```javascript
db.patients.createIndex({ patientId: 1 });
db.patients.createIndex({ isActive: 1 });
```

**Size:** ~1.5 KB per patient × 5 = 7.5 KB total

---

### 2. HEALTHRECORDS Collection

```javascript
{
  _id: ObjectId,

  // Reference
  patientId: "P001",  // Index: for queries

  // Vital Signs (captured at moment of reading)
  heartRate: 72,                    // beats per minute
  bloodPressure: "140/88",          // systolic/diastolic
  spo2: 98,                         // oxygen saturation %
  bodyTemperature: 36.8,            // celsius
  motionLevel: 0.35,                // 0-1 scale
  fallRiskScore: 12,                // 0-100 scale

  // Device Information
  sensorId: "sensor-P001",          // Wearable device ID

  // External API Response
  httpbinResponse: {
    statusCode: 200,
    timestamp: "2026-01-15T10:05:00Z",
    headers: {...},
    ip: "203.0.113.42"
  },

  // Timestamps
  recordedAt: ISODate("2026-01-15T10:05:00Z"),  // Index: for history
  createdAt: ISODate("2026-01-15T10:05:00Z")
}
```

**Indexes:**

```javascript
db.healthrecords.createIndex({ patientId: 1, recordedAt: -1 });
db.healthrecords.createIndex(
  { recordedAt: 1 },
  { expireAfterSeconds: 2592000 }
); // 30 days TTL
```

**Size:** ~500 bytes per record  
**Volume:** 5 patients × 288 records/day = 1,440 records/day = ~720 KB/day

---

### 3. ANOMALIES Collection

```javascript
{
  _id: ObjectId,

  // Reference
  patientId: "P001",  // Index: for queries
  recordId: ObjectId("..."),  // Reference to HealthRecord

  // Anomaly Details
  severity: "critical",  // Enum: normal, warning, critical

  // Alert Messages (can be multiple)
  alerts: [
    {
      type: "critical",  // Critical or warning
      category: "bradycardia",  // Category type
      message: "⚠️ BRADYCARDIA: HR 45 bpm (< 45)",  // Human readable
      value: 45  // Actual value that triggered alert
    },
    {
      type: "warning",
      category: "spo2_declining",
      message: "⚠️ DECLINING SpO₂: Down 5.2% in last hour",
      value: -5.2
    }
  ],

  // Scoring
  anomalyScore: 85,  // 0-100: severity score

  // Acknowledgment
  acknowledged: false,
  acknowledgedBy: null,  // Username/ID of person who reviewed
  acknowledgedAt: null,

  // Timestamps
  detectedAt: ISODate("2026-01-15T10:05:30Z"),  // Index: for sorting
  createdAt: ISODate("2026-01-15T10:05:30Z")
}
```

**Indexes:**

```javascript
db.anomalies.createIndex({ patientId: 1, detectedAt: -1 });
db.anomalies.createIndex({ acknowledged: 1, severity: 1 });
```

**Size:** ~1 KB per anomaly  
**Volume:** Varies (depends on patient health), typically 5-20/day

---

### 4. ALERTLOGS Collection

```javascript
{
  _id: ObjectId,

  // Patient Reference
  patientId: "P001",  // Index: for history queries

  // Alert Information
  alertType: "bradycardia",         // Category (matches anomaly category)
  message: "⚠️ BRADYCARDIA: HR 45", // Alert message
  severity: "critical",             // Alert severity

  // Action Tracking
  actionTaken: "alert_triggered",   // What system did

  // Timestamps
  timestamp: ISODate("2026-01-15T10:05:30Z")  // Index: for history
}
```

**Indexes:**

```javascript
db.alertlogs.createIndex({ patientId: 1, timestamp: -1 });
db.alertlogs.createIndex({ severity: 1, timestamp: -1 });
```

**Size:** ~300 bytes per log entry  
**Volume:** 50-100/day across all patients

---

### 5. DASHBOARDSUMMARY Collection (Optional)

```javascript
{
  _id: ObjectId,

  // Aggregated Statistics
  totalPatients: 5,
  activeAlerts: 3,
  criticalCount: 1,
  warningCount: 2,

  // Recent Data
  recentAnomalies: [
    { patientId: "P001", severity: "critical", message: "..." },
    { patientId: "P002", severity: "warning", message: "..." }
  ],

  // Timestamp
  lastUpdate: ISODate("2026-01-15T10:05:00Z")
}
```

---

## 🔧 Database Optimization

### Query Patterns

#### 1. Get Latest Vitals for Patient

```javascript
// Query
db.healthrecords.findOne({ patientId: "P001" }, { sort: { recordedAt: -1 } });

// Index: { patientId: 1, recordedAt: -1 }
// Expected performance: <10ms
```

#### 2. Get 24-Hour History

```javascript
// Query
db.healthrecords.find({
  patientId: "P001",
  recordedAt: { $gte: new Date(Date.now() - 86400000) },
});

// Index: { patientId: 1, recordedAt: -1 }
// Expected performance: <50ms (288 records)
```

#### 3. Get Active Anomalies

```javascript
// Query
db.anomalies.find({
  acknowledged: false,
  severity: "critical",
});

// Index: { acknowledged: 1, severity: 1 }
// Expected performance: <20ms
```

#### 4. Get Patient Summary

```javascript
// Multi-document join
1. db.patients.findOne({ patientId: "P001" })
2. db.healthrecords.findOne({ patientId: "P001" }, sort)
3. db.anomalies.find({ patientId: "P001" }, limit: 10)

// Expected combined performance: <100ms
```

---

## 📊 Data Volume Estimates

### Daily Data Generation

```
Per Patient (5-min intervals):
  - 288 health records/day × 5 patients = 1,440 records
  - ~720 KB/day of vital signs
  - 10-20 anomalies/day (varies by patient condition)
  - 30-50 alert logs/day

Monthly:
  - 43,200 health records (~21.6 MB)
  - 300-600 anomalies (~300-600 KB)
  - 900-1500 alert logs (~300-450 KB)

Yearly:
  - 525,600 health records (~250 MB)
  - 3,600-7,200 anomalies (~3.6-7.2 MB)
  - ~150 MB total storage (very manageable)
```

### Memory Usage

```
24-hour rolling window per patient:
  - 288 records × 30 bytes = 8.6 KB per patient
  - 5 patients = 43 KB
  - Scales easily to 1,000 patients = 8.6 MB

Total in-memory anomaly detection:
  - <10 MB for 1,000 patients
  - Scales efficiently
```

---

## 🔐 Data Retention & Cleanup

### Recommended Policies

```javascript
// Archive old health records after 30 days
db.healthrecords.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 2592000 } // 30 days
);

// Keep anomalies for 90 days
db.anomalies.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 7776000 } // 90 days
);

// Keep alert logs for 1 year
db.alertlogs.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 31536000 } // 1 year
);

// Keep patient profiles indefinitely
// (no TTL)
```

---

## 🚀 Scaling Considerations

### For 100 Patients

- Add index: `{ patientId: 1 }` on all collections
- Monitor memory: 860 KB for rolling windows
- Expected database size: ~2.5 GB/year
- Consider: MongoDB Atlas free tier

### For 1,000 Patients

- Use MongoDB sharding by patientId
- Consider: Separate read replicas for dashboards
- Expected database size: ~25 GB/year
- Performance: Still <100ms queries with proper indexes

### For 10,000+ Patients

- Implement time-series collection optimization
- Use MongoDB compression
- Consider: Read-heavy sharding strategy
- Performance: Requires optimization review

---

## 🔍 Monitoring Queries

### Find Unacknowledged Alerts

```javascript
db.anomalies.find({
  acknowledged: false,
  detectedAt: { $gte: new Date(Date.now() - 3600000) }, // Last hour
});
```

### Get Critical Alerts by Patient

```javascript
db.anomalies
  .find({
    patientId: "P001",
    severity: "critical",
  })
  .sort({ detectedAt: -1 })
  .limit(10);
```

### Find Patients with Recent Anomalies

```javascript
db.anomalies.aggregate([
  { $match: { detectedAt: { $gte: new Date(Date.now() - 86400000) } } },
  { $group: { _id: "$patientId", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);
```

---

## 📈 Performance Benchmarks

| Operation            | Query Time | Notes                            |
| -------------------- | ---------- | -------------------------------- |
| Get patient list     | <10ms      | Simple find, 5 docs              |
| Get latest vitals    | <10ms      | Indexed on patientId, recordedAt |
| Get 24-hour history  | <50ms      | 288 records per patient          |
| Get active alerts    | <20ms      | Indexed on acknowledged          |
| Dashboard summary    | <100ms     | Multiple collection joins        |
| Full patient summary | <150ms     | Patient + vitals + anomalies     |

---

## 🛠️ Database Setup Script

```javascript
// Connect to MongoDB
use health-monitor

// Create collections
db.createCollection("patients")
db.createCollection("healthrecords")
db.createCollection("anomalies")
db.createCollection("alertlogs")

// Create indexes
db.patients.createIndex({ patientId: 1 }, { unique: true })
db.healthrecords.createIndex({ patientId: 1, recordedAt: -1 })
db.anomalies.createIndex({ patientId: 1, detectedAt: -1 })
db.anomalies.createIndex({ acknowledged: 1 })
db.alertlogs.createIndex({ patientId: 1, timestamp: -1 })

// Set TTL for old data
db.healthrecords.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 })

// Create admin user (optional)
db.createUser({
  user: "health-monitor-app",
  pwd: "securePassword123",
  roles: [{ role: "readWrite", db: "health-monitor" }]
})

// Verify setup
db.patients.getIndexes()
db.healthrecords.getIndexes()
```

---

**Database is optimized for real-time health monitoring with minimal latency!** 🚀
