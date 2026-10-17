import datetime
import uuid
from typing import List, Tuple
from app.models.documents import ParsedDocument, DocumentType
from app.models.audit import (
    AuditResult,
    AuditSummary,
    AuditStatus,
    Discrepancy,
    DiscrepancySeverity,
    DiscrepancyType,
    DemurrageEstimate,
)
from app.core.config import settings


class AuditService:
    def perform_cross_audit(self, documents: List[ParsedDocument], consignment_id: str = None) -> AuditResult:
        cid = consignment_id or f"CONSIGN-{uuid.uuid4().hex[:8].upper()}"
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        discrepancies: List[Discrepancy] = []
        total_checks = 0
        passed_checks = 0
        
        # Organize docs by type
        doc_map = {d.doc_type: d for d in documents}
        bl = doc_map.get(DocumentType.BILL_OF_LADING) or (documents[0] if len(documents) > 0 else None)
        pl = doc_map.get(DocumentType.PACKING_LIST) or (documents[1] if len(documents) > 1 else None)
        ci = doc_map.get(DocumentType.COMMERCIAL_INVOICE) or (documents[2] if len(documents) > 2 else None)

        num_containers = len(bl.containers) if bl and bl.containers else 1

        # Check 1: Container ISO 6346 / BIC Checksum Check
        total_checks += 1
        container_errors = []
        for doc in documents:
            for c in doc.containers:
                if not c.is_valid_bic:
                    container_errors.append(f"{c.container_number} in {doc.doc_number}")
        
        if container_errors:
            discrepancies.append(Discrepancy(
                id=f"DISC-{uuid.uuid4().hex[:5].upper()}",
                type=DiscrepancyType.CONTAINER_CHECK_FAIL,
                severity=DiscrepancySeverity.CRITICAL,
                title="Invalid ISO 6346 Container Number Checksum",
                description=f"Container checksum failed for: {', '.join(container_errors)}. Port gate-in scanning systems will halt entry.",
                expected_value="Valid ISO 6346 BIC 7-digit modulus-11 check digit",
                found_value="Checksum verification failed",
                source_docs=[d.doc_number for d in documents],
                estimated_penalty_usd=450.0,
                estimated_penalty_inr=450.0 * settings.USD_TO_INR_RATE,
                regulatory_clause="Customs Automated EDI Gate System Rule 4",
                remediation_action="Verify container prefix and 7th digit against physical shipping line container plate."
            ))
        else:
            passed_checks += 1

        # Check 2: Cross-Document Gross Weight Variance (BL vs PL)
        if bl and pl:
            total_checks += 1
            bl_gw = bl.weights.gross_weight_kg
            pl_gw = pl.weights.gross_weight_kg
            variance_kg = abs(bl_gw - pl_gw)
            variance_pct = (variance_kg / max(bl_gw, 1.0)) * 100.0

            # Maritime tolerance threshold: 1.0% or 150 kg
            if variance_pct > 1.0:
                severity = DiscrepancySeverity.CRITICAL if variance_pct > 3.0 else DiscrepancySeverity.WARNING
                penalty_usd = 1200.0 if severity == DiscrepancySeverity.CRITICAL else 500.0
                discrepancies.append(Discrepancy(
                    id=f"DISC-{uuid.uuid4().hex[:5].upper()}",
                    type=DiscrepancyType.WEIGHT_MISMATCH,
                    severity=severity,
                    title="Gross Weight Discrepancy Between B/L and Packing List",
                    description=(
                        f"Discrepancy of {variance_kg:,.1f} kg ({variance_pct:.2f}% variance) detected between "
                        f"Bill of Lading ({bl.doc_number}) Gross Weight and Packing List ({pl.doc_number}) Gross Weight."
                    ),
                    expected_value=f"{bl_gw:,.1f} kg (Declared on B/L)",
                    found_value=f"{pl_gw:,.1f} kg (Declared on Packing List)",
                    source_docs=[bl.doc_number, pl.doc_number],
                    estimated_penalty_usd=penalty_usd,
                    estimated_penalty_inr=penalty_usd * settings.USD_TO_INR_RATE,
                    regulatory_clause="Indian Customs Act 1962 Sec 111(m) - Misdeclaration of Cargo Specifications",
                    remediation_action="Issue amended Packing List or Bill of Lading endorsement before EDI filing to avoid 100% container de-stuffing inspection."
                ))
            else:
                passed_checks += 1

        # Check 3: HS Code Tariff Classification Match (CI vs BL / PL)
        if ci and (bl or pl):
            total_checks += 1
            ci_hs = {item.hs_code.replace(".", "")[:6] for item in ci.hs_items}
            other_hs = set()
            if bl:
                other_hs.update({item.hs_code.replace(".", "")[:6] for item in bl.hs_items})
            if pl:
                other_hs.update({item.hs_code.replace(".", "")[:6] for item in pl.hs_items})

            mismatch = ci_hs.symmetric_difference(other_hs)
            if mismatch and len(other_hs) > 0:
                discrepancies.append(Discrepancy(
                    id=f"DISC-{uuid.uuid4().hex[:5].upper()}",
                    type=DiscrepancyType.HS_CODE_MISMATCH,
                    severity=DiscrepancySeverity.CRITICAL,
                    title="Harmonized System (HS) Tariff Code Conflict",
                    description=(
                        f"Commercial Invoice ({ci.doc_number}) declares HS codes [{', '.join(sorted(ci_hs))}], "
                        f"which conflicts with cargo declaration [{', '.join(sorted(other_hs))}]. "
                        "Customs duty assessment will be blocked for classification review."
                    ),
                    expected_value=f"Uniform 6/8-digit HS Code matching ICEGATE tariff schedule",
                    found_value=f"Conflicting classifications between Invoice and Transport Manifest",
                    source_docs=[ci.doc_number, (bl.doc_number if bl else pl.doc_number)],
                    estimated_penalty_usd=1500.0,
                    estimated_penalty_inr=1500.0 * settings.USD_TO_INR_RATE,
                    regulatory_clause="Customs Tariff Act 1975 & ICEGATE Automated Assessment System",
                    remediation_action="Harmonize HS code classification across commercial invoice and Bill of Lading."
                ))
            else:
                passed_checks += 1

        # Check 4: Consignee & IEC Verification
        if bl and ci and bl.consignee and ci.consignee:
            total_checks += 1
            bl_c = bl.consignee.name.strip().lower()
            ci_c = ci.consignee.name.strip().lower()
            # Simple fuzzy/substring check
            if bl_c not in ci_c and ci_c not in bl_c:
                discrepancies.append(Discrepancy(
                    id=f"DISC-{uuid.uuid4().hex[:5].upper()}",
                    type=DiscrepancyType.CONSIGNEE_MISMATCH,
                    severity=DiscrepancySeverity.WARNING,
                    title="Consignee Importer Name Divergence",
                    description=f"Consignee on B/L ('{bl.consignee.name}') does not match Commercial Invoice ('{ci.consignee.name}').",
                    expected_value=bl.consignee.name,
                    found_value=ci.consignee.name,
                    source_docs=[bl.doc_number, ci.doc_number],
                    estimated_penalty_usd=300.0,
                    estimated_penalty_inr=300.0 * settings.USD_TO_INR_RATE,
                    regulatory_clause="Customs Brokers Licensing Regulations (CBLR)",
                    remediation_action="Align buyer/consignee title or provide verified High Sea Sales / Endorsement agreement."
                ))
            else:
                passed_checks += 1

        # Check 5: Incoterm Consistency
        if bl and ci:
            total_checks += 1
            if bl.incoterm and ci.incoterm and bl.incoterm.strip().upper() != ci.incoterm.strip().upper():
                discrepancies.append(Discrepancy(
                    id=f"DISC-{uuid.uuid4().hex[:5].upper()}",
                    type=DiscrepancyType.INCOTERM_MISMATCH,
                    severity=DiscrepancySeverity.WARNING,
                    title="Incoterm Conflict Detected",
                    description=f"B/L indicates '{bl.incoterm}' while Commercial Invoice specifies '{ci.incoterm}'. Freight assessment dispute risk.",
                    expected_value=bl.incoterm,
                    found_value=ci.incoterm,
                    source_docs=[bl.doc_number, ci.doc_number],
                    estimated_penalty_usd=250.0,
                    estimated_penalty_inr=250.0 * settings.USD_TO_INR_RATE,
                    regulatory_clause="GATT Valuation Rules / Customs Valuation (Determination of Value of Imported Goods) Rules 2007",
                    remediation_action="Clarify whether freight and marine insurance are buyer or seller obligation."
                ))
            else:
                passed_checks += 1

        # Calculate Demurrage & Penalty Averted
        critical_count = sum(1 for d in discrepancies if d.severity == DiscrepancySeverity.CRITICAL)
        warning_count = sum(1 for d in discrepancies if d.severity == DiscrepancySeverity.WARNING)
        failed_checks = len(discrepancies)

        # Status determination
        if critical_count > 0:
            status = AuditStatus.FLAGGED_RISK
        elif warning_count > 0:
            status = AuditStatus.FLAGGED_RISK
        else:
            status = AuditStatus.CLEARED

        match_pct = max(0.0, round(((total_checks - failed_checks) / max(total_checks, 1)) * 100.0, 1))

        # Financial loss modeling
        if critical_count > 0:
            hold_days = 6  # Typical customs hold for misdeclaration / classification query
        elif warning_count > 0:
            hold_days = 2
        else:
            hold_days = 0

        daily_demurrage_usd = num_containers * settings.DEMURRAGE_DAILY_RATE_USD_40FT
        daily_demurrage_inr = daily_demurrage_usd * settings.USD_TO_INR_RATE

        demurrage_loss_usd = hold_days * daily_demurrage_usd
        customs_fines_usd = sum(d.estimated_penalty_usd for d in discrepancies)
        total_averted_usd = demurrage_loss_usd + customs_fines_usd
        total_averted_inr = total_averted_usd * settings.USD_TO_INR_RATE

        calc_text = (
            f"Based on {num_containers} x 40HC container(s) @ ${settings.DEMURRAGE_DAILY_RATE_USD_40FT}/day "
            f"over estimated {hold_days} days customs hold prevented, plus ${customs_fines_usd:,.2f} in statutory misdeclaration fines."
        ) if hold_days > 0 else "Consignment passed all consistency checks. Zero demurrage hold expected."

        demurrage_estimate = DemurrageEstimate(
            estimated_hold_days=hold_days,
            daily_demurrage_usd=daily_demurrage_usd,
            daily_demurrage_inr=daily_demurrage_inr,
            customs_fine_usd=customs_fines_usd,
            customs_fine_inr=customs_fines_usd * settings.USD_TO_INR_RATE,
            total_averted_usd=total_averted_usd,
            total_averted_inr=total_averted_inr,
            calculation_breakdown=calc_text
        )

        summary = AuditSummary(
            total_checks=total_checks,
            passed_checks=passed_checks,
            failed_checks=failed_checks,
            critical_count=critical_count,
            warning_count=warning_count,
            status=status,
            match_percentage=match_pct
        )

        return AuditResult(
            consignment_id=cid,
            audit_timestamp=timestamp,
            summary=summary,
            discrepancies=discrepancies,
            demurrage_estimate=demurrage_estimate,
            analyzed_documents=documents
        )


audit_service = AuditService()
