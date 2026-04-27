/* ─── Packing Print Panel types ─── */

export interface PackingPrintItem {
  soSystemId: number | null
  soSystemNo: string | null
  invoiceDate: string | null
  customerName: string | null
  supplierName: string | null
  customerAddress: string | null
  supplierAddress: string | null
  jobType: string | null
  soOrderFrom: string | null
}

export interface PackingPrintFilters {
  currentStatus: number
  startDate: string
  endDate: string
  customerId: number
}
