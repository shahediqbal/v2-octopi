/* ─── Payment Report types ─── */

/** Single row returned by GET /Report/GetPaymentReport */
export interface PaymentReportItem {
  paymentSystemId: number | null
  paymentCustomerId: number | null
  customerName: string | null
  customerAddress: string | null
  soSystemNo: string | null
  invoiceDate: string | null
  sobFinalBill: number | null
  moenyRecepitNo: string | null
  paymentDate: string | null
  paymentAmount: number | null
  paymentAdjustedAmount: number | null
  paymentMethodName: string | null
  paymentMethodType: string | null
  collectedBy: string | null
  paymentChequeId: number | null
  chequeNumber: string | null
  chequeCollectionDate: string | null
  chequeDate: string | null
  chequeAmount: number | null
  chequeBankName: string | null
  beneficiaryBank: string | null
  belongsToFname: string | null
  belongsToLname: string | null
}

/** Filters for the payment report query */
export interface PaymentReportFilters {
  startDate: string
  endDate: string
  partnerId: number
}

/** API wrapper shape */
export interface PaymentReportApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}