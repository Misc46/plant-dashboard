/**
 * Frequency-response (Bode plot) math for the control loop.
 * Pure functions over PlantData — no Firebase, no UI, no side effects.
 * The plant dynamics come from getPlantDynamics() so the frequency domain
 * always matches the time-domain simulator exactly.
 */
import { PlantData, getPlantDynamics } from "./simulator";

/** A complex number split into real/imaginary parts. */
interface Complex {
  re: number;
  im: number;
}

const cMul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

const cDiv = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / d,
    im: (a.im * b.re - a.re * b.im) / d,
  };
};

/** Plant response G(jw) = K / (1 + j*w*tau). */
function plantResponse(gain: number, tau: number, w: number): Complex {
  return cDiv({ re: gain, im: 0 }, { re: 1, im: w * tau });
}

/** Controller response C(jw) = Kp + Ki/(jw) + Kd*jw, integral/derivative terms dropped for P/PI. */
function controllerResponse(plant: PlantData, w: number): Complex {
  const ki = plant.controllerType === "PI" || plant.controllerType === "PID" ? plant.ki : 0;
  const kd = plant.controllerType === "PID" ? plant.kd : 0;
  return { re: plant.kp, im: kd * w - ki / w };
}

/** Open-loop response L(jw) = C(jw) * G(jw). */
function openLoopResponse(plant: PlantData, w: number): Complex {
  const { gain, tau } = getPlantDynamics(plant);
  return cMul(controllerResponse(plant, w), plantResponse(gain, tau, w));
}

/** Closed-loop response T(jw) = L / (1 + L). */
function closedLoopResponse(plant: PlantData, w: number): Complex {
  const l = openLoopResponse(plant, w);
  return cDiv(l, { re: 1 + l.re, im: l.im });
}

const magnitudeDb = (c: Complex): number =>
  20 * Math.log10(Math.hypot(c.re, c.im) || 1e-12);

const phaseDeg = (c: Complex): number => (Math.atan2(c.im, c.re) * 180) / Math.PI;

export const BODE_MIN_FREQ = 0.001; // rad/s
export const BODE_MAX_FREQ = 1000; // rad/s
export const BODE_POINTS = 200;

/** Log-spaced frequency sweep covering all preset plants' corner frequencies. */
export function bodeFrequencies(): number[] {
  const logMin = Math.log10(BODE_MIN_FREQ);
  const logMax = Math.log10(BODE_MAX_FREQ);
  const freqs: number[] = [];
  for (let i = 0; i < BODE_POINTS; i++) {
    freqs.push(10 ** (logMin + (i / (BODE_POINTS - 1)) * (logMax - logMin)));
  }
  return freqs;
}

export interface BodePoint {
  frequency: number;
  openLoopMagDb: number;
  openLoopPhaseDeg: number;
  closedLoopMagDb: number;
  closedLoopPhaseDeg: number;
}

/** Evaluates open- and closed-loop response over the full frequency sweep. */
export function computeBode(plant: PlantData): BodePoint[] {
  return bodeFrequencies().map((w) => {
    const l = openLoopResponse(plant, w);
    const t = closedLoopResponse(plant, w);
    return {
      frequency: w,
      openLoopMagDb: magnitudeDb(l),
      openLoopPhaseDeg: phaseDeg(l),
      closedLoopMagDb: magnitudeDb(t),
      closedLoopPhaseDeg: phaseDeg(t),
    };
  });
}

/**
 * Finds the frequency where `valueOf` crosses `target` (log-space bisection on
 * the bracketing sweep samples), or null when no crossing exists in range.
 */
function findCrossing(
  freqs: number[],
  valueOf: (w: number) => number,
  target: number
): number | null {
  for (let i = 0; i < freqs.length - 1; i++) {
    const f0 = valueOf(freqs[i]) - target;
    const f1 = valueOf(freqs[i + 1]) - target;
    if (f0 === 0) return freqs[i];
    if (f0 > 0 !== f1 > 0) {
      let lo = freqs[i];
      let hi = freqs[i + 1];
      for (let k = 0; k < 50; k++) {
        const mid = Math.sqrt(lo * hi);
        const fm = valueOf(mid) - target;
        if (fm > 0 === f0 > 0) lo = mid;
        else hi = mid;
      }
      return Math.sqrt(lo * hi);
    }
  }
  return null;
}

export interface StabilityMargins {
  /** Phase margin in degrees, or null when the gain never crosses 0 dB. */
  phaseMarginDeg: number | null;
  /** Frequency of the 0 dB (gain) crossover in rad/s, or null. */
  phaseMarginFreq: number | null;
  /** Gain margin in dB, or null when the phase never reaches -180 deg. */
  gainMarginDb: number | null;
  /** Frequency of the -180 deg crossover in rad/s, or null. */
  gainMarginFreq: number | null;
}

/** Stability margins read off the open-loop Bode plot. */
export function computeMargins(plant: PlantData): StabilityMargins {
  const freqs = bodeFrequencies();
  const magDbAt = (w: number) => magnitudeDb(openLoopResponse(plant, w));
  const phaseAt = (w: number) => phaseDeg(openLoopResponse(plant, w));

  const phaseMarginFreq = findCrossing(freqs, magDbAt, 0);
  const phaseMarginDeg =
    phaseMarginFreq != null ? 180 + phaseAt(phaseMarginFreq) : null;

  const gainMarginFreq = findCrossing(freqs, phaseAt, -180);
  const gainMarginDb = gainMarginFreq != null ? -magDbAt(gainMarginFreq) : null;

  return { phaseMarginDeg, phaseMarginFreq, gainMarginDb, gainMarginFreq };
}

export interface ClosedLoopMetrics {
  /** Frequency where |T| falls 3 dB below its DC value, or null. */
  bandwidthRadPerSec: number | null;
  /** Peak |T| above its DC value in dB (0 when no resonance bump). */
  resonancePeakDb: number;
  /** Frequency of the resonance peak, or null. */
  resonanceFreq: number | null;
}

/** Bandwidth and resonance read off the closed-loop Bode plot. */
export function computeClosedLoopMetrics(plant: PlantData): ClosedLoopMetrics {
  const freqs = bodeFrequencies();
  const magDbAt = (w: number) => magnitudeDb(closedLoopResponse(plant, w));
  const dcDb = magDbAt(freqs[0]);

  let peakDb = 0;
  let peakFreq: number | null = null;
  for (const w of freqs) {
    const aboveDc = magDbAt(w) - dcDb;
    if (aboveDc > peakDb) {
      peakDb = aboveDc;
      peakFreq = w;
    }
  }

  return {
    bandwidthRadPerSec: findCrossing(freqs, magDbAt, dcDb - 3),
    resonancePeakDb: peakDb > 0 ? peakDb : 0,
    resonanceFreq: peakFreq,
  };
}
