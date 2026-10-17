from typing import Dict, Any, List
from app.models.documents import DocumentType, ParsedDocument, ContainerInfo, HSCodeItem, WeightInfo, PartyInfo

DEMO_CASES: Dict[str, Dict[str, Any]] = {
    "clean_consignment": {
        "id": "clean_consignment",
        "title": "Clean Consignment (Golden Path)",
        "description": "Electronics shipment via Nhava Sheva (JNPT). 100% document alignment across Bill of Lading, Invoice, and Packing List. Immediate Green Channel pre-clearance.",
        "port": "INNSA1 - Nhava Sheva (JNPT)",
        "cargo": "Portable automatic data processing machines (Laptops)",
        "documents": [
            {
                "doc_type": DocumentType.BILL_OF_LADING,
                "doc_number": "MSCU-2026-BOM89421",
                "raw_text": """
================================================================================
                    MEDITERRANEAN SHIPPING COMPANY S.A.
                         OCEAN BILL OF LADING
================================================================================
B/L NUMBER: MSCU-2026-BOM89421                    DATE OF ISSUE: 2026-10-12
VESSEL / VOYAGE: MSC CLARA / 2609E                FLAG: PANAMA
PORT OF LOADING: SHANGHAI, CHINA (CNSHA)
PORT OF DISCHARGE: NHAVA SHEVA, INDIA (INNSA1)

SHIPPER:
Sino-Pacific High-Tech Hardware Corp Ltd
Building 4, Pudong Free Trade Zone, Shanghai, China

CONSIGNEE:
Apex Logistics India Pvt Ltd
Plot 42, MIDC Industrial Area, Taloja, Navi Mumbai 410208, India
IEC CODE: 0309012481 | GSTIN: 270309012481Z5

CONTAINER NO: MSCU6142987 (40HC)      SEAL NO: MSC-IND-991204
PACKAGE COUNT: 500 CARTONS
DESCRIPTION OF GOODS:
Portable automatic data processing machines (Laptops)
HS TARIFF CODE: 8471.30.10
INCOTERM: FOB SHANGHAI

GROSS WEIGHT: 24,500.00 KG
NET WEIGHT:   22,100.00 KG
MEASUREMENT:  68.50 CBM
================================================================================
                """
            },
            {
                "doc_type": DocumentType.COMMERCIAL_INVOICE,
                "doc_number": "INV-2026-SH0918",
                "raw_text": """
================================================================================
                       COMMERCIAL INVOICE
================================================================================
INVOICE NO: INV-2026-SH0918                      INVOICE DATE: 2026-10-11
REF B/L: MSCU-2026-BOM89421                      CURRENCY: USD

SELLER / EXPORTER:
Sino-Pacific High-Tech Hardware Corp Ltd
Shanghai, China

BUYER / CONSIGNEE:
Apex Logistics India Pvt Ltd
Plot 42, MIDC Industrial Area, Taloja, Navi Mumbai 410208, India
IEC: 0309012481

ITEM 1:
- HS CODE: 8471.30.10
- DESCRIPTION: High-Performance Portable Laptop Computers
- QUANTITY: 500 UNITS
- UNIT PRICE: $750.00 USD
- TOTAL VALUE: $375,000.00 USD

TERMS OF DELIVERY: FOB SHANGHAI
PAYMENT TERMS: IRREVOCABLE L/C AT SIGHT
================================================================================
                """
            },
            {
                "doc_type": DocumentType.PACKING_LIST,
                "doc_number": "PL-2026-SH0918",
                "raw_text": """
================================================================================
                         EXPORT PACKING LIST
================================================================================
PACKING LIST NO: PL-2026-SH0918                  DATE: 2026-10-11
INVOICE REF: INV-2026-SH0918                     VESSEL: MSC CLARA

CONTAINER NO: MSCU6142987 (40HC)
SEAL NO: MSC-IND-991204

PACKAGING BREAKDOWN:
- PALLETS 1-25: 500 Master Cartons of 8471.30.10 Laptops
- TOTAL GROSS WEIGHT: 24,500.00 KG
- TOTAL NET WEIGHT:   22,100.00 KG
- CONTAINER TARE:     3,820.00 KG
- TOTAL VOLUME:       68.50 CBM

CONSIGNEE: Apex Logistics India Pvt Ltd
IEC: 0309012481
================================================================================
                """
            }
        ]
    },

    "high_risk_discrepancy": {
        "id": "high_risk_discrepancy",
        "title": "Severe Demurrage Risk Consignment",
        "description": "Auto parts shipment with 1,450 kg weight variance between B/L & Packing List, conflicting HS tariff codes (8708.29 vs 8409.91), and Incoterm clash.",
        "port": "INMUN1 - Mundra Port & SEZ, Gujarat",
        "cargo": "Automotive Transmission & Engine Sub-assemblies",
        "documents": [
            {
                "doc_type": DocumentType.BILL_OF_LADING,
                "doc_number": "MAEU-2026-NSA44109",
                "raw_text": """
================================================================================
                        MAERSK LINE A/S
                         OCEAN BILL OF LADING
================================================================================
B/L NUMBER: MAEU-2026-NSA44109                    DATE: 2026-10-14
VESSEL / VOYAGE: MAERSK MC-KINNEY / 991W          FLAG: DENMARK
PORT OF LOADING: BUSAN, SOUTH KOREA (KRPUS)
PORT OF DISCHARGE: MUNDRA PORT, INDIA (INMUN1)

SHIPPER:
Hanwha Precision Machining Co Ltd
Gimhae Industrial Complex, South Korea

CONSIGNEE:
Bharat Precision Engineering Ltd
Survey 118, Sanand Industrial Area, Ahmedabad, Gujarat 382110, India
IEC CODE: 0811099234

CONTAINER NO: MSCU6142981 (40HC)
SEAL NO: ML-KOR-550192

DESCRIPTION:
Automotive Body Parts & Sub-assemblies
HS CODE: 8708.29.00
FREIGHT TERMS: CIF MUNDRA

GROSS WEIGHT: 28,250.00 KG
NET WEIGHT:   25,600.00 KG
MEASUREMENT:  59.00 CBM
================================================================================
                """
            },
            {
                "doc_type": DocumentType.COMMERCIAL_INVOICE,
                "doc_number": "INV-EXP-8812",
                "raw_text": """
================================================================================
                       COMMERCIAL INVOICE
================================================================================
INVOICE NO: INV-EXP-8812                         DATE: 2026-10-13
B/L REF: MAEU-2026-NSA44109                      CURRENCY: USD

SELLER:
Hanwha Precision Machining Co Ltd
South Korea

CONSIGNEE / BUYER:
Bharat Precision Automations LLP
Sanand, Gujarat, India
IEC CODE: 0811099234

ITEM 1:
- HS CODE: 8409.91.00  [NOTE: Classifies as Spark-ignition internal combustion engine parts, basic customs duty differs from 8708.29.00]
- DESCRIPTION: Precision machined powertrain housing
- QTY: 1,200 UNITS
- TOTAL VALUE: $148,000.00 USD

TERMS OF DELIVERY: FOB BUSAN  [CONFLICT: B/L states CIF MUNDRA]
================================================================================
                """
            },
            {
                "doc_type": DocumentType.PACKING_LIST,
                "doc_number": "PL-EXP-8812",
                "raw_text": """
================================================================================
                         EXPORT PACKING LIST
================================================================================
PACKING LIST NO: PL-EXP-8812                     DATE: 2026-10-13
B/L REF: MAEU-2026-NSA44109

CONTAINER NO: MSCU6142981 (40HC)
SEAL NO: ML-KOR-550192

CARGO BREAKDOWN:
- 1,200 Precision Powertrain Castings in 48 Steel Crates
- GROSS WEIGHT: 26,800.00 KG  [CRITICAL: 1,450 KG lower than B/L declared 28,250 KG!]
- NET WEIGHT:   24,200.00 KG
- TARE WEIGHT:   3,850.00 KG
- VOLUME:        59.00 CBM

CONSIGNEE: Bharat Precision Engineering Ltd
================================================================================
                """
            }
        ]
    }
}


class DemoService:
    def list_cases(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": c["id"],
                "title": c["title"],
                "description": c["description"],
                "port": c["port"],
                "cargo": c["cargo"],
                "doc_count": len(c["documents"])
            }
            for c in DEMO_CASES.values()
        ]

    def get_case(self, case_id: str) -> Dict[str, Any]:
        if case_id not in DEMO_CASES:
            raise KeyError(f"Demo case '{case_id}' not found. Available: {list(DEMO_CASES.keys())}")
        return DEMO_CASES[case_id]


demo_service = DemoService()
