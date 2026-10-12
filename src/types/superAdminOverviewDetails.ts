export interface SuperAdminPurchaseDetail {
  supplierId: number
  supplierName: string
  supplierAddress: string
  invoiceCount: number
  totalPurchase: number
  averageInvoiceValue: number
  lastPurchaseDate: string | null
}

export interface SuperAdminPurchaseDetailsSummary {
  startDate: string
  endDate: string
  totalPurchase: number
  supplierCount: number
  invoiceCount: number
  suppliers: SuperAdminPurchaseDetail[]
}
