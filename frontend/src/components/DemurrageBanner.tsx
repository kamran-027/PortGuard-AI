"use client";

import React from "react";
import { AuditResult, CertificateStatus } from "@/lib/types";
import { Card, CHANNEL, Status, Tone, formatInr, formatUsd } from "./ui";

interface DemurrageBannerProps {
  auditResult?: AuditResult | null;
  channelStatus?: CertificateStatus | null;
  consignmentTitle?: string;
}

function Stat({
  label,
  children,
  sub,
}: {
  label: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="bg-white px-5 py-4">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
        {children}
      </div>
      {sub && <div className="mt-0.5 text-sm text-zinc-500">{sub}</div>}
    </div>
  );
}

export default function DemurrageBanner({
  auditResult,
  channelStatus,
  consignmentTitle,
}: DemurrageBannerProps) {
  if (!auditResult) {
    return (
      <Card className="px-5 py-4 text-sm text-zinc-500">
        No consignment loaded yet. Pick a sample case below to run the checks.
      </Card>
    );
  }

  const { demurrage_estimate: est, summary } = auditResult;
  const isClean = summary.status === "CLEARED";
  const statusTone: Tone = isClean
    ? "good"
    : summary.critical_count > 0
    ? "bad"
    : "warn";
  const channel = channelStatus ? CHANNEL[channelStatus] : undefined;

  return (
    <Card>
      {consignmentTitle && (
        <div className="border-b border-zinc-200 px-5 py-3 text-sm text-zinc-500">
          {consignmentTitle}
        </div>
      )}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-lg bg-zinc-200 lg:grid-cols-4">
        <Stat
          label="Audit result"
          sub={`${summary.passed_checks} of ${summary.total_checks} checks passed`}
        >
          <Status tone={statusTone}>
            <span className="text-xl font-semibold">
              {isClean ? "Cleared" : `${auditResult.discrepancies.length} issues`}
            </span>
          </Status>
        </Stat>
        <Stat label="Expected routing">
          {channel ? (
            <Status tone={channel.tone}>
              <span className="text-xl font-semibold">{channel.label}</span>
            </Status>
          ) : (
            "—"
          )}
        </Stat>
        <Stat label="Hold days avoided">
          {isClean ? 0 : est.estimated_hold_days}
        </Stat>
        <Stat
          label="Cost avoided"
          sub={isClean ? undefined : formatUsd(est.total_averted_usd)}
        >
          {formatInr(isClean ? 0 : est.total_averted_inr)}
        </Stat>
      </div>
    </Card>
  );
}
