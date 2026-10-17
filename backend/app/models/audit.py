from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.documents import ParsedDocument


class DiscrepancySeverity(str, Enum):
    CRITICAL = "CRITICAL"  # Guaranteed customs hold & immediate demurrage accrual
    WARNING = "WARNING"    # Likely query from customs inspector
    INFO = "INFO"          # Formatting / non-blocking discrepancy


class DiscrepancyType(str, Enum):
    WEIGHT_MISMATCH = "WEIGHT_MISMATCH"
    HS_CODE_MISMATCH = "HS_CODE_MISMATCH"
    CONSIGNEE_MISMATCH = "CONSIGNEE_MISMATCH"
    INCOTERM_MISMATCH = "INCOTERM_MISMATCH"
    CONTAINER_CHECK_FAIL = "CONTAINER_CHECK_FAIL"
    PORT_MISMATCH = "PORT_MISMATCH"
    VALUE_VARIANCE = "VALUE_VARIANCE"


class Discrepancy(BaseModel):
    id: str = Field(..., description="Unique discrepancy identifier e.g. DISC-01")
    type: DiscrepancyType = Field(..., description="Category of error")
    severity: DiscrepancySeverity = Field(..., description="Severity level")
    title: str = Field(..., description="Short summary title")
    description: str = Field(..., description="Detailed explanation of the mismatch")
    expected_value: str = Field(..., description="Value declared on primary document (e.g. BL)")
    found_value: str = Field(..., description="Conflicting value found on secondary document (e.g. PL)")
    source_docs: List[str] = Field(..., description="Documents involved in discrepancy")
    estimated_penalty_usd: float = Field(default=0.0, description="Estimated demurrage/penalty liability in USD")
    estimated_penalty_inr: float = Field(default=0.0, description="Estimated demurrage/penalty liability in INR")
    regulatory_clause: Optional[str] = Field(default=None, description="Customs legal clause e.g. ICEGATE Sec 111(m)")
    remediation_action: str = Field(..., description="Actionable step to fix before customs filing")


class AuditStatus(str, Enum):
    CLEARED = "CLEARED"                # 100% Match, ready for instant ICEGATE filing
    FLAGGED_RISK = "FLAGGED_RISK"      # Discrepancies found, demurrage risk flagged
    REJECTED = "REJECTED"              # Severe invalidity (e.g. invalid container checksum)


class AuditSummary(BaseModel):
    total_checks: int = Field(default=0)
    passed_checks: int = Field(default=0)
    failed_checks: int = Field(default=0)
    critical_count: int = Field(default=0)
    warning_count: int = Field(default=0)
    status: AuditStatus = Field(...)
    match_percentage: float = Field(default=100.0)


class DemurrageEstimate(BaseModel):
    estimated_hold_days: int = Field(..., description="Estimated customs hold duration without pre-clearance")
    daily_demurrage_usd: float = Field(..., description="Daily container demurrage rate in USD")
    daily_demurrage_inr: float = Field(..., description="Daily container demurrage rate in INR")
    customs_fine_usd: float = Field(default=0.0, description="Statutory fine for misdeclaration")
    customs_fine_inr: float = Field(default=0.0, description="Statutory fine for misdeclaration in INR")
    total_averted_usd: float = Field(..., description="Total financial loss averted by catching error early")
    total_averted_inr: float = Field(..., description="Total financial loss averted in INR")
    calculation_breakdown: str = Field(..., description="Readable explanation of how savings were calculated")


class AuditResult(BaseModel):
    consignment_id: str = Field(..., description="Consignment or job reference ID")
    audit_timestamp: str = Field(..., description="ISO 8601 timestamp of audit run")
    summary: AuditSummary = Field(..., description="High-level audit metrics")
    discrepancies: List[Discrepancy] = Field(default_factory=list, description="List of detected errors")
    demurrage_estimate: DemurrageEstimate = Field(..., description="Averted financial loss projection")
    analyzed_documents: List[ParsedDocument] = Field(..., description="Underlying parsed documents")
    ai_compliance_assessment: Optional[str] = Field(default=None, description="Gemma 4 generated customs officer compliance briefing")


class AuditRequest(BaseModel):
    documents: List[ParsedDocument] = Field(..., description="List of parsed shipping documents to cross-audit")
    consignment_id: Optional[str] = Field(default=None, description="Optional job ID")
