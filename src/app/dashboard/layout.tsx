"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import axios from "axios";
import { Badge, Button, PageLoader } from "@/components/ui";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Client-side protection check
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Periodic tick invocation to advance running simulator plants when an active tab is open
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const idToken = await user.getIdToken();
        await axios.post(
          "/api/tick",
          {},
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
      } catch {
        // Silent failure for simulation tick polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <PageLoader text="Loading auth state..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const isOverviewActive = pathname === "/dashboard";
  const isPlantsActive =
    pathname === "/dashboard/plants" ||
    (pathname.startsWith("/dashboard/plants/") &&
      pathname !== "/dashboard/plants/new");
  const isNewPlantActive = pathname === "/dashboard/plants/new";

  const roleTone: "purple" | "gray" =
    profile?.role === "ADMIN" ? "purple" : "gray";
  const avatarInitial =
    profile?.email?.split("@")[0]?.slice(0, 2).toUpperCase() ?? "U";

  const navLinkClass = (active: boolean) =>
    `relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
      active
        ? "bg-blue-600/15 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      {/* Sidebar Nav */}
      <aside className="flex w-full flex-col justify-between border-r border-slate-800 bg-slate-900 p-4 text-white md:w-64">
        <div>
          {/* Brand */}
          <div className="mb-6 flex items-center gap-2.5 px-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6 shrink-0 text-blue-400"
              aria-hidden="true"
            >
              <path d="M3 12h4l2.5-7 4.5 14 2.5-7H21" />
            </svg>
            <span className="text-lg font-semibold tracking-wide text-blue-400">
              Plant Control Systems
            </span>
          </div>

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Navigation
          </p>
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              aria-current={isOverviewActive ? "page" : undefined}
              className={navLinkClass(isOverviewActive)}
            >
              {isOverviewActive && (
                <span className="absolute left-0 top-1/2 h-4 w-[1.5px] -translate-y-1/2 rounded-full bg-blue-400" />
              )}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 shrink-0"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              Overview
            </Link>

            <Link
              href="/dashboard/plants"
              aria-current={isPlantsActive ? "page" : undefined}
              className={navLinkClass(isPlantsActive)}
            >
              {isPlantsActive && (
                <span className="absolute left-0 top-1/2 h-4 w-[1.5px] -translate-y-1/2 rounded-full bg-blue-400" />
              )}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 shrink-0"
                aria-hidden="true"
              >
                <path d="m12 2 9 5-9 5-9-5 9-5Z" />
                <path d="m3 12 9 5 9-5" />
                <path d="m3 17 9 5 9-5" />
              </svg>
              Plant List
            </Link>

            {profile?.role === "ADMIN" && (
              <Link
                href="/dashboard/plants/new"
                aria-current={isNewPlantActive ? "page" : undefined}
                className={`mt-4 flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 ${
                  isNewPlantActive ? "bg-blue-700" : ""
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="size-4 shrink-0"
                  aria-hidden="true"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                New Plant
              </Link>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="mt-8 border-t border-slate-800 pt-4">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[11px] text-slate-400">
              Simulation ticker active · 2s
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-600/20 text-xs font-semibold text-blue-300">
              {avatarInitial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-300">
                {profile?.email}
              </p>
              <div className="mt-1">
                <Badge tone={roleTone}>{profile?.role || "VIEWER"}</Badge>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-6 py-3.5 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Real-Time Plant Monitoring System
              </h2>
              <span className="hidden text-xs text-slate-400 sm:inline">
                / Dashboard
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={roleTone}>{profile?.role || "VIEWER"}</Badge>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Dynamic Page View */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
