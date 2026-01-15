"use client";

import VitalChart from "@/components/dashboard/VitalChart";
import { getPatient, getPatientAnomalies, getVitalsHistory } from "@/lib/api";
import { initializeSocket } from "@/lib/socket";
import { Anomaly, HealthRecord, Patient } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<HealthRecord[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch patient data - NO useCallback, just plain function
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

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error || "Patient not found"}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const latestVitals = vitalsHistory[vitalsHistory.length - 1];
  const activeAnomalies = anomalies.filter((a) => !a.acknowledged);
  console.log("latestVitals", latestVitals);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Patient Info Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
            <p className="mt-1 text-gray-600">
              {patient.age} years • {patient.gender === "M" ? "Male" : "Female"}{" "}
              • ID: {patient.patientId}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {patient.conditions?.map((condition, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>
          <div>
            {activeAnomalies.length > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                {activeAnomalies.length} Active Alert
                {activeAnomalies.length > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                No Alerts
              </span>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 grid gap-4 border-t border-gray-200 pt-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-gray-500">Phone</p>
            <p className="mt-1 text-sm text-gray-900">
              {patient.contactInfo?.phone || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Email</p>
            <p className="mt-1 text-sm text-gray-900">
              {patient.contactInfo?.email || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">
              Emergency Contact
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {patient.contactInfo?.emergencyContact || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Vitals Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Real-time Vital Signs History
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
                Live Updates
              </span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Time
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Heart Rate
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Blood Pressure
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Temp (°C)
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  SpO₂
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Motion
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {vitalsHistory
                .slice(-20)
                .reverse()
                .map((record, idx) => {
                  const hasAnomaly = anomalies.some(
                    (a) => a.recordId === record?._id && !a.acknowledged
                  );
                  return (
                    <tr
                      key={record?._id || idx}
                      className={`${
                        idx === 0 ? "bg-blue-50" : "hover:bg-gray-50"
                      } transition-colors`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {new Date(record?.recordedAt).toLocaleTimeString()}
                        {idx === 0 && (
                          <span className="ml-2 text-xs text-blue-600 font-medium">
                            Latest
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className="font-medium text-gray-900">
                          {record?.heartRate ?? "N/A"}
                        </span>
                        <span className="ml-1 text-gray-500">bpm</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className="font-medium text-gray-900">
                          {record?.bloodPressure ?? "N/A"}
                        </span>
                        <span className="ml-1 text-gray-500">mmHg</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className="font-medium text-gray-900">
                          {typeof record?.bodyTemperature === "number"
                            ? record?.bodyTemperature.toFixed(1)
                            : "N/A"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className="font-medium text-gray-900">
                          {record?.spo2 ?? "N/A"}
                        </span>
                        <span className="ml-1 text-gray-500">%</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className="font-medium text-gray-900">
                          {typeof record?.motionLevel === "number"
                            ? record?.motionLevel.toFixed(2)
                            : "N/A"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {hasAnomaly ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                            Alert
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {vitalsHistory.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">No vital signs recorded yet</p>
          </div>
        )}
      </div>

      {/* Vital Charts */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          24-Hour Vital Trends
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <VitalChart
            data={vitalsHistory}
            metric="heartRate"
            title="Heart Rate"
            unit="bpm"
            color="#ef4444"
            thresholds={patient.thresholds?.heartRate}
          />
          <VitalChart
            data={vitalsHistory}
            metric="systolic"
            title="Systolic BP"
            unit="mmHg"
            color="#3b82f6"
            thresholds={patient.thresholds?.systolic}
          />
          <VitalChart
            data={vitalsHistory}
            metric="temperature"
            title="Temperature"
            unit="°C"
            color="#f59e0b"
            thresholds={patient.thresholds?.temperature}
          />
          <VitalChart
            data={vitalsHistory}
            metric="spo2"
            title="SpO₂"
            unit="%"
            color="#10b981"
            thresholds={{ min: patient.thresholds?.spo2?.min }}
          />
          <VitalChart
            data={vitalsHistory}
            metric="bloodGlucose"
            title="Blood Glucose"
            unit="mg/dL"
            color="#8b5cf6"
            thresholds={patient.thresholds?.bloodGlucose}
          />
          <VitalChart
            data={vitalsHistory}
            metric="diastolic"
            title="Diastolic BP"
            unit="mmHg"
            color="#06b6d4"
            thresholds={patient.thresholds?.diastolic}
          />
        </div>
      </div>

      {/* Anomaly History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Anomaly History
        </h2>
        {anomalies.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <p className="text-sm text-gray-500">✅ No anomalies detected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <div
                key={anomaly._id}
                className={`rounded-lg border-2 p-4 ${
                  anomaly.acknowledged
                    ? "border-gray-200 bg-gray-50"
                    : anomaly.severity === "critical"
                    ? "border-red-300 bg-red-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                          anomaly.severity === "critical"
                            ? "bg-red-200 text-red-800"
                            : "bg-amber-200 text-amber-800"
                        }`}
                      >
                        {anomaly.severity}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatDate(anomaly.detectedAt)}
                      </span>
                      {anomaly.acknowledged && (
                        <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                          ✓ Acknowledged
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      {anomaly.alerts?.map((alert, idx) => (
                        <p key={idx} className="text-sm text-gray-700">
                          • {alert.message}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
