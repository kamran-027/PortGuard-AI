import React from "react";

export type Tone = "neutral" | "good" | "warn" | "bad";

const toneText: Record<Tone, string> = {
  neutral: "text-zinc-600",
  good: "text-emerald-700",
  warn: "text-amber-700",
  bad: "text-red-700",
};

const toneDot: Record<Tone, string> = {
  neutral: "bg-zinc-400",
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-red-500",
};

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Status({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${toneText[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${toneDot[tone]}`} />
      {children}
    </span>
  );
}

const pillLight: Record<Tone, string> = {
  neutral: "bg-zinc-100 text-zinc-600",
  good: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
};

const pillDark: Record<Tone, string> = {
  neutral: "bg-white/10 text-zinc-300 ring-white/15",
  good: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
  warn: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  bad: "bg-red-400/10 text-red-300 ring-red-400/25",
};

export function Pill({
  tone,
  dark = false,
  children,
}: {
  tone: Tone;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        dark ? `ring-1 ${pillDark[tone]}` : pillLight[tone]
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${toneDot[tone]}`} />
      {children}
    </span>
  );
}

export function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd className={`text-right text-zinc-900 ${mono ? "font-mono text-[13px]" : ""}`}>
        {value === undefined || value === null || value === "" ? "—" : value}
      </dd>
    </div>
  );
}

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${styles} ${className}`}
    />
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-md border border-zinc-200 bg-zinc-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`rounded px-3 py-1 text-sm transition-colors disabled:opacity-50 ${
            value === o.value
              ? "bg-white font-medium text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const formatInr = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

export const formatUsd = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);

export const DOC_LABELS: Record<string, string> = {
  BILL_OF_LADING: "Bill of Lading",
  COMMERCIAL_INVOICE: "Commercial Invoice",
  PACKING_LIST: "Packing List",
  UNKNOWN: "Document",
};

export const CHANNEL: Record<string, { label: string; tone: Tone }> = {
  GREEN_CHANNEL_APPROVED: { label: "Green channel", tone: "good" },
  YELLOW_CHANNEL_DOCUMENT_ASSESSMENT: { label: "Yellow channel", tone: "warn" },
  RED_CHANNEL_HOLD: { label: "Red channel", tone: "bad" },
};

/** Drops trailing qualifiers like "(Golden Path)" from demo case titles. */
export const shortTitle = (t?: string) => (t ?? "").replace(/\s*\(.*\)\s*$/, "");
