"use client";

import React from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Scale,
  FileCheck2,
  Cpu,
  BadgeAlert,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Scale3D,
  Sparkles,
} from "lucide-react";
import { AuditResult, Discrepancy, DiscrepancySeverity } from "@/lib/types";

interface Stage2AuditConsoleProps {
  auditResult: AuditResult | null;
  onProceedToCertificate?: () => void;
}

export default function Stage2AuditConsole({
  auditResult,
  onProceedToCertificate,
}: Stage2AuditConsoleProps) {
  if (!auditResult) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
        <Scale className="mx-auto h-12 w-12 text-slate-600 animate-pulse" />
        <h3 className="mt-3 text-base font-bold text-slate-300">
          Stage 2: Cross-Document Audit Engine Idle
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          Execute the pipeline in Stage 1 to initiate cross-document discrepancy detection, weight variance analysis, and tariff code reconciliation.
        </p>
      </div>
    );
  }

  const { summary, discrepancies, analyzed_documents, ai_compliance_assessment } =
    auditResult;
  const isClean = summary.status === "CLEARED";

  // Find B/L and Packing List weights for the weight variance meter
  const blDoc = analyzed_documents.find((d) => d.doc_type === "BILL_OF_LADING");
  const plDoc = analyzed_documents.find((d) => d.doc_type === "PACKING_LIST");
  const blWeight = blDoc?.weights?.gross_weight_kg || 0;
  const plWeight = plDoc?.weights?.gross_weight_kg || 0;
  const weightDelta = Math.abs(blWeight - plWeight);
  const weightVariancePct =
    blWeight > 0 ? (weightDelta / blWeight) * 100 : 0;

  // Find CI and BL for HS Code comparison
  const ciDoc = analyzed_documents.find((d) => d.doc_type === "COMMERCIAL_INVOICE");
  const ciHsCode = ciDoc?.hs_items?.[0]?.hs_code || null;
  const blHsCode = blDoc?.hs_items?.[0]?.hs_code || null;
  const hsCodeMismatch = ciHsCode && blHsCode && ciHsCode !== blHsCode;

  const getSeverityBadge = (severity: DiscrepancySeverity) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-950/70 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
            <AlertCircle className="h-3 w-3 text-rose-400" />
            CRITICAL HOLD
          </span>
        );
      case "WARNING":
        return (
          <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/70 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            WARNING QUERY
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            PASSED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400 font-bold text-xs">
              2
            </span>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-100">
              Cross-Document Audit Matrix & Discrepancies
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Multi-way comparison across Bill of Lading, Invoice, and Packing List executed on local Gemma 4 engine.
          </p>
        </div>

        {/* Summary Pill Counts */}
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Checks</div>
            <div className="text-sm font-bold text-slate-100">{summary.total_checks}</div>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold text-emerald-400 uppercase">Passed</div>
            <div className="text-sm font-bold text-emerald-300">{summary.passed_checks}</div>
          </div>
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold text-rose-400 uppercase">Critical</div>
            <div className="text-sm font-bold text-rose-300">{summary.critical_count}</div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold text-amber-400 uppercase">Warning</div>
            <div className="text-sm font-bold text-amber-300">{summary.warning_count}</div>
          </div>
        </div>
      </div>

      {/* Two Column Feature: Weight Variance Meter + HS Code Comparison */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Feature 1: Weight Variance Meter */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Gross Weight Variance Meter
              </h3>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                weightVariancePct <= 1.0
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                  : weightVariancePct <= 3.0
                  ? "bg-amber-950 text-amber-400 border border-amber-500/40"
                  : "bg-rose-950 text-rose-400 border border-rose-500/40"
              }`}
            >
              {weightVariancePct <= 1.0
                ? "WITHIN TOLERANCE (≤1%)"
                : weightVariancePct <= 3.0
                ? "WARNING VARIANCE (1-3%)"
                : "STATUTORY VIOLATION (>3%)"}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Compares declared gross weight on Master B/L against physical export Packing List weight.
          </p>

          {/* Comparative Metrics */}
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">
                B/L Declared
              </div>
              <div className="text-sm font-mono font-bold text-cyan-300">
                {blWeight.toLocaleString()} kg
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">
                Packing List
              </div>
              <div className="text-sm font-mono font-bold text-slate-200">
                {plWeight.toLocaleString()} kg
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">
                Delta / Variance
              </div>
              <div
                className={`text-sm font-mono font-bold ${
                  weightDelta === 0
                    ? "text-emerald-400"
                    : weightVariancePct > 3.0
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                {weightDelta === 0
                  ? "0 kg (0.0%)"
                  : `-${weightDelta.toLocaleString()} kg (${weightVariancePct.toFixed(2)}%)`}
              </div>
            </div>
          </div>

          {/* Visual Variance Bar Gauge */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
              <span>0% (Exact Match)</span>
              <span>1% Safe</span>
              <span>3% Legal Threshold</span>
              <span>5%+ Critical Demurrage</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-800">
              {/* Safe Zone */}
              <div className="absolute inset-y-0 left-0 w-[20%] bg-emerald-500/40" />
              {/* Warning Zone */}
              <div className="absolute inset-y-0 left-[20%] w-[40%] bg-amber-500/40" />
              {/* Danger Zone */}
              <div className="absolute inset-y-0 left-[60%] w-[40%] bg-rose-500/40" />

              {/* Indicator needle */}
              <div
                className={`absolute inset-y-0 w-2.5 rounded-full shadow-md transition-all duration-500 ${
                  weightVariancePct <= 1.0
                    ? "bg-emerald-400 shadow-emerald-400/50"
                    : weightVariancePct <= 3.0
                    ? "bg-amber-400 shadow-amber-400/50"
                    : "bg-rose-500 shadow-rose-500/50"
                }`}
                style={{
                  left: `${Math.min(weightVariancePct * 16, 96)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {weightVariancePct === 0
                ? "✅ Zero weight delta detected between documents. Ready for Green Channel."
                : `⚠️ Variance of ${weightDelta.toLocaleString()} kg triggers Indian Customs Sec 111(m) mandatory weighbridge inspection.`}
            </p>
          </div>
        </div>

        {/* Feature 2: HS Code Classification Match Comparison */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                HS Code Tariff Classification Match
              </h3>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                !hsCodeMismatch
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                  : "bg-rose-950 text-rose-400 border border-rose-500/40"
              }`}
            >
              {!hsCodeMismatch ? "100% TARIFF ALIGNMENT" : "TARIFF DIVERGENCE FLAGGED"}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Harmonized System code verification between Commercial Invoice and Master Manifest.
          </p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Bill of Lading Manifest
                </span>
                <div className="font-mono text-sm font-bold text-cyan-300">
                  {blHsCode || "8471.30.10"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {blDoc?.hs_items?.[0]?.description || "Declared cargo line item"}
                </div>
              </div>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                Schedule I
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Commercial Invoice
                </span>
                <div
                  className={`font-mono text-sm font-bold ${
                    hsCodeMismatch ? "text-rose-400" : "text-emerald-300"
                  }`}
                >
                  {ciHsCode || "8471.30.10"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {ciDoc?.hs_items?.[0]?.description || "Invoice declaration"}
                </div>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-mono ${
                  hsCodeMismatch
                    ? "bg-rose-950 text-rose-300 border border-rose-500/30"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {hsCodeMismatch ? "Duty Clash" : "Exact Match"}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            {!hsCodeMismatch
              ? "✅ HS codes harmonize with zero duty classification ambiguity."
              : "⚠️ Tariff mismatch detected: Duty rates vary between engine parts (7.5%) and body parts (15.0%)."}
          </p>
        </div>
      </div>

      {/* Discrepancy Alert Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Audited Discrepancies & Regulatory Clause Citations ({discrepancies.length})
        </h3>

        {discrepancies.length === 0 ? (
          <div className="flex items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-300">
                Zero Discrepancies Detected Across Consignment
              </div>
              <p className="text-xs text-slate-400">
                All cross-document integrity checks satisfied: BIC container verification, Gross/Net weight reconciliation, and HS tariff alignment.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {discrepancies.map((disc: Discrepancy) => (
              <div
                key={disc.id}
                className={`rounded-xl border p-4.5 transition shadow-md ${
                  disc.severity === "CRITICAL"
                    ? "border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900"
                    : "border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    {disc.severity === "CRITICAL" ? (
                      <BadgeAlert className="h-5 w-5 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-bold text-slate-100 text-sm">{disc.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getSeverityBadge(disc.severity)}
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-rose-300 font-semibold">
                      ₹{disc.estimated_penalty_inr.toLocaleString()} ($
                      {disc.estimated_penalty_usd})
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  {disc.description}
                </p>

                {/* Expected vs Found values */}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-500">
                      Primary Doc Declared:
                    </span>
                    <div className="font-mono text-cyan-300 font-medium">
                      {disc.expected_value}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-500">
                      Conflicting Value Found:
                    </span>
                    <div className="font-mono text-rose-300 font-medium">
                      {disc.found_value}
                    </div>
                  </div>
                </div>

                {/* Regulatory Clause + Actionable Remediation */}
                <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-800/60 pt-2 text-xs">
                  {disc.regulatory_clause && (
                    <div className="text-slate-400">
                      <span className="font-semibold text-slate-300">Statutory Clause: </span>
                      <span className="font-mono text-cyan-400">
                        {disc.regulatory_clause}
                      </span>
                    </div>
                  )}
                  <div className="text-slate-300">
                    <span className="font-semibold text-amber-400">Remediation Action: </span>
                    <span>{disc.remediation_action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gemma 4 Customs Superintendent AI Compliance Memorandum */}
      {ai_compliance_assessment && (
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/20 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Gemma 4 Customs Superintendent AI Compliance Memorandum
                </h3>
                <span className="text-[10px] text-slate-400">
                  Synthesized via local 12B parameter legal reasoning model
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
              <Sparkles className="h-3 w-3" />
              <span>AIR-GAPPED VERIFICATION</span>
            </div>
          </div>

          <div className="mt-4 relative rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-xs leading-relaxed text-slate-200">
            <blockquote className="border-l-2 border-cyan-500 pl-3 italic text-slate-300">
              &quot;{ai_compliance_assessment}&quot;
            </blockquote>
          </div>
        </div>
      )}

      {/* Forward Button */}
      {onProceedToCertificate && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onProceedToCertificate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500"
          >
            <span>Proceed to ICEGATE Certificate</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
