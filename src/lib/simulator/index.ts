export type PlantType = "DC_MOTOR" | "WATER_TANK" | "TEMPERATURE";
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
  status: PlantStatus;
  connectionMode?: "SIMULATED" | "ESP";
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
}

interface PlantSimState {
  pv: number;
  integral: number;
  prevError: number;
}

// Memory cache for simulator state per plant during execution
const simStateMap = new Map<string, PlantSimState>();

export class PlantSimulator {
  /**
   * Calculates next simulation step for a plant.
   * Model: First-order differential equation: y[k+1] = y[k] + dt * (gain * u[k] - y[k]) / tau
   */
  static simulateStep(
    plant: PlantData,
    lastReading?: TelemetryReading | null,
    dtSeconds: number = 0.5
  ): TelemetryReading {
    let state = simStateMap.get(plant.id);
    if (!state) {
      state = {
        pv: lastReading ? lastReading.processVariable : 0,
        integral: 0,
        prevError: 0,
      };
      simStateMap.set(plant.id, state);
    }

    if (plant.status !== "RUNNING") {
      const pv = plant.status === "STOPPED" ? state.pv : 0;
      return {
        timestamp: Date.now(),
        processVariable: pv,
        controlOutput: 0,
        error: plant.setpoint - pv,
        setpoint: plant.setpoint,
      };
    }

    // Plant specific physical dynamics parameters
    let gain = 1.0;
    let tau = 1.0; // Time constant in seconds

    switch (plant.type) {
      case "DC_MOTOR":
        gain = 14; // u=100% -> PV steady state = 1400, headroom above the seed setpoint 1200
        tau = 2.0; // Fast response
        break;
      case "WATER_TANK":
        gain = 0.8;
        tau = 4.0; // Medium slow response
        break;
      case "TEMPERATURE":
        gain = 2.0;
        tau = 10.0; // Slow response
        break;
    }

    const setpoint = plant.setpoint;
    const error = setpoint - state.pv;

    // Controller output calculation (P, PI, PID)
    const pTerm = plant.kp * error;
    let iTerm = 0;
    let dTerm = 0;

    if (plant.controllerType === "PI" || plant.controllerType === "PID") {
      state.integral += error * dtSeconds;
      iTerm = plant.ki * state.integral;
    }

    if (plant.controllerType === "PID") {
      const derivative = (error - state.prevError) / (dtSeconds || 0.001);
      dTerm = plant.kd * derivative;
    }

    state.prevError = error;

    const rawOutput = pTerm + iTerm + dTerm;
    // Saturation / Output clamping
    const controlOutput = Math.max(plant.outputMin, Math.min(plant.outputMax, rawOutput));

    // Plant process response calculation
    const dpv = (dtSeconds * (gain * controlOutput - state.pv)) / tau;
    state.pv += dpv;

    // Small measurement noise simulating physical sensors
    const noise = (Math.random() - 0.5) * 0.05;
    const noisyPv = Math.max(0, state.pv + noise);

    return {
      timestamp: Date.now(),
      processVariable: Number(noisyPv.toFixed(3)),
      controlOutput: Number(controlOutput.toFixed(3)),
      error: Number((setpoint - noisyPv).toFixed(3)),
      setpoint: setpoint,
    };
  }

  static resetState(plantId: string) {
    simStateMap.delete(plantId);
  }
}
