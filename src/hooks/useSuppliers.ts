import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PAGINATED_LIST_ENDPOINTS } from '@/config/pagination'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { apiClient } from '@/lib/api'
import type { ApiResponse, CreateSupplierPayload, Supplier, UpdateSupplierPayload } from '@/types/supplier'

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: () => [...supplierKeys.all, 'list'] as const,
  paginated: (searchTerm: string, pageSize: number) =>
    [...supplierKeys.all, 'paginated', searchTerm, pageSize] as const,
  detail: (id: number) => [...supplierKeys.all, 'detail', id] as const,
}

export function useSuppliers() {
  return useQuery({
    queryKey: supplierKeys.list(),
    queryFn: () =>
      apiClient.get<ApiResponse<Supplier[]>>('/Supplier/GetSuppliers').then((r) => r.dataObj ?? []),
  })
}

export function usePaginatedSuppliers(searchTerm = '', pageSize = 50) {
  return usePaginatedList<Supplier>({
    queryKey: supplierKeys.paginated(searchTerm, pageSize),
    endpointConfig: PAGINATED_LIST_ENDPOINTS.supplier,
    searchTerm,
    pageSize,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useSupplierDetail(id: number | undefined) {
  return useQuery({
    queryKey: supplierKeys.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Supplier[] | Supplier>>(`/Supplier/GetSupplierById/${id}`)
      const dataObj = response.dataObj
      if (Array.isArray(dataObj)) return dataObj[0]
      return dataObj
    },
    enabled: !!id,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSupplierPayload) =>
      apiClient.post<ApiResponse<Supplier>>('/Supplier/AddSupplier', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all })
    },
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateSupplierPayload) =>
      apiClient.put<ApiResponse<Supplier>>('/Supplier/SupplierUpdate', data),
    onSuccess: (_response, variables) => {
      qc.invalidateQueries({ queryKey: supplierKeys.all })
      qc.invalidateQueries({ queryKey: supplierKeys.detail(variables.supplierId) })
    },
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (supplierId: number) =>
      apiClient.delete<ApiResponse<null>>(`/Supplier/DeleteSupplier?id=${supplierId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all })
    },
  })
}