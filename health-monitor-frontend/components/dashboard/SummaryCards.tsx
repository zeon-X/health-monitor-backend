"use client";

import SummaryCard from "@/components/dashboard/SummaryCard";
import {
  BellAlertIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface SummaryCardsProps {
  totalPatients: number;
  activeAnomalies: number;
  criticalCount: number;
  warningCount: number;
}

export default function SummaryCards({
  totalPatients,
  activeAnomalies,
  criticalCount,
  warningCount,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Patients"
        value={totalPatients}
        icon={<UsersIcon />}
        severity="normal"
      />
      <SummaryCard
        title="Active Alerts"
        value={activeAnomalies}
        icon={<BellAlertIcon />}
        severity={activeAnomalies > 0 ? "warning" : "normal"}
      />
      <SummaryCard
        title="Critical"
        value={criticalCount}
        icon={<ShieldExclamationIcon />}
        severity={criticalCount > 0 ? "critical" : "normal"}
      />
      <SummaryCard
        title="Warnings"
        value={warningCount}
        icon={<ExclamationTriangleIcon />}
        severity={warningCount > 0 ? "warning" : "normal"}
      />
    </div>
  );
}
