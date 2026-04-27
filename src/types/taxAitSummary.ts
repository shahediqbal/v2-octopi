/* ─── Tax AIT Summary Report types ─── */

export interface TaxAitSummaryItem {
  customerName: string | null
  customerAddress: string | null
  yearMonth: string | null
  monthName: string | null
  year: number | null
  invoiceCount: number | null
  sumTaxableBase: number | null
  sumVatAmount: number | null
  sumAitAmount: number | null
  runningSumTaxableBaseByCustomer: number | null
  runningSumVatByCustomer: number | null
  runningSumAitByCustomer: number | null
}

export interface TaxAitSummaryFilters {
  startDate: string
  endDate: string
  customerId: number
}
