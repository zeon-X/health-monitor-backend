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
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        24-Hour Vital Trends
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <VitalChart
          data={vitalsHistory}
          metric="heartRate"
          title="Heart Rate"
          unit="bpm"
          color="#ef4444"
          thresholds={patient.thresholds?.heartRate}
        />
        <VitalChart
          data={vitalsHistory}
          metric="systolic"
          title="Systolic BP"
          unit="mmHg"
          color="#3b82f6"
          thresholds={patient.thresholds?.systolic}
        />
        <VitalChart
          data={vitalsHistory}
          metric="temperature"
          title="Temperature"
          unit="°C"
          color="#f59e0b"
          thresholds={patient.thresholds?.temperature}
        />
        <VitalChart
          data={vitalsHistory}
          metric="spo2"
          title="SpO₂"
          unit="%"
          color="#10b981"
          thresholds={{ min: patient.thresholds?.spo2?.min }}
        />
        <VitalChart
          data={vitalsHistory}
          metric="diastolic"
          title="Diastolic BP"
          unit="mmHg"
          color="#06b6d4"
          thresholds={patient.thresholds?.diastolic}
        />
      </div>
    </div>
  );
}
