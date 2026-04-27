export interface DeliveryReportItem {
  soSystemNo: string | null
  invoiceDate: string | null
  entityName: string | null
  entityAddress: string | null
  sobFinalBill: number | null
  jobType: string | null
  lifecycleName: string | null
  soOrderFrom: string | null
  atEscalation: string | null
  atInvoicing: string | null
  atPacking: string | null
  atAssign: string | null
  atDelivery: string | null
  delivered: string | null
  deliveredBy: string | null
}

export interface DeliveryReportFilters {
  startDate: string
  endDate: string
  partnerId: number
}
