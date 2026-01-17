"use client";

import { Anomaly } from "@/lib/types";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface AlertModalProps {
  selectedPatient: string | null;
  patientAnomalies: Anomaly[];
  onClose: () => void;
  onAcknowledge: (anomalyId: string) => void;
}

export default function AlertModal({
  selectedPatient,
  patientAnomalies,
  onClose,
  onAcknowledge,
}: AlertModalProps) {
  if (!selectedPatient) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative z-50 w-full max-w-2xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Active Alerts
              </h3>
              <p className="text-sm text-gray-500">
                Patient ID: {selectedPatient}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Alert List */}
          <div className="max-h-96 overflow-y-auto p-6">
            <div className="space-y-4">
              {patientAnomalies.map((anomaly) => (
                <div
                  key={anomaly._id}
                  className={`rounded-lg border-2 p-4 ${
                    anomaly.severity === "critical"
                      ? "border-red-300 bg-red-50"
                      : "border-amber-300 bg-amber-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-1 text-xs font-bold uppercase ${
                            anomaly.severity === "critical"
                              ? "bg-red-200 text-red-800"
                              : "bg-amber-200 text-amber-800"
                          }`}
                        >
                          {anomaly.severity}
                        </span>
                        {anomaly.anomalyScore && (
                          <span className="text-xs font-medium text-gray-600">
                            Score: {anomaly.anomalyScore.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-600">
                        Detected:{" "}
                        {new Date(anomaly.detectedAt).toLocaleString()}
                      </p>
                      <div className="mt-3 space-y-2">
                        {anomaly.alerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {alert.type || alert.message}
                              </p>
                              {alert.value && (
                                <p className="text-xs text-gray-600">
                                  Value: {JSON.stringify(alert.value)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onAcknowledge(anomaly._id)}
                    className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                  >
                    Acknowledge Alert
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
