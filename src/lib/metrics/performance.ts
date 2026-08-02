import { TelemetryReading } from "@/lib/simulator";

export interface PerformanceMetrics {
  riseTimeMs: number | null;
  overshootPercent: number | null;
  settlingTimeMs: number | null;
  message?: string;
}

export function calculatePerformanceMetrics(
  readings: TelemetryReading[],
  stepStartAt: number,
  setpoint: number
): PerformanceMetrics {
  const filtered = readings
    .filter((r) => r.timestamp >= stepStartAt)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (filtered.length < 5) {
    return {
      riseTimeMs: null,
      overshootPercent: null,
      settlingTimeMs: null,
      message: "Insufficient telemetry data since step start (requires at least 5 readings).",
    };
  }

  const initialPV = filtered[0].processVariable;
  const deltaTarget = setpoint - initialPV;
  
  if (Math.abs(deltaTarget) < 0.001) {
    return {
      riseTimeMs: 0,
      overshootPercent: 0,
      settlingTimeMs: 0,
    };
  }

  // 1. Rise Time: time to reach 90% of the way from initialPV to setpoint
  const target90 = initialPV + 0.9 * deltaTarget;
  let riseTimeMs: number | null = null;

  for (const r of filtered) {
    if (deltaTarget > 0 ? r.processVariable >= target90 : r.processVariable <= target90) {
      riseTimeMs = r.timestamp - stepStartAt;
      break;
    }
  }

  // 2. Overshoot Percentage: (peakPV - setpoint) / setpoint * 100
  let overshootPercent: number = 0;
  if (deltaTarget > 0) {
    const maxPV = Math.max(...filtered.map((r) => r.processVariable));
    if (maxPV > setpoint && setpoint !== 0) {
      overshootPercent = ((maxPV - setpoint) / Math.abs(setpoint)) * 100;
    }
  } else {
    const minPV = Math.min(...filtered.map((r) => r.processVariable));
    if (minPV < setpoint && setpoint !== 0) {
      overshootPercent = ((setpoint - minPV) / Math.abs(setpoint)) * 100;
    }
  }

  // 3. Settling Time: time until processVariable enters and stays within ±5% of setpoint
  const band = 0.05 * Math.abs(setpoint || 1);
  let settlingTimeMs: number | null = null;

  for (let i = 0; i < filtered.length; i++) {
    let staysInBand = true;
    for (let j = i; j < filtered.length; j++) {
      if (Math.abs(filtered[j].processVariable - setpoint) > band) {
        staysInBand = false;
        break;
      }
    }
    if (staysInBand) {
      settlingTimeMs = filtered[i].timestamp - stepStartAt;
      break;
    }
  }

  return {
    riseTimeMs: riseTimeMs !== null ? Math.round(riseTimeMs) : null,
    overshootPercent: Number(overshootPercent.toFixed(2)),
    settlingTimeMs: settlingTimeMs !== null ? Math.round(settlingTimeMs) : null,
  };
}
