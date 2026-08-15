import { NextResponse } from "next/server";
import { adminAuth, adminDb, adminRtdb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized caller" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Only ADMIN role may reset a plant (mirrors the UI guard)
    const userSnap = await adminDb.collection("users").doc(uid).get();
    const role = userSnap.exists ? (userSnap.data()?.role as string) : undefined;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const plantRef = adminDb.collection("plants").doc(id);
    const plantSnap = await plantRef.get();
    if (!plantSnap.exists) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    // 1. Reset plant document state (STOPPED, no step markers)
    await plantRef.update({
      status: "STOPPED",
      stepStartAt: null,
      stepStartSetpoint: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Wipe the telemetry stream so the chart starts clean.
    //    The simulator is stateless (state is rebuilt from the last reading),
    //    so the next run seeds itself from PV = 0 / integral = 0 automatically.
    await adminRtdb.ref(`telemetry/${id}`).remove();

    return NextResponse.json({ message: "Plant reset successfully" });
  } catch (error) {
    console.error("Plant reset API error:", error);
    const message = error instanceof Error ? error.message : "Failed to reset plant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
