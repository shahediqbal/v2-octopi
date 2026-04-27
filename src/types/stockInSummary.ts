export interface StockInSummaryItem {
  siInvoiceNo: string | null
  siInvoiceDate: string | null
  jobType: string | null
  lifecycleName: string | null
  sourceChannelName: string | null
  destinationChannelName: string | null
  partyName: string | null
  partyAddress: string | null
  sibFinalAmount: number | null
  sibFinalConvertedBill: number | null
  sibCurrencyName: string | null
}

export interface StockInSummaryFilters {
  startDate: string
  endDate: string
  statusId: number
  supplierId: number
  customerId: number
}
