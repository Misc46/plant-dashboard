"use client";

import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { TelemetryReading } from "@/lib/simulator";

interface UPlotChartProps {
  data: TelemetryReading[];
  unit?: string;
}

export default function TelemetryChart({ data, unit }: UPlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Filter out duplicate timestamps and sort chronologically for strict uPlot monotonicity
    const uniqueMap = new Map<number, TelemetryReading>();
    for (const d of data) {
      const secKey = Math.floor(d.timestamp / 1000);
      // Keep latest sample if duplicate second timestamp
      uniqueMap.set(secKey, d);
    }
    const sortedData = Array.from(uniqueMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    // Prep initial timestamps, PV, and Setpoint data arrays
    const timestamps = sortedData.map((d) => d.timestamp / 1000);
    const pvs = sortedData.map((d) => d.processVariable);
    const setpoints = sortedData.map((d) => d.setpoint);
    const outputs = sortedData.map((d) => d.controlOutput);

    const chartData: uPlot.AlignedData = [timestamps, pvs, setpoints, outputs];

    const opts: uPlot.Options = {
      title: "Real-Time Telemetry Stream (uPlot)",
      width: containerRef.current.clientWidth || 600,
      height: 300,
      series: [
        {},
        {
          label: unit ? `PV (${unit})` : "PV",
          stroke: "rgb(37, 99, 235)",
          width: 2,
        },
        {
          label: unit ? `SP (${unit})` : "SP",
          stroke: "rgb(220, 38, 38)",
          width: 1.5,
          dash: [5, 5],
        },
        {
          label: "Output (%)",
          stroke: "rgb(147, 51, 234)",
          width: 1.5,
        },
      ],
      scales: {
        x: { time: true },
      },
      axes: [
        { scale: "x", grid: { show: true } },
        { scale: "y", grid: { show: true } },
      ],
    };

    if (!chartRef.current) {
      chartRef.current = new uPlot(opts, chartData, containerRef.current);
    } else {
      chartRef.current.setData(chartData);
    }

    const handleResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.setSize({
          width: containerRef.current.clientWidth,
          height: 300,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, unit]);

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Live Telemetry</h2>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-mono text-blue-600">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: "rgb(37, 99, 235)" }}
            />
            {unit ? `PV (${unit})` : "PV"}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-mono text-red-600">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: "rgb(220, 38, 38)" }}
            />
            {unit ? `SP (${unit})` : "SP"}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-mono text-purple-600">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: "rgb(147, 51, 234)" }}
            />
            Output
          </span>
        </div>
      </div>
      <div ref={containerRef} className="w-full"></div>
    </div>
  );
}
