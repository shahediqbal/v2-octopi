import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PAGINATED_LIST_ENDPOINTS } from '@/config/pagination'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { apiClient } from '@/lib/api'
import { useEmployeeByChannelDropdown } from '@/hooks/useDropdown'
import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  ApiResponse,
  Channel,
  Designation,
} from '@/types/customer'

/* ─────────────────── query keys (per CODING_STANDARDS) ─────────────────── */

export const customerKeys = {
  all: ['customers'] as const,
  list: () => [...customerKeys.all, 'list'] as const,
  paginated: (searchTerm: string, pageSize: number) =>
    [...customerKeys.all, 'paginated', searchTerm, pageSize] as const,
  detail: (id: number) => [...customerKeys.all, 'detail', id] as const,
}

/* ─────────────────── queries ─────────────────── */

/** GET /Customer/GetCustomerDetails → full customer list */
export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.list(),
    queryFn: () =>
      apiClient.get<ApiResponse<Customer[]>>('/Customer/GetCustomerDetails').then((r) => r.dataObj),
  })
}

/** GET /Customer/GetCustomerById/:id → single customer for edit */
export function useCustomerDetail(id: number | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id!),
    queryFn: () =>
      apiClient.get<ApiResponse<Customer>>(`/Customer/GetCustomerById/${id}`).then((r) => r.dataObj),
    enabled: !!id,
  })
}

/* ─────────────────── mutations ─────────────────── */

/** POST /Customer/AddCustomer */
export function useCreateCustomer() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCustomerPayload) =>
      apiClient.post<ApiResponse<Customer>>('/Customer/AddCustomer', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.list() })
    },
  })
}

/** PUT /Customer/CustomerUpdate */
export function useUpdateCustomer() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateCustomerPayload) =>
      apiClient.put<ApiResponse<Customer>>('/Customer/CustomerUpdate', data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: customerKeys.list() })
      qc.invalidateQueries({ queryKey: customerKeys.detail(variables.customerId) })
    },
  })
}

/* ─────────────────── dropdown helpers ─────────────────── */

/** GET /Channel/GetChannels → { channelId, channelName }[] */
export function useChannels() {
  return useQuery({
    queryKey: ['channels', 'list'],
    queryFn: () =>
      apiClient.get<ApiResponse<Channel[]>>('/Channel/GetChannels').then((r) => r.dataObj),
    staleTime: 5 * 60_000,
  })
}

/** GET /Designation/GetDesignation → { designationId, designation1 }[] */
export function useDesignations() {
  return useQuery({
    queryKey: ['designations', 'list'],
    queryFn: () =>
      apiClient.get<ApiResponse<Designation[]>>('/Designation/GetDesignation').then((r) => r.dataObj),
    staleTime: 5 * 60_000,
  })
}

/** Employees by channel via /KeyValue/GetDropdown?type=employeebychannel&channelId={id} → { key, value }[] */
export function useEmployeesByChannel(channelId: number | null) {
  return useEmployeeByChannelDropdown(channelId)
}

/** PUT /Customer/UpdateCustomerFlag */
export function useUpdateCustomerFlag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { customerId: number; customerFlag: 0 | 1 }) =>
      apiClient.put('/Customer/UpdateCustomerFlag', payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: customerKeys.list() })
      const previous = qc.getQueryData<Customer[]>(customerKeys.list())
      qc.setQueryData<Customer[]>(customerKeys.list(), (old = []) =>
        old.map((c) =>
          c.customerId === payload.customerId
            ? { ...c, customerFlag: payload.customerFlag }
            : c,
        ),
      )
      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        qc.setQueryData(customerKeys.list(), context.previous)
      }
    },
  })
}

/* ─────────────────── paginated customer list ─────────────────── */

/** GET /Customer/GetAllCustomerListPagination?pageNumber=&pageSize=&searchTerm= */
export function usePaginatedCustomers(searchTerm = '', pageSize = 50) {
  return usePaginatedList<Customer>({
    queryKey: customerKeys.paginated(searchTerm, pageSize),
    endpointConfig: PAGINATED_LIST_ENDPOINTS.customer,
    searchTerm,
    pageSize,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
