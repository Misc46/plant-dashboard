"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { PlantData } from "@/lib/simulator";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  PageLoader,
  StatusBadge,
} from "@/components/ui";
import { wsService } from "@/services/websocket";

export default function PlantsListPage() {
  const [plants, setPlants] = useState<PlantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [espLive, setEspLive] = useState<{ isOnline: boolean; pv: number | null }>({ isOnline: false, pv: null });
  const onlineTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    // Realtime live updating list from Firestore onSnapshot
    const unsubscribe = onSnapshot(
      collection(db, "plants"),
      (snapshot) => {
        const list: PlantData[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as PlantData);
        });
        setPlants(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to WebSocket for live ESP telemetry
  useEffect(() => {
    const hasEsp = plants.some((p) => p.connectionMode === "ESP");
    if (!hasEsp) return;

    const handleWsMessage = (data: any) => {
      const pv =
        data.processVariable !== undefined
          ? data.processVariable
          : data.temp !== undefined
          ? data.temp
          : null;

      if (pv === null && data.controlValue === undefined) return;

      setEspLive({ isOnline: true, pv: pv ?? espLive.pv });

      if (onlineTimeoutRef.current) clearTimeout(onlineTimeoutRef.current);
      onlineTimeoutRef.current = setTimeout(() => {
        setEspLive((prev) => ({ ...prev, isOnline: false }));
      }, 5000);
    };

    wsService.subscribe(handleWsMessage);
    return () => {
      wsService.unsubscribe(handleWsMessage);
      if (onlineTimeoutRef.current) clearTimeout(onlineTimeoutRef.current);
    };
  }, [plants, espLive.pv]);

  const addPlantAction =
    profile?.role === "ADMIN" ? (
      <Link href="/dashboard/plants/new">
        <Button variant="primary">+ Add Plant</Button>
      </Link>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control Plants"
        subtitle="Live-updating via Firestore stream"
        actions={addPlantAction}
      />

      {loading ? (
        <PageLoader text="Connecting to Firestore live stream..." />
      ) : plants.length === 0 ? (
        <EmptyState
          title="No plants created yet"
          description="Create your first control loop to start simulating telemetry."
          action={
            profile?.role === "ADMIN" ? (
              <Link href="/dashboard/plants/new">
                <Button variant="primary">+ Add Plant</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plants.map((plant) => (
            <Card
              key={plant.id}
              className="flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="truncate font-semibold text-slate-900">
                    {plant.name}
                  </h3>
                  <StatusBadge
                    status={
                      plant.connectionMode === "ESP"
                        ? espLive.isOnline
                          ? "ONLINE"
                          : "OFFLINE"
                        : plant.status
                    }
                  />
                </div>

                <p className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <Badge tone="blue">{plant.type}</Badge>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{plant.controllerType}</span>
                  <span aria-hidden="true">·</span>
                  <Badge tone={plant.connectionMode === "ESP" ? "purple" : "gray"}>
                    {plant.connectionMode === "ESP" ? "ESP" : "Simulated"}
                  </Badge>
                </p>

                <div className="mb-4 space-y-1 rounded-lg bg-slate-50 p-3 font-mono text-xs tabular-nums">
                  <p>
                    <span className="text-slate-400">SP</span>{" "}
                    <span className="font-medium text-slate-700">
                      {plant.setpoint}
                    </span>
                    {plant.connectionMode === "ESP" && espLive.pv !== null && (
                      <>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-slate-400">PV</span>{" "}
                        <span
                          className={`font-medium ${
                            espLive.isOnline
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {espLive.pv.toFixed(2)}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="text-slate-700">
                    Kp {plant.kp} · Ki {plant.ki} · Kd {plant.kd}
                  </p>
                  <p className="text-slate-700">
                    Output {plant.outputMin} – {plant.outputMax}
                  </p>
                </div>
              </div>

              <Link
                href={`/dashboard/plants/${plant.id}`}
                className="block"
              >
                <Button variant="secondary" size="md" className="w-full">
                  Inspect Telemetry &rarr;
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
