/* ─── Mapping Report types ─── */

/** Single row returned by GET /Report/GetMappedItemReport */
export interface MappingReportItem {
  soSystemNo: string | null
  invoiceDate: string | null
  customerId: number | null
  customerName: string | null
  customerAddress: string | null
  sodProductId: number | null
  productName: string | null
  sodMappedProductId: number | null
  mappedProduct: string | null
  sodRequestedQty: number | null
  sodConfirmedQty: number | null
}

/** KeyValue pair returned by /KeyValue/* endpoints */
export interface KeyValueOption {
  key: number
  value: string
}

/** Dropdown option (id + label) after mapping from KeyValue */
export interface DropdownItem {
  id: number
  label: string
}

/** API wrapper shape */
export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}

/** Filters for the mapping report query */
export interface MappingReportFilters {
  startDate: string
  endDate: string
  productId: number
  partnerId: number
}
