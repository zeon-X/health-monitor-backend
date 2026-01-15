// Patient Card Component
"use client";

import { Patient, VitalSigns } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import Link from "next/link";

interface PatientCardProps {
  patient: Patient;
  vitals?: VitalSigns;
  lastUpdate?: string;
  hasActiveAlert?: boolean;
}

export default function PatientCard({
  patient,
  vitals,
  lastUpdate,
  hasActiveAlert,
}: PatientCardProps) {
  const getStatus = () => {
    if (hasActiveAlert) return { label: "Alert", color: "bg-red-500" };
    if (!vitals) return { label: "Offline", color: "bg-gray-400" };
    return { label: "Normal", color: "bg-green-500" };
  };

  const status = getStatus();

  return (
    <Link href={`/patients/${patient.patientId}`}>
      <div className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {patient.name}
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white ${status.color}`}
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-white"></span>
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {patient.age}y • {patient.gender} • ID: {patient.patientId}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {patient.conditions.slice(0, 2).map((condition, idx) => (
                <span
                  key={idx}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>
        </div>

        {vitals && (
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs text-gray-500">Heart Rate</p>
              <p className="mt-1 font-semibold text-gray-900">
                {vitals.heartRate || "N/A"} bpm
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">BP</p>
              <p className="mt-1 font-semibold text-gray-900">
                {typeof vitals.bloodPressure === "string"
                  ? vitals.bloodPressure
                  : `${vitals.bloodPressure?.systolic || "N/A"}/${
                      vitals.bloodPressure?.diastolic || "N/A"
                    }`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">SpO₂</p>
              <p className="mt-1 font-semibold text-gray-900">
                {vitals.spo2 || "N/A"}%
              </p>
            </div>
          </div>
        )}

        {lastUpdate && (
          <p className="mt-3 text-xs text-gray-400">
            Last update: {formatTime(lastUpdate)}
          </p>
        )}
      </div>
    </Link>
  );
}
