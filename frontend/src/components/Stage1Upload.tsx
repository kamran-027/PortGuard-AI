"use client";

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  Copy,
  Check,
  Container,
  Scale,
  Hash,
  Building,
  UploadCloud,
  Play,
  RotateCw,
  Eye,
  FileCode,
} from "lucide-react";
import {
  ParsedDocument,
  DemoCaseSummary,
  DemoCaseDetail,
  DocumentType,
} from "@/lib/types";

interface Stage1UploadProps {
  demoCases: DemoCaseSummary[];
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
  parsedDocuments: ParsedDocument[];
  demoDetail: DemoCaseDetail | null;
  isLoading: boolean;
  onRunPipeline: () => void;
  onCustomParse?: (text: string, type: DocumentType) => void;
}

export default function Stage1Upload({
  demoCases,
  activeCaseId,
  onSelectCase,
  parsedDocuments,
  demoDetail,
  isLoading,
  onRunPipeline,
}: Stage1UploadProps) {
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"structured" | "raw">("structured");
  const [copied, setCopied] = useState(false);

  // Active raw text and parsed doc
  const currentRawDoc = demoDetail?.documents?.[selectedDocIndex];
  const currentParsedDoc = parsedDocuments?.[selectedDocIndex];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Demo Case Selector Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400 font-bold text-xs">
                1
              </span>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-100">
                1-Click Consignment Demo Scenarios
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Select an automated shipment test case to feed the on-device AI customs parser & cross-audit engine.
            </p>
          </div>

          {/* Quick Demo Case Pills */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onSelectCase("clean_consignment")}
              disabled={isLoading}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                activeCaseId === "clean_consignment"
                  ? "border border-emerald-500/60 bg-emerald-950/80 text-emerald-200 ring-2 ring-emerald-500/30"
                  : "border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-750"
              }`}
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>⚡ Clean Consignment (Golden Path)</span>
              <span className="rounded bg-emerald-900/80 px-1.5 py-0.2 text-[9px] text-emerald-300 uppercase">
                0 Errors
              </span>
            </button>

            <button
              onClick={() => onSelectCase("high_risk_discrepancy")}
              disabled={isLoading}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                activeCaseId === "high_risk_discrepancy"
                  ? "border border-rose-500/60 bg-rose-950/80 text-rose-200 ring-2 ring-rose-500/30"
                  : "border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-750"
              }`}
            >
              <AlertOctagon className="h-4 w-4 text-rose-400" />
              <span>🚨 Severe Demurrage Risk (Hero Story)</span>
              <span className="rounded bg-rose-900/80 px-1.5 py-0.2 text-[9px] text-rose-300 uppercase">
                1,450kg Delta
              </span>
            </button>
          </div>
        </div>

        {/* Active case description banner */}
        {demoDetail && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-cyan-400">{demoDetail.title}: </span>
              <span className="text-slate-300">{demoDetail.description}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-cyan-300">
                {demoDetail.port}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                {demoDetail.cargo}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Document Inspector Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
        {/* Document Tabs Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {demoDetail?.documents.map((doc, idx) => {
              const parsed = parsedDocuments[idx];
              const docName =
                doc.doc_type === "BILL_OF_LADING"
                  ? "Ocean Bill of Lading"
                  : doc.doc_type === "COMMERCIAL_INVOICE"
                  ? "Commercial Invoice"
                  : "Packing List";

              return (
                <button
                  key={doc.doc_number || idx}
                  onClick={() => setSelectedDocIndex(idx)}
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                    selectedDocIndex === idx
                      ? "border-cyan-500/50 bg-cyan-950/50 text-cyan-200 shadow-sm"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{docName}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                    {parsed?.doc_number || doc.doc_number}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toggle between Structured and Raw View */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
              <button
                onClick={() => setViewMode("structured")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
                  viewMode === "structured"
                    ? "bg-slate-800 text-cyan-300 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Extracted Schema</span>
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
                  viewMode === "raw"
                    ? "bg-slate-800 text-cyan-300 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Raw Manifest</span>
              </button>
            </div>

            {viewMode === "raw" && currentRawDoc && (
              <button
                onClick={() => handleCopy(currentRawDoc.raw_text)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-slate-750 hover:text-white"
                title="Copy raw text"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* View Mode Content */}
        <div className="mt-6">
          {viewMode === "structured" && currentParsedDoc ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Box 1: Vessel & Voyage */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Container className="h-4 w-4 text-cyan-400" />
                  <span>Vessel & Transit</span>
                </div>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Vessel: </span>
                    <span className="font-semibold text-slate-200">
                      {currentParsedDoc.vessel_name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Voyage: </span>
                    <span className="font-mono text-slate-200">
                      {currentParsedDoc.voyage_number || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Origin: </span>
                    <span className="text-slate-200">
                      {currentParsedDoc.port_of_loading || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Destination: </span>
                    <span className="font-semibold text-cyan-300">
                      {currentParsedDoc.port_of_discharge || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Incoterm: </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                      {currentParsedDoc.incoterm || "FOB"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Weights & Volume */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Scale className="h-4 w-4 text-emerald-400" />
                  <span>Declared Weights</span>
                </div>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Gross Weight: </span>
                    <span className="font-mono font-bold text-slate-100">
                      {currentParsedDoc.weights?.gross_weight_kg?.toLocaleString()} kg
                    </span>
                  </div>
                  {currentParsedDoc.weights?.net_weight_kg && (
                    <div>
                      <span className="text-slate-500">Net Weight: </span>
                      <span className="font-mono text-slate-300">
                        {currentParsedDoc.weights.net_weight_kg.toLocaleString()} kg
                      </span>
                    </div>
                  )}
                  {currentParsedDoc.weights?.tare_weight_kg && (
                    <div>
                      <span className="text-slate-500">Tare Weight: </span>
                      <span className="font-mono text-slate-400">
                        {currentParsedDoc.weights.tare_weight_kg.toLocaleString()} kg
                      </span>
                    </div>
                  )}
                  {currentParsedDoc.weights?.measurement_cbm && (
                    <div>
                      <span className="text-slate-500">Volume: </span>
                      <span className="font-mono text-slate-300">
                        {currentParsedDoc.weights.measurement_cbm} CBM
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 3: Containers & ISO 6346 Checksum */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Hash className="h-4 w-4 text-purple-400" />
                  <span>Containers & Seal</span>
                </div>
                <div className="mt-2 space-y-2">
                  {currentParsedDoc.containers?.length > 0 ? (
                    currentParsedDoc.containers.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-cyan-300">
                            {c.container_number}
                          </span>
                          <span className="rounded bg-slate-800 px-1 text-[10px] text-slate-400">
                            {c.iso_type || "40HC"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Seal: {c.seal_number || "Verified"}</span>
                          <span
                            className={`flex items-center gap-0.5 text-[10px] font-medium ${
                              c.is_valid_bic ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {c.is_valid_bic ? "BIC Valid" : "BIC Checksum Fail"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">No container listed (Breakbulk or Invoice)</div>
                  )}
                </div>
              </div>

              {/* Box 4: Parties & HS Code */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Building className="h-4 w-4 text-amber-400" />
                  <span>Importer & Tariff</span>
                </div>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Consignee: </span>
                    <span className="font-medium text-slate-200">
                      {currentParsedDoc.consignee?.name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">IEC Code: </span>
                    <span className="font-mono text-cyan-300">
                      {currentParsedDoc.consignee?.iec_or_tax_id || "N/A"}
                    </span>
                  </div>
                  {currentParsedDoc.hs_items?.length > 0 && (
                    <div className="mt-2 border-t border-slate-800/80 pt-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Primary HS Code
                      </div>
                      <div className="font-mono font-bold text-amber-300">
                        {currentParsedDoc.hs_items[0].hs_code}
                      </div>
                      <div className="line-clamp-2 text-[11px] text-slate-400">
                        {currentParsedDoc.hs_items[0].description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
              <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap selection:bg-cyan-500 selection:text-black">
                {currentRawDoc?.raw_text || "No raw text available."}
              </pre>
            </div>
          )}
        </div>

        {/* Action Trigger Banner */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Ready for Cross-Document Verification
              </div>
              <div className="text-xs text-slate-400">
                Execute automated 3-stage validation: BIC Checksum + Weight Variance + HS Tariff Audit + ICEGATE Filing.
              </div>
            </div>
          </div>

          <button
            onClick={onRunPipeline}
            disabled={isLoading}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" />
                <span>Auditing with Gemma 4...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Run End-to-End Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
