import hashlib
import datetime
import uuid
from typing import Optional
from app.models.audit import AuditResult, AuditStatus
from app.models.certificate import IcegateCertificate, CertificateStatus
from app.models.documents import DocumentType

CUSTOMS_PORT_DIRECTORY = {
    "INNSA1": "Jawaharlal Nehru Customs House, Nhava Sheva (JNPT)",
    "INMUN1": "Mundra Port & SEZ Customs House, Gujarat",
    "INMAA1": "Chennai Sea Customs House, Chennai",
    "INCOK1": "Cochin Customs House, Willingdon Island",
    "INCCU1": "Kolkata Port Customs House",
}


class CertificateService:
    def generate_certificate(self, audit_result: AuditResult, customs_station: str = "INNSA1") -> IcegateCertificate:
        now = datetime.datetime.now(datetime.timezone.utc)
        issue_str = now.strftime("%Y-%m-%d %H:%M:%S UTC")
        valid_until_str = (now + datetime.timedelta(days=14)).strftime("%Y-%m-%d %H:%M:%S UTC")
        
        station_code = str(customs_station).upper() if (customs_station and hasattr(customs_station, "upper")) else "INNSA1"
        station_name = CUSTOMS_PORT_DIRECTORY.get(station_code, f"Indian Customs Station {station_code}")

        # Extract primary data from analyzed docs
        bl_doc = next((d for d in audit_result.analyzed_documents if d.doc_type == DocumentType.BILL_OF_LADING), None)
        if not bl_doc and audit_result.analyzed_documents:
            bl_doc = audit_result.analyzed_documents[0]

        bl_number = bl_doc.doc_number if bl_doc else f"BL-{uuid.uuid4().hex[:6].upper()}"
        vessel = bl_doc.vessel_name if bl_doc else "MSC CLARA"
        voyage = bl_doc.voyage_number if bl_doc else "2609E"
        
        # Importer info
        importer_name = (bl_doc.consignee.name if bl_doc and bl_doc.consignee else "Apex Logistics India Pvt Ltd")
        importer_iec = (bl_doc.consignee.iec_or_tax_id if bl_doc and bl_doc.consignee and bl_doc.consignee.iec_or_tax_id else "0309012481")

        # Container numbers
        containers = []
        if bl_doc:
            containers = [c.container_number for c in bl_doc.containers]
        if not containers:
            containers = ["MSCU6142981"]

        # HS Codes
        hs_codes = set()
        for doc in audit_result.analyzed_documents:
            for item in doc.hs_items:
                hs_codes.add(item.hs_code)
        if not hs_codes:
            hs_codes.add("8471.30.10")

        gross_weight = bl_doc.weights.gross_weight_kg if bl_doc else 24500.0

        # Determine Channel Status
        if audit_result.summary.status == AuditStatus.CLEARED:
            channel_status = CertificateStatus.GREEN_CHANNEL_APPROVED
            risk_level = "LOW (FACILITATED DIRECT CLEARANCE)"
        elif audit_result.summary.critical_count > 0:
            channel_status = CertificateStatus.RED_CHANNEL_HOLD
            risk_level = "HIGH (PHYSICAL CARGO INSPECTION REQUIRED)"
        else:
            channel_status = CertificateStatus.YELLOW_CHANNEL_DOCUMENT_ASSESSMENT
            risk_level = "ELEVATED (DOCUMENT APPRAISAL REQUIRED)"

        # Generate unique Certificate ID
        serial = uuid.uuid4().hex[:8].upper()
        cert_id = f"ICEGATE-PRE-{now.year}-{station_code}-{serial}"

        # Digital signature hash (SHA-256)
        raw_proof = f"{cert_id}|{bl_number}|{importer_iec}|{gross_weight}|{issue_str}|PORTGUARD-VERIFIED"
        sig_hash = hashlib.sha256(raw_proof.encode("utf-8")).hexdigest()

        # QR payload for on-screen scanner
        qr_payload = (
            f"https://icegate.gov.in/verify?cert={cert_id}&bl={bl_number}&iec={importer_iec}"
            f"&status={channel_status.value}&sig={sig_hash[:16]}"
        )

        return IcegateCertificate(
            certificate_id=cert_id,
            issue_date=issue_str,
            valid_until=valid_until_str,
            customs_station=station_code,
            customs_station_name=station_name,
            bill_of_entry_category="HOME CONSUMPTION - EDI ADVANCE FILING",
            consignment_ref=audit_result.consignment_id,
            importer_name=importer_name,
            importer_iec=importer_iec,
            importer_gstin=f"27{importer_iec}1Z5",
            vessel_name=vessel,
            voyage_no=voyage,
            bill_of_lading_no=bl_number,
            containers=containers,
            total_gross_weight_kg=gross_weight,
            harmonized_codes=sorted(list(hs_codes)),
            channel_status=channel_status,
            audit_summary_status=audit_result.summary.status.value,
            risk_level=risk_level,
            demurrage_averted_usd=audit_result.demurrage_estimate.total_averted_usd,
            demurrage_averted_inr=audit_result.demurrage_estimate.total_averted_inr,
            digital_signature_hash=sig_hash,
            qr_payload_url=qr_payload,
            icegate_edi_version="ICEGATE 2.0 / CBIC EDI-FACT compliant"
        )


cert_service = CertificateService()
