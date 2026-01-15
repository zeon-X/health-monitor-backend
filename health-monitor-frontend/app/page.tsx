"use client";

import SummaryCard from "@/components/dashboard/SummaryCard";
import { acknowledgeAnomaly, getDashboardSummary } from "@/lib/api";
import { initializeSocket } from "@/lib/socket";
import { DashboardSummary } from "@/lib/types";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchData = async () => {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSocket and fetch data
  useEffect(() => {
    fetchData();

    // Initialize WebSocket
    const socket = initializeSocket();

    // Listen for vital updates
    socket.on("vital_update", (data) => {
      console.log("Vital update:", data);
      fetchData(); // Refresh dashboard
    });

    // Listen for anomaly alerts
    socket.on("anomaly_alert", (data) => {
      console.log("Anomaly alert:", data);
      fetchData(); // Refresh dashboard

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

  // Handle anomaly acknowledgment
  const handleAcknowledge = async (anomalyId: string) => {
    try {
      await acknowledgeAnomaly(anomalyId);
      fetchData(); // Refresh dashboard
    } catch (err) {
      console.error("Failed to acknowledge anomaly:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error || "Failed to load data"}</p>
        <button
          onClick={fetchData}
          className="mt-4 rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryCard
          title="Total Patients"
          value={summary.summary.totalPatients}
          icon="👥"
          severity="normal"
        />
        <SummaryCard
          title="Active Alerts"
          value={summary.summary.activeAnomalies}
          icon="🔔"
          severity={summary.summary.activeAnomalies > 0 ? "warning" : "normal"}
        />
        <SummaryCard
          title="Critical Alerts"
          value={summary.summary.criticalCount}
          icon="🚨"
          severity={summary.summary.criticalCount > 0 ? "critical" : "normal"}
        />
        <SummaryCard
          title="Warnings"
          value={summary.summary.warningCount}
          icon="⚠️"
          severity={summary.summary.warningCount > 0 ? "warning" : "normal"}
        />
      </div>

      {/* Full Width Table */}
      <div className="w-full">
        {/* Patients Table */}
        <div className="w-full">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Patients
                </h2>
                <span className="text-sm text-gray-500">
                  {summary.latestVitals.length} active
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Patient
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Heart Rate
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Blood Pressure
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Temp
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      SpO₂
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Last Update
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {summary.latestVitals.map((record) => {
                    const hasActiveAlert = summary.recentAnomalies.some(
                      (a) => a.patientId === record.patientId && !a.acknowledged
                    );
                    return (
                      <tr
                        key={record.patientId}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() =>
                          (window.location.href = `/patients/${record.patientId}`)
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-gray-900">
                                {record.patientName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {record.patientId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          <span className="font-medium text-gray-900">
                            {record.heartRate || "N/A"}
                          </span>
                          <span className="ml-1 text-gray-500">bpm</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          <span className="font-medium text-gray-900">
                            {record.bloodPressure || "N/A"}
                          </span>
                          <span className="ml-1 text-gray-500">mmHg</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          <span className="font-medium text-gray-900">
                            {typeof record.bodyTemperature === "number"
                              ? record.bodyTemperature.toFixed(1)
                              : "N/A"}
                          </span>
                          <span className="ml-1 text-gray-500">°C</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          <span className="font-medium text-gray-900">
                            {record.spo2 || "N/A"}
                          </span>
                          <span className="ml-1 text-gray-500">%</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                          {new Date(record.recordedAt).toLocaleTimeString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          {hasActiveAlert ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                              Alert
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              <span className="h-2 w-2 rounded-full bg-green-500"></span>
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/patients/${record.patientId}`;
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {summary.latestVitals.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-gray-500">No active patients</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
