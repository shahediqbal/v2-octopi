/* ─── Customer Credit Report types ─── */

export interface CreditTransactionItem {
  serial_no: number | null
  date: string | null
  job_type: string | null
  transaction_number: string | null
  payable_amount: number | null
  paid_amount: number | null
  returned_amount: number | null
  linq_calculated_due_amount: number | null
}

export interface CreditHistoryResponse {
  customerInfo: {
    customerId: number
    customerName: string
    customerAddress: string
  } | null
  transctionInfo: CreditTransactionItem[]
}

export interface CreditSummaryItem {
  customerId: number | null
  customerName: string | null
  customerAddress: string | null
  marketingName: string | null
  openingCredit: number | null
  totalSale: number | null
  totalPaid: number | null
  totalAdjustment: number | null
  totalDue: number | null
}

export interface CustomerCreditFilters {
  startDate: string
  endDate: string
  customerId: number
}
