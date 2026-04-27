export interface ProductInReportItem {
  siSystemId: number | null
  siSystemNo: string | null
  siInvoiceNo: string | null
  siInvoiceDate: string | null
  siSupplierId: number | null
  supplierName: string | null
  customerName: string | null
  jobType: string | null
  sidProductId: number | null
  productName: string | null
  sidMappedProductId: number | null
  mappedProductName: string | null
  sidConfirmedQty: number | null
  sidConfirmedUnitPrice: number | null
  siCurrentStatus: number | null
  lifecycleName: string | null
  siRemarks: string | null
}

export interface ProductInReportFilters {
  startDate: string
  endDate: string
  productId: number
}
