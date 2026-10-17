from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.audit import AuditResult


class CertificateStatus(str, Enum):
    GREEN_CHANNEL_APPROVED = "GREEN_CHANNEL_APPROVED"  # Accelerated clearance without physical examination
    YELLOW_CHANNEL_DOCUMENT_ASSESSMENT = "YELLOW_CHANNEL_DOCUMENT_ASSESSMENT" # Assessment needed
    RED_CHANNEL_HOLD = "RED_CHANNEL_HOLD"              # Physical inspection required due to discrepancies


class IcegateCertificate(BaseModel):
    certificate_id: str = Field(..., description="Unique ICEGATE pre-clearance certificate serial")
    issue_date: str = Field(..., description="Issuance timestamp")
    valid_until: str = Field(..., description="Validity expiration timestamp")
    customs_station: str = Field(..., description="Customs Port Station Code e.g. INNSA1")
    customs_station_name: str = Field(..., description="Customs House Name e.g. JNPT / Nhava Sheva")
    bill_of_entry_category: str = Field(..., description="Declaration Category e.g. Home Consumption")
    consignment_ref: str = Field(..., description="Internal consignment tracking ID")
    
    # Importer Details
    importer_name: str = Field(..., description="Registered importer name")
    importer_iec: str = Field(..., description="10-digit Importer-Exporter Code (IEC)")
    importer_gstin: Optional[str] = Field(default=None, description="GSTIN identifier")
    
    # Cargo & Transit Details
    vessel_name: Optional[str] = Field(default=None)
    voyage_no: Optional[str] = Field(default=None)
    bill_of_lading_no: str = Field(..., description="Primary Master/House B/L number")
    containers: List[str] = Field(..., description="List of verified container numbers")
    total_gross_weight_kg: float = Field(..., description="Verified gross weight in kg")
    harmonized_codes: List[str] = Field(..., description="List of validated 8-digit/6-digit HS codes")
    
    # Audit & Status
    channel_status: CertificateStatus = Field(...)
    audit_summary_status: str = Field(...)
    risk_level: str = Field(..., description="LOW / ELEVATED / HIGH")
    demurrage_averted_usd: float = Field(default=0.0)
    demurrage_averted_inr: float = Field(default=0.0)
    
    # Cryptographic integrity
    digital_signature_hash: str = Field(..., description="SHA-256 cryptographic proof hash")
    qr_payload_url: str = Field(..., description="Verification payload string for QR scanner")
    icegate_edi_version: str = Field(default="ICEGATE 2.0 / EDI-FACT compliant")


class CertificateGenerateRequest(BaseModel):
    audit_result: AuditResult
    customs_station: Optional[str] = Field(default="INNSA1")
