/**
 * Time helpers for displaying plant timestamps.
 *
 * Firestore timestamps in this project are inconsistent by design history:
 * `createdAt` is always a numeric epoch (Date.now()), while `updatedAt` may be
 * either a number or a Firestore Timestamp (serverTimestamp()). `toMillis`
 * normalises all of those shapes so the UI never renders "Invalid Date".
 */

type TimestampLike =
  | number
  | string
  | Date
  | { toMillis: () => number }
  | { seconds: number; nanoseconds?: number }
  | null
  | undefined;

export function toMillis(value: TimestampLike): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  if (typeof value === "object") {
    if ("toMillis" in value && typeof value.toMillis === "function") {
      return value.toMillis();
    }
    if ("seconds" in value && typeof value.seconds === "number") {
      return value.seconds * 1000;
    }
  }

  return null;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "just now" / "5 minutes ago" / "3 hours ago" / "2 days ago".
 * Falls back to an absolute date once the value is older than 30 days,
 * because "412 days ago" is harder to read than "13 Aug 2026".
 */
export function formatRelativeTime(value: TimestampLike): string {
  const ms = toMillis(value);
  if (ms === null) return "unknown";

  const diff = Date.now() - ms;

  // Clock skew between client and server can produce a small negative diff.
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (diff < 30 * DAY) {
    const d = Math.floor(diff / DAY);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }

  return formatAbsoluteTime(value);
}

export function formatAbsoluteTime(value: TimestampLike): string {
  const ms = toMillis(value);
  if (ms === null) return "unknown";

  return new Date(ms).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
