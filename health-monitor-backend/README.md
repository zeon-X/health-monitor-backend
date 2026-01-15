# 🏥 Elderly Patient Health Monitoring System

Real-time health monitoring for elderly patients with AI-powered anomaly detection and instant alerts.

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 5.0+

### Installation & Run

```bash
# Start MongoDB
brew services start mongodb-community

# Install dependencies
npm install

# Start server
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Patients

```bash
GET /api/patients                              # List all patients
GET /api/patients/:patientId                   # Patient details
GET /api/patients/:patientId/vitals/latest     # Latest vitals
GET /api/patients/:patientId/vitals/history    # History (24h default)
```

### Anomalies & Alerts

```bash
GET /api/anomalies/active                      # Unacknowledged alerts
GET /api/patients/:patientId/anomalies         # Patient anomalies
POST /api/anomalies/:anomalyId/acknowledge     # Mark alert reviewed
```

### Dashboard

```bash
GET /api/dashboard/summary                     # Real-time stats
GET /api/alerts/history                        # Alert log
GET /api/health                                # Server status
```

## WebSocket Events

```javascript
// Listen for vital updates
socket.on("vital_update", (data) => {
  // { patientId, vitals, anomaly, timestamp }
});

// Listen for anomaly alerts
socket.on("anomaly_alert", (data) => {
  // { patientId, patientName, severity, alerts, score, timestamp }
});

// Subscribe to patient
socket.emit("subscribe_patient", "P001");
```

## Testing

```bash
# Run all tests
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## Key Features

✅ **5 Realistic Patient Profiles** - Elderly patients with common conditions  
✅ **Real-time Monitoring** - Every 5 minutes via simulated wearables  
✅ **Advanced Anomaly Detection** - 4 methods (critical, statistical, trend, behavioral)  
✅ **Instant Alerts** - WebSocket + REST API  
✅ **MongoDB Persistence** - Full health history  
✅ **Comprehensive Tests** - 15+ tests, >70% coverage  
✅ **CI/CD Pipeline** - GitHub Actions automation

## Project Structure

```
health-monitor-backend/
├── src/
│   ├── index.js                    # Express + Socket.IO server
│   ├── config/patients.js          # 5 patient profiles
│   ├── services/                   # Core services
│   │   ├── healthDataGenerator.js  # Realistic vitals
│   │   ├── anomalyDetector.js      # Anomaly detection
│   │   └── healthMonitoringService.js
│   ├── models/index.js             # MongoDB schemas
│   └── routes/api.js               # REST endpoints
├── tests/
│   └── anomalyDetector.test.js     # Test suite (15 tests)
├── docs/                           # Full documentation
├── .github/workflows/ci-cd.yml     # GitHub Actions
└── package.json
```

## Patients Overview

| ID   | Name            | Age | Conditions              | Risk              |
| ---- | --------------- | --- | ----------------------- | ----------------- |
| P001 | Margaret Chen   | 78  | Hypertension, AFib      | Heart arrhythmias |
| P002 | Robert Williams | 82  | Diabetes, Mobility      | Falls             |
| P003 | Helen Martinez  | 75  | COPD, Sleep Apnea       | Oxygen drops      |
| P004 | James Thompson  | 81  | Atrial Fibrillation     | Irregular rhythm  |
| P005 | Dorothy Brown   | 79  | Osteoporosis, Arthritis | Falls, fractures  |

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Real-time:** Socket.IO
- **Testing:** Jest, Supertest
- **CI/CD:** GitHub Actions

## Full Documentation

See [`docs/`](./docs/) folder for comprehensive guides:

- [Architecture & Algorithms](./docs/ARCHITECTURE.md) - System design, data flow, algorithm details
- [Quick Start Guide](./docs/QUICKSTART.md) - Detailed setup with examples
- [Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md) - Complete overview & stats
- [Medical Guide](./docs/MEDICAL_GUIDE.md) - Patient conditions & thresholds
- [Database Schema](./docs/DATABASE_SCHEMA.md) - MongoDB collections & relationships
- [Quick Reference](./docs/QUICK_REFERENCE.md) - API endpoints & commands

## Next Steps

1. **Frontend** - Build React/Vue dashboard
2. **Deployment** - Docker, Kubernetes, Cloud
3. **Enhancements** - Email/SMS alerts, ML-based thresholds, mobile app

---

Created for BizScout interview assignment.
