"use client";

import { Anomaly, HealthRecord } from "@/lib/types";
import {
  ArrowTrendingUpIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  FireIcon,
  HeartIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

interface PatientCardProps {
  record: HealthRecord;
  patientAnomalies: Anomaly[];
  onAlertClick: (patientId: string) => void;
  onViewDetails: (patientId: string) => void;
}

export default function PatientCard({
  record,
  patientAnomalies,
  onAlertClick,
  onViewDetails,
}: PatientCardProps) {
  console.log(patientAnomalies);

  const hasAlert = patientAnomalies.length > 0;
  const activeAnomalies = patientAnomalies.filter((a) => !a.acknowledged);
  const hasActiveAlert = activeAnomalies.length > 0;
  const criticalAlert = activeAnomalies.find((a) => a.severity === "critical");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {record.patientName || `Patient ${record.patientId}`}
          </h3>
          <p className="text-xs text-gray-500">ID: {record.patientId}</p>
        </div>
        {hasAlert ? (
          <button
            onClick={() => onAlertClick(record.patientId)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              hasActiveAlert
                ? criticalAlert
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {hasActiveAlert ? (
              criticalAlert ? (
                <ShieldExclamationIcon className="h-4 w-4" />
              ) : (
                <ExclamationTriangleIcon className="h-4 w-4" />
              )
            ) : (
              <div className="h-2 w-2 rounded-full bg-gray-500"></div>
            )}
            <span className="rounded-full bg-white px-1.5 py-0.5 text-xs font-bold">
              {hasActiveAlert
                ? activeAnomalies.length
                : patientAnomalies.length}
            </span>
            {!hasActiveAlert && <span className="text-[10px]">Mon.</span>}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-700">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            Normal
          </span>
        )}
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <HeartIcon className="h-3.5 w-3.5" />
            Heart Rate
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {record.heartRate || "--"} {record.heartRate && "bpm"}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
            Blood Pressure
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {record.bloodPressure || "--"}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <FireIcon className="h-3.5 w-3.5" />
            Temperature
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {record.bodyTemperature
              ? `${record.bodyTemperature.toFixed(1)}°C`
              : "--"}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <BeakerIcon className="h-3.5 w-3.5" />
            SpO₂
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {record.spo2 || "--"} {record.spo2 && "%"}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500">
          {new Date(record.recordedAt).toLocaleString()}
        </p>
        <button
          onClick={() => onViewDetails(record.patientId)}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
