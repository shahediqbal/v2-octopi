import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  ProductFunction,
  ProductFunctionApiResponse,
  ProductFunctionPayload,
} from '@/types/productFunction'

export const productFunctionKeys = {
  all: ['productFunctions'] as const,
  list: () => [...productFunctionKeys.all, 'list'] as const,
  detail: (id: number) => [...productFunctionKeys.all, 'detail', id] as const,
}

export function useProductFunctionsList() {
  return useQuery({
    queryKey: productFunctionKeys.list(),
    queryFn: () =>
      apiClient
        .get<ProductFunctionApiResponse<ProductFunction[]>>('/Product/GetFunction')
        .then((r) => r.dataObj ?? []),
    staleTime: 5 * 60_000,
  })
}

export function useProductFunctionDetail(id: number | undefined) {
  return useQuery({
    queryKey: productFunctionKeys.detail(id!),
    queryFn: () =>
      apiClient
        .get<ProductFunctionApiResponse<ProductFunction>>(`/Product/GetProductFunctionById/${id}`)
        .then((r) => r.dataObj),
    enabled: !!id,
  })
}

export function useCreateProductFunction() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: ProductFunctionPayload) =>
      apiClient.post<ProductFunctionApiResponse<ProductFunction>>('/Product/AddProductFunction', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productFunctionKeys.list() })
    },
  })
}

export function useUpdateProductFunction() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: ProductFunctionPayload) =>
      apiClient.put<ProductFunctionApiResponse<ProductFunction>>('/Product/ProductFunctionUpdate', data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: productFunctionKeys.list() })
      qc.invalidateQueries({ queryKey: productFunctionKeys.detail(variables.functionId) })
    },
  })
}