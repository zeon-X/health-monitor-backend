# Health Monitor Backend - Architecture & Design Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HEALTH MONITORING SYSTEM                 │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
            ┌───▼────┐   ┌────▼────┐  ┌────▼────┐
            │ WebApp │   │  REST   │  │ WebSocket
            │        │   │   API   │  │  Events
            └────────┘   └────┬────┘  └────┬────┘
                              │             │
                    ┌─────────┴─────────────┘
                    │
              ┌─────▼────────┐
              │  Express.js  │
              │   Server     │
              └─────┬────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    ┌───▼──┐  ┌────▼────┐  ┌──▼──────┐
    │Health│  │Anomaly  │  │Database │
    │Data  │  │Detector │  │Service  │
    │Gen   │  │         │  │         │
    └───┬──┘  └────┬────┘  └──┬──────┘
        │          │          │
        └──────────┼──────────┘
                   │
        ┌──────────▼──────────┐
        │     MongoDB        │
        │   (Patients,       │
        │    Records,        │
        │    Anomalies)      │
        └────────────────────┘
```

## Module Breakdown

### 1. Health Data Generator (`healthDataGenerator.js`)

**Purpose:** Simulate realistic wearable sensor data

**Key Algorithms:**

- **Temporal Coherence:** Each vital sign is 85% influenced by previous value
- **Gaussian Distribution:** Natural variation around baseline
- **Diurnal Variation:** Body temperature follows 24-hour cycle
- **Activity Correlation:** Motion level affects SpO₂

**Example:**

```javascript
HR(t) = 0.85 * HR(t-1) + 0.15 * (baseline + random_noise)
```

**Output:** Realistic vitals that don't jump around but stay physiologically plausible

### 2. Anomaly Detector (`anomalyDetector.js`)

**Purpose:** Detect health issues using multiple methods

**Detection Methods:**

#### Method 1: Critical Thresholds

- Hard limits for each patient
- Immediate critical alerts when exceeded
- Example: HR < 45 = Bradycardia

#### Method 2: Z-Score Analysis

- Tracks 24-hour rolling window (288 data points)
- Calculates: `z = (value - mean) / stddev`
- Flags if |z| > 2.5 (outlier)
- Detects subtle abnormalities

#### Method 3: Trend Analysis

- Looks at recent changes (last 1-12 hours)
- Detects declining SpO₂ (apnea pattern)
- Identifies sustained changes

#### Method 4: Behavioral Analysis

- Nocturnal activity patterns
- Sustained inactivity during day
- Activity correlation with vitals

**Anomaly Score Calculation:**

```
Score = (critical_alerts * 30) + (warning_alerts * 10)
Max = 100
```

### 3. Health Monitoring Service (`healthMonitoringService.js`)

**Purpose:** Orchestrate the monitoring system

**Workflow (every 5 minutes):**

```
1. Generate vitals for each patient
   ↓
2. POST to httpbin.org
   ↓
3. Store in MongoDB
   ↓
4. Analyze for anomalies
   ↓
5. If anomaly detected:
   - Save anomaly record
   - Log alert
   - Broadcast via WebSocket
   ↓
6. Broadcast vitals to all clients
```

**Broadcast Types:**

- `vital_update` - All new vital signs
- `anomaly_alert` - Anomalies detected
- `critical_alert` - Patient-specific critical alerts

### 4. MongoDB Models (`models/index.js`)

**Collections:**

- `patients` - Patient profiles and baselines
- `healthrecords` - Vital signs (288 per patient per day)
- `anomalies` - Detected anomalies with details
- `alertlogs` - Historical alert log

**Indexes for Performance:**

- `patientId` on all collections
- `recordedAt` on health records
- `detectedAt` on anomalies

### 5. REST API Routes (`routes/api.js`)

**Key Endpoints:**

- GET `/api/patients` - List all patients
- GET `/api/patients/:id/vitals/history` - Historical data
- GET `/api/anomalies/active` - Current unacknowledged alerts
- POST `/api/anomalies/:id/acknowledge` - Mark alert reviewed
- GET `/api/dashboard/summary` - Real-time statistics

---

## Key Design Decisions

### 1. Why 5-Minute Intervals?

- **Realistic:** Wearable devices typically transmit every 5-15 minutes
- **Practical:** Allows 288 readings per day (24 hour window)
- **Responsive:** Detects issues within 5 minutes
- **Cost-effective:** Not overwhelming for database

### 2. Why 24-Hour Rolling Window for Z-Score?

- **Sufficient Data:** 288 points = good statistical confidence
- **Personal Baseline:** Accounts for patient-specific normal ranges
- **Memory Efficient:** Fixed size (doesn't grow infinitely)
- **Responsive:** Updates every 5 minutes with new data

### 3. Why Z-Score > 2.5?

- **Statistical Confidence:** 2.5σ = 98.75th percentile
- **Low False Positives:** Unlikely to trigger on normal variation
- **Balanced Sensitivity:** Catches true anomalies

### 4. Why Multiple Detection Methods?

- **Redundancy:** Catches different types of issues
- **Clinical Validity:** Different problems present differently
  - Critical thresholds = immediate danger
  - Z-score = subtle pattern changes
  - Trend = gradual deterioration
  - Behavioral = cognitive/mobility changes

### 5. Why WebSocket Instead of Polling?

- **Low Latency:** <100ms vs 1000ms+ polling
- **Efficient:** Server pushes only when needed
- **Scalable:** Can handle thousands of connections
- **Real-time:** Critical for health alerts

---

## Data Flow Example

**Scenario: Patient falls at 10:05 AM**

```
1. [10:05:00] Health data generator creates vitals:
   - Previous motion: 0.8 (walking)
   - Current motion: 0.05 (lying down)
   - Current HR: 85 → 102 (stress response)
   - Fall risk score: 95

2. [10:05:02] POST to httpbin.org:
   {
     "patientId": "P002",
     "heartRate": 102,
     "motionLevel": 0.05,
     "fallRiskScore": 95,
     ...
   }
   Response: { status: 200, ... }

3. [10:05:03] Save health record to MongoDB:
   db.healthrecords.insert({
     patientId: "P002",
     heartRate: 102,
     motionLevel: 0.05,
     fallRiskScore: 95,
     recordedAt: 2026-01-15T10:05:00Z
   })

4. [10:05:04] Anomaly detection triggers:
   - Check critical vitals: OK
   - Check fall detection:
     Motion drop 0.8→0.05 + HR spike 85→102
     = FALL DETECTED ✓
   - Severity: CRITICAL

5. [10:05:05] Save anomaly:
   db.anomalies.insert({
     patientId: "P002",
     severity: "critical",
     alerts: [{
       type: "critical",
       category: "fall_detected",
       message: "🚨 FALL DETECTED: Patient P002 - Risk Score 95%"
     }],
     anomalyScore: 95,
     acknowledged: false
   })

6. [10:05:05] Broadcast via WebSocket:
   io.emit('anomaly_alert', {
     patientId: "P002",
     patientName: "Robert Williams",
     severity: "critical",
     alerts: [...],
     timestamp: "2026-01-15T10:05:05Z"
   })

   io.to('patient_P002').emit('critical_alert', {
     message: "⚠️ Health Alert for Robert Williams",
     severity: "critical",
     alerts: [...]
   })

7. [10:05:06] Frontend receives alert:
   - Red banner: "FALL DETECTED - Robert Williams"
   - Sound alarm
   - Auto-call caregiver
   - Log incident
```

---

## Anomaly Detection Thresholds by Patient

### Margaret Chen (P001) - Hypertension Risk

```
Condition: Cardiac Arrhythmia
HR Critical:    45-130 bpm
BP Critical:    Systolic >180 or <90
SpO2 Critical:  <92%
Temperature:    36.0-39.5°C
```

### Robert Williams (P002) - Fall Risk

```
Condition: Mobility Issues
HR Critical:    50-120 bpm
BP Critical:    Systolic >160 or <100
SpO2 Critical:  <93%
Fall Risk:      Motion drop + HR spike
```

### Helen Martinez (P003) - COPD

```
Condition: COPD (lower SpO2 baseline)
HR Critical:    55-125 bpm
BP Critical:    Systolic >170 or <95
SpO2 Critical:  <91% (lower due to COPD)
Trend Alert:    >5% SpO2 decline in 1 hour
```

---

## Testing Strategy

### Why Test AnomalyDetector?

1. **Critical Function:** Responsible for patient safety
2. **Complex Logic:** Multiple detection methods
3. **Edge Cases:** Various patient conditions
4. **Regression Prevention:** Ensures thresholds work correctly

### Test Categories

- ✅ Critical vitals detection (7 tests)
- ✅ Fall detection (2 tests)
- ✅ Statistical anomalies (2 tests)
- ✅ Behavioral anomalies (1 test)
- ✅ Anomaly scoring (3 tests)
- ✅ History management (2 tests)
- ✅ Multiple alerts (1 test)
- ✅ Normal vitals (1 test)

### Coverage Goal: >70%

---

## Future Enhancements

1. **Machine Learning**

   - Train per-patient anomaly thresholds
   - Predict health deterioration
   - Adaptive detection based on history

2. **Integration**

   - Real healthcare APIs (HL7 FHIR)
   - Emergency dispatch systems
   - Pharmacy integration

3. **Advanced Visualization**

   - D3.js charts with confidence bands
   - Time-series forecasting plots
   - Comparative analysis across patients

4. **Compliance**
   - HIPAA audit logging
   - Encryption at rest & in transit
   - Access control & role management

---

## Performance Considerations

### Database Query Optimization

```javascript
// Use indexes
db.healthrecords.createIndex({ patientId: 1, recordedAt: -1 });
db.anomalies.createIndex({ patientId: 1, detectedAt: -1 });
```

### Memory Usage

- Data window: 288 vitals × ~30 bytes = 8.6 KB per patient
- 5 patients = 43 KB (negligible)
- Scales to 1000+ patients easily

### Network Efficiency

- 5 patients × 1 record = ~500 bytes per 5 minutes
- WebSocket push only on anomalies (fewer than vitals)
- Compression built-in to Socket.IO

---

## Deployment Notes

### Docker Container

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables (Production)

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/health-monitor
NODE_ENV=production
HEALTH_CHECK_INTERVAL=300000
```

### Scaling Considerations

- **Horizontal:** Multiple instances with shared MongoDB
- **Vertical:** Increase CPU/memory for large patient base
- **Database:** Use MongoDB Atlas for managed scaling

---
