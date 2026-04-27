export interface MonthlyCreditItem {
  employeeId: number | null
  employeeName: string | null
  monthName: string | null
  monthYear: string | null
  creditAmount: number | null
  customerCount: number | null
  invoiceCount: number | null
  [key: string]: unknown
}

export interface MonthlyCreditFilters {
  employeeId: number
  startDate: string
  endDate: string
}
