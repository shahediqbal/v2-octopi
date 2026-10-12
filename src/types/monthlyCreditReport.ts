export interface MonthlyCreditLastTransactions {
  lastSaleAmount?: number | null
  lastSaleDate?: string | null
  lastPaymentAmount?: number | null
  lastPaymentDate?: string | null
  daysSinceLastPayment?: number | string | null
  daysSinceLastSale?: number | string | null
  paymentStatus?: string | null
}

export interface MonthlyCreditItem {
  employeeId: number | null
  employeeName: string | null
  monthName: string | null
  monthYear: string | null
  creditAmount: number | null
  customerCount: number | null
  invoiceCount: number | null
  customerName?: string | null
  marketingName?: string | null
  monthlyValues?: Record<string, number | null | undefined> | null
  lastTransactions?: MonthlyCreditLastTransactions | null
  [key: string]: unknown
}

export interface MonthlyCreditFilters {
  employeeId: number
  startDate: string
  endDate: string
}
