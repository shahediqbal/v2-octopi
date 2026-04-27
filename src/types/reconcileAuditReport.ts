export interface ReconciliationItem {
  channelName: string | null
  productName: string | null
  openingStock: number | null
  stockInQty: number | null
  stockOutQty: number | null
  adjustmentQty: number | null
  calculatedClosing: number | null
  currentQty: number | null
  variance: number | null
}

export interface AuditItem {
  channelName: string | null
  productName: string | null
  movementDate: string | null
  movementType: string | null
  referenceNo: string | null
  qtyIn: number | null
  qtyOut: number | null
  qtyAdj: number | null
  qtyChange: number | null
  runningBalance: number | null
  openingBalanceAtStart: number | null
  remarks: string | null
}

export interface ReconcileAuditFilters {
  productId: number
  channelId: number
  dateFrom: string
  dateTo: string
}
