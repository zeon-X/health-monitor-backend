// Alert Feed Component
"use client";

import { Anomaly } from "@/lib/types";
import { formatTime } from "@/lib/utils";

interface AlertFeedProps {
  anomalies: Anomaly[];
  onAcknowledge: (anomalyId: string) => void;
}

export default function AlertFeed({
  anomalies,
  onAcknowledge,
}: AlertFeedProps) {
  if (anomalies.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">✅ No active alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
      <div className="max-h-[600px] space-y-2 overflow-y-auto">
        {anomalies.map((anomaly) => (
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
                    className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                      anomaly.severity === "critical"
                        ? "bg-red-200 text-red-800"
                        : "bg-amber-200 text-amber-800"
                    }`}
                  >
                    {anomaly.severity}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {anomaly.patientName}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  {formatTime(anomaly.detectedAt)}
                </p>
                <div className="mt-2 space-y-1">
                  {anomaly.alerts.slice(0, 2).map((alert, idx) => (
                    <p key={idx} className="text-sm text-gray-700">
                      • {alert.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => onAcknowledge(anomaly._id)}
              className="mt-3 w-full rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700"
            >
              Acknowledge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
