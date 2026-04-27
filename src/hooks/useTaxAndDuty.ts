import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { TaxDutyRow, TaxDutyDetail, CreateTaxDutyPayload, UpdateTaxDutyPayload } from '@/types/taxAndDuty'
import type { ApiResponse } from '@/types/customer'

export const taxDutyKeys = {
  all: ['taxDuty'] as const,
  list: () => [...taxDutyKeys.all, 'list'] as const,
  detail: (id: number) => [...taxDutyKeys.all, 'detail', id] as const,
}

export function useTaxDutyList() {
  return useQuery({
    queryKey: taxDutyKeys.list(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<TaxDutyRow[]>>('/Customer/GetAllCustomerTaxDuty')
        .then((r) => r.dataObj ?? []),
    staleTime: 30_000,
  })
}

export function useTaxDutyDetail(id: number | undefined) {
  return useQuery({
    queryKey: taxDutyKeys.detail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<TaxDutyDetail>>(`/Customer/ByIdCustomerTaxDuty/${id}`)
        .then((r) => r.dataObj),
    enabled: !!id,
  })
}

export function useCreateTaxDuty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaxDutyPayload) =>
      apiClient.post('/Customer/AddCustomerTaxDuty', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxDutyKeys.list() })
    },
  })
}

export function useUpdateTaxDuty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateTaxDutyPayload) =>
      apiClient.put('/Customer/UpdateCustomerTaxDuty', payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taxDutyKeys.list() })
      queryClient.invalidateQueries({ queryKey: taxDutyKeys.detail(variables.customerTaxDutyId) })
    },
  })
}

export function useDeleteTaxDuty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/Customer/DeleteCustomerTaxDuty/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxDutyKeys.list() })
    },
  })
}
