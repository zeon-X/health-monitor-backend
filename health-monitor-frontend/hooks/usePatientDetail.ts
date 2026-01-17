import {
    acknowledgeAnomaly,
    getPatient,
    getPatientAnomalies,
    getVitalsHistory,
} from "@/lib/api";
import { initializeSocket } from "@/lib/socket";
import { Anomaly, HealthRecord, Patient } from "@/lib/types";
import { useEffect, useState } from "react";

export function usePatientDetail(patientId: string) {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [vitalsHistory, setVitalsHistory] = useState<HealthRecord[]>([]);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Fetch patient data
    const fetchData = async () => {
        try {
            console.log("🔍 Fetching data for patient:", patientId);
            const [patientData, vitalsResponse, anomaliesData] = await Promise.all([
                getPatient(patientId),
                getVitalsHistory(patientId, 24),
                getPatientAnomalies(patientId),
            ]);

            console.log(
                "✅ Data fetched, vitals count:",
                vitalsResponse.records?.length || 0
            );
            setPatient(patientData);
            // Backend returns { records: [...] } format
            const records = vitalsResponse.records || vitalsResponse;
            setVitalsHistory(Array.isArray(records) ? records : []);
            setAnomalies(anomaliesData);
            setLastUpdate(new Date());
            setError(null);
        } catch (err) {
            setError("Failed to load patient data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle anomaly acknowledgment
    const handleAcknowledge = async (anomalyId: string) => {
        try {
            await acknowledgeAnomaly(anomalyId);
            fetchData();
        } catch (err) {
            console.error("Failed to acknowledge anomaly:", err);
        }
    };

    useEffect(() => {
        fetchData();

        const socket = initializeSocket();

        // Listen for vital updates
        const handleVitalUpdate = (data: any) => {
            console.log("🔄 Vital update received:", data);
            if (data.patientId === patientId) {
                console.log("✅ Updating patient data for:", patientId);
                fetchData();
            }
        };

        // Listen for anomaly alerts
        const handleAnomalyAlert = (data: any) => {
            console.log("🚨 Anomaly alert received:", data);
            if (data.patientId === patientId) {
                console.log("✅ Updating patient data for:", patientId);
                fetchData();
            }
        };

        socket.on("vital_update", handleVitalUpdate);
        socket.on("anomaly_alert", handleAnomalyAlert);

        // Polling fallback - refresh every 30 seconds
        const interval = setInterval(() => {
            console.log("🔄 Auto-refresh patient data");
            fetchData();
        }, 30000);

        return () => {
            socket.off("vital_update", handleVitalUpdate);
            socket.off("anomaly_alert", handleAnomalyAlert);
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    const activeAnomalies = anomalies.filter((a) => !a.acknowledged);

    return {
        patient,
        vitalsHistory,
        anomalies,
        activeAnomalies,
        loading,
        error,
        lastUpdate,
        handleAcknowledge,
    };
}
