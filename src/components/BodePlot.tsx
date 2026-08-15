"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { PlantData, getPlantDynamics } from "@/lib/simulator";
import {
  BODE_MAX_FREQ,
  BODE_MIN_FREQ,
  computeBode,
  computeClosedLoopMetrics,
  computeMargins,
} from "@/lib/bode";
import { Card, Segmented, StatCard } from "@/components/ui";

type BodeMode = "open" | "closed";

const MAG_COLOR = "rgb(37, 99, 235)";
const PHASE_COLOR = "rgb(147, 51, 234)";
const REF_COLOR = "rgba(100, 116, 139, 0.5)";

export default function BodePlot({ plant }: { plant: PlantData }) {
  const [mode, setMode] = useState<BodeMode>("open");

  const magRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<HTMLDivElement>(null);

  // Recomputes on every plant snapshot, so live PID tuning updates the curves.
  const { points, margins, closedMetrics, cornerFreq } = useMemo(() => {
    const { tau } = getPlantDynamics(plant);
    return {
      points: computeBode(plant),
      margins: computeMargins(plant),
      closedMetrics: computeClosedLoopMetrics(plant),
      cornerFreq: 1 / tau,
    };
  }, [plant]);

  useEffect(() => {
    if (!magRef.current || !phaseRef.current) return;

    const freqs = points.map((p) => p.frequency);
    const magY = points.map((p) =>
      mode === "open" ? p.openLoopMagDb : p.closedLoopMagDb
    );
    const phaseY = points.map((p) =>
      mode === "open" ? p.openLoopPhaseDeg : p.closedLoopPhaseDeg
    );
    const zeroRef = freqs.map(() => 0);
    const minus180Ref = freqs.map(() => -180);

    const width = magRef.current.clientWidth || 600;
    const xRange: uPlot.Scale.Range = [BODE_MIN_FREQ, BODE_MAX_FREQ];
    const yPad: uPlot.Scale.Range = (_u, min, max) => {
      const pad = (max - min) * 0.1 || 1;
      return [min - pad, max + pad];
    };
    // uPlot formats the x scale as dates by default; explicit numeric labels
    // keep frequencies from rendering as 1970 timestamps. Splits can contain
    // nulls during the first layout pass, so skip those entries.
    const freqTicks: uPlot.Axis.Values = (_u, splits) =>
      splits.map((v) => (v == null ? "" : Number(v.toPrecision(3)).toString()));

    const magAxes: uPlot.Axis[] = [
      { scale: "x", label: "Frequency [rad/s]", grid: { show: true }, values: freqTicks },
      { scale: "y", label: "Magnitude [dB]", grid: { show: true } },
    ];
    const phaseAxes: uPlot.Axis[] = [
      { scale: "x", label: "Frequency [rad/s]", grid: { show: true }, values: freqTicks },
      { scale: "y", label: "Phase [deg]", grid: { show: true } },
    ];
    const magSeries: uPlot.Series[] = [
      {},
      {
        label: mode === "open" ? "Open Loop L(j\u03c9)" : "Closed Loop T(j\u03c9)",
        stroke: MAG_COLOR,
        width: 2,
      },
      {
        label: "0 dB",
        stroke: REF_COLOR,
        width: 1,
        dash: [6, 4],
        points: { show: false },
      },
    ];
    const phaseSeries: uPlot.Series[] = [
      {},
      {
        label: mode === "open" ? "Open Loop L(j\u03c9)" : "Closed Loop T(j\u03c9)",
        stroke: PHASE_COLOR,
        width: 2,
      },
      ...(mode === "open"
        ? [
            {
              label: "-180\u00b0",
              stroke: REF_COLOR,
              width: 1,
              dash: [6, 4],
              points: { show: false },
            },
          ]
        : []),
    ];

    const magPlot = new uPlot(
      {
        width,
        height: 260,
        legend: { show: false },
        cursor: { sync: { key: "bode", scales: ["x", null] } },
        scales: { x: { time: false, distr: 3, range: xRange }, y: { range: yPad } },
        axes: magAxes,
        series: magSeries,
      },
      [freqs, magY, zeroRef],
      magRef.current
    );

    const phasePlot = new uPlot(
      {
        width,
        height: 240,
        legend: { show: false },
        cursor: { sync: { key: "bode", scales: ["x", null] } },
        scales: { x: { time: false, distr: 3, range: xRange }, y: { range: yPad } },
        axes: phaseAxes,
        series: phaseSeries,
      },
      mode === "open" ? [freqs, phaseY, minus180Ref] : [freqs, phaseY],
      phaseRef.current
    );

    const handleResize = () => {
      const w = magRef.current?.clientWidth;
      if (w) {
        magPlot.setSize({ width: w, height: 260 });
        phasePlot.setSize({ width: w, height: 240 });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      magPlot.destroy();
      phasePlot.destroy();
    };
  }, [mode, points]);

  const pm = margins.phaseMarginDeg;
  const gm = margins.gainMarginDb;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Bode Plot</h2>
          <p className="text-xs text-slate-500">
            Frequency response of the loop · corner frequency 1/τ ={" "}
            {cornerFreq.toFixed(2)} rad/s
          </p>
        </div>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "open", label: "Open Loop L(s)" },
            { value: "closed", label: "Closed Loop T(s)" },
          ]}
        />
      </div>

      {mode === "open" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Phase Margin"
            tone="blue"
            value={pm != null ? `${pm.toFixed(1)}\u00b0` : "\u221e"}
          />
          <StatCard
            label="Gain Margin"
            tone="purple"
            value={gm != null ? `${gm.toFixed(1)} dB` : "\u221e"}
          />
          <StatCard
            label="0 dB Crossover"
            tone="green"
            value={
              margins.phaseMarginFreq != null
                ? `${margins.phaseMarginFreq.toFixed(3)} rad/s`
                : "\u2014"
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Bandwidth (-3 dB)"
            tone="blue"
            value={
              closedMetrics.bandwidthRadPerSec != null
                ? `${closedMetrics.bandwidthRadPerSec.toFixed(3)} rad/s`
                : "\u2014"
            }
          />
          <StatCard
            label="Resonance Peak"
            tone="purple"
            value={
              closedMetrics.resonancePeakDb > 0.05
                ? `${closedMetrics.resonancePeakDb.toFixed(1)} dB @ ${closedMetrics.resonanceFreq?.toFixed(3)} rad/s`
                : "None"
            }
          />
        </div>
      )}

      <div ref={magRef} className="w-full" />
      <div ref={phaseRef} className="w-full" />

      <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        {mode === "open" ? (
          <>
            <p>
              <span className="font-semibold text-slate-700">What this shows:</span>{" "}
              the Bode plot is the frequency response of the open loop{" "}
              <span className="font-mono">L(s) = C(s)·G(s)</span> — controller
              times plant. The top panel is magnitude (dB), the bottom is phase
              shift (degrees), both against frequency on a log scale. The
              plant&apos;s magnitude starts rolling off at the corner frequency
              1/τ = {cornerFreq.toFixed(2)} rad/s.
            </p>
            <p>
              <span className="font-semibold text-slate-700">
                Stability margins:
              </span>{" "}
              the phase margin is how much extra phase lag the loop could
              tolerate before becoming unstable — good loops sit above 45°. The
              gain margin is how much extra gain it could take — typically 6–10
              dB or more. An &ldquo;∞&rdquo; means the curve never reaches the
              reference, so that limit is not what threatens this loop.
            </p>
          </>
        ) : (
          <>
            <p>
              <span className="font-semibold text-slate-700">What this shows:</span>{" "}
              the closed loop{" "}
              <span className="font-mono">T(s) = L/(1+L)</span> is what the
              feedback system actually does: how the measured output responds
              to the setpoint at each frequency. Where the magnitude sits at
              0 dB, the loop tracks perfectly; where it drops, the loop can no
              longer follow fast changes.
            </p>
            <p>
              <span className="font-semibold text-slate-700">Reading it:</span>{" "}
              the bandwidth is the frequency where the response falls 3 dB
              below its low-frequency value — roughly the fastest signal the
              loop can track. A resonance peak (a bump above 0 dB) means the
              loop amplifies frequencies near it, which usually shows up as
              overshoot in the step response.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
