export type PlantType = "DC_MOTOR" | "WATER_TANK" | "TEMPERATURE" | "CUSTOM";
export type ControllerType = "PID" | "PI" | "P";
export type PlantStatus = "STOPPED" | "RUNNING" | "FAULT";

export interface PlantData {
  id: string;
  name: string;
  type: PlantType;
  controllerType: ControllerType;
  kp: number;
  ki: number;
  kd: number;
  setpoint: number;
  samplingPeriodMs: number;
  outputMin: number;
  outputMax: number;
  // First-order transfer function dynamics, only used when type === "CUSTOM".
  // Optional so legacy plants created before this feature stay valid.
  transferGain?: number;
  timeConstantTau?: number;
  // Conditional-integration anti-windup for PI/PID controllers. Optional so
  // legacy plants default to the original behavior (no anti-windup).
  antiWindup?: boolean;
  status: PlantStatus;
  stepStartAt?: number | null;
  stepStartSetpoint?: number | null;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface TelemetryReading {
  timestamp: number;
  processVariable: number;
  controlOutput: number;
  error: number;
  setpoint: number;
  // Full controller state persisted with every reading so any ticker instance
  // (multiple laptops/tabs/serverless workers) can continue the simulation
  // seamlessly from the last stored reading.
  integral: number;
  prevError: number;
}

interface PlantSimState {
  pv: number;
  integral: number;
  prevError: number;
}

/**
 * Returns the first-order dynamics (gain and time constant in seconds) for a
 * plant. Single source of truth shared by the time-domain simulator and the
 * frequency-domain Bode plot math, so both always use identical parameters.
 */
export function getPlantDynamics(plant: PlantData): { gain: number; tau: number } {
  switch (plant.type) {
    case "DC_MOTOR":
      return { gain: 14, tau: 2.0 }; // u=100% -> PV steady state = 1400, headroom above the seed setpoint 1200
    case "WATER_TANK":
      return { gain: 0.8, tau: 4.0 }; // Medium slow response
    case "TEMPERATURE":
      return { gain: 2.0, tau: 10.0 }; // Slow response
    case "CUSTOM":
      // User-defined first-order dynamics: G(s) = transferGain / (timeConstantTau*s + 1)
      return {
        gain: plant.transferGain && plant.transferGain > 0 ? plant.transferGain : 1.0,
        tau: plant.timeConstantTau && plant.timeConstantTau > 0 ? plant.timeConstantTau : 1.0,
      };
  }
}

export class PlantSimulator {
  /**
   * Calculates next simulation step for a plant.
   * Model: First-order differential equation: y[k+1] = y[k] + dt * (gain * u[k] - y[k]) / tau
   *
   * Stateless by design: the full controller state (pv, integral, prevError) is
   * rebuilt from the last persisted reading on every call, so concurrent ticker
   * instances can never diverge from each other.
   */
  static simulateStep(
    plant: PlantData,
    lastReading?: TelemetryReading | null,
    dtSeconds: number = 0.5
  ): TelemetryReading {
    // Seed the full simulation state from the last persisted reading.
    // Legacy readings (pre state-persistence) fall back to zeroed integrators.
    const state: PlantSimState = {
      pv: lastReading ? lastReading.processVariable : 0,
      integral: lastReading?.integral ?? 0,
      prevError: lastReading?.prevError ?? 0,
    };

    if (plant.status !== "RUNNING") {
      const pv = plant.status === "STOPPED" ? state.pv : 0;
      return {
        timestamp: Date.now(),
        processVariable: pv,
        controlOutput: 0,
        error: plant.setpoint - pv,
        setpoint: plant.setpoint,
        integral: state.integral,
        prevError: state.prevError,
      };
    } // Kalo plant tidak running, kembalikan nilai terakhir tanpa mengubah state

    // Plant specific physical dynamics parameters (shared with the Bode plot math)
    const { gain, tau } = getPlantDynamics(plant);

    const setpoint = plant.setpoint;
    const error = setpoint - state.pv;

    // Controller output calculation (P, PI, PID)
    const pTerm = plant.kp * error; // Kontrol Proportional: Seberapa besar error saat ini dikali kp (diset admin saat pembuatan plant)
    let iTerm = 0;
    let dTerm = 0;

    if (plant.controllerType === "PI" || plant.controllerType === "PID") {
      if (plant.antiWindup) {
        // Anti-windup path: compute iTerm from the integral accumulated so far
        // and defer this step's accumulation until the clamped output is known.
        iTerm = plant.ki * state.integral;
      } else {
        state.integral += error * dtSeconds;
        iTerm = plant.ki * state.integral;
      }
    } // Kontrol Integral: Menjumlahkan error dari waktu ke waktu dikali ki (diset admin saat pembuatan plant)
    // Hanya untuk Kontroler jenis PI dan PID

    if (plant.controllerType === "PID") {
      const derivative = (error - state.prevError) / (dtSeconds || 0.001);
      dTerm = plant.kd * derivative; // Kontrol Derivatif: Menghitung laju perubahan error dikali kd (diset admin saat pembuatan plant)
    } // Hanya untuk Kontroler jenis PID

    state.prevError = error; // Menyimpan error saat ini untuk perhitungan derivative pada step selanjutnya

    const rawOutput = pTerm + iTerm + dTerm; // Output akhir dari kontroller (P + I + D)
    // Saturation / Output clamping
    const controlOutput = Math.max(plant.outputMin, Math.min(plant.outputMax, rawOutput)); // Membatasi output kontroller agar tidak melebihi nilai minimum dan maksimum yang telah ditentukan (clamping/saturation)

    // Anti-windup (conditional integration): accumulate the integral only when
    // the error pushes the output away from a saturated limit. While the output
    // is pinned at a limit, the integral stops growing so it unwinds quickly
    // once the error reverses.
    const hasIntegralTerm = plant.controllerType === "PI" || plant.controllerType === "PID";
    if (plant.antiWindup && hasIntegralTerm) {
      const pushingAgainstHigh = error > 0 && rawOutput >= plant.outputMax;
      const pushingAgainstLow = error < 0 && rawOutput <= plant.outputMin;
      if (!pushingAgainstHigh && !pushingAgainstLow) {
        state.integral += error * dtSeconds;
      }
    }

    // Plant process response calculation
    const dpv = (dtSeconds * (gain * controlOutput - state.pv)) / tau; // Menghitung perubahan nilai PV pada step selanjutnya
    state.pv += dpv; // Menambahkan perubahan nilai PV ke nilai PV sebelumnya

    // Small measurement noise simulating physical sensors
    const noise = (Math.random() - 0.5) * 0.05; // Menambahkan noise pada nilai PV (simulasi sensor)
    const noisyPv = Math.max(0, state.pv + noise); // Menambahkan noise pada nilai PV (simulasi sensor)

    return {
      timestamp: Date.now(),
      processVariable: Number(noisyPv.toFixed(3)),
      controlOutput: Number(controlOutput.toFixed(3)),
      error: Number((setpoint - noisyPv).toFixed(3)),
      setpoint: setpoint,
      integral: state.integral,
      prevError: state.prevError,
    };
  }
}
