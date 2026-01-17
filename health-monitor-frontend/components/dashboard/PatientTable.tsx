"use client";

import { Anomaly, HealthRecord } from "@/lib/types";
import {
  ArrowTrendingUpIcon,
  BeakerIcon,
  FireIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import PatientTableRow from "./PatientTableRow";

interface PatientTableProps {
  patients: HealthRecord[];
  getPatientAnomalies: (patientId: string) => Anomaly[];
  onAlertClick: (patientId: string) => void;
  onViewDetails: (patientId: string) => void;
}

export default function PatientTable({
  patients,
  getPatientAnomalies,
  onAlertClick,
  onViewDetails,
}: PatientTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Patient
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <div className="flex items-center gap-2">
                <HeartIcon className="h-4 w-4" />
                HR
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-4 w-4" />
                BP
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <div className="flex items-center gap-2">
                <FireIcon className="h-4 w-4" />
                Temp
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <div className="flex items-center gap-2">
                <BeakerIcon className="h-4 w-4" />
                SpO₂
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Last Update
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Alerts
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {patients.map((record) => (
            <PatientTableRow
              key={record._id}
              record={record}
              patientAnomalies={getPatientAnomalies(record.patientId)}
              onAlertClick={onAlertClick}
              onViewDetails={onViewDetails}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
