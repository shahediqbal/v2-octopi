import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  CreditHistoryResult,
  CreditSaleSummaryRow,
  CustomerChequeRow,
  CustomerLoanSummaryRow,
  LcPaymentInfoRow,
  PaymentSummaryRow,
  ProductLoanDetailRow,
  TaxAitDetailRow,
  TopProductRow,
} from '@/types/reviewCockpit'
import { isApiEnvelope } from '@/types/reviewCockpit'

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getLastNDaysRange(days: number): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - Math.max(0, days))
  return { startDate: toDateInput(start), endDate: toDateInput(end) }
}

export function getTaxYearRange(today = new Date()): { startDate: string; endDate: string } {
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  // Default fiscal year: Jul 1 → Jun 30
  const startYear = month >= 7 ? year : year - 1
  const endYear = startYear + 1
  return {
    startDate: `${startYear}-07-01`,
    endDate: `${endYear}-06-30`,
  }
}

function buildUrl(path: string, params: Record<string, string | number | null | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    const text = String(value)
    if (text.length === 0) return
    sp.set(key, text)
  })

  const qs = sp.toString()
  return qs ? `${path}?${qs}` : path
}

async function unwrapDataObj<T>(url: string): Promise<T> {
  const result = await apiClient.get<unknown>(url)

  if (isApiEnvelope<T>(result)) {
    return (result.dataObj ?? null) as T
  }

  return result as T
}

export const reviewCockpitKeys = {
  all: ['reviewCockpit'] as const,
  creditSaleSummary: (customerId: number, startDate: string, endDate: string) =>
    [...reviewCockpitKeys.all, 'credit-sale-summary', customerId, startDate, endDate] as const,
  creditHistory: (customerId: number, startDate: string, endDate: string) =>
    [...reviewCockpitKeys.all, 'credit-history', customerId, startDate, endDate] as const,
  sampleIssueQty: (customerId: number, startDate: string, endDate: string) =>
    [...reviewCockpitKeys.all, 'sample-issue-qty', customerId, startDate, endDate] as const,
  topProducts: (customerId: number, startDate: string, endDate: string) =>
    [...reviewCockpitKeys.all, 'top-products', customerId, startDate, endDate] as const,
  loanSummary: (customerId: number) => [...reviewCockpitKeys.all, 'loan-summary', customerId] as const,
  loanDetail: (customerId: number, productId: number) =>
    [...reviewCockpitKeys.all, 'loan-detail', customerId, productId] as const,
  chequeReport: (customerId: number, chequeStatusId: number) =>
    [...reviewCockpitKeys.all, 'cheque-report', customerId, chequeStatusId] as const,
  allCheques: (customerId: number) => [...reviewCockpitKeys.all, 'all-cheques', customerId] as const,
  lcPaymentInfo: (customerId: number) => [...reviewCockpitKeys.all, 'lc-payment-info', customerId] as const,
  lcDetail: (piSystemId: number) => [...reviewCockpitKeys.all, 'lc-detail', piSystemId] as const,
  taxAitDetails: (customerId: number, startDate: string, endDate: string) =>
    [...reviewCockpitKeys.all, 'tax-ait-details', customerId, startDate, endDate] as const,
  paymentSummary: (customerId: number) => [...reviewCockpitKeys.all, 'payment-summary', customerId] as const,
}

export function useCustomerCreditSaleSummary(
  customerId: number | null | undefined,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: reviewCockpitKeys.creditSaleSummary(customerId ?? 0, startDate, endDate),
    queryFn: async () =>
      unwrapDataObj<CreditSaleSummaryRow[]>(
        buildUrl('/Report/GetCustomerCreditSaleSummery', { customerId: customerId ?? 0, startDate, endDate }),
      ).then((rows) => rows ?? []),
    enabled: !!customerId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useSampleIssueQuantity(
  customerId: number | null | undefined,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: reviewCockpitKeys.sampleIssueQty(customerId ?? 0, startDate, endDate),
    queryFn: async () =>
      unwrapDataObj<number>(
        buildUrl('/Dashboard/SampleIssueQuantity', { startDate, endDate, customerId: customerId ?? 0 }),
      ).then((value) => Number(value ?? 0)),
    enabled: !!customerId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useTopProducts(customerId: number | null | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: reviewCockpitKeys.topProducts(customerId ?? 0, startDate, endDate),
    queryFn: async () =>
      unwrapDataObj<TopProductRow[]>(
        buildUrl('/Dashboard/TopProducts', { startDate, endDate, customerId: customerId ?? 0 }),
      ).then((rows) => rows ?? []),
    enabled: !!customerId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useCustomerLoanSummary(customerId: number | null | undefined) {
  return useQuery({
    queryKey: reviewCockpitKeys.loanSummary(customerId ?? 0),
    queryFn: async () =>
      unwrapDataObj<CustomerLoanSummaryRow[]>(`/Report/GetCustomerLoanSummery/${customerId ?? 0}/0`).then((rows) => rows ?? []),
    enabled: !!customerId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useCustomerChequeReport(customerId: number | null | undefined, chequeStatusId = 1) {
  return useQuery({
    queryKey: reviewCockpitKeys.chequeReport(customerId ?? 0, chequeStatusId),
    queryFn: async () =>
      unwrapDataObj<CustomerChequeRow[]>(
        buildUrl('/Report/GetCustomerChequeReport', {
          partnerId: customerId ?? 0,
          chequeStatusId,
        }),
      ).then((rows) => rows ?? []),
    enabled: !!customerId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useLcPaymentInfo(customerId: number | null | undefined) {
  return useQuery({
    queryKey: reviewCockpitKeys.lcPaymentInfo(customerId ?? 0),
    queryFn: async () =>
      unwrapDataObj<LcPaymentInfoRow[]>(
        buildUrl('/LCTracking/GetPiLcDocPaymentInfoByFilters', { customerId: customerId ?? 0 }),
      ).then((rows) => rows ?? []),
    enabled: !!customerId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useTaxAitDetails(customerId: number | null | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: reviewCockpitKeys.taxAitDetails(customerId ?? 0, startDate, endDate),
    queryFn: async () =>
      unwrapDataObj<TaxAitDetailRow[]>(
        buildUrl('/Report/GetTaxAitDetails', { startDate, endDate, customerId: customerId ?? 0 }),
      ).then((rows) => rows ?? []),
    enabled: !!customerId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function usePaymentSummary(customerId: number | null | undefined) {
  return useQuery({
    queryKey: reviewCockpitKeys.paymentSummary(customerId ?? 0),
    queryFn: async () =>
      unwrapDataObj<PaymentSummaryRow[]>(
        buildUrl('/CustomerPayment/GetPaymentSummary', { customerId: customerId ?? 0 }),
      ).then((rows) => rows ?? []),
    enabled: !!customerId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

// ─── Detail Modal Hooks ───

export function useCreditHistory(
  customerId: number | null | undefined,
  startDate: string,
  endDate: string,
  enabled = true,
) {
  return useQuery({
    queryKey: reviewCockpitKeys.creditHistory(customerId ?? 0, startDate, endDate),
    queryFn: async () =>
      unwrapDataObj<CreditHistoryResult>(
        buildUrl('/Report/GetCustomerCreditHistory', { customerId: customerId ?? 0, startDate, endDate }),
      ).then((result) => result ?? { customerInfo: null, transctionInfo: [] }),
    enabled: !!customerId && enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useProductLoanDetails(
  customerId: number | null | undefined,
  productId: number | null | undefined,
) {
  return useQuery({
    queryKey: reviewCockpitKeys.loanDetail(customerId ?? 0, productId ?? 0),
    queryFn: async () =>
      unwrapDataObj<ProductLoanDetailRow[]>(
        `/Report/GetCustomerLoanDetails/${customerId ?? 0}/${productId ?? 0}`,
      ).then((rows) => rows ?? []),
    enabled: !!customerId && !!productId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useAllCheques(customerId: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: reviewCockpitKeys.allCheques(customerId ?? 0),
    queryFn: async () =>
      unwrapDataObj<CustomerChequeRow[]>(
        buildUrl('/Report/GetCustomerChequeReport', { partnerId: customerId ?? 0 }),
      ).then((rows) => rows ?? []),
    enabled: !!customerId && enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useLcDetail(piSystemId: number | null | undefined) {
  return useQuery({
    queryKey: reviewCockpitKeys.lcDetail(piSystemId ?? 0),
    queryFn: async () =>
      unwrapDataObj<LcPaymentInfoRow[]>(
        buildUrl('/LCTracking/GetPiLcDocPaymentInfoByFilters', { piSystemId: piSystemId ?? 0 }),
      ).then((rows) => (rows ?? [])[0] ?? null),
    enabled: !!piSystemId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
