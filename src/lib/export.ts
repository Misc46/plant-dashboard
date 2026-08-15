/**
 * Shared definitions and pure helpers for the telemetry CSV export.
 * Imported by both the API route (server) and the export menu (client), so the
 * range keys can never drift apart between the two. Nothing here touches
 * Firebase, which keeps it testable on its own.
 */

import type { TelemetryReading } from "@/lib/simulator";

export type ExportRange = "5m" | "30m" | "1h";

export const EXPORT_RANGES: {
  value: ExportRange;
  label: string;
  ms: number;
}[] = [
  { value: "5m", label: "Last 5 minutes", ms: 5 * 60_000 },
  { value: "30m", label: "Last 30 minutes", ms: 30 * 60_000 },
  { value: "1h", label: "Last 1 hour", ms: 60 * 60_000 },
];

export const RANGE_MS: Record<ExportRange, number> = {
  "5m": 5 * 60_000,
  "30m": 30 * 60_000,
  "1h": 60 * 60_000,
};

export function isExportRange(value: unknown): value is ExportRange {
  return value === "5m" || value === "30m" || value === "1h";
}

/** "DC Motor Speed Loop" -> "dc-motor-speed-loop" (safe for a filename). */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "plant"
  );
}

/* ------------------------------- CSV dialect ------------------------------ */

/**
 * The dashboard is used on Windows with Indonesian regional settings, where
 * Excel splits columns on ";" and reads "," as the decimal separator. Flip both
 * constants together for the international dialect (pandas, R, Sheets).
 */
export const DELIMITER = ";";
export const DECIMAL_COMMA = true;

export const CSV_HEADER = [
  "Waktu",
  "Setpoint",
  "Process Variable",
  "Control Output",
  "Error",
];

export function formatNumber(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  const text = String(value);
  return DECIMAL_COMMA ? text.replace(".", ",") : text;
}

/** "2026-08-13 21:05:03" rendered in the requested IANA time zone. */
export function formatLocal(ms: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  // Some runtimes emit "24" instead of "00" for midnight.
  const hour = get("hour") === "24" ? "00" : get("hour");

  return `"${get("year")}-${get("month")}-${get("day")} ${hour}:${get(
    "minute"
  )}:${get("second")}"`;
}

/** Falls back to UTC for a missing or unknown zone, never the server's own. */
export function safeTimeZone(value: string | null | undefined): string {
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}

/**
 * Keeps only the samples inside the window and sorts them oldest-first.
 * If the plant ran for 5 minutes and an hour was requested, the result holds
 * those 5 minutes — no padding rows are invented for the idle time.
 */
export function selectRows(
  readings: TelemetryReading[],
  cutoff: number
): TelemetryReading[] {
  return readings
    .filter((r) => typeof r?.timestamp === "number" && r.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Builds the CSV text. The leading U+FEFF makes Excel read it as UTF-8 and
 * CRLF is the line ending Excel expects on Windows.
 */
export function buildCsv(
  rows: TelemetryReading[],
  timeZone: string
): string {
  const header = CSV_HEADER.join(DELIMITER);
  const body = rows.map((r) =>
    [
      formatLocal(r.timestamp, timeZone),
      formatNumber(r.setpoint),
      formatNumber(r.processVariable),
      formatNumber(r.controlOutput),
      formatNumber(r.error),
    ].join(DELIMITER)
  );

  return "﻿" + [header, ...body].join("\r\n") + "\r\n";
}

export function buildFilename(
  plantName: string,
  range: ExportRange,
  nowMs: number,
  timeZone: string
): string {
  // "2026-08-13 21:05:03" -> "20260813-210503"
  const stamp = formatLocal(nowMs, timeZone)
    .replace(/[-:]/g, "")
    .replace(" ", "-");
  return `${slugify(plantName)}-telemetry-${range}-${stamp}.csv`;
}

/**
 * The dashboard ticks every 2 s, but several open tabs each drive their own
 * ticker, so the real sample rate can be a multiple of that. Over-fetch by 4x
 * plus a fixed margin, then filter by timestamp — cheaper and more robust than
 * an orderByChild query, which would need an .indexOn rule on telemetry.
 */
export function estimateRowBudget(rangeMs: number): number {
  return Math.min(20_000, Math.ceil(rangeMs / 2_000) * 4 + 200);
}
