"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./ui";
import { PlantData, getPlantDynamics } from "@/lib/simulator";

// ─── Lambda (IMC) Tuning ────────────────────────────────────────────────────
//
// For a first-order plant  G(s) = K / (τs + 1)  with assumed dead-time L,
// IMC tuning with closed-loop time constant λ gives:
//
//   P  only:  Kp = τ / (K × λ)
//   PI  :     Kp = τ / (K × (λ + L))       Ki = Kp / τ
//   PID :     Kp = (τ + L/2) / (K × (λ + L/2))
//             Ki = Kp / (τ + L/2)          Kd = Kp × (τ × L / (2τ + L))
//
// Dead-time L is approximated as one simulation tick (samplingPeriodMs).
// ────────────────────────────────────────────────────────────────────────────

interface Suggestion {
  label: string;
  lambda: number;
  description: string;
}

const LAMBDA_PRESETS: Suggestion[] = [
  {
    label: "Aggressive",
    lambda: 0.5,
    description:
      "Fast tracking, higher overshoot risk. Good for plants that must respond quickly.",
  },
  {
    label: "Balanced",
    lambda: 1.0,
    description:
      "A solid starting point: reasonable speed with moderate stability margin.",
  },
  {
    label: "Conservative",
    lambda: 2.0,
    description:
      "Slow, robust response. Minimal overshoot — ideal for high-gain or noisy plants.",
  },
];

function computeGains(
  plant: PlantData,
  lambda: number
): { kp: number; ki: number; kd: number } {
  const { gain: K, tau } = getPlantDynamics(plant);
  const L = (plant.samplingPeriodMs ?? 500) / 1000;

  switch (plant.controllerType) {
    case "P": {
      const kp = tau / (K * lambda);
      return { kp, ki: 0, kd: 0 };
    }
    case "PI": {
      const kp = tau / (K * (lambda + L));
      const ki = kp / tau;
      return { kp, ki, kd: 0 };
    }
    case "PID": {
      const tauEff = tau + L / 2;
      const lambdaEff = lambda + L / 2;
      const kp = tauEff / (K * lambdaEff);
      const ki = kp / tauEff;
      const kd = kp * ((tau * L) / (2 * tau + L));
      return { kp, ki, kd };
    }
  }
}

function fmt(n: number): string {
  return parseFloat(n.toPrecision(4)).toString();
}

function GainChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-white/70 border border-slate-200 px-1 py-2 min-w-0 overflow-hidden">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span className="mt-0.5 text-xs font-mono font-bold text-slate-800 break-all text-center leading-tight">
        {value}
      </span>
    </div>
  );
}

function PresetCard({ preset, plant }: { preset: Suggestion; plant: PlantData }) {
  const { kp, ki, kd } = computeGains(plant, preset.lambda);

  const accentMap: Record<string, string> = {
    Aggressive: "border-rose-200 bg-rose-50",
    Balanced: "border-emerald-200 bg-emerald-50",
    Conservative: "border-blue-200 bg-blue-50",
  };
  const badgeMap: Record<string, string> = {
    Aggressive: "bg-rose-100 text-rose-700",
    Balanced: "bg-emerald-100 text-emerald-700",
    Conservative: "bg-blue-100 text-blue-700",
  };

  return (
    <div className={`rounded-xl border-2 p-4 space-y-3 ${accentMap[preset.label]}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-800">{preset.label}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeMap[preset.label]}`}>
          λ = {preset.lambda} s
        </span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{preset.description}</p>
      <div className="grid grid-cols-3 gap-2">
        <GainChip label="Kp" value={fmt(kp)} />
        {plant.controllerType !== "P" && <GainChip label="Ki" value={fmt(ki)} />}
        {plant.controllerType === "PID" && <GainChip label="Kd" value={fmt(kd)} />}
      </div>
    </div>
  );
}

export function TuningAdvisor({ plant }: { plant: PlantData }) {
  const [open, setOpen] = useState(false);
  const { gain: K, tau } = getPlantDynamics(plant);
  const L = (plant.samplingPeriodMs ?? 500) / 1000;
  const ctrlLabel = plant.controllerType;

  return (
    <>
      <Button type="button" variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        {ctrlLabel} Tuning Advisor
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${ctrlLabel} Tuning Advisor — ${plant.name}`}
        description="Optimised parameter suggestions using IMC / Lambda tuning. Read-only — your plant is not changed."
        size="lg"
        footer={<Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>}
      >
        <div className="space-y-5">
          {/* How it works */}
          <section className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              How IMC / Lambda tuning works
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your plant is modelled as a <strong>first-order system</strong>{" "}
              <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">G(s) = K / (τs + 1)</code>.
              IMC tuning maps this model to a desired closed-loop speed, controlled by{" "}
              <strong>λ (lambda)</strong> — the desired closed-loop time constant in seconds.
              Smaller λ = faster but more aggressive; larger λ = slower and more robust.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white border border-slate-200 p-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Plant Gain K</p>
                <p className="font-mono font-bold text-slate-800">{K}</p>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 p-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Time Const. τ</p>
                <p className="font-mono font-bold text-slate-800">{tau} s</p>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 p-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Est. Dead-time L</p>
                <p className="font-mono font-bold text-slate-800">{L} s</p>
              </div>
            </div>
          </section>

          {/* Formulas */}
          <section className="space-y-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Formulas applied
            </h4>
            <div className="rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs p-4 space-y-1 leading-relaxed">
              {plant.controllerType === "P" && <p>Kp = τ / (K × λ)</p>}
              {plant.controllerType === "PI" && (
                <>
                  <p>Kp = τ / (K × (λ + L))</p>
                  <p>Ki = Kp / τ</p>
                </>
              )}
              {plant.controllerType === "PID" && (
                <>
                  <p>Kp = (τ + L/2) / (K × (λ + L/2))</p>
                  <p>Ki = Kp / (τ + L/2)</p>
                  <p>Kd = Kp × (τ × L / (2τ + L))</p>
                </>
              )}
            </div>
          </section>

          {/* Preset cards */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Optimised parameters
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {LAMBDA_PRESETS.map((preset) => (
                <PresetCard key={preset.label} preset={preset} plant={plant} />
              ))}
            </div>
          </section>

          {/* Tip */}
          <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
            <strong className="text-slate-500">Tip:</strong> Start with the{" "}
            <strong>Balanced</strong> preset and adjust λ manually if you need faster response
            (decrease) or less overshoot (increase). For the DC Motor&apos;s high gain (K = {K}),
            the Conservative preset is usually the safest first choice.
          </p>
        </div>
      </Modal>
    </>
  );
}
