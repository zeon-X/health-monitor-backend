import { Anomaly } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface AnomalyHistoryProps {
  anomalies: Anomaly[];
  onAcknowledge: (anomalyId: string) => void;
}

export default function AnomalyHistory({
  anomalies,
  onAcknowledge,
}: AnomalyHistoryProps) {
  return (
    <div id="anomaly-history">
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
              {!anomaly.acknowledged && (
                <button
                  onClick={() => onAcknowledge(anomaly._id)}
                  className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                >
                  Acknowledge Alert
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
