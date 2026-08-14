"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui";
import { EXPORT_RANGES, ExportRange } from "@/lib/export";

/**
 * "Export CSV" button with a range picker. Downloads through the API route so
 * the file is built server-side and the request can carry the ID token; a plain
 * <a href> could not attach the Authorization header.
 */
export function ExportTelemetryMenu({ plantId }: { plantId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportRange | null>(null);
  const [message, setMessage] = useState<{
    tone: "info" | "error";
    text: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleExport = async (range: ExportRange) => {
    if (!user || busy) return;

    setBusy(range);
    setMessage(null);

    try {
      const idToken = await user.getIdToken();
      // The browser's own zone, so the timestamps read the same as the clock
      // on the machine that asked for the file — not the server's zone.
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const res = await axios.get(`/api/plants/${plantId}/export`, {
        params: { range, tz },
        headers: { Authorization: `Bearer ${idToken}` },
        responseType: "blob",
      });

      const rowCount = Number(res.headers["x-row-count"] ?? 0);

      // Pull the filename the server chose out of Content-Disposition.
      const disposition = String(res.headers["content-disposition"] ?? "");
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? `telemetry-${range}.csv`;

      const blobUrl = URL.createObjectURL(res.data as Blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Release the object URL; without this the blob stays in memory until
      // the tab is closed.
      URL.revokeObjectURL(blobUrl);

      setOpen(false);
      setMessage({
        tone: rowCount === 0 ? "error" : "info",
        text:
          rowCount === 0
            ? "No telemetry recorded in that window — the file only has its header row."
            : `Exported ${rowCount} sample${rowCount === 1 ? "" : "s"}.`,
      });
    } catch (err) {
      // The response body is a Blob because of responseType: "blob", so the
      // JSON error from the server has to be read back out of it.
      let text = "Export failed.";
      if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
        try {
          const parsed = JSON.parse(await err.response.data.text());
          text = parsed.error ?? text;
        } catch {
          text = err.message;
        }
      } else if (err instanceof Error) {
        text = err.message;
      }
      setMessage({ tone: "error", text });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div ref={containerRef} className="relative">
        <Button
          variant="secondary"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          loading={busy !== null}
        >
          {busy ? "Exporting..." : "Export CSV ▾"}
        </Button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {EXPORT_RANGES.map((range) => (
              <button
                key={range.value}
                type="button"
                role="menuitem"
                disabled={busy !== null}
                onClick={() => handleExport(range.value)}
                className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {message && (
        <p
          className={`text-xs ${
            message.tone === "error" ? "text-red-600" : "text-slate-500"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
