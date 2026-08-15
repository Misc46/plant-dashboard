// Shared UI primitives for the Plant Control & Monitoring Dashboard.
// Style-only components — no logic, no state, no external dependencies.
// Import from "@/components/ui".

"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { useEffect, useState } from "react";

/* ---------------------------------- Card ---------------------------------- */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/* -------------------------------- StatCard -------------------------------- */

const statTones = {
  default: "text-slate-900",
  green: "text-emerald-600",
  red: "text-red-600",
  blue: "text-blue-600",
  purple: "text-purple-600",
  yellow: "text-amber-600",
} as const;

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: keyof typeof statTones;
}) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${statTones[tone]}`}>
        {value}
      </p>
    </Card>
  );
}

/* ---------------------------------- Badge --------------------------------- */

const badgeTones = {
  green: { badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  red: { badge: "bg-red-100 text-red-800", dot: "bg-red-500" },
  gray: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  blue: { badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  purple: { badge: "bg-purple-100 text-purple-800", dot: "bg-purple-500" },
  yellow: { badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
} as const;

export function Badge({
  tone,
  pulse,
  children,
}: {
  tone: keyof typeof badgeTones;
  pulse?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeTones[tone].badge}`}
    >
      {pulse && (
        <span
          className={`mr-1.5 inline-block size-1.5 animate-pulse rounded-full ${badgeTones[tone].dot}`}
        />
      )}
      {children}
    </span>
  );
}

/* ------------------------------- StatusBadge ------------------------------ */

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: keyof typeof badgeTones; pulse: boolean }> = {
    RUNNING: { tone: "green", pulse: true },
    FAULT: { tone: "red", pulse: true },
    STOPPED: { tone: "gray", pulse: false },
    OFFLINE: { tone: "gray", pulse: false },
    DISCONNECTED: { tone: "gray", pulse: false },
  };
  
  const { tone, pulse } = map[status] || { tone: "gray", pulse: false };
  
  return (
    <Badge tone={tone} pulse={pulse}>
      {status}
    </Badge>
  );
}

/* ---------------------------------- Button -------------------------------- */

const buttonVariants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  warning: "bg-amber-500 text-white hover:bg-amber-600",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
} as const;

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition ${
        buttonVariants[variant]
      } ${buttonSizes[size]} ${
        loading || disabled ? "cursor-not-allowed opacity-60" : ""
      } ${className ?? ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

/* ---------------------------------- Input --------------------------------- */

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-slate-100 disabled:text-slate-500 ${className ?? ""}`}
      {...props}
    />
  );
}

/* ---------------------------------- Select -------------------------------- */

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-slate-100 disabled:text-slate-500 ${className ?? ""}`}
      {...props}
    />
  );
}

/* ---------------------------------- Field --------------------------------- */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

/* -------------------------------- Segmented -------------------------------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            value === option.value
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- Toggle --------------------------------- */

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <label
      className={`inline-flex items-center gap-2 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}

/* ---------------------------------- Alert --------------------------------- */

const alertTones = {
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof alertTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${alertTones[tone]} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/* --------------------------------- Spinner -------------------------------- */

const spinnerSizes = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-8",
} as const;

export function Spinner({ size = "md" }: { size?: keyof typeof spinnerSizes }) {
  return (
    <span
      aria-label="Loading"
      role="status"
      className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 ${spinnerSizes[size]}`}
    />
  );
}

/* -------------------------------- PageLoader ------------------------------ */

export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Spinner />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

/* -------------------------------- EmptyState ------------------------------ */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* -------------------------------- PageHeader ------------------------------ */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ───────────────────────────── Toast system ──────────────────────────────── */

export type ToastTone = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

// Tiny event bus — lets any module call toast() without a React context.
type ToastListener = (msg: ToastMessage) => void;
const listeners: Set<ToastListener> = new Set();
let nextId = 0;

export function toast(message: string, tone: ToastTone = "info") {
  const msg: ToastMessage = { id: ++nextId, message, tone };
  listeners.forEach((fn) => fn(msg));
}

const toastStyles: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error:   "border-red-200 bg-red-50 text-red-800",
  info:    "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

const toastIcons: Record<ToastTone, ReactNode> = {
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-emerald-500">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-red-500">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-blue-500">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-amber-500">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * Mount <Toaster /> once near the root (e.g. in layout.tsx).
 * Individual toasts are triggered by calling toast(message, tone).
 */
export function Toaster() {
  const [toasts, setToasts] = useState<(ToastMessage & { visible: boolean })[]>([]);

  useEffect(() => {
    const handler: ToastListener = (msg) => {
      setToasts((prev) => [...prev, { ...msg, visible: true }]);

      // Start fade-out after 3.5 s, remove from DOM after 4 s
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === msg.id ? { ...t, visible: false } : t))
        );
      }, 3500);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 4000);
    };

    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`
            flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium
            pointer-events-auto transition-all duration-300
            ${toastStyles[t.tone]}
            ${t.visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
          `}
        >
          {toastIcons[t.tone]}
          <span className="flex-1 leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
