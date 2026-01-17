"use client";

import AlertModal from "@/components/dashboard/AlertModal";
import PatientCard from "@/components/dashboard/PatientCard";
import PatientTable from "@/components/dashboard/PatientTable";
import SummaryCards from "@/components/dashboard/SummaryCards";
import ErrorState from "@/components/ErrorState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useDashboard } from "@/hooks/useDashboard";
import { UsersIcon } from "@heroicons/react/24/outline";

export default function DashboardPage() {
  const {
    summary,
    loading,
    error,
    selectedPatient,
    setSelectedPatient,
    handleAcknowledge,
    getPatientAnomalies,
    getActiveAnomalies,
    fetchData,
  } = useDashboard();

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (error || !summary) {
    return (
      <ErrorState
        message={error || "Failed to load data"}
        onRetry={fetchData}
      />
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
          selectedPatient ? getActiveAnomalies(selectedPatient) : []
        }
        onClose={() => setSelectedPatient(null)}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  );
}
