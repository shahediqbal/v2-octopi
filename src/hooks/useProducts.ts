import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PAGINATED_LIST_ENDPOINTS } from '@/config/pagination'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { apiClient } from '@/lib/api'
import type {
  ApiResponse,
  CreateProductPayload,
  MapProductPayload,
  Product,
  ProductLookupOption,
  ProductSampleUpdateItem,
  UpdateProductPayload,
} from '@/types/product'

function mapLookup<T extends Record<string, unknown>>(
  items: T[],
  idKey: keyof T,
  labelKey: keyof T,
): ProductLookupOption[] {
  return items.map((item) => ({
    id: Number(item[idKey]),
    label: String(item[labelKey] ?? ''),
  }))
}

export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  paginatedList: (searchTerm: string, pageSize: number) =>
    [...productKeys.all, 'paginated', searchTerm, pageSize] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  functions: () => [...productKeys.all, 'functions'] as const,
  brands: () => [...productKeys.all, 'brands'] as const,
  groups: () => [...productKeys.all, 'groups'] as const,
  countries: () => [...productKeys.all, 'countries'] as const,
  categoryProducts: (categoryId: number) => [...productKeys.all, 'category-products', categoryId] as const,
  mappedList: (categoryId: number) => [...productKeys.all, 'mapped-list', categoryId] as const,
  mappedProducts: (productId: number) => [...productKeys.all, 'mapped-products', productId] as const,
}

export function useProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: () => apiClient.get<ApiResponse<Product[]>>('/Product/GetProducts').then((r) => r.dataObj ?? []),
  })
}

export function usePaginatedProducts(searchTerm = '', pageSize = 50) {
  return usePaginatedList<Product>({
    queryKey: productKeys.paginatedList(searchTerm, pageSize),
    endpointConfig: PAGINATED_LIST_ENDPOINTS.product,
    searchTerm,
    pageSize,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useProductDetail(id: number | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id!),
    queryFn: () => apiClient.get<ApiResponse<Product>>(`/Product/GetProductById/${id}`).then((r) => r.dataObj),
    enabled: !!id,
  })
}

export function useProductCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Array<{ productCategoryId: number; productCategoryName: string }>>>('/Product/GetCategory')
        .then((r) => mapLookup(r.dataObj ?? [], 'productCategoryId', 'productCategoryName')),
    staleTime: 5 * 60_000,
  })
}

export function useProductFunctions() {
  return useQuery({
    queryKey: productKeys.functions(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Array<{ functionId: number; functionName: string }>>>('/Product/GetFunction')
        .then((r) => mapLookup(r.dataObj ?? [], 'functionId', 'functionName')),
    staleTime: 5 * 60_000,
  })
}

export function useProductCountries() {
  return useQuery({
    queryKey: productKeys.countries(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Array<{ cooId: number; countryOfOrigin: string }>>>('/Product/GetCountryOrigin')
        .then((r) => mapLookup(r.dataObj ?? [], 'cooId', 'countryOfOrigin')),
    staleTime: 5 * 60_000,
  })
}

export function useProductBrands() {
  return useQuery({
    queryKey: productKeys.brands(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Array<{ brandId: number; brandName: string }>>>('/Product/GetBrand')
        .then((r) => mapLookup(r.dataObj ?? [], 'brandId', 'brandName')),
    staleTime: 5 * 60_000,
  })
}

export function useProductGroups() {
  return useQuery({
    queryKey: productKeys.groups(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Array<{ groupId: number; groupName: string }>>>('/Product/GetGroup')
        .then((r) => mapLookup(r.dataObj ?? [], 'groupId', 'groupName')),
    staleTime: 5 * 60_000,
  })
}

export function useProductsByCategory(categoryId: number | null) {
  return useQuery({
    queryKey: productKeys.categoryProducts(categoryId ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Product[]>>(`/Product/GetProductByCatId/${categoryId}`)
        .then((r) => r.dataObj ?? []),
    enabled: !!categoryId,
    staleTime: 60_000,
  })
}

export function useMappedCandidateProducts(categoryId: number | null) {
  return useQuery({
    queryKey: productKeys.mappedList(categoryId ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Product[]>>(`/Product/GetProductByCatId/${categoryId}`)
        .then((r) => mapLookup(r.dataObj ?? [], 'productId', 'productName')),
    enabled: !!categoryId,
    staleTime: 60_000,
  })
}

export function useMappedProductsForProduct(productId: number | null) {
  return useQuery({
    queryKey: productKeys.mappedProducts(productId ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Array<{ key: number; value: string }>>>(`/Product/GetProductMappedProducts/${productId}`)
        .then((r) => mapLookup(r.dataObj ?? [], 'key', 'value')),
    enabled: !!productId,
    staleTime: 60_000,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductPayload) => apiClient.post<ApiResponse<Product>>('/Product/AddProduct', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.list() })
    },
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProductPayload) => apiClient.put<ApiResponse<Product>>('/Product/ProductUpdate', data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: productKeys.list() })
      qc.invalidateQueries({ queryKey: productKeys.detail(variables.productId) })
      qc.invalidateQueries({ queryKey: productKeys.categoryProducts(variables.categoryId) })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (productId: number) => apiClient.delete<ApiResponse<null>>(`/Product/DeleteProduct?id=${productId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.list() })
    },
  })
}

export function useMapProduct() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, mappedIds }: MapProductPayload) =>
      apiClient.put<ApiResponse<unknown>>(`/Product/MapProduct/${productId}`, mappedIds),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: productKeys.mappedProducts(variables.productId) })
      qc.invalidateQueries({ queryKey: productKeys.list() })
      qc.invalidateQueries({ queryKey: productKeys.detail(variables.productId) })
    },
  })
}

export function useUpdateProductSamples() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (items: ProductSampleUpdateItem[]) =>
      apiClient.put<ApiResponse<unknown>>('/Product/SampleUpdate', items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.list() })
      qc.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}