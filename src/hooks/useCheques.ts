import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PAGINATED_LIST_ENDPOINTS } from '@/config/pagination'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { apiClient } from '@/lib/api'
import type { DropdownApiResponse, DropdownOption } from '@/types/dropdown'
import type {
  ApiResponse,
  ChequeDetail,
  ChequeInfo,
  ChequeLookupOption,
  ChequePayload,
} from '@/types/cheque'

export const chequeKeys = {
  all: ['cheques'] as const,
  paginated: (searchTerm: string, pageSize: number, statusId: number | null) =>
    [...chequeKeys.all, 'paginated', searchTerm, pageSize, statusId] as const,
  detail: (id: number) => [...chequeKeys.all, 'detail', id] as const,
  lookups: ['cheques', 'lookups'] as const,
  lookup: (name: string) => [...chequeKeys.lookups, name] as const,
}

function toLookupOptions(items: DropdownOption[] | null | undefined): ChequeLookupOption[] {
  return [...(items ?? [])]
    .map((item) => ({ id: item.key, label: item.value }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

function normalizeChequeDetail(dataObj: ChequeDetail | ChequeDetail[] | null | undefined) {
  if (Array.isArray(dataObj)) return dataObj[0]
  return dataObj ?? null
}

function useChequeLookup(name: string, endpoint: string) {
  return useQuery({
    queryKey: chequeKeys.lookup(name),
    queryFn: () =>
      apiClient
        .get<DropdownApiResponse<DropdownOption[]>>(endpoint)
        .then((response) => toLookupOptions(response.dataObj)),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  })
}

export function usePaginatedCheques(searchTerm = '', pageSize = 50, statusId: number | null = null) {
  return usePaginatedList<ChequeInfo>({
    queryKey: chequeKeys.paginated(searchTerm, pageSize, statusId),
    endpointConfig: PAGINATED_LIST_ENDPOINTS.chequeInfo,
    searchTerm,
    pageSize,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    extraParams: statusId != null ? { chequeStatusId: statusId } : undefined,
  })
}

export function useChequeDetail(id: number | undefined) {
  return useQuery({
    queryKey: chequeKeys.detail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<ChequeDetail | ChequeDetail[]>>(`/CustomerPayment/GetChequeInfoById/${id}`)
        .then((response) => normalizeChequeDetail(response.dataObj)),
    enabled: !!id,
  })
}

export function useChequeStatuses() {
  return useChequeLookup('statuses', '/KeyValue/GetChequeStatusKeyValue')
}

export function useChequeTypes() {
  return useChequeLookup('types', '/KeyValue/GetPaymentMethodKeyValue/1')
}

export function useIssuerBanks() {
  return useChequeLookup('issuerBanks', '/KeyValue/GetBankListKeyValue/0')
}

export function useBeneficiaryBanks() {
  return useChequeLookup('beneficiaryBanks', '/KeyValue/GetBankListKeyValue/1')
}

export function useCreateCheque() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ChequePayload) =>
      apiClient.post<ApiResponse<ChequeDetail | null>>('/CustomerPayment/AddChequeInfo', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chequeKeys.all })
    },
  })
}

export function useUpdateCheque() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ChequePayload) =>
      apiClient.put<ApiResponse<ChequeDetail | null>>('/CustomerPayment/UpdateChequeInfo', payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: chequeKeys.all })
      queryClient.invalidateQueries({ queryKey: chequeKeys.detail(variables.chequeInfoId) })
    },
  })
}