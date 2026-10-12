import type { DropdownType } from '@/types/dropdown'

type PaginationParamValue = string | number | boolean

export interface PaginatedEndpointConfig {
  endpoint: string
  pageSize: number
  pageNumberParam?: string
  pageSizeParam?: string
  searchParam?: string
  staticParams?: Record<string, PaginationParamValue>
  transformItems?: (items: unknown[]) => unknown[]
  /** Send sortOrder=desc to the backend and sort each loaded page descending client-side */
  sortDesc?: boolean
  /** Field name to sort by client-side (string comparison, Z→A). Applied after transformItems. */
  clientSortKey?: string
}

export const PAGINATED_LIST_ENDPOINTS = {
  customer: {
    endpoint: '/Customer/GetAllCustomerListPagination',
    pageSize: 50,
    searchParam: 'searchTerm',
    sortDesc: true,
    clientSortKey: 'customerId',
  },
  employee: {
    endpoint: '/Employee/GetEmployeeListPagination',
    pageSize: 50,
    searchParam: 'searchTerm',
    sortDesc: true,
    clientSortKey: 'employeeId',
  },
  product: {
    endpoint: '/Product/GetProductListPagination',
    pageSize: 50,
    searchParam: 'searchTerm',
    sortDesc: true,
    clientSortKey: 'productId',
  },
  supplier: {
    endpoint: '/Supplier/GetSupplierListPagination',
    pageSize: 50,
    searchParam: 'searchTerm',
    sortDesc: true,
    clientSortKey: 'supplierId',
  },
  location: {
    endpoint: '/KeyValue/GetDropdown',
    pageSize: 50,
    searchParam: 'searchTerm',
    staticParams: { type: 'location' },
    sortDesc: true,
    clientSortKey: 'locationId',
    transformItems: (items) =>
      items.map((item) => {
        const location = item as {
          key?: number | string
          value?: string | null
        }

        return {
          locationId: Number(location.key ?? 0),
          locationName: String(location.value ?? ''),
        }
      }),
  },
  chequeInfo: {
    endpoint: '/CustomerPayment/GetChequeInfoGridPagination',
    pageSize: 50,
    searchParam: 'searchTerm',
    sortDesc: true,
    clientSortKey: 'chequeInfoId',
  },
  stockInOrderLazy: {
    endpoint: '/StockIn/StockInOrderGridDataLazy/52',
    pageSize: 50,
    searchParam: 'searchTerm',
    sortDesc: true,
  },
} as const satisfies Record<string, PaginatedEndpointConfig>

export const PAGINATED_DROPDOWN_ENDPOINTS: Partial<Record<DropdownType, PaginatedEndpointConfig>> = {
  customer: {
    endpoint: '/KeyValue/GetDropdown',
    pageSize: 50,
    searchParam: 'searchTerm',
    staticParams: { type: 'customer' },
  },
  product: {
    endpoint: '/KeyValue/GetDropdown',
    pageSize: 50,
    searchParam: 'searchTerm',
    staticParams: { type: 'product' },
  },
  supplier: {
    endpoint: '/Supplier/GetSupplierListPagination',
    pageSize: 50,
    searchParam: 'searchTerm',
    transformItems: (items) =>
      items.map((item) => {
        const supplier = item as {
          supplierId?: number
          supplierName?: string | null
        }

        return {
          key: Number(supplier.supplierId ?? 0),
          value: String(supplier.supplierName ?? ''),
        }
      }),
  },
  location: {
    endpoint: '/KeyValue/GetDropdown',
    pageSize: 50,
    searchParam: 'searchTerm',
    staticParams: { type: 'location' },
  },
  employee: {
    endpoint: '/Employee/GetEmployeeListPagination',
    pageSize: 50,
    searchParam: 'searchTerm',
    transformItems: (items) =>
      items.map((item) => {
        const employee = item as {
          employeeId?: number
          employeeCode?: string | null
          empName?: string | null
          empFirstName?: string | null
          empLastName?: string | null
        }

        const fullName = employee.empName
          ?? [employee.empFirstName, employee.empLastName].filter(Boolean).join(' ').trim()
          ?? employee.employeeCode
          ?? ''

        return {
          key: Number(employee.employeeId ?? 0),
          value: String(fullName),
        }
      }),
  },
}

export function buildPaginatedUrl(
  config: PaginatedEndpointConfig,
  pageNumber: number,
  pageSize: number,
  searchTerm = '',
  extraParams?: Record<string, PaginationParamValue | null | undefined>,
) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(config.staticParams ?? {})) {
    params.set(key, String(value))
  }

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value === undefined || value === null || value === '') continue
      params.set(key, String(value))
    }
  }

  params.set(config.pageNumberParam ?? 'pageNumber', String(pageNumber))
  params.set(config.pageSizeParam ?? 'pageSize', String(pageSize))

  if (searchTerm.trim()) {
    params.set(config.searchParam ?? 'searchTerm', searchTerm.trim())
  }

  if (config.sortDesc) {
    params.set('sortOrder', 'desc')
  }

  return `${config.endpoint}?${params.toString()}`
}