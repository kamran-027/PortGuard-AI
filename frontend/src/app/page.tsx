"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import DemurrageBanner from "@/components/DemurrageBanner";
import Stage1Upload from "@/components/Stage1Upload";
import Stage2AuditConsole from "@/components/Stage2AuditConsole";
import Stage3Certificate from "@/components/Stage3Certificate";
import {
  checkHealth,
  getDemoCaseDetail,
  getDemoCases,
  runPipelineCase,
} from "@/lib/api";
import {
  AuditResult,
  DemoCaseDetail,
  DemoCaseSummary,
  IcegateCertificate,
  ParsedDocument,
  SystemHealth,
} from "@/lib/types";
import {
  Layers,
  FileText,
  Scale,
  Award,
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  const [selectedPort, setSelectedPort] = useState("INNSA1");
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [demoCases, setDemoCases] = useState<DemoCaseSummary[]>([]);
  const [activeCaseId, setActiveCaseId] = useState("clean_consignment");
  const [demoDetail, setDemoDetail] = useState<DemoCaseDetail | null>(null);

  // Pipeline output states
  const [parsedDocuments, setParsedDocuments] = useState<ParsedDocument[]>([]);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [certificate, setCertificate] = useState<IcegateCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "stage1" | "stage2" | "stage3">(
    "all"
  );

  // Initialize on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const [health, cases] = await Promise.all([
          checkHealth(),
          getDemoCases(),
        ]);
        setSystemHealth(health);
        setDemoCases(cases);

        // Preload clean consignment
        const detail = await getDemoCaseDetail("clean_consignment");
        setDemoDetail(detail);

        // Run initial pipeline run for clean consignment
        const pipelineRes = await runPipelineCase("clean_consignment", "INNSA1");
        setParsedDocuments(pipelineRes.stage1_parsed_documents);
        setAuditResult(pipelineRes.stage2_audit_result);
        setCertificate(pipelineRes.stage3_certificate);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Handle case switch
  const handleSelectCase = async (caseId: string) => {
    setActiveCaseId(caseId);
    setIsLoading(true);
    try {
      const detail = await getDemoCaseDetail(caseId);
      setDemoDetail(detail);

      const pipelineRes = await runPipelineCase(caseId, selectedPort);
      setParsedDocuments(pipelineRes.stage1_parsed_documents);
      setAuditResult(pipelineRes.stage2_audit_result);
      setCertificate(pipelineRes.stage3_certificate);
    } catch (err) {
      console.error("Failed to run pipeline for case:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle port change
  const handleSelectPort = async (port: string) => {
    setSelectedPort(port);
    if (activeCaseId) {
      setIsLoading(true);
      try {
        const pipelineRes = await runPipelineCase(activeCaseId, port);
        setParsedDocuments(pipelineRes.stage1_parsed_documents);
        setAuditResult(pipelineRes.stage2_audit_result);
        setCertificate(pipelineRes.stage3_certificate);
      } catch (err) {
        console.error("Failed to update port pipeline:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Explicit re-run of pipeline
  const handleRunPipeline = async () => {
    setIsLoading(true);
    try {
      const pipelineRes = await runPipelineCase(activeCaseId, selectedPort);
      setParsedDocuments(pipelineRes.stage1_parsed_documents);
      setAuditResult(pipelineRes.stage2_audit_result);
      setCertificate(pipelineRes.stage3_certificate);
    } catch (err) {
      console.error("Failed to execute pipeline:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        selectedPort={selectedPort}
        onSelectPort={handleSelectPort}
        systemHealth={systemHealth}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Hero Demurrage Metric Banner */}
        <DemurrageBanner
          auditResult={auditResult}
          channelStatus={certificate?.channel_status}
          consignmentTitle={demoDetail?.title}
          onJumpToAudit={() => setActiveTab("stage2")}
        />

        {/* Pipeline Stepper & Tab Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-3">
          {/* Stepper Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "all"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Complete Pipeline View</span>
            </button>

            <button
              onClick={() => setActiveTab("stage1")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "stage1"
                  ? "border border-cyan-500/40 bg-slate-900 text-cyan-300"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              <span>Stage 1: Documents</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[10px]">
                {parsedDocuments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("stage2")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "stage2"
                  ? "border border-cyan-500/40 bg-slate-900 text-cyan-300"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Scale className="h-3.5 w-3.5 text-amber-400" />
              <span>Stage 2: Cross-Audit</span>
              {auditResult && (
                <span
                  className={`rounded px-1.5 py-0.2 font-mono text-[10px] ${
                    auditResult.summary.status === "CLEARED"
                      ? "bg-emerald-950 text-emerald-400"
                      : "bg-rose-950 text-rose-400"
                  }`}
                >
                  {auditResult.summary.status === "CLEARED"
                    ? "Pass"
                    : `${auditResult.discrepancies.length} Alerts`}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("stage3")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "stage3"
                  ? "border border-cyan-500/40 bg-slate-900 text-cyan-300"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Award className="h-3.5 w-3.5 text-purple-400" />
              <span>Stage 3: Certificate</span>
              {certificate && (
                <span
                  className={`rounded px-1.5 py-0.2 font-mono text-[10px] ${
                    certificate.channel_status === "GREEN_CHANNEL_APPROVED"
                      ? "bg-emerald-950 text-emerald-400"
                      : "bg-rose-950 text-rose-400"
                  }`}
                >
                  {certificate.channel_status === "GREEN_CHANNEL_APPROVED"
                    ? "Green"
                    : "Red"}
                </span>
              )}
            </button>
          </div>

          {/* Status info */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-slate-300">Port {selectedPort}</span>
            </div>
            <span>•</span>
            <div className="text-[11px] text-slate-400">
              Gemma 4 Zero-Leakage Pipeline
            </div>
          </div>
        </div>

        {/* View Mode Router */}
        {activeTab === "all" && (
          <div className="space-y-10">
            <Stage1Upload
              demoCases={demoCases}
              activeCaseId={activeCaseId}
              onSelectCase={handleSelectCase}
              parsedDocuments={parsedDocuments}
              demoDetail={demoDetail}
              isLoading={isLoading}
              onRunPipeline={handleRunPipeline}
            />

            <Stage2AuditConsole
              auditResult={auditResult}
              onProceedToCertificate={() => setActiveTab("stage3")}
            />

            <Stage3Certificate certificate={certificate} />
          </div>
        )}

        {activeTab === "stage1" && (
          <Stage1Upload
            demoCases={demoCases}
            activeCaseId={activeCaseId}
            onSelectCase={handleSelectCase}
            parsedDocuments={parsedDocuments}
            demoDetail={demoDetail}
            isLoading={isLoading}
            onRunPipeline={handleRunPipeline}
          />
        )}

        {activeTab === "stage2" && (
          <Stage2AuditConsole
            auditResult={auditResult}
            onProceedToCertificate={() => setActiveTab("stage3")}
          />
        )}

        {activeTab === "stage3" && (
          <Stage3Certificate certificate={certificate} />
        )}
      </main>

      {/* Industrial Footer */}
      <footer className="mt-16 border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-500" />
            <span className="font-semibold text-slate-400">PortGuard AI</span>
            <span>—</span>
            <span>Built by Cadence Labs for High-Throughput Maritime Logistics</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>ICEGATE 2.0 / EDI-FACT</span>
            <span>•</span>
            <span>Customs Act 1962 Sec 111(m) Shield</span>
            <span>•</span>
            <span>Local Gemma 4 (12B)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
