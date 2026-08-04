"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  PageHeader,
  PageLoader,
  StatCard,
} from "@/components/ui";

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
      <PageHeader
        title="System Overview"
        subtitle="Live aggregate telemetry across all control plants"
        actions={
          <Button variant="secondary" size="sm" onClick={fetchSummary}>
            Refresh Now
          </Button>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <PageLoader text="Loading aggregate plant metrics..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total Plants" value={summary?.activePlants ?? 0} />
            <StatCard
              label="Running Systems"
              value={summary?.runningSystems ?? 0}
              tone="green"
            />
            <StatCard
              label="Fault Count"
              value={summary?.faultCount ?? 0}
              tone="red"
            />
            <StatCard
              label="Avg Absolute Error"
              value={summary?.avgError ?? 0}
              tone="blue"
            />
            <StatCard
              label="Avg Control Output"
              value={summary?.avgOutput ?? 0}
              tone="purple"
            />
          </div>

          {summary?.timestamp && (
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <svg
                className="size-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Last updated:{" "}
              <time dateTime={new Date(summary.timestamp).toISOString()}>
                {new Date(summary.timestamp).toLocaleTimeString()}
              </time>
            </p>
          )}
        </>
      )}

      <Card>
        <h2 className="font-semibold text-slate-900">Control System Monitoring</h2>
        <p className="mt-1 text-sm text-slate-500">
          Telemetry readings are polled in real-time. Navigate to the plant list
          to inspect single control loops or tune PID parameter configurations.
        </p>
        <div className="mt-4">
          <Link href="/dashboard/plants">
            <Button variant="primary">View Active Plants</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
