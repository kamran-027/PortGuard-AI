"use client";

import React from "react";
import { AuditResult, CertificateStatus } from "@/lib/types";
import { CHANNEL, Pill, Tone, formatInr, formatUsd } from "./ui";

interface DemurrageBannerProps {
  auditResult?: AuditResult | null;
  channelStatus?: CertificateStatus | null;
  title?: string;
  subtitle?: string | null;
}

const valueTone: Record<Tone, string> = {
  neutral: "text-white",
  good: "text-emerald-300",
  warn: "text-amber-300",
  bad: "text-red-300",
};

function Stat({
  label,
  tone = "neutral",
  children,
  sub,
}: {
  label: string;
  tone?: Tone;
  children: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="lg:px-6 lg:first:pl-0">
      <dt className="text-sm text-zinc-400">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${valueTone[tone]}`}>
        {children}
      </dd>
      {sub && <dd className="mt-0.5 text-sm text-zinc-500">{sub}</dd>}
    </div>
  );
}

export default function DemurrageBanner({
  auditResult,
  channelStatus,
  title,
  subtitle,
}: DemurrageBannerProps) {
  const summary = auditResult?.summary;
  const est = auditResult?.demurrage_estimate;
  const isClean = summary?.status === "CLEARED";
  const statusTone: Tone = !summary
    ? "neutral"
    : isClean
    ? "good"
    : summary.critical_count > 0
    ? "bad"
    : "warn";
  const channel = channelStatus ? CHANNEL[channelStatus] : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-7 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {title ?? "Loading consignment…"}
        </h1>
        {title && !summary && (
          <Pill tone="neutral" dark>
            Not checked
          </Pill>
        )}
        {summary && (
          <Pill tone={statusTone} dark>
            {isClean
              ? "Cleared"
              : `${auditResult!.discrepancies.length} issue${
                  auditResult!.discrepancies.length === 1 ? "" : "s"
                }`}
          </Pill>
        )}
      </div>
      {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-white/10">
        <Stat
          label="Checks passed"
          tone={statusTone}
          sub={summary && `${summary.critical_count} critical · ${summary.warning_count} warnings`}
        >
          {summary ? `${summary.passed_checks}/${summary.total_checks}` : "—"}
        </Stat>
        <Stat label="Expected routing" tone={channel?.tone}>
          {channel?.label ?? "—"}
        </Stat>
        <Stat label="Hold days avoided">
          {est ? (isClean ? 0 : est.estimated_hold_days) : "—"}
        </Stat>
        <Stat
          label="Cost avoided"
          sub={est && !isClean ? formatUsd(est.total_averted_usd) : undefined}
        >
          {est ? formatInr(isClean ? 0 : est.total_averted_inr) : "—"}
        </Stat>
      </dl>
    </div>
  );
}
