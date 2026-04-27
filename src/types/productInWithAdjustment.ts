export interface ProductInWithAdjustmentItem {
  siSystemNo: string | null
  siInvoiceDate: string | null
  supplierName: string | null
  customerName: string | null
  sidProductId: number | null
  productName: string | null
  sidConfirmedQty: number | null
  sidConfirmedUnitPrice: number | null
  adjustmentAmount: number | null
  adjustedUnitPrice: number | null
  // Raw fallback fields from API
  sidAdjustedAmount?: number | null
  sidAdjustmentAmount?: number | null
  sidAdjustmentQty?: number | null
  sidAdjustedUnitPrice?: number | null
  sidFinalUnitPrice?: number | null
}

export interface ProductInWithAdjustmentFilters {
  startDate: string
  endDate: string
  productId: number
}
