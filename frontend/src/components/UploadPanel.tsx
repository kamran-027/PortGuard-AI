"use client";

import React, { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { UPLOAD_SLOTS, UploadEntry, UploadSlot } from "@/lib/types";
import { DOC_LABELS } from "./ui";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ".pdf,.txt,application/pdf,text/plain";

const HINTS: Record<UploadSlot, string> = {
  BILL_OF_LADING: "Containers, vessel, gross weight",
  COMMERCIAL_INVOICE: "HS codes, value, Incoterm",
  PACKING_LIST: "Packages, net and gross weight",
};

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function isSupported(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".txt");
}

function Slot({
  slot,
  entry,
  disabled,
  onFile,
  onRemove,
}: {
  slot: UploadSlot;
  entry?: UploadEntry;
  disabled: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const label = DOC_LABELS[slot];

  if (entry) {
    return (
      <div className="flex min-h-28 flex-col justify-between rounded-md border border-zinc-200 bg-white p-3.5">
        <div className="text-sm font-medium text-zinc-900">{label}</div>
        <div className="mt-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-zinc-900" title={entry.file.name}>
              {entry.file.name}
            </div>
            <div className="text-xs text-zinc-500">{formatSize(entry.file.size)}</div>
          </div>
          <button
            onClick={onRemove}
            disabled={disabled}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50"
            aria-label={`Remove ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={`flex min-h-28 flex-col items-start justify-between rounded-md border border-dashed p-3.5 text-left transition disabled:opacity-50 ${
        dragging
          ? "border-brand-500 bg-brand-50/60"
          : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
      }`}
    >
      <div>
        <div className="text-sm font-medium text-zinc-900">{label}</div>
        <div className="mt-0.5 text-xs text-zinc-500">{HINTS[slot]}</div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-sm text-zinc-600">
        <Upload className="h-3.5 w-3.5" />
        <span>
          Drop file or <span className="text-brand-600">browse</span>
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </button>
  );
}

export default function UploadPanel({
  uploads,
  disabled,
  onChange,
}: {
  uploads: Partial<Record<UploadSlot, UploadEntry>>;
  disabled: boolean;
  onChange: (slot: UploadSlot, file: File | null) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleFile = (slot: UploadSlot, file: File) => {
    if (!isSupported(file)) {
      setError(`${file.name}: only PDF and .txt files are supported.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`${file.name} is larger than 10 MB.`);
      return;
    }
    setError(null);
    onChange(slot, file);
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {UPLOAD_SLOTS.map((slot) => (
          <Slot
            key={slot}
            slot={slot}
            entry={uploads[slot]}
            disabled={disabled}
            onFile={(f) => handleFile(slot, f)}
            onRemove={() => onChange(slot, null)}
          />
        ))}
      </div>
      <p className={`mt-2.5 text-sm ${error ? "text-red-700" : "text-zinc-500"}`}>
        {error ??
          "Text-based PDF or .txt, up to 10 MB each (scanned images aren’t supported yet). Upload all three for the full cross-check."}
      </p>
    </div>
  );
}
