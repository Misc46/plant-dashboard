"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PlantData, getPlantUnit } from "@/lib/simulator";
import { Badge, StatusBadge } from "@/components/ui";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/time";

/* ------------------------------ Card actions ------------------------------ */

function GearMenu({
  onProperties,
  onDelete,
  plantName,
}: {
  onProperties: () => void;
  onDelete: () => void;
  plantName: string;
}) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={containerRef} className="pointer-events-auto relative">
      <button
        type="button"
        aria-label={`Settings for ${plantName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          // The whole card is a link; keep the click from bubbling to it.
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              onProperties();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4 text-slate-400"
            >
              <path d="M13.5 3.5l3 3L7 16H4v-3z" />
            </svg>
            Properties
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M4 6h12M8 6V4h4v2M6 6l.7 9.3A1 1 0 0 0 7.7 16h4.6a1 1 0 0 0 1-.7L14 6" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- PlantCard ------------------------------- */

export function PlantCard({
  plant,
  isAdmin,
  onProperties,
  onDelete,
}: {
  plant: PlantData;
  isAdmin: boolean;
  onProperties: (plant: PlantData) => void;
  onDelete: (plant: PlantData) => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/30">
      {/* Stretched link: the whole card opens telemetry. Sits below the
          action row so the gear button stays clickable. */}
      <Link
        href={`/dashboard/plants/${plant.id}`}
        aria-label={`Inspect telemetry for ${plant.name}`}
        className="absolute inset-0 z-10 rounded-xl focus:outline-none"
      />

      {/* Action row — always visible; the label gains emphasis on hover */}
      <div className="pointer-events-none relative z-20 mb-3 flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">
          Inspect Telemetry &rarr;
        </span>

        {isAdmin && (
          <GearMenu
            plantName={plant.name}
            onProperties={() => onProperties(plant)}
            onDelete={() => onDelete(plant)}
          />
        )}
      </div>

      {/* Specs first */}
      <div className="pointer-events-none relative z-0 mb-4 space-y-1 rounded-lg bg-slate-50 p-3 font-mono text-xs tabular-nums">
        <p>
          <span className="text-slate-400">SP</span>{" "}
          <span className="font-medium text-slate-700">
            {plant.setpoint} {getPlantUnit(plant)}
          </span>
        </p>
        <p className="text-slate-700">
          Kp {plant.kp} · Ki {plant.ki} · Kd {plant.kd}
        </p>
        <p className="text-slate-700">
          Output {plant.outputMin} – {plant.outputMax}
        </p>
      </div>

      {/* Identity + status at the bottom */}
      <div className="pointer-events-none relative z-0 mt-auto">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-slate-900">{plant.name}</h3>
          <StatusBadge
            status={
              plant.connectionMode === "ESP" && plant.status === "STOPPED"
                ? "OFFLINE"
                : plant.status
            }
          />
        </div>

        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
          <Badge tone="blue">{plant.type}</Badge>
          <span aria-hidden="true">·</span>
          <span className="truncate">{plant.controllerType}</span>
          <span aria-hidden="true">·</span>
          <Badge tone={plant.connectionMode === "ESP" ? "purple" : "gray"}>
            {plant.connectionMode === "ESP" ? "ESP" : "Simulated"}
          </Badge>
        </p>

        <p
          className="mt-1.5 text-xs text-slate-400"
          title={formatAbsoluteTime(plant.createdAt)}
        >
          Created {formatRelativeTime(plant.createdAt)}
        </p>
      </div>
    </div>
  );
}
