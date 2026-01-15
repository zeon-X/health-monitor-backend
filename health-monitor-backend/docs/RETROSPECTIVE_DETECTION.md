# Retrospective Anomaly Detection API

## Overview

The Retrospective Anomaly Detection API allows you to re-analyze historical health records to detect anomalies that may have been missed using updated thresholds or after a system upgrade. This is useful for:

- Detecting anomalies after threshold changes
- Re-analyzing data after system upgrades
- Backfilling missing anomaly detections
- Quality assurance and validation

## API Endpoint

### POST `/api/anomalies/retrospective`

Runs retrospective anomaly detection on historical health records.

#### Request Body (all optional)

```json
{
  "patientId": "P001", // Optional: specific patient ID or omit for all patients
  "startDate": "2024-01-01", // Optional: ISO date string for start of analysis period
  "endDate": "2024-12-31", // Optional: ISO date string for end of analysis period
  "updateDatabase": true // Optional: whether to save detected anomalies (default: true)
}
```

#### Response Format

```json
{
  "success": true,
  "message": "Retrospective analysis completed. Processed 150 records, detected 12 new anomalies.",
  "results": {
    "recordsProcessed": 150,
    "newAnomaliesDetected": 12,
    "criticalAnomalies": 3,
    "warningAnomalies": 9,
    "patientsSummary": {
      "P001": {
        "patientName": "Margaret Chen",
        "recordsProcessed": 75,
        "newAnomalies": 5,
        "criticalAnomalies": 1,
        "warningAnomalies": 4
      },
      "P002": {
        "patientName": "Robert Williams",
        "recordsProcessed": 75,
        "newAnomalies": 7,
        "criticalAnomalies": 2,
        "warningAnomalies": 5
      }
    },
    "errors": []
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Use Cases

### 1. Analyze All Patients (No Date Filter)

```bash
curl -X POST http://localhost:3000/api/anomalies/retrospective \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 2. Analyze Specific Patient

```bash
curl -X POST http://localhost:3000/api/anomalies/retrospective \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P001"
  }'
```

### 3. Analyze Date Range

```bash
curl -X POST http://localhost:3000/api/anomalies/retrospective \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z"
  }'
```

### 4. Dry Run (Don't Save to Database)

```bash
curl -X POST http://localhost:3000/api/anomalies/retrospective \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P001",
    "updateDatabase": false
  }'
```

### 5. After System Upgrade

```bash
# Analyze all records from the last week after threshold changes
curl -X POST http://localhost:3000/api/anomalies/retrospective \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-08T00:00:00.000Z",
    "endDate": "2024-01-15T00:00:00.000Z"
  }'
```

## How It Works

1. **Loads Patient Profiles**: Fetches current patient thresholds and configurations
2. **Retrieves Historical Records**: Queries health records based on filters (patient, date range)
3. **Re-runs Detection**: Applies current anomaly detection algorithms to historical data
4. **Deduplication**: Checks for existing anomalies to avoid duplicates (based on timestamp)
5. **Saves Results**: Creates new Anomaly and AlertLog records (if `updateDatabase` is true)
6. **Returns Summary**: Provides detailed statistics per patient

## Features

### Intelligent Deduplication

- Prevents creating duplicate anomaly records
- Compares timestamps (rounded to minute) to identify existing detections
- Safe to run multiple times on the same data

### Metadata Tracking

All anomalies detected retrospectively are tagged with:

```javascript
{
  retrospective: true,
  detectionDate: new Date(),
  anomalyScore: <calculated_score>
}
```

### Performance Optimization

- Processes records in batches by patient
- Loads historical context for better statistical analysis
- Efficient database queries with proper indexing

## Error Handling

### Invalid Date Format

```json
{
  "success": false,
  "error": "Invalid startDate format",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Date Range Error

```json
{
  "success": false,
  "error": "startDate cannot be after endDate",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Database Errors

```json
{
  "success": false,
  "error": "Database connection error",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing

### Manual Testing Script

```bash
# See manual-test-retrospective.js
node manual-test-retrospective.js
```

### Integration Tests

```bash
npm test -- tests/integration/retrospective-anomaly.integration.test.js
```

## Best Practices

1. **Test First**: Run with `updateDatabase: false` to preview results
2. **Use Date Ranges**: For large datasets, process in smaller time windows
3. **Monitor Performance**: Large batches may take time; consider scheduling during off-peak hours
4. **Verify Results**: Check the `patientsSummary` to validate detection accuracy
5. **Review Errors**: Always check the `errors` array in the response

## Implementation Details

### Service Layer

- **File**: `src/services/anomalyDetector.js`
- **Method**: `detectRetrospectiveAnomalies(options)`
- Uses the same detection logic as real-time monitoring
- Maintains statistical context through rolling windows

### API Layer

- **File**: `src/routes/anomalies.js`
- **Route**: `POST /api/anomalies/retrospective`
- Validates input parameters
- Handles errors gracefully
- Returns detailed results

### Database Schema

Anomalies are stored with retrospective metadata:

```javascript
{
  patientId: String,
  severity: String,
  detectedAt: Date,
  alerts: Array,
  acknowledged: Boolean,
  metadata: {
    retrospective: Boolean,
    detectionDate: Date,
    anomalyScore: Number
  }
}
```

## Performance Considerations

- **Small Datasets (< 1000 records)**: Processes in seconds
- **Medium Datasets (1000-10000 records)**: May take 1-2 minutes
- **Large Datasets (> 10000 records)**: Consider batching by date range

## Support

For issues or questions, please refer to:

- Main documentation: `/docs/INDEX.md`
- Architecture guide: `/docs/ARCHITECTURE.md`
- API documentation: `/docs/QUICKSTART.md`
