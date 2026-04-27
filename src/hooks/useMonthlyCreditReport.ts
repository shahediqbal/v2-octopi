import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { MonthlyCreditFilters, MonthlyCreditItem } from '@/types/monthlyCreditReport'

export const monthlyCreditKeys = {
  all: ['monthlyCredit'] as const,
  list: (filters: MonthlyCreditFilters) => [...monthlyCreditKeys.all, 'list', filters] as const,
}

export function useMonthlyCreditReport(filters: MonthlyCreditFilters, enabled: boolean) {
  return useQuery({
    queryKey: monthlyCreditKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<MonthlyCreditItem[]>>(
          `/Report/GetCreditSummaryByMktByMonthForMd?employeeId=${filters.employeeId}&startDate=${filters.startDate}&endDate=${filters.endDate}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
