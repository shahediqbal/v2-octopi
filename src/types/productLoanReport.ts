// ─── Detail item ───
export interface ProductLoanDetailItem {
  manualInvoice: string | null
  invoiceDate: string | null
  productName: string | null
  loanReceivedQty: number | null
  loanGivenQty: number | null
}

// ─── Summary item ───
export interface ProductLoanSummaryItem {
  productName: string | null
  loanReceivedQty: number | null
  loanGivenQty: number | null
  balanceQty: number | null
}

export interface ProductLoanFilters {
  customerId: number
  productId: number
}
