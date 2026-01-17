"use client";

import ErrorStateWithButton from "@/components/ErrorStateWithButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import AnomalyHistory from "@/components/patient/AnomalyHistory";
import PatientInfoCard from "@/components/patient/PatientInfoCard";
import VitalChartsGrid from "@/components/patient/VitalChartsGrid";
import VitalsHistoryTable from "@/components/patient/VitalsHistoryTable";
import { usePatientDetail } from "@/hooks/usePatientDetail";
import { useParams, useRouter } from "next/navigation";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  const {
    patient,
    vitalsHistory,
    anomalies,
    activeAnomalies,
    loading,
    error,
    lastUpdate,
    handleAcknowledge,
  } = usePatientDetail(patientId);

  if (loading) {
    return <LoadingSpinner message="Loading patient data..." />;
  }

  if (error || !patient) {
    return (
      <ErrorStateWithButton
        message={error || "Patient not found"}
        buttonText="Back to Dashboard"
        onButtonClick={() => router.push("/")}
      />
    );
  }

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
      <PatientInfoCard
        patient={patient}
        activeAnomaliesCount={activeAnomalies.length}
        totalAnomaliesCount={anomalies.length}
        onAlertClick={() => {
          document.getElementById("anomaly-history")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
      />

      {/* Real-time Vitals Table */}
      <VitalsHistoryTable
        vitalsHistory={vitalsHistory}
        anomalies={anomalies}
        lastUpdate={lastUpdate}
      />

      {/* Vital Charts */}
      <VitalChartsGrid vitalsHistory={vitalsHistory} patient={patient} />

      {/* Anomaly History */}
      <AnomalyHistory anomalies={anomalies} onAcknowledge={handleAcknowledge} />
    </div>
  );
}
