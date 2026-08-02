"use client";

import { useEffect, useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { ControllerType, PlantType } from "@/lib/simulator";

export default function CreatePlantPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState<PlantType>("DC_MOTOR");
  const [controllerType, setControllerType] = useState<ControllerType>("PID");
  const [kp, setKp] = useState(1.2);
  const [ki, setKi] = useState(0.4);
  const [kd, setKd] = useState(0.1);
  const [setpoint, setSetpoint] = useState(100);
  const [samplingPeriodMs] = useState(500);
  const [outputMin, setOutputMin] = useState(0);
  const [outputMax, setOutputMax] = useState(100);

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
    return <div className="text-gray-500">Checking permissions...</div>;
  }

  if (profile?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded border border-gray-200 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Create New Control Plant</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded border border-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plant Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. DC Motor Speed Loop 1"
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plant Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PlantType)}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="DC_MOTOR">DC Motor Speed Control</option>
              <option value="WATER_TANK">Water Tank Level Control</option>
              <option value="TEMPERATURE">Temperature Control System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Controller Type</label>
            <select
              value={controllerType}
              onChange={(e) => setControllerType(e.target.value as ControllerType)}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="PID">PID Controller</option>
              <option value="PI">PI Controller</option>
              <option value="P">P Controller</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Kp</label>
            <input
              type="number"
              step="any"
              required
              value={kp}
              onChange={(e) => setKp(Number(e.target.value))}
              className="w-full px-3 py-1.5 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ki</label>
            <input
              type="number"
              step="any"
              required
              value={ki}
              onChange={(e) => setKi(Number(e.target.value))}
              className="w-full px-3 py-1.5 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Kd</label>
            <input
              type="number"
              step="any"
              required
              value={kd}
              onChange={(e) => setKd(Number(e.target.value))}
              className="w-full px-3 py-1.5 border rounded text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Setpoint</label>
            <input
              type="number"
              step="any"
              required
              value={setpoint}
              onChange={(e) => setSetpoint(Number(e.target.value))}
              className="w-full px-3 py-1.5 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Output Min</label>
            <input
              type="number"
              step="any"
              required
              value={outputMin}
              onChange={(e) => setOutputMin(Number(e.target.value))}
              className="w-full px-3 py-1.5 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Output Max</label>
            <input
              type="number"
              step="any"
              required
              value={outputMax}
              onChange={(e) => setOutputMax(Number(e.target.value))}
              className="w-full px-3 py-1.5 border rounded text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition disabled:opacity-50 text-sm"
        >
          {submitting ? "Creating Plant..." : "Create Plant Document"}
        </button>
      </form>
    </div>
  );
}
