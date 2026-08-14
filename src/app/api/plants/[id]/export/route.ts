import { NextResponse } from "next/server";
import { adminAuth, adminDb, adminRtdb } from "@/lib/firebase/admin";
import { TelemetryReading } from "@/lib/simulator";
import {
  RANGE_MS,
  buildCsv,
  buildFilename,
  estimateRowBudget,
  isExportRange,
  safeTimeZone,
  selectRows,
} from "@/lib/export";

/**
 * GET /api/plants/[id]/export?range=5m|30m|1h&tz=Asia/Jakarta
 *
 * Returns the plant's telemetry for the requested window as a CSV download.
 * Open to any authenticated user — it mirrors the read access the telemetry
 * page already grants to viewers. All CSV shaping lives in @/lib/export.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    const url = new URL(req.url);
    const range = url.searchParams.get("range");
    if (!isExportRange(range)) {
      return NextResponse.json(
        { error: "Invalid range. Use 5m, 30m or 1h." },
        { status: 400 }
      );
    }

    const timeZone = safeTimeZone(url.searchParams.get("tz"));
    const { id } = await context.params;

    const plantSnap = await adminDb.collection("plants").doc(id).get();
    if (!plantSnap.exists) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }
    const plantName = (plantSnap.data()?.name as string) ?? "plant";

    const rangeMs = RANGE_MS[range];
    const now = Date.now();

    const snapshot = await adminRtdb
      .ref(`telemetry/${id}`)
      .orderByKey()
      .limitToLast(estimateRowBudget(rangeMs))
      .once("value");

    const readings: TelemetryReading[] = snapshot.exists()
      ? (Object.values(snapshot.val()) as TelemetryReading[])
      : [];

    const rows = selectRows(readings, now - rangeMs);
    const csv = buildCsv(rows, timeZone);
    const filename = buildFilename(plantName, range, now, timeZone);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        // Read by the client to report how many samples were exported.
        "X-Row-Count": String(rows.length),
        "Access-Control-Expose-Headers": "X-Row-Count",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Telemetry export API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to export telemetry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
