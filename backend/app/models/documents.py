from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    BILL_OF_LADING = "BILL_OF_LADING"
    COMMERCIAL_INVOICE = "COMMERCIAL_INVOICE"
    PACKING_LIST = "PACKING_LIST"
    UNKNOWN = "UNKNOWN"


class ContainerInfo(BaseModel):
    container_number: str = Field(..., description="Container ID e.g. MSCU1234567")
    iso_type: Optional[str] = Field(default="40HC", description="ISO container size/type code")
    seal_number: Optional[str] = Field(default=None, description="Customs lead or high-security seal")
    is_valid_bic: bool = Field(default=True, description="ISO 6346 / BIC check-digit verification status")
    tare_weight_kg: Optional[float] = Field(default=None, description="Tare weight in kg")


class HSCodeItem(BaseModel):
    hs_code: str = Field(..., description="Harmonized Tariff Code e.g. 8471.30.10")
    description: str = Field(..., description="Commercial cargo item description")
    quantity: Optional[float] = Field(default=1.0, description="Declared quantity")
    unit: Optional[str] = Field(default="PCS", description="Unit of measurement")
    total_value_usd: Optional[float] = Field(default=None, description="Total line value in USD")


class WeightInfo(BaseModel):
    gross_weight_kg: float = Field(..., description="Total gross weight including packaging")
    net_weight_kg: Optional[float] = Field(default=None, description="Net weight of goods")
    tare_weight_kg: Optional[float] = Field(default=None, description="Tare weight of container")
    measurement_cbm: Optional[float] = Field(default=None, description="Cubic volume in CBM")


class PartyInfo(BaseModel):
    name: str = Field(..., description="Company or individual entity name")
    address: Optional[str] = Field(default=None, description="Full registered physical address")
    country_code: Optional[str] = Field(default=None, description="ISO 2-letter country code")
    iec_or_tax_id: Optional[str] = Field(default=None, description="Import-Export Code (IEC) or GSTIN")


class ParsedDocument(BaseModel):
    doc_id: str = Field(..., description="Unique document reference ID")
    doc_type: DocumentType = Field(..., description="Type of shipping document")
    doc_number: str = Field(..., description="Document serial/tracking number e.g. BL-89421")
    issue_date: Optional[str] = Field(default=None, description="Date of document issuance")
    vessel_name: Optional[str] = Field(default=None, description="Ocean vessel name")
    voyage_number: Optional[str] = Field(default=None, description="Voyage identifier")
    port_of_loading: Optional[str] = Field(default=None, description="Port of origin / loading (UN/LOCODE or text)")
    port_of_discharge: Optional[str] = Field(default=None, description="Destination customs port (e.g. INNSA1 / Nhava Sheva)")
    shipper: Optional[PartyInfo] = Field(default=None, description="Shipper / Exporter details")
    consignee: Optional[PartyInfo] = Field(default=None, description="Consignee / Importer details")
    notify_party: Optional[PartyInfo] = Field(default=None, description="Notify party details")
    incoterm: Optional[str] = Field(default="FOB", description="Incoterms (FOB, CIF, CFR, DDP, EXW)")
    containers: List[ContainerInfo] = Field(default_factory=list, description="Extracted container IDs")
    hs_items: List[HSCodeItem] = Field(default_factory=list, description="Extracted HS tariff classified line items")
    weights: WeightInfo = Field(..., description="Declared weight specifications")
    currency: Optional[str] = Field(default="USD", description="Declared invoice currency")
    total_amount: Optional[float] = Field(default=None, description="Total invoice amount")
    raw_snippet: Optional[str] = Field(default=None, description="Source raw text snippet")


class ParseRequest(BaseModel):
    text: str = Field(..., description="Raw text of shipping document to extract")
    doc_type_hint: Optional[DocumentType] = Field(default=None, description="Optional hint for document type")
    filename: Optional[str] = Field(default="document.txt", description="Original filename")
