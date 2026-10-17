"use client";

import React from "react";
import { SystemHealth } from "@/lib/types";

interface NavbarProps {
  selectedPort: string;
  onSelectPort: (port: string) => void;
  systemHealth?: SystemHealth | null;
}

export const PORT_OPTIONS = [
  { code: "INNSA1", name: "Nhava Sheva (JNPT)" },
  { code: "INMUN1", name: "Mundra" },
  { code: "INMAA1", name: "Chennai" },
  { code: "INCCU1", name: "Kolkata" },
];

export default function Navbar({
  selectedPort,
  onSelectPort,
  systemHealth,
}: NavbarProps) {
  const modelName = systemHealth?.ollama?.target_model;
  const isOnline = systemHealth?.ollama?.online;

  return (
    <header className="border-b border-zinc-200 bg-white print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <span className="text-[15px] font-semibold tracking-tight text-zinc-900">
            PortGuard
          </span>
          <span className="hidden text-sm text-zinc-500 sm:inline">
            Customs pre-clearance
          </span>
        </div>

        <div className="flex items-center gap-4">
          {systemHealth && (
            <span
              className="hidden items-center gap-1.5 text-sm text-zinc-500 md:flex"
              title={isOnline ? "Ollama is reachable" : "Ollama is not reachable"}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isOnline ? "bg-emerald-500" : "bg-zinc-400"
                }`}
              />
              <span className="font-mono text-[13px]">{modelName ?? "model"}</span>
              <span>{isOnline ? "local" : "offline"}</span>
            </span>
          )}

          <label htmlFor="port-selector" className="sr-only">
            Customs station
          </label>
          <select
            id="port-selector"
            value={selectedPort}
            onChange={(e) => onSelectPort(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-800 focus:border-zinc-500 focus:outline-none"
          >
            {PORT_OPTIONS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
