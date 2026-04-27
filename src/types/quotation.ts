// ─────────────────────────────────────────────────────────────────────────────
// Quotation Module Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}

export interface QuotationListItem {
  pqSystemId: number
  pqSystemNo: string
  pqOrderDate: string
  customerName: string
  customerAddress: string
}

export interface QuotationDetail {
  priceQuotationMasterData: QuotationMaster
  priceQuotationDetailList: QuotationLineItem[]
}

export interface QuotationMaster {
  pqSystemId: number
  pqSystemNo: string
  customerId: number
  customerName: string
  customerAddress: string
  pqOrderDate: string
  pqCurrencyName: string                // "BDT" | "USD"
}

export interface QuotationLineItem {
  pqdProductId: number
  productName: string
  pqdProductUnitPrice: number
  pqdAppliedVatPercantage: number        // NOTE: backend typo "Percantage"
  pqdAppliedAitPercantage: number
  pqdIncreasedType: string               // "F" (flat) | "P" (percentage)
  pqdIncreasedAmount: number
  pqdCalculatedPrice: number
  pqdAdustedAmount: number               // NOTE: backend typo "Adusted"
  pqdFinalPrice: number
}

export interface CreateQuotationPayload {
  pqSystemId: number                     // UserSystemId from JWT decode
  customerId: number
  pqCurrencyName: string
  priceQuotationProducts: QuotationProductPayload[]
}

export interface UpdateQuotationPayload {
  pqSystemId: number                     // Existing quotation ID
  customerId: number
  pqCurrencyName: string
  priceQuotationProducts: QuotationProductPayload[]
}

export interface QuotationProductPayload {
  pqdProductId: number
  pqdProductUnitPrice: number
  pqdAppliedVatPercantage: number
  pqdAppliedAitPercantage: number
  pqdIncreasedType: string
  pqdIncreasedAmount: number
  pqdCalculatedPrice: number
  pqdAdustedAmount: number
  pqdFinalPrice: number
}

export interface ApproveQuotationPayload {
  pqSystemId: number
  isApproved: boolean                    // always true
}
