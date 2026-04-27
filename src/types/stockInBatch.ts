/* ─── StockIn Batch Report types ─── */

export interface StockInBatchItem {
  supplierId: number | null
  supplierName: string | null
  invoiceNo: string | null
  siSystemNo: string | null
  invoiceDate: string | null
  productId: number | null
  productName: string | null
  batchNo: string | null
  batchProductionDate: string | null
  batchExpiryDate: string | null
  receivedQty: number | null
}

export interface StockInBatchFilters {
  startDate: string
  endDate: string
  supplierId: number
  productId: number
}
