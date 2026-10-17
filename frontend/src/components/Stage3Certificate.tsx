"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy } from "lucide-react";
import { IcegateCertificate } from "@/lib/types";
import {
  Button,
  Card,
  CHANNEL,
  Field,
  SectionHeader,
  Status,
  formatInr,
} from "./ui";

interface Stage3CertificateProps {
  certificate: IcegateCertificate | null;
}

const fmtDate = (s?: string) => (s ? new Date(s).toLocaleString() : undefined);

export default function Stage3Certificate({ certificate }: Stage3CertificateProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!certificate) {
    return (
      <section className="space-y-4">
        <SectionHeader title="Certificate" />
        <Card className="p-5 text-sm text-zinc-500">
          The certificate is generated after the audit runs.
        </Card>
      </section>
    );
  }

  const channel = CHANNEL[certificate.channel_status];
  const isGreen = certificate.channel_status === "GREEN_CHANNEL_APPROVED";

  const handleCopyHash = () => {
    navigator.clipboard.writeText(certificate.digital_signature_hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(certificate, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${certificate.certificate_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const certificateCard = (
    <Card className="overflow-hidden print:border-black">
      <div
        className={`h-1 ${
          channel?.tone === "good"
            ? "bg-emerald-500"
            : channel?.tone === "warn"
            ? "bg-amber-500"
            : "bg-red-500"
        }`}
      />
      <div className="flex flex-col gap-4 border-b border-zinc-200 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="font-semibold tracking-tight text-zinc-900">PortGuard</span>
            <span className="h-3.5 w-px bg-zinc-300" />
            Pre-clearance certificate
          </div>
          <div className="mt-2 font-mono text-sm text-zinc-900">
            {certificate.certificate_id}
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            Issued {fmtDate(certificate.issue_date)}
            {certificate.valid_until && <> · valid until {fmtDate(certificate.valid_until)}</>}
          </div>
        </div>
        <div className="sm:text-right">
          {channel && (
            <Status tone={channel.tone}>
              <span className="text-lg font-semibold">{channel.label}</span>
            </Status>
          )}
          <p className="mt-1 max-w-xs text-sm text-zinc-500">
            {isGreen
              ? "No discrepancies found. Eligible for facilitated clearance."
              : "Discrepancies found. Expect examination before release."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-10 p-6 md:grid-cols-2">
        <dl className="divide-y divide-zinc-100">
          <Field
            label="Customs station"
            value={`${certificate.customs_station_name} (${certificate.customs_station})`}
          />
          <Field label="Importer" value={certificate.importer_name} />
          <Field label="IEC" value={certificate.importer_iec} mono />
          {certificate.importer_gstin && (
            <Field label="GSTIN" value={certificate.importer_gstin} mono />
          )}
          <Field label="Bill of Entry category" value={certificate.bill_of_entry_category} />
        </dl>
        <dl className="divide-y divide-zinc-100">
          <Field label="B/L no." value={certificate.bill_of_lading_no} mono />
          <Field
            label="Vessel / voyage"
            value={
              [certificate.vessel_name, certificate.voyage_no].filter(Boolean).join(" / ") ||
              undefined
            }
          />
          <Field label="Containers" value={certificate.containers.join(", ")} mono />
          <Field
            label="Gross weight"
            value={`${certificate.total_gross_weight_kg.toLocaleString()} kg`}
            mono
          />
          <Field label="HS codes" value={certificate.harmonized_codes.join(", ")} mono />
          <Field label="Risk level" value={certificate.risk_level} />
          <Field
            label="Cost avoided"
            value={formatInr(certificate.demurrage_averted_inr)}
          />
        </dl>
      </div>

      <div className="border-t border-zinc-200 px-6 py-4">
        <div className="text-sm text-zinc-500">SHA-256</div>
        <div className="mt-1 flex items-start gap-2">
          <code className="break-all font-mono text-[13px] text-zinc-700">
            {certificate.digital_signature_hash}
          </code>
          <button
            onClick={handleCopyHash}
            className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 print:hidden"
            title="Copy hash"
          >
            {copiedHash ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        {certificate.icegate_edi_version && (
          <div className="mt-1 text-sm text-zinc-400">
            EDI {certificate.icegate_edi_version}
          </div>
        )}
      </div>
    </Card>
  );

  // Name the saved PDF after the certificate rather than the app.
  const handlePrint = () => {
    const previousTitle = document.title;
    document.title = certificate.certificate_id;
    window.addEventListener("afterprint", () => (document.title = previousTitle), { once: true });
    window.print();
  };

  return (
    <section className="space-y-4">
      <div className="print:hidden">
        <SectionHeader
          title="Certificate"
          description="Pre-clearance summary for ICEGATE filing."
          actions={
            <>
              <Button onClick={handleDownloadJson}>Export JSON</Button>
              <Button onClick={handlePrint}>Print</Button>
            </>
          }
        />
      </div>

      {certificateCard}

      {/* Print-only copy, attached to <body> so printing can hide the rest of the page. */}
      {typeof document !== "undefined" &&
        createPortal(<div className="print-root">{certificateCard}</div>, document.body)}
    </section>
  );
}
