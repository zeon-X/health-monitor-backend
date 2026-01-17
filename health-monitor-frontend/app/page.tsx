"use client";

import AlertModal from "@/components/dashboard/AlertModal";
import PatientCard from "@/components/dashboard/PatientCard";
import PatientTable from "@/components/dashboard/PatientTable";
import SummaryCards from "@/components/dashboard/SummaryCards";
import { acknowledgeAnomaly, getDashboardSummary } from "@/lib/api";
import { initializeSocket } from "@/lib/socket";
import { DashboardSummary } from "@/lib/types";
import { UsersIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

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
      setSelectedPatient(null); // Close modal after acknowledgement
    } catch (err) {
      console.error("Failed to acknowledge anomaly:", err);
    }
  };

  const getPatientAnomalies = (patientId: string) => {
    return (
      summary?.recentAnomalies.filter(
        (a) => a.patientId === patientId && !a.acknowledged
      ) || []
    );
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <SummaryCards
        totalPatients={summary.summary.totalPatients}
        activeAnomalies={summary.summary.activeAnomalies}
        criticalCount={summary.summary.criticalCount}
        warningCount={summary.summary.warningCount}
      />

      {/* Patient Cards Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Patient Overview
          </h2>
          <span className="text-sm text-gray-500">
            {summary.latestVitals.length} patients
          </span>
        </div>

        {/* Patient Table - Desktop / Mobile Cards */}
        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          {summary.latestVitals.map((record) => (
            <PatientCard
              key={record._id}
              record={record}
              patientAnomalies={getPatientAnomalies(record.patientId)}
              onAlertClick={setSelectedPatient}
              onViewDetails={(patientId) =>
                (window.location.href = `/patients/${patientId}`)
              }
            />
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <PatientTable
            patients={summary.latestVitals}
            getPatientAnomalies={getPatientAnomalies}
            onAlertClick={setSelectedPatient}
            onViewDetails={(patientId) =>
              (window.location.href = `/patients/${patientId}`)
            }
          />
        </div>

        {/* Empty State */}
        {summary.latestVitals.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No patient data available
            </p>
          </div>
        )}
      </div>

      {/* Alert Modal */}
      <AlertModal
        selectedPatient={selectedPatient}
        patientAnomalies={
          selectedPatient ? getPatientAnomalies(selectedPatient) : []
        }
        onClose={() => setSelectedPatient(null)}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  );
}
