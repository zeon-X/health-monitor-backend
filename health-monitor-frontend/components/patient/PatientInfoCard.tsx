import { Patient } from "@/lib/types";

interface PatientInfoCardProps {
  patient: Patient;
  activeAnomaliesCount: number;
  totalAnomaliesCount: number;
  onAlertClick?: () => void;
}

export default function PatientInfoCard({
  patient,
  activeAnomaliesCount,
  totalAnomaliesCount,
  onAlertClick,
}: PatientInfoCardProps) {
  const hasAnyAnomalies = totalAnomaliesCount > 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
          <p className="mt-1 text-gray-600">
            {patient.age} years • {patient.gender === "M" ? "Male" : "Female"} •
            ID: {patient.patientId}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {patient.conditions?.map((condition, idx) => (
              <span
                key={idx}
                className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
        <div>
          {hasAnyAnomalies ? (
            <button
              onClick={onAlertClick}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all hover:shadow-md cursor-pointer ${
                activeAnomaliesCount > 0
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  activeAnomaliesCount > 0
                    ? "animate-pulse bg-red-500"
                    : "bg-amber-500"
                }`}
              ></span>
              {activeAnomaliesCount > 0
                ? `${activeAnomaliesCount} Active Alert${
                    activeAnomaliesCount > 1 ? "s" : ""
                  }`
                : `${totalAnomaliesCount} Alert${
                    totalAnomaliesCount > 1 ? "s" : ""
                  } (Monitored)`}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              No Alerts
            </span>
          )}
        </div>
      </div>

      {/* Patient Details */}
      <div className="mt-6 grid gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-gray-500">Medications</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {patient.medications && patient.medications.length > 0 ? (
              patient.medications.map((med, idx) => (
                <span
                  key={idx}
                  className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800"
                >
                  {med}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-400">None listed</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Risk Factors</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {patient.riskFactors && patient.riskFactors.length > 0 ? (
              patient.riskFactors.map((risk, idx) => (
                <span
                  key={idx}
                  className="rounded bg-red-100 px-2 py-1 text-xs text-red-800"
                >
                  {risk.replace(/_/g, " ")}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-400">None listed</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
