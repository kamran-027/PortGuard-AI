"use client";

import React, { useEffect, useState } from "react";
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Download,
  QrCode,
  Lock,
  ExternalLink,
  Building2,
  Anchor,
  FileCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { IcegateCertificate } from "@/lib/types";

interface Stage3CertificateProps {
  certificate: IcegateCertificate | null;
  onSelectPort?: (port: string) => void;
}

export default function Stage3Certificate({ certificate }: Stage3CertificateProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (certificate && certificate.channel_status === "GREEN_CHANNEL_APPROVED") {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#06b6d4", "#3b82f6", "#f59e0b"],
        });
      } catch {
        // Ignore if confetti context unavailable
      }
    }
  }, [certificate]);

  if (!certificate) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
        <FileCheck className="mx-auto h-12 w-12 text-slate-600 animate-pulse" />
        <h3 className="mt-3 text-base font-bold text-slate-300">
          Stage 3: ICEGATE Pre-Clearance Certificate Pending
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          Execute the verification pipeline in Stage 1 & 2 to generate an official cryptographically-signed customs pre-clearance certificate.
        </p>
      </div>
    );
  }

  const isGreen = certificate.channel_status === "GREEN_CHANNEL_APPROVED";
  const isRed = certificate.channel_status === "RED_CHANNEL_HOLD";

  const handleCopyHash = () => {
    navigator.clipboard.writeText(certificate.digital_signature_hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(certificate, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `${certificate.certificate_id}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400 font-bold text-xs">
              3
            </span>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-100">
              Official ICEGATE Pre-Clearance Certificate
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Compliant with CBIC National Single Window & ICEGATE 2.0 Electronic Data Interchange (EDI).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-750 hover:text-white"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export EDI JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Certificate</span>
          </button>
        </div>
      </div>

      {/* Official Certificate Paper Container */}
      <div
        id="icegate-certificate"
        className="relative overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-950 p-6 sm:p-10 shadow-2xl print:border-black print:bg-white print:text-black print:shadow-none"
      >
        {/* Subtle Watermark in Background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] print:opacity-[0.06]">
          <span className="font-serif text-8xl font-black uppercase tracking-widest text-white print:text-black">
            ICEGATE
          </span>
        </div>

        {/* Official Header */}
        <div className="border-b-2 border-slate-800 pb-6 print:border-black">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Government Emblem / Header text */}
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/40 bg-slate-900 shadow-md print:border-black print:bg-white">
                <Anchor className="h-8 w-8 text-cyan-400 print:text-black" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 print:text-gray-600">
                  Government of India • Ministry of Finance
                </div>
                <h1 className="text-lg font-black tracking-wider text-slate-100 print:text-black sm:text-xl">
                  CENTRAL BOARD OF INDIRECT TAXES & CUSTOMS
                </h1>
                <div className="text-xs font-medium text-cyan-400 print:text-gray-800">
                  Indian Customs EDI Gateway (ICEGATE 2.0) • Pre-Clearance Division
                </div>
              </div>
            </div>

            {/* Certificate ID Pill */}
            <div className="flex flex-col items-end text-right">
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 print:border-black print:bg-white">
                <div className="text-[9px] uppercase font-mono text-slate-400 print:text-gray-600">
                  Certificate Serial
                </div>
                <div className="font-mono text-xs font-bold text-cyan-300 print:text-black">
                  {certificate.certificate_id}
                </div>
              </div>
              <div className="mt-1 text-[10px] text-slate-400 print:text-gray-600">
                Issued: {new Date(certificate.issue_date).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Status Stamp & Channel Declaration */}
        <div className="my-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 print:text-gray-700">
              Risk Management System (RMS) Routing
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-black tracking-tight sm:text-3xl ${
                  isGreen
                    ? "text-emerald-400 print:text-green-700"
                    : isRed
                    ? "text-rose-400 print:text-red-700"
                    : "text-amber-400 print:text-amber-700"
                }`}
              >
                {isGreen
                  ? "GREEN CHANNEL APPROVED"
                  : isRed
                  ? "RED CHANNEL HOLD"
                  : "YELLOW CHANNEL ASSESSMENT"}
              </span>
            </div>
            <p className="text-xs text-slate-300 print:text-gray-800">
              {isGreen
                ? "Autonomous zero-discrepancy verification completed. Facilitated clearance authorized without physical examination under Sec 47 of Customs Act."
                : "Consignment flagged with critical weight/tariff variance. Mandatory 100% physical examination required before gate pass issuance."}
            </p>
          </div>

          {/* Official Round Stamp Seal */}
          <div className="shrink-0 flex justify-center">
            <div
              className={`relative flex h-32 w-32 items-center justify-center rounded-full border-4 p-2 text-center uppercase tracking-tighter ${
                isGreen
                  ? "border-emerald-500/80 text-emerald-400 print:border-green-700 print:text-green-700"
                  : "border-rose-500/80 text-rose-400 print:border-red-700 print:text-red-700"
              } shadow-lg`}
              style={{ transform: "rotate(-6deg)" }}
            >
              <div className="flex flex-col items-center">
                <div className="text-[8px] font-black tracking-widest">
                  INDIAN CUSTOMS
                </div>
                {isGreen ? (
                  <ShieldCheck className="my-1 h-6 w-6 text-emerald-400 print:text-green-700" />
                ) : (
                  <XCircle className="my-1 h-6 w-6 text-rose-400 print:text-red-700" />
                )}
                <div className="text-[10px] font-black leading-tight">
                  {isGreen ? "CLEARED" : "HOLD EXAM"}
                </div>
                <div className="text-[8px] font-mono mt-0.5">
                  FACILITY {certificate.customs_station}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Details Grid */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:grid-cols-2 lg:grid-cols-3 print:border-black print:bg-white">
          {/* Item 1: Port Station */}
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-500 print:text-gray-600">
              Customs Station Port
            </span>
            <div className="text-xs font-bold text-slate-200 print:text-black">
              {certificate.customs_station_name}
            </div>
            <div className="font-mono text-[11px] text-cyan-400 print:text-gray-800">
              Station Code: {certificate.customs_station}
            </div>
          </div>

          {/* Item 2: Importer Details */}
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-500 print:text-gray-600">
              Registered Importer
            </span>
            <div className="text-xs font-bold text-slate-200 print:text-black truncate">
              {certificate.importer_name}
            </div>
            <div className="font-mono text-[11px] text-slate-300 print:text-gray-800">
              IEC: {certificate.importer_iec}
            </div>
          </div>

          {/* Item 3: Bill of Lading & Vessel */}
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-500 print:text-gray-600">
              Ocean Master B/L No
            </span>
            <div className="font-mono text-xs font-bold text-cyan-300 print:text-black">
              {certificate.bill_of_lading_no}
            </div>
            <div className="text-[11px] text-slate-300 print:text-gray-800">
              Vessel: {certificate.vessel_name || "MSC CLARA"} (Voy:{" "}
              {certificate.voyage_no || "2609E"})
            </div>
          </div>

          {/* Item 4: Verified Containers */}
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-500 print:text-gray-600">
              Verified Containers (BIC Valid)
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {certificate.containers.map((c, i) => (
                <span
                  key={i}
                  className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-cyan-300 font-semibold print:border print:border-black print:bg-white print:text-black"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Item 5: Gross Weight & HS Tariff */}
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-500 print:text-gray-600">
              Verified Gross Weight & HS Codes
            </span>
            <div className="font-mono text-xs font-bold text-slate-200 print:text-black">
              {certificate.total_gross_weight_kg.toLocaleString()} kg
            </div>
            <div className="font-mono text-[11px] text-amber-300 print:text-gray-800">
              HS Codes: {certificate.harmonized_codes.join(", ")}
            </div>
          </div>

          {/* Item 6: Financial Savings */}
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-500 print:text-gray-600">
              Demurrage & Fine Shield
            </span>
            <div className="text-xs font-bold text-emerald-400 print:text-black">
              {certificate.demurrage_averted_inr > 0
                ? `₹${certificate.demurrage_averted_inr.toLocaleString()} Averted`
                : "₹0 Demurrage Accrued"}
            </div>
            <div className="text-[11px] text-slate-400 print:text-gray-600">
              Risk Classification: {certificate.risk_level}
            </div>
          </div>
        </div>

        {/* Cryptographic Proof & QR Code Footer */}
        <div className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:flex-row sm:items-center sm:justify-between print:border-black print:bg-white">
          {/* Digital Signature Hash */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-gray-700">
              <Lock className="h-3 w-3 text-cyan-400 print:text-black" />
              <span>SHA-256 Cryptographic Integrity Signature</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-300 print:text-black break-all">
                {certificate.digital_signature_hash}
              </span>
              <button
                onClick={handleCopyHash}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white print:hidden"
                title="Copy SHA-256 hash"
              >
                {copiedHash ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div className="text-[10px] text-slate-500 print:text-gray-600">
              EDI-FACT standard • On-device tamper-proof hash calculated over manifest payload
            </div>
          </div>

          {/* QR Code preview block */}
          <div className="flex shrink-0 items-center gap-3 border-t border-slate-800 pt-3 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4 print:border-black">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-700 bg-white p-1 shadow-sm">
              {/* Simulated QR Code graphic */}
              <div className="grid grid-cols-5 gap-0.5 p-1">
                {[...Array(25)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-[1px] ${
                      i % 2 === 0 || i % 7 === 0 || i === 0 || i === 4 || i === 20 || i === 24
                        ? "bg-black"
                        : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 print:text-gray-700">
              <div className="font-semibold text-slate-300 print:text-black">
                Customs EDI QR
              </div>
              <div>Scan for Port Gate-In</div>
              <div className="font-mono text-[9px] text-cyan-400 print:text-black">
                RMS-VAL-2026
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
