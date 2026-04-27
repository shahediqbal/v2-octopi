// ─── Tax Duty List Row ───
export interface TaxDutyRow {
  customerTaxDutyId: number
  customerId: number
  customerName: string
  customerAddress: string
  customerAitPercentage: number
  customerVatPercentage: number
  effectiveDate: string
}

// ─── Single Detail (from ByIdCustomerTaxDuty) ───
export interface TaxDutyDetail {
  customerTaxDutyId: number
  customerId: number
  customerName: string
  customerAitPercentage: number
  customerVatPercentage: number
  effectiveDate: string
}

// ─── Create Payload ───
export interface CreateTaxDutyPayload {
  customerId: number
  customerAitPercentage: number
  customerVatPercentage: number
  effectiveDate: string
}

// ─── Update Payload (ID in body) ───
export interface UpdateTaxDutyPayload {
  customerTaxDutyId: number
  customerId: number
  customerAitPercentage: number
  customerVatPercentage: number
  effectiveDate: string
}
