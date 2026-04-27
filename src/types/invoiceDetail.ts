/* ─── Invoice Detail types ─── */

export interface InvoiceDetailItem {
  productName: string | null
  sodQty: number | null
  sodUnitPrice: number | null
  sodFinalCalculatedUnitPrice: number | null
  sodFinalPrice: number | null
}

export interface InvoiceBillData {
  calculatedBill: number | null
  billVatPercantage: number | null
  billAitPercantage: number | null
  billDiscount: number | null
  billAdjustment: number | null
  finalBill: number | null
  sobCurrencyName: string | null
  billDiscountAmount: number | null
}

export interface InvoiceDetail {
  soSystemNo: string | null
  jobType: string | null
  entityName: string | null
  entityAddress: string | null
  stockOutItemsData: InvoiceDetailItem[]
  stockOutBillData: InvoiceBillData
}
