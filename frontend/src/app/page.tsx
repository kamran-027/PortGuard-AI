"use client";

import React, { useEffect, useRef, useState } from "react";
import Navbar, { PORT_OPTIONS } from "@/components/Navbar";
import DemurrageBanner from "@/components/DemurrageBanner";
import Stage1Upload, { DocSource } from "@/components/Stage1Upload";
import Stage2AuditConsole from "@/components/Stage2AuditConsole";
import Stage3Certificate from "@/components/Stage3Certificate";
import {
  checkHealth,
  generateCertificate,
  getDemoCaseDetail,
  getDemoCases,
  parseUploadedDocument,
  runAudit,
  runPipelineCase,
} from "@/lib/api";
import {
  AuditResult,
  DemoCaseDetail,
  DemoCaseSummary,
  IcegateCertificate,
  ParsedDocument,
  SourceDoc,
  SystemHealth,
  UPLOAD_SLOTS,
  UploadEntry,
  UploadSlot,
} from "@/lib/types";
import { CHANNEL, DOC_LABELS, Pill, shortTitle } from "@/components/ui";

type Tab = "all" | "stage1" | "stage2" | "stage3";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Overview" },
  { id: "stage1", label: "Documents" },
  { id: "stage2", label: "Audit" },
  { id: "stage3", label: "Certificate" },
];

export default function Home() {
  const [selectedPort, setSelectedPort] = useState("INNSA1");
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [source, setSource] = useState<DocSource>("upload");
  const [demoCases, setDemoCases] = useState<DemoCaseSummary[]>([]);
  const [activeCaseId, setActiveCaseId] = useState("clean_consignment");
  const [demoDetail, setDemoDetail] = useState<DemoCaseDetail | null>(null);
  const [uploads, setUploads] = useState<Partial<Record<UploadSlot, UploadEntry>>>({});

  const [parsedDocuments, setParsedDocuments] = useState<ParsedDocument[]>([]);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [certificate, setCertificate] = useState<IcegateCertificate | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  // Bumped whenever the inputs change so a late response for the
  // previous selection is ignored.
  const runToken = useRef(0);

  const clearResults = () => {
    runToken.current++;
    setIsRunning(false);
    setProgress(null);
    setError(null);
    setParsedDocuments([]);
    setAuditResult(null);
    setCertificate(null);
  };

  // Load the sample cases and the default case's source documents.
  // No extraction or model call happens until "Run checks" is clicked.
  useEffect(() => {
    checkHealth().then(setSystemHealth);
    Promise.all([getDemoCases(), getDemoCaseDetail("clean_consignment")])
      .then(([cases, detail]) => {
        setDemoCases(cases);
        setDemoDetail(detail);
      })
      .catch(console.error);
  }, []);

  // Release PDF preview URLs when the page goes away.
  const uploadsRef = useRef(uploads);
  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);
  useEffect(
    () => () => {
      Object.values(uploadsRef.current).forEach((u) => u?.url && URL.revokeObjectURL(u.url));
    },
    []
  );

  const handleSourceChange = (next: DocSource) => {
    if (next === source) return;
    setSource(next);
    clearResults();
  };

  const handleSelectCase = async (caseId: string) => {
    if (caseId === activeCaseId) return;
    setActiveCaseId(caseId);
    clearResults();
    setDemoDetail(null);
    try {
      setDemoDetail(await getDemoCaseDetail(caseId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadChange = async (slot: UploadSlot, file: File | null) => {
    clearResults();
    const previous = uploads[slot];
    if (previous?.url) URL.revokeObjectURL(previous.url);

    let entry: UploadEntry | undefined;
    if (file) {
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      entry = isPdf
        ? { file, url: URL.createObjectURL(file) }
        : { file, text: await file.text() };
    }
    setUploads((prev) => {
      const next = { ...prev };
      if (entry) next[slot] = entry;
      else delete next[slot];
      return next;
    });
  };

  const handleSelectPort = (port: string) => {
    setSelectedPort(port);
    clearResults();
  };

  const uploadedSlots = UPLOAD_SLOTS.filter((slot) => uploads[slot]);

  const runUploaded = async (token: number) => {
    const parsed: ParsedDocument[] = [];
    for (const [i, slot] of uploadedSlots.entries()) {
      setProgress(
        `Extracting ${DOC_LABELS[slot]} (${i + 1} of ${uploadedSlots.length}) with the local model…`
      );
      parsed.push(await parseUploadedDocument(uploads[slot]!.file, slot));
      if (token !== runToken.current) return;
      setParsedDocuments([...parsed]);
    }

    setProgress("Cross-checking documents…");
    const audit = await runAudit(parsed);
    if (token !== runToken.current) return;
    setAuditResult(audit);

    setProgress("Generating certificate…");
    const cert = await generateCertificate(audit, selectedPort);
    if (token !== runToken.current) return;
    setCertificate(cert);
  };

  const runSample = async (token: number) => {
    setProgress("Running checks on the sample case…");
    const res = await runPipelineCase(activeCaseId, selectedPort);
    if (token !== runToken.current) return;
    setParsedDocuments(res.stage1_parsed_documents);
    setAuditResult(res.stage2_audit_result);
    setCertificate(res.stage3_certificate);
  };

  const handleRunPipeline = async () => {
    clearResults();
    const token = runToken.current;
    setIsRunning(true);
    try {
      await (source === "upload" ? runUploaded(token) : runSample(token));
    } catch (err) {
      if (token === runToken.current) {
        setError(err instanceof Error ? err.message : "Something went wrong running the checks.");
      }
    } finally {
      if (token === runToken.current) {
        setIsRunning(false);
        setProgress(null);
      }
    }
  };

  const documents: SourceDoc[] =
    source === "upload"
      ? uploadedSlots.map((slot) => ({
          doc_type: slot,
          name: uploads[slot]!.file.name,
          raw_text: uploads[slot]!.text,
          pdf_url: uploads[slot]!.url,
        }))
      : demoDetail?.documents ?? [];

  const canRun = source === "upload" ? uploadedSlots.length > 0 : demoDetail !== null;

  const portName = PORT_OPTIONS.find((p) => p.code === selectedPort)?.name;
  const heroTitle =
    source === "upload" ? "Your documents" : demoDetail ? shortTitle(demoDetail.title) : undefined;
  const heroSubtitle =
    source === "upload"
      ? uploadedSlots.length
        ? `${uploadedSlots.length} of 3 documents · ${selectedPort} · ${portName}`
        : "Upload a Bill of Lading, Commercial Invoice and Packing List to start"
      : demoDetail && `${demoDetail.cargo} · ${demoDetail.port}`;

  const stage1 = (
    <Stage1Upload
      source={source}
      onSourceChange={handleSourceChange}
      demoCases={demoCases}
      activeCaseId={activeCaseId}
      onSelectCase={handleSelectCase}
      uploads={uploads}
      onUploadChange={handleUploadChange}
      documents={documents}
      parsedDocuments={parsedDocuments}
      isLoading={isRunning}
      progress={progress}
      error={error}
      canRun={canRun}
      onRunPipeline={handleRunPipeline}
    />
  );
  const stage2 = (
    <Stage2AuditConsole
      auditResult={auditResult}
      onProceedToCertificate={() => setActiveTab("stage3")}
    />
  );
  const stage3 = <Stage3Certificate certificate={certificate} />;

  const issueCount = auditResult?.discrepancies.length ?? 0;
  const channel = certificate ? CHANNEL[certificate.channel_status] : undefined;
  const tabMeta: Partial<Record<Tab, React.ReactNode>> = {
    stage1: parsedDocuments.length > 0 && (
      <Pill tone="neutral">{parsedDocuments.length} docs</Pill>
    ),
    stage2: auditResult && (
      <Pill tone={issueCount ? "bad" : "good"}>
        {issueCount ? `${issueCount} issues` : "Pass"}
      </Pill>
    ),
    stage3: channel && <Pill tone={channel.tone}>{channel.label.split(" ")[0]}</Pill>,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        selectedPort={selectedPort}
        onSelectPort={handleSelectPort}
        systemHealth={systemHealth}
        isLoading={isRunning}
      >
        <DemurrageBanner
          auditResult={auditResult}
          channelStatus={certificate?.channel_status}
          title={heroTitle}
          subtitle={heroSubtitle}
        />
      </Navbar>

      <nav className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl gap-7 overflow-x-auto px-4 sm:px-6">
          {TABS.map((t, i) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 py-3.5 text-sm transition-colors ${
                  active
                    ? "border-brand-600 font-medium text-zinc-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {i > 0 && (
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors ${
                      active ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {i}
                  </span>
                )}
                {t.label}
                {tabMeta[t.id]}
              </button>
            );
          })}
        </div>
      </nav>

      <main
        className={`mx-auto w-full max-w-6xl flex-1 px-4 py-8 transition-opacity sm:px-6 ${
          isRunning ? "opacity-60" : ""
        }`}
      >
        <div key={activeTab} className="animate-fade-in">
          {activeTab === "all" && (
            <div className="space-y-12">
              {stage1}
              {stage2}
              {stage3}
            </div>
          )}
          {activeTab === "stage1" && stage1}
          {activeTab === "stage2" && stage2}
          {activeTab === "stage3" && stage3}
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-sm text-zinc-400 print:hidden">
        <div className="mx-auto flex max-w-6xl justify-between px-4 sm:px-6">
          <span>PortGuard</span>
          <span>Documents never leave this machine</span>
        </div>
      </footer>
    </div>
  );
}
