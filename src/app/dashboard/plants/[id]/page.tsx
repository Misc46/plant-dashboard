"use client";

import { use, useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, onValue, query, limitToLast } from "firebase/database";
import { db, rtdb } from "@/lib/firebase/client";
import { PlantData, TelemetryReading } from "@/lib/simulator";
import { useAuth } from "@/lib/auth/AuthProvider";
import TelemetryChart from "@/components/TelemetryChart";
import axios from "axios";
import { PerformanceMetrics } from "@/lib/metrics/performance";

export default function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { profile } = useAuth();

  const [plant, setPlant] = useState<PlantData | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryReading[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Config Form State
  const [kp, setKp] = useState(0);
  const [ki, setKi] = useState(0);
  const [kd, setKd] = useState(0);
  const [setpoint, setSetpoint] = useState(0);
  const [savingConfig, setSavingConfig] = useState(false);

  const isAdmin = profile?.role === "ADMIN";

  // 1. Listen to Firestore plant doc metadata
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "plants", id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as PlantData;
        setPlant(data);
        setKp(data.kp);
        setKi(data.ki);
        setKd(data.kd);
        setSetpoint(data.setpoint);
      }
    });

    return () => unsub();
  }, [id]);

  // 2. Listen to Realtime DB telemetry stream using limitToLast(50) for fast bounded rendering
  useEffect(() => {
    const telemetryQuery = query(ref(rtdb, `telemetry/${id}`), limitToLast(50));
    const unsubRtdb = onValue(telemetryQuery, (snapshot) => {
      if (snapshot.exists()) {
        const valObj = snapshot.val();
        const readings: TelemetryReading[] = Object.values(valObj);
        setTelemetry(readings);
      } else {
        setTelemetry([]);
      }
    });

    return () => unsubRtdb();
  }, [id]);

  // 3. Fetch performance metrics calculation from GET /api/plants/[id]/performance
  const fetchMetrics = useCallback(() => {
    axios
      .get<PerformanceMetrics>(`/api/plants/${id}/performance`)
      .then((res) => {
        setMetrics(res.data);
      })
      .catch((err) => {
        console.error("Failed to load metrics:", err);
      })
      .finally(() => {
        setMetricsLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (plant?.stepStartAt) {
      fetchMetrics();
    }
  }, [id, plant?.stepStartAt, plant?.setpoint, fetchMetrics]);

  // Command Action Handlers (ADMIN only direct Firestore write)
  const handleStatusChange = async (newStatus: "RUNNING" | "STOPPED") => {
    if (!isAdmin || !plant) return;
    try {
      await updateDoc(doc(db, "plants", id), {
        status: newStatus,
        stepStartAt: Date.now(),
        stepStartSetpoint: plant.setpoint,
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Failed to update status. Check permissions.");
    }
  };

  const handleReset = async () => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, "plants", id), {
        status: "STOPPED",
        stepStartAt: null,
        stepStartSetpoint: null,
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Failed to reset plant state.");
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !plant) return;

    setSavingConfig(true);
    try {
      const setpointChanged = plant.setpoint !== setpoint;
      await updateDoc(doc(db, "plants", id), {
        kp,
        ki,
        kd,
        setpoint,
        ...(setpointChanged
          ? { stepStartAt: Date.now(), stepStartSetpoint: setpoint }
          : {}),
        updatedAt: serverTimestamp(),
      });
      alert("Configuration updated successfully.");
    } catch {
      alert("Failed to save config. Check authorization.");
    } finally {
      setSavingConfig(false);
    }
  };

  if (!plant) {
    return <div className="text-gray-500">Loading plant details...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded border border-gray-200 shadow-sm gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-800">{plant.name}</h1>
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded ${
                plant.status === "RUNNING"
                  ? "bg-green-100 text-green-800"
                  : plant.status === "FAULT"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {plant.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ID: {plant.id} | Type: {plant.type} | Controller: {plant.controllerType}
          </p>
        </div>

        {/* Command Buttons (ADMIN only) */}
        {isAdmin && (
          <div className="flex items-center space-x-2">
            {plant.status !== "RUNNING" ? (
              <button
                onClick={() => handleStatusChange("RUNNING")}
                className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded text-sm transition"
              >
                Start Simulation
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange("STOPPED")}
                className="py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded text-sm transition"
              >
                Stop
              </button>
            )}
            <button
              onClick={handleReset}
              className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-sm transition"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Real-time Telemetry Chart */}
      <TelemetryChart data={telemetry} />

      {/* Grid: Performance Panel + PID Config Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Metrics Panel */}
        <div className="bg-white p-5 rounded border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-gray-800">Control Performance Metrics</h3>
            <button
              onClick={() => {
                setMetricsLoading(true);
                fetchMetrics();
              }}
              disabled={metricsLoading}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700"
            >
              {metricsLoading ? "Calculating..." : "Refresh Metrics"}
            </button>
          </div>

          {metrics?.message ? (
            <p className="text-xs text-gray-500 py-2">{metrics.message}</p>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-3 rounded border border-blue-100">
                <p className="text-xs text-blue-600 font-medium">Rise Time</p>
                <p className="text-lg font-bold text-blue-900 mt-1">
                  {metrics?.riseTimeMs !== null && metrics?.riseTimeMs !== undefined
                    ? `${metrics.riseTimeMs} ms`
                    : "N/A"}
                </p>
              </div>

              <div className="bg-purple-50 p-3 rounded border border-purple-100">
                <p className="text-xs text-purple-600 font-medium">Overshoot %</p>
                <p className="text-lg font-bold text-purple-900 mt-1">
                  {metrics?.overshootPercent !== null && metrics?.overshootPercent !== undefined
                    ? `${metrics.overshootPercent}%`
                    : "N/A"}
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded border border-green-100">
                <p className="text-xs text-green-600 font-medium">Settling Time</p>
                <p className="text-lg font-bold text-green-900 mt-1">
                  {metrics?.settlingTimeMs !== null && metrics?.settlingTimeMs !== undefined
                    ? `${metrics.settlingTimeMs} ms`
                    : "N/A"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controller Config Form */}
        <div className="bg-white p-5 rounded border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">
            PID Parameter Configuration {isAdmin ? "(Admin Editable)" : "(View Only)"}
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Setpoint
                </label>
                <input
                  type="number"
                  step="any"
                  disabled={!isAdmin}
                  value={setpoint}
                  onChange={(e) => setSetpoint(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded text-sm disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Kp (Proportional)
                </label>
                <input
                  type="number"
                  step="any"
                  disabled={!isAdmin}
                  value={kp}
                  onChange={(e) => setKp(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded text-sm disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Ki (Integral)
                </label>
                <input
                  type="number"
                  step="any"
                  disabled={!isAdmin}
                  value={ki}
                  onChange={(e) => setKi(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded text-sm disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Kd (Derivative)
                </label>
                <input
                  type="number"
                  step="any"
                  disabled={!isAdmin}
                  value={kd}
                  onChange={(e) => setKd(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded text-sm disabled:bg-gray-100"
                />
              </div>
            </div>

            {isAdmin && (
              <button
                type="submit"
                disabled={savingConfig}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm transition disabled:opacity-50 mt-2"
              >
                {savingConfig ? "Saving Changes..." : "Update Plant Parameters"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
