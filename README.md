# PortGuard

Customs pre-clearance checks for shipping documents, run on a local model.

PortGuard cross-checks a **Bill of Lading**, **Commercial Invoice** and **Packing List** before they are filed on ICEGATE (the Indian Customs EDI Gateway). Mismatches between these documents are a common cause of customs holds, and every day a container sits at the port adds demurrage charges of roughly $150–500 (₹12,000–40,000). PortGuard flags the mismatches up front, estimates the cost they would have caused, and produces a pre-clearance report.

Everything runs locally: FastAPI, Next.js and Ollama with `gemma4:12b`. No documents are sent to a cloud service.

---

## How it works

```
                 ┌──────────────────────────────────────┐
                 │   Dashboard (Next.js 16 + Tailwind)  │
                 └──────────────────┬───────────────────┘
                                    │  upload or pick a sample case,
                                    │  then "Run checks"
                                    ▼
                 ┌──────────────────────────────────────┐
                 │   FastAPI backend (localhost:8000)   │
                 └──────────────────┬───────────────────┘
                                    │  local calls only
                                    ▼
                 ┌──────────────────────────────────────┐
                 │   Ollama (gemma4:12b)                │
                 └──────────────────────────────────────┘

 1. Extract                  2. Audit                     3. Certificate
 Containers, HS codes,       Cross-document checks,       Expected clearance channel,
 weights, parties,           estimated demurrage          summary and SHA-256 hash
 Incoterms                   and fines                    of the result
```

**1. Extract.** Each document is turned into structured fields: container numbers, HS tariff codes, gross/net/tare weights, consignee and shipper, Incoterm, ports and vessel.
- Uploaded documents are extracted by Gemma, with a rule-based parser as fallback.
- Sample cases use the rule-based parser only (`fast_mode`), so a demo run takes about 30 seconds.

**2. Audit.** Five cross-document checks:
- Gross weight on the B/L vs the Packing List
- HS code on the B/L vs the Commercial Invoice
- Consignee name
- Incoterm
- Container number check digit (ISO 6346)

Each issue includes the expected vs found value, the regulation it relates to, a suggested fix and an estimated penalty. Gemma then writes a short assessment of the result.

**3. Certificate.** A pre-clearance report showing the expected ICEGATE channel (green, yellow or red), the risk level, the key shipment details and a SHA-256 hash of the result. It can be exported as JSON or printed on its own as a one-page PDF.

---

## Using the dashboard

- **Your documents:** upload a Bill of Lading, Commercial Invoice and Packing List (text-based PDF or `.txt`, up to 10 MB each). One document is enough to run, but all three are needed for the full cross-check.
- **Sample case:** two built-in cases.
  - *Clean Consignment*: every document matches, so the result is the green channel.
  - *Severe Demurrage Risk*: a 1,450 kg weight variance, conflicting HS codes, a consignee mismatch and an Incoterm clash, so the result is the red channel.
- **Customs station:** the port selector in the header (Nhava Sheva, Mundra, Chennai, Kolkata).

Nothing is extracted and no model is called until you click **Run checks**. Changing the documents, case or port clears the previous results.

---

## Quick start

**Prerequisites**
- [Ollama](https://ollama.com/) with the model pulled: `ollama pull gemma4:12b`
- Python 3.11+
- Bun (or Node 18+)

**One-time setup**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd ../frontend
bun install
```

**Run**

```bash
ollama serve      # in a separate terminal, if Ollama isn't already running
./run.sh          # starts the backend and frontend
```

| Service | URL |
| :--- | :--- |
| Dashboard | http://localhost:3000 |
| API docs | http://localhost:8000/docs |

To use a different model, set `OLLAMA_MODEL` in `backend/.env`.

---

## API

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| GET | `/api/health` | Backend and Ollama status |
| GET | `/api/demo/cases`, `/api/demo/cases/{id}` | Sample cases and their source text |
| POST | `/api/stage1/parse` | Extract fields from plain text |
| POST | `/api/stage1/upload-pdf` | Extract fields from a PDF |
| POST | `/api/stage2/audit` | Cross-check parsed documents |
| POST | `/api/stage3/certificate` | Generate the pre-clearance report |
| POST | `/api/pipeline/run-case/{id}` | Run all three stages on a sample case |

---

## Limitations

This is a hackathon MVP. Known gaps:

- **Fallback values.** When the rule-based parser can't find a field, it fills in fixed sample values (for example, vessel "MSC CLARA", port of loading Shanghai). Some extracted fields, and the certificate, can show details that aren't in the uploaded document.
- **Model speed.** Gemma extraction takes about 90 seconds per document on a laptop and may hit the backend's 90-second model timeout. In that case it falls back to the rule-based parser.
- **Scanned PDFs** aren't supported (no OCR yet).
- **Not an official document.** The certificate is a pre-check report, not an ICEGATE filing or customs approval.
- **Estimates.** Penalty and demurrage figures use fixed rates from `backend/app/core/config.py`, not live tariff or port data.
- **Sample-mode fallback.** If the backend is unreachable, sample cases show pre-built results. Uploads show an error instead.

---

## Repository structure

```
portguard-ai/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app and CORS
│   │   ├── api/routes.py      # All endpoints
│   │   ├── core/              # Settings and Ollama client
│   │   ├── models/            # Pydantic schemas (documents, audit, certificate)
│   │   └── services/          # Parser, audit, certificate, container check digit, demo cases
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/               # Page, layout, global styles and theme
│       ├── components/        # Header, summary, upload panel, the three stage panels, UI primitives
│       └── lib/               # API client and types
├── data/demo/                 # Sample document sets (.txt)
└── run.sh                     # Starts backend and frontend
```

---

## Tech stack

| Layer | Technology |
| :--- | :--- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, Lucide icons |
| Backend | FastAPI, Python 3.11+, Pydantic v2, Uvicorn |
| Model | Ollama, `gemma4:12b` |
| PDF text | pypdf |

---

## License

MIT. Built for a hackathon.
