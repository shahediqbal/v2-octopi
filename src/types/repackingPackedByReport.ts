/* ─── Repacking Packed By Report types ─── */

/** Single row returned by GET /Report/GetRepackingPackedBy */
export interface RepackingPackedByReportItem {
  soSystemId: number | null
  soSystemNo: string | null
  customerName: string | null
  productName: string | null
  sopProductQty: number | null
  packTypeName: string | null
  sopPackSize: number | null
  sopNoPack: number | null
  empFirstName: string | null
  empLastName: string | null
  entryDate: string | null
}

/** Filters for the repacking packed-by report query */
export interface RepackingPackedByReportFilters {
  startDate: string
  endDate: string
  customerId: number
  employeeId: number
  soSystemId: string
  productId: number
}

/** API wrapper shape */
export interface RepackingPackedByReportApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}