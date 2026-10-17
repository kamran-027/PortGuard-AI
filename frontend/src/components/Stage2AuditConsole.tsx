"use client";

import React from "react";
import { AuditResult, Discrepancy } from "@/lib/types";
import {
  Button,
  Card,
  DOC_LABELS,
  Field,
  SectionHeader,
  Status,
  Tone,
  formatInr,
  formatUsd,
} from "./ui";

interface Stage2AuditConsoleProps {
  auditResult: AuditResult | null;
  onProceedToCertificate?: () => void;
}

const severityTone: Record<string, Tone> = {
  CRITICAL: "bad",
  WARNING: "warn",
  INFO: "neutral",
};

function CheckCard({
  title,
  tone,
  verdict,
  children,
}: {
  title: string;
  tone: Tone;
  verdict: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-zinc-900">{title}</h3>
        <Status tone={tone}>{verdict}</Status>
      </div>
      {children}
    </Card>
  );
}

const severityEdge: Record<string, string> = {
  CRITICAL: "border-l-red-500",
  WARNING: "border-l-amber-500",
  INFO: "border-l-zinc-300",
};

const barColor: Record<Tone, string> = {
  neutral: "bg-zinc-400",
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-red-500",
};

function WeightBars({
  rows,
  tone,
}: {
  rows: { label: string; kg: number }[];
  tone: Tone;
}) {
  const max = Math.max(...rows.map((r) => r.kg), 1);
  return (
    <div className="mt-4 space-y-2">
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-8 text-xs text-zinc-500">{r.label}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                i === 0 ? "bg-zinc-800" : barColor[tone]
              }`}
              style={{ width: `${(r.kg / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Renders the model's light markdown: paragraphs and **bold** spans. */
function ModelText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para, i) => {
          // A paragraph that is only bold text is a heading.
          const heading = para.match(/^\*\*(.+)\*\*$/);
          if (heading) {
            return (
              <p key={i} className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {heading[1]}
              </p>
            );
          }
          return (
            <p key={i} className="whitespace-pre-line">
              {para.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={j} className="font-medium text-zinc-900">
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  part
                )
              )}
            </p>
          );
        })}
    </>
  );
}

function DiscrepancyRow({ d }: { d: Discrepancy }) {
  return (
    <li
      className={`border-l-2 px-5 py-4 ${severityEdge[d.severity] ?? "border-l-zinc-300"}`}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <Status tone={severityTone[d.severity] ?? "neutral"}>
            <span className="text-zinc-900">{d.title}</span>
          </Status>
          <p className="mt-1 text-sm text-zinc-600">{d.description}</p>
        </div>
        <div className="shrink-0 text-sm text-zinc-500 sm:text-right">
          {formatInr(d.estimated_penalty_inr)}
          <span className="text-zinc-400"> · {formatUsd(d.estimated_penalty_usd)}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-x-8 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <span className="text-zinc-500">Expected</span>
          <span className="font-mono text-[13px] text-zinc-900">{d.expected_value}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-zinc-500">Found</span>
          <span className="font-mono text-[13px] text-zinc-900">{d.found_value}</span>
        </div>
      </div>

      <p className="mt-3 text-sm text-zinc-700">
        <span className="text-zinc-500">Fix: </span>
        {d.remediation_action}
        {d.regulatory_clause && (
          <span className="text-zinc-400"> ({d.regulatory_clause})</span>
        )}
      </p>
    </li>
  );
}

export default function Stage2AuditConsole({
  auditResult,
  onProceedToCertificate,
}: Stage2AuditConsoleProps) {
  if (!auditResult) {
    return (
      <section className="space-y-4">
        <SectionHeader title="Audit" />
        <Card className="p-5 text-sm text-zinc-500">
          Run the checks to compare documents.
        </Card>
      </section>
    );
  }

  const { summary, discrepancies, analyzed_documents, ai_compliance_assessment } =
    auditResult;

  const find = (t: string) => analyzed_documents.find((d) => d.doc_type === t);
  const blDoc = find("BILL_OF_LADING");
  const plDoc = find("PACKING_LIST");
  const ciDoc = find("COMMERCIAL_INVOICE");

  const blWeight = blDoc?.weights?.gross_weight_kg ?? 0;
  const plWeight = plDoc?.weights?.gross_weight_kg ?? 0;
  const weightDelta = Math.abs(blWeight - plWeight);
  const variancePct = blWeight > 0 ? (weightDelta / blWeight) * 100 : 0;
  const weightTone: Tone =
    variancePct <= 1 ? "good" : variancePct <= 3 ? "warn" : "bad";

  const blHs = blDoc?.hs_items?.[0]?.hs_code;
  const ciHs = ciDoc?.hs_items?.[0]?.hs_code;
  const hsMismatch = Boolean(blHs && ciHs && blHs !== ciHs);

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Audit"
        description={`${summary.total_checks} cross-document checks · ${summary.passed_checks} passed · ${summary.critical_count} critical · ${summary.warning_count} warnings`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CheckCard
          title="Gross weight"
          tone={weightTone}
          verdict={
            weightDelta === 0
              ? "Match"
              : `${variancePct.toFixed(2)}% variance`
          }
        >
          <dl className="divide-y divide-zinc-100">
            <Field label="Bill of Lading" value={`${blWeight.toLocaleString()} kg`} mono />
            <Field label="Packing List" value={`${plWeight.toLocaleString()} kg`} mono />
            <Field label="Difference" value={`${weightDelta.toLocaleString()} kg`} mono />
          </dl>
          <WeightBars
            tone={weightTone}
            rows={[
              { label: "B/L", kg: blWeight },
              { label: "PL", kg: plWeight },
            ]}
          />
        </CheckCard>

        <CheckCard
          title="HS classification"
          tone={hsMismatch ? "bad" : "good"}
          verdict={hsMismatch ? "Mismatch" : "Match"}
        >
          <dl className="divide-y divide-zinc-100">
            <Field label="Bill of Lading" value={blHs} mono />
            <Field label="Commercial Invoice" value={ciHs} mono />
            <Field
              label="Description"
              value={ciDoc?.hs_items?.[0]?.description ?? blDoc?.hs_items?.[0]?.description}
            />
          </dl>
        </CheckCard>
      </div>

      <Card>
        <div className="border-b border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-900">
          Issues <span className="font-normal text-zinc-500">({discrepancies.length})</span>
        </div>
        {discrepancies.length === 0 ? (
          <p className="px-5 py-4 text-sm text-zinc-600">
            No discrepancies across{" "}
            {analyzed_documents.map((d) => DOC_LABELS[d.doc_type]).join(", ")}.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {discrepancies.map((d) => (
              <DiscrepancyRow key={d.id} d={d} />
            ))}
          </ul>
        )}
      </Card>

      {ai_compliance_assessment && (
        <Card className="p-5">
          <h3 className="text-sm font-medium text-zinc-900">Model assessment</h3>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-zinc-700">
            <ModelText text={ai_compliance_assessment} />
          </div>
        </Card>
      )}

      {onProceedToCertificate && (
        <div className="flex justify-end">
          <Button onClick={onProceedToCertificate}>View certificate →</Button>
        </div>
      )}
    </section>
  );
}
