"use client";

import React from "react";
import { SystemHealth } from "@/lib/types";

interface NavbarProps {
  selectedPort: string;
  onSelectPort: (port: string) => void;
  systemHealth?: SystemHealth | null;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const PORT_OPTIONS = [
  { code: "INNSA1", name: "Nhava Sheva (JNPT)" },
  { code: "INMUN1", name: "Mundra" },
  { code: "INMAA1", name: "Chennai" },
  { code: "INCCU1", name: "Kolkata" },
];

function LogoMark() {
  // A stack of containers on a hull.
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-brand-500" />
      <rect x="9" y="8" width="7" height="5" rx="1" fill="white" opacity="0.6" />
      <rect x="17" y="8" width="7" height="5" rx="1" fill="white" opacity="0.85" />
      <rect x="7" y="14" width="9" height="5" rx="1" fill="white" />
      <rect x="17" y="14" width="9" height="5" rx="1" fill="white" opacity="0.7" />
      <path d="M5 21h22l-3 5H8z" fill="white" />
    </svg>
  );
}

export default function Navbar({
  selectedPort,
  onSelectPort,
  systemHealth,
  isLoading = false,
  children,
}: NavbarProps) {
  const modelName = systemHealth?.ollama?.target_model;
  const isOnline = systemHealth?.ollama?.online;

  return (
    <header className="relative overflow-hidden bg-zinc-950 text-white print:hidden">
      {/* Faint dot grid, fading out to the right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_right,black,transparent_70%)]"
      />

      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <LogoMark />
          <span className="text-base font-semibold tracking-tight">PortGuard</span>
          <span className="hidden h-4 w-px bg-white/15 sm:block" />
          <span className="hidden text-sm text-zinc-400 sm:inline">
            Customs pre-clearance
          </span>
        </div>

        <div className="flex items-center gap-3">
          {systemHealth && (
            <span
              className="hidden items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-300 ring-1 ring-white/10 md:inline-flex"
              title={isOnline ? "Ollama is reachable" : "Ollama is not reachable"}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isOnline ? "bg-emerald-400" : "bg-zinc-500"
                }`}
              />
              <span className="font-mono">{modelName ?? "model"}</span>
              <span className="text-zinc-500">{isOnline ? "local" : "offline"}</span>
            </span>
          )}

          <label htmlFor="port-selector" className="sr-only">
            Customs station
          </label>
          <select
            id="port-selector"
            value={selectedPort}
            onChange={(e) => onSelectPort(e.target.value)}
            className="rounded-md bg-white/5 px-2.5 py-1.5 text-sm text-white ring-1 ring-white/15 transition hover:bg-white/10 focus:outline-none focus:ring-brand-400 [&>option]:text-zinc-900"
          >
            {PORT_OPTIONS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {children && (
        <div className="relative border-t border-white/10">{children}</div>
      )}

      {/* Indeterminate progress while the pipeline runs */}
      <div
        className={`absolute inset-x-0 bottom-0 h-0.5 overflow-hidden transition-opacity ${
          isLoading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-1/4 animate-progress bg-brand-400" />
      </div>
    </header>
  );
}
