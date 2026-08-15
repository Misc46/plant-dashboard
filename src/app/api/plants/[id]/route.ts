import { NextResponse } from "next/server";
import { adminAuth, adminDb, adminRtdb } from "@/lib/firebase/admin";

/**
 * DELETE /api/plants/[id]
 *
 * Firestore rules already allow an ADMIN to delete the plant document from the
 * client, but that would orphan the telemetry stream in the Realtime Database.
 * This route removes the stream and the document together; the simulator is
 * stateless, so dropping the stream is all the server-side cleanup needed.
 */
export async function DELETE(
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

    // Only ADMIN role may delete a plant (mirrors the UI guard and rules)
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

    // 1. Drop the telemetry stream first — if this fails we still have the
    //    plant document, so the operation stays retryable.
    await adminRtdb.ref(`telemetry/${id}`).remove();

    // 2. Remove the plant document
    await plantRef.delete();

    return NextResponse.json({ message: "Plant deleted successfully" });
  } catch (error) {
    console.error("Plant delete API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete plant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
