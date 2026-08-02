"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { PlantData } from "@/lib/simulator";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function PlantsListPage() {
  const [plants, setPlants] = useState<PlantData[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Control Plants</h1>
          <p className="text-sm text-gray-500">Live updated via Firestore `onSnapshot`</p>
        </div>
        {profile?.role === "ADMIN" && (
          <Link
            href="/dashboard/plants/new"
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition"
          >
            + Add Plant
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500 py-6">Connecting to Firestore live stream...</div>
      ) : plants.length === 0 ? (
        <div className="bg-white p-8 rounded border text-center text-gray-500">
          No plants created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <div
              key={plant.id}
              className="bg-white rounded border border-gray-200 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800 text-lg">{plant.name}</h3>
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

                <p className="text-xs text-gray-500 mb-4">
                  Type: <span className="font-semibold text-gray-700">{plant.type}</span> | Controller:{" "}
                  <span className="font-semibold text-gray-700">{plant.controllerType}</span>
                </p>

                <div className="bg-gray-50 p-3 rounded text-xs space-y-1 font-mono mb-4">
                  <p>Setpoint: {plant.setpoint}</p>
                  <p>
                    Kp: {plant.kp} | Ki: {plant.ki} | Kd: {plant.kd}
                  </p>
                  <p>
                    Output Limits: [{plant.outputMin}, {plant.outputMax}]
                  </p>
                </div>
              </div>

              <Link
                href={`/dashboard/plants/${plant.id}`}
                className="w-full text-center py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded transition"
              >
                Inspect Telemetry & Control &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
