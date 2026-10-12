// ─── Detail (all customers) ───
// export interface LoanReportDetailItem {
//   customerId: number | null
//   customerName: string | null
//   customerAddress: string | null
//   invoiceNo: string | null
//   invoiceDate: string | null
//   productName: string | null
//   loanGivenQuantity: number | null
//   loanReceiveQuantity: number | null
// }
export interface LoanReportDetailItem {
  productId?: number | null
  customerId: number | null
  customerName: string | null
  customerAddress: string | null
  invoiceNo: string | null
  invoiceDate: string | null
  productName: string | null
  loanGivenQuantity: number | null
  loanReceiveQuantity: number | null
}

export interface LoanReportSummaryItem {
  productId?: number | null
  customerId: number | null
  customerName: string | null
  customerAddress: string | null
  productName: string | null
  loanGivenQuantity: number | null
  loanReceiveQuantity: number | null
  balanceQuantity: number | null
}
// ─── Summary (all customers) ───
// export interface LoanReportSummaryItem {
//   customerId: number | null
//   customerName: string | null
//   customerAddress: string | null
//   productName: string | null
//   loanGivenQuantity: number | null
//   loanReceiveQuantity: number | null
//   balanceQuantity: number | null
// }

export interface LoanReportFilters {
  customerId: number
  productId: number
}
