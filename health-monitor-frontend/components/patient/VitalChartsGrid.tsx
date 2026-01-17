import VitalChart from "@/components/dashboard/VitalChart";
import { HealthRecord, Patient } from "@/lib/types";

interface VitalChartsGridProps {
  vitalsHistory: HealthRecord[];
  patient: Patient;
}

export default function VitalChartsGrid({
  vitalsHistory,
  patient,
}: VitalChartsGridProps) {
  // Get last 24 data points for charts (last 2 hours at 5-min intervals)
  const chartData = vitalsHistory.slice(-24);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        24-Hour Vital Trends (Last 24 readings)
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <VitalChart
          data={chartData}
          metric="heartRate"
          title="Heart Rate"
          unit="bpm"
          color="#ef4444"
          thresholds={patient.baselineVitals?.hr}
        />
        <VitalChart
          data={chartData}
          metric="systolic"
          title="Systolic BP"
          unit="mmHg"
          color="#3b82f6"
          thresholds={patient.baselineVitals?.systolic}
        />
        <VitalChart
          data={chartData}
          metric="temperature"
          title="Temperature"
          unit="°C"
          color="#f59e0b"
          thresholds={patient.baselineVitals?.temp}
        />
        <VitalChart
          data={chartData}
          metric="spo2"
          title="SpO₂"
          unit="%"
          color="#10b981"
          thresholds={patient.baselineVitals?.spo2}
        />
        <VitalChart
          data={chartData}
          metric="diastolic"
          title="Diastolic BP"
          unit="mmHg"
          color="#06b6d4"
          thresholds={patient.baselineVitals?.diastolic}
        />
      </div>
    </div>
  );
}
