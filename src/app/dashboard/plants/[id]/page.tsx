"use client";

import { use, useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, onValue, query, limitToLast } from "firebase/database";
import { db, rtdb } from "@/lib/firebase/client";
import { PlantData, TelemetryReading } from "@/lib/simulator";
import { useAuth } from "@/lib/auth/AuthProvider";
import TelemetryChart from "@/components/TelemetryChart";
import BodePlot from "@/components/BodePlot";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageLoader,
  Segmented,
  StatCard,
  StatusBadge,
  Toggle,
} from "@/components/ui";
import axios from "axios";
import { PerformanceMetrics } from "@/lib/metrics/performance";

export default function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { profile, user } = useAuth();

  const [plant, setPlant] = useState<PlantData | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryReading[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"telemetry" | "bode">("telemetry");

  // Config Form State — raw strings so users can clear a field and retype;
  // parsed to numbers only when saving (Number() per keystroke would snap
  // an emptied field back to 0).
  const [kp, setKp] = useState("");
  const [ki, setKi] = useState("");
  const [kd, setKd] = useState("");
  const [setpoint, setSetpoint] = useState("");
  const [transferGain, setTransferGain] = useState("");
  const [timeConstantTau, setTimeConstantTau] = useState("");
  const [antiWindup, setAntiWindup] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const isAdmin = profile?.role === "ADMIN";

  // 1. Listen to Firestore plant doc metadata
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "plants", id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as PlantData;
        setPlant(data);
        setKp(String(data.kp));
        setKi(String(data.ki));
        setKd(String(data.kd));
        setSetpoint(String(data.setpoint));
        setTransferGain(data.transferGain != null ? String(data.transferGain) : "");
        setTimeConstantTau(data.timeConstantTau != null ? String(data.timeConstantTau) : "");
        setAntiWindup(data.antiWindup === true);
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
        readings.sort((a, b) => a.timestamp - b.timestamp);
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
    if (!isAdmin || !user) return;
    try {
      const idToken = await user.getIdToken();
      await axios.post(
        `/api/plants/${id}/reset`,
        {},
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      setTelemetry([]);
    } catch {
      alert("Failed to reset plant state.");
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !plant) return;

    if (
      plant.type === "CUSTOM" &&
      (Number(transferGain) <= 0 || Number(timeConstantTau) <= 0)
    ) {
      alert("Transfer gain (K) and time constant (τ) must be greater than zero.");
      return;
    }

    setSavingConfig(true);
    try {
      const setpointChanged = plant.setpoint !== Number(setpoint);
      await updateDoc(doc(db, "plants", id), {
        kp: Number(kp),
        ki: Number(ki),
        kd: Number(kd),
        setpoint: Number(setpoint),
        antiWindup,
        ...(plant.type === "CUSTOM"
          ? {
              transferGain: Number(transferGain),
              timeConstantTau: Number(timeConstantTau),
            }
          : {}),
        ...(setpointChanged
          ? { stepStartAt: Date.now(), stepStartSetpoint: Number(setpoint) }
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
    return <PageLoader text="Loading plant details..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{plant.name}</h1>
            <StatusBadge status={plant.status} />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            ID: {plant.id} | Type: {plant.type} | Controller: {plant.controllerType}
            {plant.type === "CUSTOM" && (
              <> | G(s) = {plant.transferGain} / ({plant.timeConstantTau}s + 1)</>
            )}
          </p>
        </div>

        {/* Command Buttons (ADMIN only) */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            {plant.status !== "RUNNING" ? (
              <Button
                variant="success"
                onClick={() => handleStatusChange("RUNNING")}
              >
                Start Simulation
              </Button>
            ) : (
              <Button
                variant="warning"
                onClick={() => handleStatusChange("STOPPED")}
              >
                Stop Simulation
              </Button>
            )}
            <Button variant="danger" onClick={handleReset}>
              Reset
            </Button>
          </div>
        )}
      </Card>

      {/* Real-time Telemetry vs Bode Plot tabs */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">
          {activeTab === "telemetry" ? "Live Telemetry" : "Frequency Analysis"}
        </h2>
        <Segmented
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: "telemetry", label: "Live Telemetry" },
            { value: "bode", label: "Bode Plot" },
          ]}
        />
      </div>
      {activeTab === "telemetry" ? (
        <TelemetryChart data={telemetry} />
      ) : (
        <BodePlot plant={plant} />
      )}

      {/* Grid: Performance Panel + PID Config Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics Panel */}
        <Card className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="font-semibold text-slate-900">Control Performance Metrics</h3>
            <Button
              variant="ghost"
              size="sm"
              loading={metricsLoading}
              onClick={() => {
                setMetricsLoading(true);
                fetchMetrics();
              }}
            >
              {metricsLoading ? "Calculating..." : "Refresh Metrics"}
            </Button>
          </div>

          {metrics?.message ? (
            <p className="text-sm text-slate-500">{metrics.message}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Rise Time"
                tone="blue"
                value={
                  metrics?.riseTimeMs !== null && metrics?.riseTimeMs !== undefined
                    ? `${metrics.riseTimeMs} ms`
                    : "N/A"
                }
              />
              <StatCard
                label="Overshoot %"
                tone="purple"
                value={
                  metrics?.overshootPercent !== null && metrics?.overshootPercent !== undefined
                    ? `${metrics.overshootPercent}%`
                    : "N/A"
                }
              />
              <StatCard
                label="Settling Time"
                tone="green"
                value={
                  metrics?.settlingTimeMs !== null && metrics?.settlingTimeMs !== undefined
                    ? `${metrics.settlingTimeMs} ms`
                    : "N/A"
                }
              />
            </div>
          )}
        </Card>

        {/* Controller Config Form */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-semibold text-slate-900">PID Parameter Configuration</h3>
            {isAdmin ? (
              <Badge tone="green">Admin Editable</Badge>
            ) : (
              <span className="text-xs text-slate-400">View Only</span>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Setpoint">
                <Input
                  type="number"
                  step="any"
                  disabled={!isAdmin}
                  value={setpoint}
                  onChange={(e) => setSetpoint(e.target.value)}
                />
              </Field>

              <Field label="Kp (Proportional)">
                <Input
                  type="number"
                  step="any"
                  disabled={!isAdmin}
                  value={kp}
                  onChange={(e) => setKp(e.target.value)}
                />
              </Field>

              <Field label="Ki (Integral)">
                <Input
                  type="number"
                  step="any"
                  disabled={!isAdmin}
                  value={ki}
                  onChange={(e) => setKi(e.target.value)}
                />
              </Field>

              <Field label="Kd (Derivative)">
                <Input
                  type="number"
                  step="any"
                  disabled={!isAdmin}
                  value={kd}
                  onChange={(e) => setKd(e.target.value)}
                />
              </Field>
            </div>

            {plant.type === "CUSTOM" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Transfer Gain (K)">
                  <Input
                    type="number"
                    step="any"
                    disabled={!isAdmin}
                    value={transferGain}
                    onChange={(e) => setTransferGain(e.target.value)}
                  />
                </Field>
                <Field label="Time Constant τ (s)">
                  <Input
                    type="number"
                    step="any"
                    disabled={!isAdmin}
                    value={timeConstantTau}
                    onChange={(e) => setTimeConstantTau(e.target.value)}
                  />
                </Field>
              </div>
            )}

            {plant.controllerType !== "P" && (
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Anti-Windup
                  </p>
                  <p className="text-xs text-slate-500">
                    Stop integral accumulation while the output is saturated
                  </p>
                </div>
                <Toggle
                  checked={antiWindup}
                  onChange={setAntiWindup}
                  disabled={!isAdmin}
                />
              </div>
            )}

            {isAdmin && (
              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                loading={savingConfig}
              >
                {savingConfig ? "Saving Changes..." : "Update Plant Parameters"}
              </Button>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
