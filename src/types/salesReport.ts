/* ─── Sales Report types ─── */

/** Single row returned by GET /Report/GetSalesInfoReport */
export interface SalesReportItem {
  soSystemId: number | null
  soSystemNo: string | null
  invoiceDate: string | null
  entityName: string | null
  entityAddress: string | null
  sobFinalBill: number | null
  jobType: string | null
  lifecycleName: string | null
  soOrderFrom: string | null
  orderStatus: string | null
  atEscalation: string | null
  atInvoicing: string | null
  atPacking: string | null
  atAssign: string | null
  atDelivery: string | null
  delivered: string | null
  deliveredBy: string | null
  actionTakenRemarks: string | null
  soCustomerReferance: string | null
}

/** Filters for the sales report query */
export interface SalesReportFilters {
  startDate: string
  endDate: string
  partnerId: number
}

/** API wrapper shape */
export interface SalesReportApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}
