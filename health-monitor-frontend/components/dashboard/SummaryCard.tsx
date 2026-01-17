// Summary Card Component
import { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  severity?: "critical" | "warning" | "normal";
  trend?: string;
}

export default function SummaryCard({
  title,
  value,
  icon,
  severity,
  trend,
}: SummaryCardProps) {
  const getColorClass = () => {
    if (severity === "critical") return "border-red-200 bg-white";
    if (severity === "warning") return "border-amber-200 bg-white";
    return "border-gray-200 bg-white";
  };

  const getTextColor = () => {
    if (severity === "critical") return "text-red-600";
    if (severity === "warning") return "text-amber-600";
    return "text-gray-900";
  };

  const getIconBgColor = () => {
    if (severity === "critical") return "bg-red-100";
    if (severity === "warning") return "bg-amber-100";
    return "bg-blue-100";
  };

  const getIconColor = () => {
    if (severity === "critical") return "text-red-600";
    if (severity === "warning") return "text-amber-600";
    return "text-blue-600";
  };

  return (
    <div className={`rounded-lg border shadow-sm p-6 ${getColorClass()}`}>
      <div className="flex items-center">
        <div className={`rounded-lg p-3 ${getIconBgColor()}`}>
          <div className={`h-6 w-6 ${getIconColor()}`}>{icon}</div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-semibold ${getTextColor()}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
