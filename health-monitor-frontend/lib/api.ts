// API client for backend communication
import axios from 'axios';
import { AlertHistory, Anomaly, DashboardSummary, HealthRecord, Patient } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Patients
export const getPatients = async (): Promise<Patient[]> => {
    const { data } = await api.get('/patients');
    return data;
};

export const getPatient = async (patientId: string): Promise<Patient> => {
    const { data } = await api.get(`/patients/${patientId}`);
    return data;
};

export const getLatestVitals = async (patientId: string): Promise<HealthRecord> => {
    const { data } = await api.get(`/vitals/${patientId}/latest`);
    return data;
};

export const getVitalsHistory = async (
    patientId: string,
    hours: number = 24
): Promise<any> => {
    const { data } = await api.get(`/vitals/${patientId}/history`, {
        params: { hours },
    });
    return data;
};

// Anomalies
export const getActiveAnomalies = async (): Promise<Anomaly[]> => {
    const { data } = await api.get('/anomalies/active');
    return data;
};

export const getPatientAnomalies = async (patientId: string): Promise<Anomaly[]> => {
    const { data } = await api.get(`/anomalies/patient/${patientId}`);
    return data;
};

export const acknowledgeAnomaly = async (anomalyId: string, acknowledgedBy: string = 'Web User'): Promise<void> => {
    await api.post(`/anomalies/${anomalyId}/acknowledge`, { acknowledgedBy });
};

// Dashboard
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    const { data } = await api.get('/dashboard/summary');
    return data;
};

export const getAlertHistory = async (days: number = 7): Promise<AlertHistory[]> => {
    const { data } = await api.get('/alerts/history', {
        params: { days },
    });
    return data;
};

// Health check
export const checkHealth = async (): Promise<{ status: string; timestamp: string }> => {
    const { data } = await api.get('/health');
    return data;
};

export default api;
