/* ─── Sales & Payment Dashboard types ─── */

export interface SalesPaymentSummaryItem {
  intervalValue: string | null
  amount: number | null
}

export interface MonthlyPurchaseSalesPaymentItem {
  monthName: string | null
  totalPurchase: number | null
  totalSales: number | null
  totalPayment: number | null
}

export interface SalesPaymentFilters {
  startDate: string
  endDate: string
  intervalType: 'daily' | 'weekly' | 'monthly'
  dataType: 'sales' | 'payment'
}
