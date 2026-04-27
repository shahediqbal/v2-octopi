/* ─── Tax AIT Detail Report types ─── */

export interface TaxAitDetailItem {
  systemNo: string | null
  invoiceDate: string | null
  customerName: string | null
  customerAddress: string | null
  monthName: string | null
  yearMonth: string | null
  taxableBase: number | null
  vatRatePct: number | null
  aitRatePct: number | null
  vatAmount: number | null
  aitAmount: number | null
  runningTaxableBaseByCustomer: number | null
}

export interface TaxAitDetailFilters {
  startDate: string
  endDate: string
  customerId: number
}
