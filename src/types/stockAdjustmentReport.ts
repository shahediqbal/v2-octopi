export interface StockAdjustmentReportItem {
  sadAutoId: number | null
  productName: string | null
  sadProductQty: number | null
  sadIsIncreased: boolean | null
}

export interface AdjustmentReference {
  id: number
  label: string
}
