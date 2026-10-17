# PortGuard AI 🚢
> **Autonomous Customs Pre-Clearance & Demurrage Aversion Engine**  
> Powered by local Ollama (`gemma4:12b` / `gemma2:9b`), FastAPI, and Next.js 15.

---

## 📌 Overview

Global shipping and freight forwarding face severe financial bleeding due to documentation errors at port customs. Discrepancies between **Bills of Lading (B/L)**, **Commercial Invoices (CI)**, and **Packing Lists (PL)** frequently cause customs holds under regulatory portals like **ICEGATE** (Indian Customs EDI Gateway).

These delays lead to **punitive container demurrage and detention charges** (averaging \$150–\$500 / ₹12,000–₹40,000 per day per container), port dwell-time spikes, and compliance penalties.

**PortGuard AI** is a locally deployed, privacy-compliant automated pre-clearance engine. It performs cross-document consistency audits, validates container numbers and HS codes, highlights discrepancies before filing, and produces an **ICEGATE-ready Pre-Clearance Certificate** complete with an estimated calculation of averted demurrage penalties.

---

## 🏛️ Architecture

```
                      ┌───────────────────────────────────────────┐
                      │            PortGuard Dashboard            │
                      │     (Next.js 15 + Tailwind + Lucide)      │
                      └─────────────────────┬─────────────────────┘
                                            │ Uploads Docs / 1-Click Demo
                                            ▼
                      ┌───────────────────────────────────────────┐
                      │              FastAPI Backend              │
                      │           (localhost:8000/api)            │
                      └─────────────────────┬─────────────────────┘
                                            │ Strictly Local API Calls
                                            ▼
                      ┌───────────────────────────────────────────┐
                      │            Local Ollama Engine            │
                      │               `gemma4:12b`                │
                      │      (or `gemma4:e4b` / `gemma2:9b`)      │
                      └─────────────────────┬─────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
 [ Stage 1: Document Parsing ]     [ Stage 2: Audit Engine ]      [ Stage 3: Clearance Cert ]
 Strict JSON extraction of:        Cross-document verification:    Generates formal ICEGATE
 • Container numbers (BIC/ISO)     • Weight discrepancy check      pre-clearance certificate
 • Harmonized (HS) tariff codes    • HS Code classification        with estimated demurrage 
 • Gross / Net Weights             • Consignee / Incoterm match    penalties averted ($/₹).
```

---

## ⚡ Key Features

* **100% Local & Air-Gapped Privacy**: Runs inference locally via Ollama with Gemma models (`gemma4:12b`, `gemma2:9b`, or `gemma4:e4b`). Zero third-party cloud leakage of sensitive trade manifests, commercial pricing, or client bills.
* **Stage 1: Multi-Document Structured Parsing**:
  * Extracts ISO 6346 / BIC container numbers, 6- to 8-digit HS (Harmonized System) tariff codes, tare/gross/net weights, consignee/shipper entities, and Incoterms (FOB, CIF, DDP, etc.).
  * Enforces strict Pydantic JSON schemas.
* **Stage 2: Cross-Document Audit Engine**:
  * **Weight Discrepancy Checks**: Compares Gross vs. Net declarations between B/L and Packing List, flagging variance over tolerance (>1%).
  * **HS Code Harmonization**: Flags classification conflicts between Commercial Invoices and customs declaration standards.
  * **Entity & Incoterm Matching**: Verifies consignee name/address and freight terms alignment.
* **Stage 3: ICEGATE Pre-Clearance Certificate & Demurrage Meter**:
  * Issues a standardized customs pre-clearance report with a digital verification hash.
  * Dynamic penalty averted calculator showing estimated demurrage risk savings in **USD (\$)** and **INR (₹)** based on port dwell-time risk.
* **1-Click Interactive Demos**:
  * **Golden Path**: Flawless consignment with 100% cross-document match and immediate clearance cert generation.
  * **High-Risk Demurrage Consignment**: Pre-loaded discrepancy scenario (e.g., weight mismatch + misclassified HS code) exposing potential \$2,500+ / ₹2,00,000+ demurrage risk prevented before customs submission.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons | Reactive, modern industrial customs dashboard |
| **Runtime & Package Manager** | Bun / Node.js | Fast client builds and tooling |
| **Backend API** | FastAPI, Python 3.11+, Uvicorn, Pydantic v2 | High-performance asynchronous REST endpoints & strict validation |
| **Local LLM Engine** | Ollama (`gemma4:12b` / `gemma2:9b` / `gemma4:e4b`) | Local inference engine for document parsing and audit reasoning |
| **Document Processing** | PyPDF / pdfplumber / regex parsing | Text extraction from shipping PDFs and structured documents |

---

## 🚀 Quickstart Guide

### Prerequisites
1. **Ollama**: Install [Ollama](https://ollama.com/) and pull the desired Gemma model:
   ```bash
   ollama pull gemma2:9b
   # or
   ollama pull gemma:7b
   ```
2. **Python 3.11+**
3. **Bun** (or Node 18+)

---

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

```bash
cd frontend
bun install
bun run dev
```
Dashboard will be live at `http://localhost:3000`.

---

## 📁 Repository Structure

```
portguard-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint & router mounts
│   │   ├── api/                 # Endpoints (/parse, /audit, /certificate, /demo)
│   │   ├── core/                # Configuration & Ollama local client
│   │   ├── models/              # Pydantic schemas (Document, AuditResult, Certificate)
│   │   └── services/            # Parsing, cross-auditing, and demurrage calculations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js 15 App router (Dashboard, Certificate View)
│   │   ├── components/          # UploadZone, AuditConsole, CertificateModal, DemurrageMeter
│   │   └── lib/                 # API client, types, mock demo datasets
│   ├── package.json
│   └── tailwind.config.ts
├── data/
│   └── demo/                    # Pre-packaged sample shipping document sets
└── README.md
```

---

## 📜 License

MIT License. Built for the Hackathon.
