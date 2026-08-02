import { NextResponse } from "next/server";
import { adminDb, adminRtdb } from "@/lib/firebase/admin";
import { PlantData } from "@/lib/simulator";

export async function GET() {
  try {
    const plantsSnap = await adminDb.collection("plants").get();
    
    let activePlants = 0;
    let runningSystems = 0;
    let faultCount = 0;
    let totalError = 0;
    let totalOutput = 0;
    let telemetryCount = 0;

    for (const doc of plantsSnap.docs) {
      activePlants++;
      const data = doc.data() as PlantData;

      if (data.status === "RUNNING") {
        runningSystems++;
      } else if (data.status === "FAULT") {
        faultCount++;
      }

      // Fetch latest RTDB telemetry point for average metrics calculation
      const rtdbSnap = await adminRtdb
        .ref(`telemetry/${doc.id}`)
        .orderByKey()
        .limitToLast(1)
        .once("value");

      if (rtdbSnap.exists()) {
        const valObj = rtdbSnap.val();
        const firstKey = Object.keys(valObj)[0];
        if (firstKey) {
          const reading = valObj[firstKey];
          totalError += Math.abs(reading.error || 0);
          totalOutput += reading.controlOutput || 0;
          telemetryCount++;
        }
      }
    }

    const avgError = telemetryCount > 0 ? Number((totalError / telemetryCount).toFixed(3)) : 0;
    const avgOutput = telemetryCount > 0 ? Number((totalOutput / telemetryCount).toFixed(3)) : 0;

    return NextResponse.json({
      activePlants,
      runningSystems,
      faultCount,
      avgError,
      avgOutput,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Dashboard summary API error:", error);
    const message = error instanceof Error ? error.message : "Failed to load summary stats";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
