"use client";

import { Anomaly, HealthRecord } from "@/lib/types";
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

interface PatientTableRowProps {
  record: HealthRecord;
  patientAnomalies: Anomaly[];
  onAlertClick: (patientId: string) => void;
  onViewDetails: (patientId: string) => void;
}

export default function PatientTableRow({
  record,
  patientAnomalies,
  onAlertClick,
  onViewDetails,
}: PatientTableRowProps) {
  const hasAlert = patientAnomalies.length > 0;
  const criticalAlert = patientAnomalies.find((a) => a.severity === "critical");

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {record.patientName || `Patient ${record.patientId}`}
          </div>
          <div className="text-xs text-gray-500">ID: {record.patientId}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-semibold text-gray-900">
          {record.heartRate || "--"}
          {record.heartRate && (
            <span className="ml-1 text-xs font-normal text-gray-500">bpm</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-semibold text-gray-900">
          {record.bloodPressure || "--"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-semibold text-gray-900">
          {record.bodyTemperature
            ? `${record.bodyTemperature.toFixed(1)}°C`
            : "--"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-semibold text-gray-900">
          {record.spo2 || "--"}
          {record.spo2 && (
            <span className="ml-1 text-xs font-normal text-gray-500">%</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
        {new Date(record.recordedAt).toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {hasAlert ? (
          <button
            onClick={() => onAlertClick(record.patientId)}
            className={`relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:shadow-md ${
              criticalAlert
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            {criticalAlert ? (
              <ShieldExclamationIcon className="h-5 w-5" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5" />
            )}
            <span className="flex items-center justify-center rounded-full bg-white px-2 py-0.5 text-xs font-bold">
              {patientAnomalies.length}
            </span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            Normal
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button
          onClick={() => onViewDetails(record.patientId)}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          View Details →
        </button>
      </td>
    </tr>
  );
}
