from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import List, Optional
import pypdf
import io

from app.models.documents import ParsedDocument, ParseRequest, DocumentType
from app.models.audit import AuditResult, AuditRequest
from app.models.certificate import IcegateCertificate, CertificateGenerateRequest
from app.services.parser_service import parser_service
from app.services.audit_service import audit_service
from app.services.cert_service import cert_service
from app.services.demo_service import demo_service
from app.core.ollama_client import ollama_client
from app.core.config import settings

router = APIRouter()


@router.get("/health", tags=["System"])
async def health_check():
    ollama_ok = await ollama_client.is_available()
    models = await ollama_client.get_available_models() if ollama_ok else []
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ollama": {
            "online": ollama_ok,
            "base_url": settings.OLLAMA_BASE_URL,
            "target_model": settings.OLLAMA_MODEL,
            "installed_models": models
        }
    }


# -------------------------------------------------------------
# Demo Data Endpoints (for 1-Click interactive demos)
# -------------------------------------------------------------
@router.get("/demo/cases", tags=["Demo Cases"])
async def list_demo_cases():
    """Lists available pre-packaged shipping document demo bundles."""
    return demo_service.list_cases()


@router.get("/demo/cases/{case_id}", tags=["Demo Cases"])
async def get_demo_case(case_id: str):
    """Retrieves full document texts and metadata for a demo case."""
    try:
        return demo_service.get_case(case_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


# -------------------------------------------------------------
# Stage 1: Document Parsing
# -------------------------------------------------------------
@router.post("/stage1/parse", response_model=ParsedDocument, tags=["Stage 1: Document Parser"])
async def parse_document(request: ParseRequest):
    """
    Parses shipping text into strict Pydantic JSON schema using local Ollama model.
    Extracts BIC containers, HS codes, Gross/Net weights, and parties.
    """
    return await parser_service.parse_document(
        text=request.text,
        doc_type_hint=request.doc_type_hint,
        filename=request.filename or "document.txt"
    )


@router.post("/stage1/upload-pdf", response_model=ParsedDocument, tags=["Stage 1: Document Parser"])
async def upload_pdf(file: UploadFile = File(...), doc_type_hint: Optional[DocumentType] = Query(None)):
    """Uploads a PDF file and extracts structured data."""
    try:
        content = await file.read()
        reader = pypdf.PdfReader(io.BytesIO(content))
        text = "\n".join([page.extract_text() or "" for page in reader.pages])
        if not text.strip():
            text = f"[Empty or Scanned PDF: {file.filename}]"
        
        return await parser_service.parse_document(
            text=text,
            doc_type_hint=doc_type_hint,
            filename=file.filename
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process PDF: {str(e)}")


# -------------------------------------------------------------
# Stage 2: Cross-Document Audit Engine
# -------------------------------------------------------------
@router.post("/stage2/audit", response_model=AuditResult, tags=["Stage 2: Audit Engine"])
async def run_audit(request: AuditRequest):
    """
    Performs cross-document consistency audit:
    - Weight variance check between B/L and Packing List
    - HS code classification alignment
    - Consignee and Incoterm matching
    - ISO 6346 container checksum validation
    - Projects estimated demurrage and customs fines averted ($ / ₹)
    """
    if not request.documents:
        raise HTTPException(status_code=400, detail="At least one parsed document is required for auditing.")
    return audit_service.perform_cross_audit(request.documents, consignment_id=request.consignment_id)


# -------------------------------------------------------------
# Stage 3: ICEGATE Pre-Clearance Certificate
# -------------------------------------------------------------
@router.post("/stage3/certificate", response_model=IcegateCertificate, tags=["Stage 3: Clearance Certificate"])
async def generate_certificate(request: CertificateGenerateRequest):
    """
    Generates an official ICEGATE Pre-Clearance Certificate:
    - Classifies clearance channel (Green / Yellow / Red Channel)
    - Generates SHA-256 cryptographic verification signature
    - Calculates total demurrage and compliance loss averted
    """
    return cert_service.generate_certificate(request.audit_result, customs_station=request.customs_station or "INNSA1")


# -------------------------------------------------------------
# End-to-End 1-Click Pipeline Endpoint
# -------------------------------------------------------------
@router.post("/pipeline/run-case/{case_id}", tags=["Pipeline 1-Click Execution"])
async def run_pipeline_for_case(case_id: str, customs_station: Optional[str] = Query("INNSA1")):
    """
    Executes the entire 3-stage pipeline in a single call for a demo case:
    1. Parse all shipping documents in the case
    2. Run cross-document audit and demurrage projection
    3. Generate official ICEGATE Pre-Clearance Certificate
    """
    try:
        case = demo_service.get_case(case_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    parsed_docs: List[ParsedDocument] = []
    for doc_info in case["documents"]:
        parsed = await parser_service.parse_document(
            text=doc_info["raw_text"],
            doc_type_hint=doc_info["doc_type"],
            filename=f"{doc_info['doc_type'].value}.txt"
        )
        parsed_docs.append(parsed)

    audit_result = audit_service.perform_cross_audit(
        documents=parsed_docs,
        consignment_id=f"CASE-{case_id.upper()}"
    )

    certificate = cert_service.generate_certificate(
        audit_result=audit_result,
        customs_station=customs_station
    )

    return {
        "case_id": case_id,
        "case_title": case["title"],
        "stage1_parsed_documents": parsed_docs,
        "stage2_audit_result": audit_result,
        "stage3_certificate": certificate
    }
