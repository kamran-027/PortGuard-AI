"use client";

import React, { useState } from "react";
import { AlertCircle, Check, Copy, Loader2 } from "lucide-react";
import {
  ParsedDocument,
  DemoCaseSummary,
  SourceDoc,
  UploadEntry,
  UploadSlot,
} from "@/lib/types";
import UploadPanel from "./UploadPanel";
import {
  Button,
  Card,
  DOC_LABELS,
  Field,
  SectionHeader,
  Segmented,
  shortTitle,
} from "./ui";

export type DocSource = "sample" | "upload";

interface Stage1UploadProps {
  source: DocSource;
  onSourceChange: (source: DocSource) => void;
  demoCases: DemoCaseSummary[];
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
  uploads: Partial<Record<UploadSlot, UploadEntry>>;
  onUploadChange: (slot: UploadSlot, file: File | null) => void;
  /** Source documents for the current selection, index-aligned with parsedDocuments. */
  documents: SourceDoc[];
  parsedDocuments: ParsedDocument[];
  isLoading: boolean;
  progress?: string | null;
  error?: string | null;
  canRun: boolean;
  onRunPipeline: () => void;
}

const kg = (n?: number) => (n || n === 0 ? `${n.toLocaleString()} kg` : undefined);

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1 text-sm font-medium text-zinc-900">{title}</h4>
      <dl className="divide-y divide-zinc-100">{children}</dl>
    </div>
  );
}

function SourceView({ doc }: { doc?: SourceDoc }) {
  if (doc?.pdf_url) {
    return (
      <iframe
        src={doc.pdf_url}
        title={doc.name ?? "Uploaded PDF"}
        className="h-[32rem] w-full rounded-md border border-zinc-200 bg-zinc-50"
      />
    );
  }
  return (
    <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-4 font-mono text-[13px] leading-relaxed text-zinc-700">
      {doc?.raw_text || (doc ? "No source text available." : "Loading…")}
    </pre>
  );
}

export default function Stage1Upload({
  source,
  onSourceChange,
  demoCases,
  activeCaseId,
  onSelectCase,
  uploads,
  onUploadChange,
  documents,
  parsedDocuments,
  isLoading,
  progress,
  error,
  canRun,
  onRunPipeline,
}: Stage1UploadProps) {
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"structured" | "raw">("structured");
  const [copied, setCopied] = useState(false);

  const docIndex = Math.min(selectedDocIndex, Math.max(documents.length - 1, 0));
  const currentSource = documents[docIndex];
  const doc = parsedDocuments?.[docIndex];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Documents"
        description="Fields extracted from each shipping document."
        actions={
          <Button variant="primary" onClick={onRunPipeline} disabled={isLoading || !canRun}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Running…" : "Run checks"}
          </Button>
        }
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        {/* Source: sample case or the user's own documents */}
        <div className="border-b border-zinc-200 p-5">
          <div className="mb-3">
            <Segmented
              disabled={isLoading}
              value={source}
              onChange={(v) => {
                setSelectedDocIndex(0);
                onSourceChange(v);
              }}
              options={[
                { value: "upload", label: "Your documents" },
                { value: "sample", label: "Sample case" },
              ]}
            />
          </div>

          {source === "upload" ? (
            <UploadPanel
              uploads={uploads}
              disabled={isLoading}
              onChange={(slot, file) => {
                setSelectedDocIndex(0);
                onUploadChange(slot, file);
              }}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {demoCases.map((c) => {
                const active = c.id === activeCaseId;
                return (
                  <button
                    key={c.id}
                    disabled={isLoading}
                    onClick={() => {
                      setSelectedDocIndex(0);
                      onSelectCase(c.id);
                    }}
                    className={`group rounded-md border p-3.5 text-left transition disabled:cursor-wait ${
                      active
                        ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500"
                        : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-zinc-900">
                        {shortTitle(c.title)}
                      </span>
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                          active
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-zinc-300 bg-white"
                        }`}
                      >
                        {active && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{c.description}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {documents.length > 0 && (
          <>
            {/* Document tabs */}
            <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="-mb-px flex gap-5 overflow-x-auto">
                {documents.map((d, idx) => (
                  <button
                    key={`${d.doc_type}-${idx}`}
                    onClick={() => setSelectedDocIndex(idx)}
                    className={`whitespace-nowrap border-b-2 py-3 text-sm transition-colors ${
                      docIndex === idx
                        ? "border-brand-600 font-medium text-zinc-900"
                        : "border-transparent text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {DOC_LABELS[d.doc_type] ?? d.doc_type}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pb-3 sm:pb-0">
                {viewMode === "raw" && currentSource?.raw_text && (
                  <button
                    onClick={() => handleCopy(currentSource.raw_text!)}
                    className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
                <Segmented
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    { value: "structured", label: "Extracted" },
                    { value: "raw", label: "Source" },
                  ]}
                />
              </div>
            </div>

            <div className="p-5">
              {viewMode === "structured" && doc ? (
                <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
                  <Group title="Shipment">
                    <Field label="Document no." value={doc.doc_number} mono />
                    <Field label="Vessel" value={doc.vessel_name} />
                    <Field label="Voyage" value={doc.voyage_number} mono />
                    <Field label="Port of loading" value={doc.port_of_loading} />
                    <Field label="Port of discharge" value={doc.port_of_discharge} />
                    <Field label="Incoterm" value={doc.incoterm} />
                  </Group>

                  <Group title="Parties">
                    <Field label="Consignee" value={doc.consignee?.name} />
                    <Field label="IEC / tax ID" value={doc.consignee?.iec_or_tax_id} mono />
                    <Field label="Shipper" value={doc.shipper?.name} />
                  </Group>

                  <Group title="Weights">
                    <Field label="Gross" value={kg(doc.weights?.gross_weight_kg)} mono />
                    <Field label="Net" value={kg(doc.weights?.net_weight_kg)} mono />
                    <Field label="Tare" value={kg(doc.weights?.tare_weight_kg)} mono />
                    <Field
                      label="Volume"
                      value={
                        doc.weights?.measurement_cbm
                          ? `${doc.weights.measurement_cbm} CBM`
                          : undefined
                      }
                      mono
                    />
                  </Group>

                  <Group title="Containers">
                    {doc.containers?.length ? (
                      doc.containers.map((c, i) => (
                        <Field
                          key={i}
                          label={c.container_number}
                          value={
                            <span className="font-sans text-sm">
                              {[c.iso_type, c.seal_number && `seal ${c.seal_number}`]
                                .filter(Boolean)
                                .join(" · ")}
                              <span
                                className={`ml-2 ${
                                  c.is_valid_bic ? "text-zinc-500" : "font-medium text-red-700"
                                }`}
                              >
                                {c.is_valid_bic ? "check digit ok" : "check digit invalid"}
                              </span>
                            </span>
                          }
                        />
                      ))
                    ) : (
                      <p className="py-1.5 text-sm text-zinc-500">None listed on this document.</p>
                    )}
                  </Group>

                  {doc.hs_items?.length > 0 && (
                    <div className="md:col-span-2">
                      <h4 className="mb-1 text-sm font-medium text-zinc-900">Line items</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 text-left text-zinc-500">
                            <th className="py-1.5 pr-4 font-normal">HS code</th>
                            <th className="py-1.5 pr-4 font-normal">Description</th>
                            <th className="py-1.5 text-right font-normal">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {doc.hs_items.map((h, i) => (
                            <tr key={i}>
                              <td className="py-1.5 pr-4 font-mono text-[13px]">{h.hs_code}</td>
                              <td className="py-1.5 pr-4 text-zinc-700">{h.description}</td>
                              <td className="py-1.5 text-right text-zinc-700">
                                {h.quantity ? `${h.quantity.toLocaleString()} ${h.unit ?? ""}` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {viewMode === "structured" && (
                    <p className="mb-4 rounded-md border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-600">
                      {isLoading
                        ? progress ?? "Extracting fields with the local model…"
                        : "Not extracted yet. Showing the source document. Click Run checks to extract fields."}
                    </p>
                  )}
                  <SourceView doc={currentSource} />
                </>
              )}
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
