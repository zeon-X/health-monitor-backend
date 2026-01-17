// TypeScript types for the health monitoring system
// Synced with backend MongoDB schemas

export interface VitalRange {
    min: number;
    max: number;
    normal?: number;
}

export interface BaselineVitals {
    hr?: VitalRange;
    systolic?: VitalRange;
    diastolic?: VitalRange;
    spo2?: VitalRange;
    temp?: VitalRange;
}

export interface AlertThresholds {
    hrCritical?: [number, number];
    bpCritical?: [number, number];
    spo2Critical?: number;
}

export interface Patient {
    _id?: string;
    patientId: string;
    name: string;
    gender?: string;
    age?: number;
    conditions: string[];
    medications: string[];
    riskFactors: string[];
    baselineVitals?: BaselineVitals;
    alertThresholds?: AlertThresholds;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface HealthRecord {
    _id: string;
    patientId: string;
    patientName?: string; // Optional field from backend
    heartRate?: number;
    bloodPressure?: string; // Format: "120/80"
    spo2?: number;
    bodyTemperature?: number;
    motionLevel?: number;
    fallRiskScore?: number;
    sensorId?: string;
    httpbinResponse?: any;
    recordedAt: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Anomaly {
    _id: string;
    patientId: string;
    patientName?: string; // Populated from Patient
    severity: 'normal' | 'warning' | 'critical';
    alerts: Alert[];
    anomalyScore?: number;
    recordId?: string;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    detectedAt: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Alert {
    type: string;
    category?: string;
    message: string;
    value?: any;
}

export interface DashboardSummary {
    summary: {
        totalPatients: number;
        activeAnomalies: number;
        criticalCount: number;
        warningCount: number;
    };
    recentAnomalies: Anomaly[];
    latestVitals: HealthRecord[];
    timestamp: string;
}

export interface AlertLog {
    _id: string;
    patientId: string;
    alertType?: string;
    message?: string;
    severity?: string;
    actionTaken?: string;
    timestamp: string;
    createdAt?: string;
    updatedAt?: string;
}
