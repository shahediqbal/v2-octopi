/* ─── StockOut Batch Report types ─── */

export interface StockOutBatchItem {
  soSystemId: number | null
  invoiceDate: string | null
  customerId: number | null
  customerName: string | null
  productId: number | null
  productName: string | null
  batchId: number | null
  batchNo: string | null
  batchProductionDate: string | null
  batchExpiryDate: string | null
  batchCertificateNo: string | null
  soldQuantity: number | null
}

export interface StockOutBatchFilters {
  startDate: string
  endDate: string
  customerId: number
  productId: number
}
