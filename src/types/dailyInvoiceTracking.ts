/* ─── Daily Invoice Tracking types ─── */

export interface DailyInvoiceTrackingItem {
  lifecycleName: string | null
  customerName: string | null
  soSystemId: number | null
  invoiceDate: string | null
  orderDuration: string | null
  empFirstName: string | null
  empLastName: string | null
  daysPending: number | null
  channelName: string | null
}

export interface DailyInvoiceTrackingFilters {
  startDate: string
  endDate: string
  partnerId: number
}
