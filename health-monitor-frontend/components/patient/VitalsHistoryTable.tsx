import { Anomaly, HealthRecord } from "@/lib/types";

interface VitalsHistoryTableProps {
  vitalsHistory: HealthRecord[];
  anomalies: Anomaly[];
  lastUpdate: Date;
}

export default function VitalsHistoryTable({
  vitalsHistory,
  anomalies,
  lastUpdate,
}: VitalsHistoryTableProps) {
  return (
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
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
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
              {vitalsHistory?.map((record, idx) => {
                // Match anomalies by timestamp proximity (within 5 minutes)
                const recordTime = new Date(record?.recordedAt).getTime();
                const hasAnomaly = anomalies.some((a) => {
                  if (a.acknowledged) return false;
                  const anomalyTime = new Date(a.detectedAt).getTime();
                  const timeDiff = Math.abs(recordTime - anomalyTime);
                  return timeDiff < 5 * 60 * 1000; // 5 minutes in milliseconds
                });

                return (
                  <tr
                    key={record?._id || idx}
                    className={`${
                      idx === 0 ? "bg-blue-50" : "hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td className="whitespace-nowrap flex px-4 py-3 text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span>
                          {new Date(record?.recordedAt).toLocaleTimeString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(record?.recordedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      </div>
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
      </div>
      {vitalsHistory.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500">No vital signs recorded yet</p>
        </div>
      )}
    </div>
  );
}
