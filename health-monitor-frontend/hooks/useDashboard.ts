import { acknowledgeAnomaly, getDashboardSummary, getPatientAnomalies } from "@/lib/api";
import { initializeSocket } from "@/lib/socket";
import { Anomaly, DashboardSummary } from "@/lib/types";
import { useEffect, useState } from "react";

export function useDashboard() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
    const [patientAnomaliesMap, setPatientAnomaliesMap] = useState<Record<string, Anomaly[]>>({});

    // Fetch dashboard data
    const fetchData = async () => {
        try {
            const data = await getDashboardSummary();
            setSummary(data);

            // Fetch anomalies for each patient
            if (data.latestVitals && data.latestVitals.length > 0) {
                const anomaliesPromises = data.latestVitals.map(async (vital) => {
                    const anomalies = await getPatientAnomalies(vital.patientId);
                    return { patientId: vital.patientId, anomalies };
                });

                const results = await Promise.all(anomaliesPromises);
                const anomaliesMap: Record<string, Anomaly[]> = {};
                results.forEach(({ patientId, anomalies }) => {
                    anomaliesMap[patientId] = anomalies;
                });
                setPatientAnomaliesMap(anomaliesMap);
            }

            setError(null);
        } catch (err) {
            setError("Failed to load dashboard data");
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
            setSelectedPatient(null);
        } catch (err) {
            console.error("Failed to acknowledge anomaly:", err);
        }
    };

    // Get all anomalies for a patient (for monitoring purposes)
    const getPatientAnomaliesData = (patientId: string) => {
        return patientAnomaliesMap[patientId] || [];
    };

    // Get only active (unacknowledged) anomalies for modal
    const getActiveAnomalies = (patientId: string) => {
        const anomalies = patientAnomaliesMap[patientId] || [];
        return anomalies.filter((a) => !a.acknowledged);
    };

    useEffect(() => {
        fetchData();

        const socket = initializeSocket();

        // Listen for vital updates
        socket.on("vital_update", (data) => {
            console.log("Vital update:", data);
            fetchData();
        });

        // Listen for anomaly alerts
        socket.on("anomaly_alert", (data) => {
            console.log("Anomaly alert:", data);
            fetchData();

            // Optional: Show browser notification
            if (Notification.permission === "granted") {
                new Notification("Health Alert", {
                    body: `${data.patientName} - ${data.severity.toUpperCase()}`,
                    icon: "/favicon.ico",
                });
            }
        });

        // Request notification permission
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);

        return () => {
            clearInterval(interval);
            socket.off("vital_update");
            socket.off("anomaly_alert");
        };
    }, []);

    return {
        summary,
        loading,
        error,
        selectedPatient,
        setSelectedPatient,
        handleAcknowledge,
        getPatientAnomalies: getPatientAnomaliesData,
        getActiveAnomalies,
        fetchData,
    };
}
