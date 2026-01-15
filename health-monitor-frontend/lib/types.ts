// TypeScript types for the health monitoring system

export interface Patient {
    patientId: string;
    name: string;
    age: number;
    gender: 'M' | 'F';
    conditions: string[];
    contactInfo: {
        phone: string;
        email: string;
        emergencyContact: string;
    };
    thresholds: {
        heartRate: { min: number; max: number };
        systolic: { min: number; max: number };
        diastolic: { min: number; max: number };
        temperature: { min: number; max: number };
        spo2: { min: number };
        bloodGlucose: { min: number; max: number };
    };
    isActive: boolean;
}

export interface VitalSigns {
    heartRate: number;
    bloodPressure: {
        systolic: number;
        diastolic: number;
    };
    temperature: number;
    spo2: number;
    bloodGlucose: number;
    respiratoryRate: number;
    motionLevel: number;
}

export interface HealthRecord {
    _id: string;
    patientId: string;
    vitals: VitalSigns;
    recordedAt: string;
    anomalyScore?: number;
}

export interface Anomaly {
    _id: string;
    patientId: string;
    patientName: string;
    detectedAt: string;
    severity: 'critical' | 'warning';
    anomalyScore: number;
    alerts: Alert[];
    acknowledged: boolean;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
}

export interface Alert {
    type: string;
    metric: string;
    value: number;
    threshold: number | string;
    severity: 'critical' | 'warning';
    message: string;
}

export interface DashboardSummary {
    summary: {
        totalPatients: number;
        activeAnomalies: number;
        criticalCount: number;
        warningCount: number;
    };
    recentAnomalies: Anomaly[];
    latestVitals: Array<any>;
    timestamp: string;
}
export interface AlertHistory {
    date: string;
    alerts: Array<{
        time: string;
        patientId: string;
        patientName: string;
        severity: 'critical' | 'warning';
        message: string;
        acknowledged: boolean;
    }>;
}
