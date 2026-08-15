"use client";

import { useEffect, useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { ControllerType, PlantType } from "@/lib/simulator";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  PageLoader,
  Select,
  Toggle,
} from "@/components/ui";

export default function CreatePlantPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState<PlantType>("DC_MOTOR");
  const [controllerType, setControllerType] = useState<ControllerType>("PID");
  // Numeric inputs keep raw string state so users can clear a field and retype
  // (Number() on every keystroke would snap an emptied field back to 0).
  // Parsing to numbers happens once, at submit time.
  const [kp, setKp] = useState("1.2");
  const [ki, setKi] = useState("0.4");
  const [kd, setKd] = useState("0.1");
  const [setpoint, setSetpoint] = useState("100");
  const [samplingPeriodMs] = useState(500);
  const [outputMin, setOutputMin] = useState("0");
  const [outputMax, setOutputMax] = useState("100");
  const [transferGain, setTransferGain] = useState("1");
  const [timeConstantTau, setTimeConstantTau] = useState("2");
  const [antiWindup, setAntiWindup] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side role protection redirect
  useEffect(() => {
    if (!loading && profile && profile.role !== "ADMIN") {
      router.push("/dashboard/plants");
    }
  }, [profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || profile.role !== "ADMIN") return;

    if (
      type === "CUSTOM" &&
      (Number(transferGain) <= 0 || Number(timeConstantTau) <= 0)
    ) {
      setError("Transfer gain (K) and time constant (τ) must be greater than zero.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const now = Date.now();
      const docRef = await addDoc(collection(db, "plants"), {
        name,
        type,
        controllerType,
        kp: Number(kp),
        ki: Number(ki),
        kd: Number(kd),
        setpoint: Number(setpoint),
        samplingPeriodMs: Number(samplingPeriodMs),
        outputMin: Number(outputMin),
        outputMax: Number(outputMax),
        antiWindup,
        ...(type === "CUSTOM"
          ? {
              transferGain: Number(transferGain),
              timeConstantTau: Number(timeConstantTau),
            }
          : {}),
        status: "STOPPED",
        stepStartAt: null,
        stepStartSetpoint: null,
        createdBy: profile.uid,
        createdAt: now,
        updatedAt: now,
      });

      router.push(`/dashboard/plants/${docRef.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create plant";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader text="Checking permissions..." />;
  }

  if (profile?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <PageHeader
          title="Create New Control Plant"
          subtitle="Configure a new simulated control loop"
        />

        {error && (
          <Alert tone="error" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Plant Name">
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DC Motor Speed Loop 1"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Plant Type">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as PlantType)}
              >
                <option value="DC_MOTOR">DC Motor Speed Control</option>
                <option value="WATER_TANK">Water Tank Level Control</option>
                <option value="TEMPERATURE">Temperature Control System</option>
                <option value="CUSTOM">Custom Transfer Function</option>
              </Select>
            </Field>

            <Field label="Controller Type">
              <Select
                value={controllerType}
                onChange={(e) => setControllerType(e.target.value as ControllerType)}
              >
                <option value="PID">PID Controller</option>
                <option value="PI">PI Controller</option>
                <option value="P">P Controller</option>
              </Select>
            </Field>
          </div>

          {type === "CUSTOM" && (
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Transfer Gain (K)"
                hint="G(s) = K / (τ·s + 1) — steady-state gain"
              >
                <Input
                  type="number"
                  step="any"
                  required
                  value={transferGain}
                  onChange={(e) => setTransferGain(e.target.value)}
                />
              </Field>
              <Field
                label="Time Constant (τ, s)"
                hint="Response speed of the first-order model"
              >
                <Input
                  type="number"
                  step="any"
                  required
                  value={timeConstantTau}
                  onChange={(e) => setTimeConstantTau(e.target.value)}
                />
              </Field>
            </div>
          )}

          {controllerType !== "P" && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Anti-Windup
                </p>
                <p className="text-xs text-slate-500">
                  Stop integral accumulation while the output is saturated
                </p>
              </div>
              <Toggle checked={antiWindup} onChange={setAntiWindup} />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Field label="Kp">
              <Input
                type="number"
                step="any"
                required
                value={kp}
                onChange={(e) => setKp(e.target.value)}
              />
            </Field>
            <Field label="Ki">
              <Input
                type="number"
                step="any"
                required
                value={ki}
                onChange={(e) => setKi(e.target.value)}
              />
            </Field>
            <Field label="Kd">
              <Input
                type="number"
                step="any"
                required
                value={kd}
                onChange={(e) => setKd(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Setpoint">
              <Input
                type="number"
                step="any"
                required
                value={setpoint}
                onChange={(e) => setSetpoint(e.target.value)}
              />
            </Field>
            <Field label="Output Min">
              <Input
                type="number"
                step="any"
                required
                value={outputMin}
                onChange={(e) => setOutputMin(e.target.value)}
              />
            </Field>
            <Field label="Output Max">
              <Input
                type="number"
                step="any"
                required
                value={outputMax}
                onChange={(e) => setOutputMax(e.target.value)}
              />
            </Field>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            loading={submitting}
          >
            {submitting ? "Creating Plant..." : "Create Plant Document"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
