import { NextResponse } from "next/server";
import { adminDb, adminRtdb } from "@/lib/firebase/admin";
import { calculatePerformanceMetrics } from "@/lib/metrics/performance";
import { TelemetryReading } from "@/lib/simulator";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const plantDoc = await adminDb.collection("plants").doc(id).get();
    if (!plantDoc.exists) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    const plant = plantDoc.data();
    const stepStartAt = plant?.stepStartAt;
    const setpoint = plant?.setpoint ?? 0;

    if (!stepStartAt) {
      return NextResponse.json({
        riseTimeMs: null,
        overshootPercent: null,
        settlingTimeMs: null,
        message: "No step input start timestamp recorded for this plant yet.",
      });
    }

    // Query RTDB for telemetry entries since stepStartAt
    const rtdbSnap = await adminRtdb.ref(`telemetry/${id}`).once("value");
    if (!rtdbSnap.exists()) {
      return NextResponse.json({
        riseTimeMs: null,
        overshootPercent: null,
        settlingTimeMs: null,
        message: "No telemetry data recorded for this plant.",
      });
    }

    const rawData = rtdbSnap.val();
    const readings: TelemetryReading[] = Object.values(rawData);

    const metrics = calculatePerformanceMetrics(readings, stepStartAt, setpoint);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Plant performance API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to calculate performance metrics";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
