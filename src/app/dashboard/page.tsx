"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface DashboardSummary {
  activePlants: number;
  runningSystems: number;
  faultCount: number;
  avgError: number;
  avgOutput: number;
  timestamp: number;
}

export default function DashboardOverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(() => {
    axios
      .get<DashboardSummary>("/api/dashboard/summary")
      .then((res) => {
        setSummary(res.data);
      })
      .catch((err) => {
        const apiError =
          axios.isAxiosError(err) && err.response?.data
            ? (err.response.data as { error?: string }).error
            : undefined;
        setError(apiError || "Failed to load dashboard summary");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 3000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">System Overview</h1>
        <button
          onClick={fetchSummary}
          className="text-xs bg-white border border-gray-300 px-3 py-1 rounded shadow-sm hover:bg-gray-50"
        >
          Refresh Now
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 py-6">Loading aggregated plant metrics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded shadow border border-gray-200">
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Plants</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {summary?.activePlants ?? 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded shadow border border-gray-200">
            <p className="text-xs text-gray-500 font-semibold uppercase">Running Systems</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {summary?.runningSystems ?? 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded shadow border border-gray-200">
            <p className="text-xs text-gray-500 font-semibold uppercase">Fault Count</p>
            <p className="text-3xl font-bold text-red-600 mt-1">
              {summary?.faultCount ?? 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded shadow border border-gray-200">
            <p className="text-xs text-gray-500 font-semibold uppercase">Avg Absolute Error</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {summary?.avgError ?? 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded shadow border border-gray-200">
            <p className="text-xs text-gray-500 font-semibold uppercase">Avg Control Output</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">
              {summary?.avgOutput ?? 0}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded shadow border border-gray-200 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Control System Monitoring Status</h2>
        <p className="text-sm text-gray-600">
          Telemetry readings are polled in real-time. Navigate to the plant list to inspect single control loops or tune PID parameter configurations.
        </p>
        <div>
          <Link
            href="/dashboard/plants"
            className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm transition"
          >
            View Active Plants &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
