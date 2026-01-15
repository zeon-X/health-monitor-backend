// Vital Chart Component using Recharts
"use client";

import { HealthRecord } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface VitalChartProps {
  data: HealthRecord[];
  metric:
    | "heartRate"
    | "systolic"
    | "diastolic"
    | "temperature"
    | "spo2"
    | "bloodGlucose";
  title: string;
  unit: string;
  color: string;
  thresholds?: { min?: number; max?: number };
}

export default function VitalChart({
  data,
  metric,
  title,
  unit,
  color,
  thresholds,
}: VitalChartProps) {
  const chartData = data.map((record) => {
    let value: number | undefined;

    // Handle blood pressure metrics
    if (metric === "systolic" || metric === "diastolic") {
      // Check if bloodPressure is a string like "140/88"
      if (typeof record.bloodPressure === "string") {
        const [sys, dia] = record.bloodPressure.split("/").map(Number);
        value = metric === "systolic" ? sys : dia;
      } else if (record.vitals?.bloodPressure) {
        value = record.vitals.bloodPressure[metric];
      }
    } else {
      // Try direct property first (backend format), then vitals nested (frontend format)
      value = (record[metric] as number) ?? (record.vitals?.[metric] as number);
    }

    return {
      time: formatTime(record.recordedAt),
      value: value ?? 0,
      timestamp: new Date(record.recordedAt).getTime(),
    };
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        {title} ({unit})
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          {thresholds?.min && (
            <ReferenceLine
              y={thresholds.min}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: "Min", position: "left", fill: "#ef4444" }}
            />
          )}
          {thresholds?.max && (
            <ReferenceLine
              y={thresholds.max}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: "Max", position: "left", fill: "#ef4444" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3 }}
            activeDot={{ r: 5 }}
            name={title}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
