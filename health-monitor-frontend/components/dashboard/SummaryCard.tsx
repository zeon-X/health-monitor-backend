// Summary Card Component

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon?: string;
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
    if (severity === "critical") return "border-red-500 bg-red-50";
    if (severity === "warning") return "border-amber-500 bg-amber-50";
    return "border-blue-500 bg-blue-50";
  };

  const getTextColor = () => {
    if (severity === "critical") return "text-red-700";
    if (severity === "warning") return "text-amber-700";
    return "text-blue-700";
  };

  return (
    <div className={`rounded-lg border-2 p-6 shadow-sm ${getColorClass()}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`mt-2 text-3xl font-bold ${getTextColor()}`}>{value}</p>
          {trend && <p className="mt-1 text-xs text-gray-500">{trend}</p>}
        </div>
        {icon && <span className="text-4xl">{icon}</span>}
      </div>
    </div>
  );
}
