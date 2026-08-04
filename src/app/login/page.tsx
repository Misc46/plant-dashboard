"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { Alert, Badge, Button, Card, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in. Check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google Sign-in failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 p-4">
      {/* Subtle control-room glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 size-80 rounded-full bg-sky-500/5 blur-3xl"
      />

      <Card className="relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="size-10 text-blue-600"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <path d="M7 12h2.4l1.6-3.2 2 6.4 1.6-3.2H17" />
          </svg>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Plant Control & Monitoring
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to view real-time telemetry and plant parameters
          </p>
        </div>

        {error && (
          <Alert tone="error" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Field label="Email Address">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@plant.local"
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full"
          >
            {loading ? "Signing in..." : "Sign In with Email"}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <span className="flex-1 border-t border-slate-200" />
          <span className="text-xs uppercase tracking-wider text-slate-400">
            or continue with
          </span>
          <span className="flex-1 border-t border-slate-200" />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="md"
          loading={loading}
          onClick={handleGoogleSignIn}
          className="w-full"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="mr-2 size-4">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
            />
          </svg>
          Sign In with Google
        </Button>

        {/* Seed account hints */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-500">
            Default seed accounts
          </p>
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-slate-500">
                admin@plant.local / admin123
              </span>
              <Badge tone="purple">ADMIN</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-slate-500">
                viewer@plant.local / viewer123
              </span>
              <Badge tone="gray">VIEWER</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
