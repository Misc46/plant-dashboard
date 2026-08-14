import { NextResponse } from "next/server";
import { adminAuth, adminDb, adminRtdb } from "@/lib/firebase/admin";
import { PlantData, PlantSimulator, TelemetryReading } from "@/lib/simulator";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized caller" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Query all plants with status RUNNING
    const snapshot = await adminDb
      .collection("plants")
      .where("status", "==", "RUNNING")
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No running plants", tickedCount: 0 });
    }

    const tickResults: Array<{ plantId: string; reading: TelemetryReading }> = [];

    for (const doc of snapshot.docs) {
      const plant = { id: doc.id, ...doc.data() } as PlantData;

      // Get last RTDB telemetry reading for process variable continuity
      const rtdbRef = adminRtdb.ref(`telemetry/${plant.id}`);
      const lastSnap = await rtdbRef.orderByKey().limitToLast(1).once("value");
      
      let lastReading: TelemetryReading | null = null;
      if (lastSnap.exists()) {
        const valObj = lastSnap.val();
        const keys = Object.keys(valObj);
        if (keys.length > 0) {
          lastReading = valObj[keys[0]];
        }
      }

      // Calculate next step
      const reading = PlantSimulator.simulateStep(plant, lastReading, 0.5);

      // Write reading to RTDB auto ID via admin
      await rtdbRef.push(reading);
      tickResults.push({ plantId: plant.id, reading });
    }

    return NextResponse.json({
      message: "Simulation tick completed",
      tickedCount: tickResults.length,
      results: tickResults,
    });
  } catch (error) {
    console.error("Tick API error:", error);
    const message = error instanceof Error ? error.message : "Failed simulation tick";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
