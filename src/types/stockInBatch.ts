/* ─── StockIn Batch Report types ─── */

export interface StockInBatchItem {
  supplierId: number | null
  supplierName: string | null
  siCustomerId: number | null
  customerName: string | null
  customerAddress: string | null
  siInvoiceNo: string | null
  siSystemNo: string | null
  siInvoiceDate: string | null
  productId: number | null
  productName: string | null
  batchNo: string | null
  batchProductionDate: string | null
  batchExpiryDate: string | null
  receiveQuantity: number | null
}

export interface StockInBatchFilters {
  startDate: string
  endDate: string
  supplierId: number
  customerId: number
  productId: number
}
