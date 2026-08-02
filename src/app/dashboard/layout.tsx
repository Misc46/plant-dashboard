"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import axios from "axios";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Loading Auth State...
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-4 flex flex-col justify-between">
        <div>
          <div className="text-xl font-bold mb-6 tracking-wide text-blue-400">
            Plant Control Systems
          </div>
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="block py-2 px-3 rounded hover:bg-slate-800 transition"
            >
              Overview Dashboard
            </Link>
            <Link
              href="/dashboard/plants"
              className="block py-2 px-3 rounded hover:bg-slate-800 transition"
            >
              Plant List
            </Link>
            {profile?.role === "ADMIN" && (
              <Link
                href="/dashboard/plants/new"
                className="block py-2 px-3 rounded bg-blue-700 hover:bg-blue-600 font-medium transition text-center mt-4"
              >
                + New Plant
              </Link>
            )}
          </nav>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-700 text-xs">
          <p className="text-slate-400">Simulation Ticker: Active (2s interval)</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Real-Time Plant Monitoring System
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{profile?.email}</p>
              <span
                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                  profile?.role === "ADMIN"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                Role: {profile?.role || "VIEWER"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="py-1 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Page View */}
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}
