/* ─── Purchase Price History types ─── */

export interface PurchasePriceHistoryItem {
  supplierId: number | null
  supplierName: string | null
  productId: number | null
  productName: string | null
  confirmedUnitPrice: number | null
  invoiceDate: string | null
}

export interface PurchasePriceHistoryFilters {
  productId: number // 0 = all
}
