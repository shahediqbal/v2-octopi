export interface StockOutSalesReturnItem {
  customerId: number | null
  customerName: string | null
  productId: number | null
  productName: string | null
  invoiceNo: string | null
  invoiceDate: string | null
  stockOutQty: number | null
  returnQty: number | null
  netQty: number | null
  stockOutAmount: number | null
  returnAmount: number | null
  netAmount: number | null
  remarks: string | null
}

export interface StockOutSalesReturnFilters {
  customerId: number
  productId: number
  startDate: string
  endDate: string
}
