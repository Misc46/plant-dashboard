"use client";

import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { TelemetryReading } from "@/lib/simulator";

interface UPlotChartProps {
  data: TelemetryReading[];
}

export default function TelemetryChart({ data }: UPlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prep initial timestamps, PV, and Setpoint data arrays
    const timestamps = data.map((d) => d.timestamp / 1000);
    const pvs = data.map((d) => d.processVariable);
    const setpoints = data.map((d) => d.setpoint);
    const outputs = data.map((d) => d.controlOutput);

    const chartData: uPlot.AlignedData = [timestamps, pvs, setpoints, outputs];

    const opts: uPlot.Options = {
      title: "Real-Time Telemetry Stream (uPlot)",
      width: containerRef.current.clientWidth || 600,
      height: 300,
      series: [
        {},
        {
          label: "Process Variable (PV)",
          stroke: "rgb(37, 99, 235)",
          width: 2,
        },
        {
          label: "Setpoint (SP)",
          stroke: "rgb(220, 38, 38)",
          width: 1.5,
          dash: [5, 5],
        },
        {
          label: "Control Output (u)",
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
  }, [data]);

  return (
    <div className="w-full bg-white p-4 rounded border border-gray-200 shadow-sm overflow-hidden">
      <div ref={containerRef} className="w-full"></div>
    </div>
  );
}
