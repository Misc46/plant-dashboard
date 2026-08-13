// Shared UI primitives for the Plant Control & Monitoring Dashboard.
// Style-only components — no logic, no state, no external dependencies.
// Import from "@/components/ui".

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

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
