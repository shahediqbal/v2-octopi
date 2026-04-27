export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}

export interface Supplier {
  supplierId: number
  supplierName: string
  supplierAddress: string | null
  supplierContactPerson: string | null
  supplierContactNumber: string | null
  supplierLat?: string | null
  supplierLong?: string | null
}

export interface CreateSupplierPayload {
  supplierId: number
  supplierName: string
  supplierAddress: string | null
  supplierContactPerson: string | null
  supplierContactNumber: string | null
  supplierLat: string | null
  supplierLong: string | null
}

export interface UpdateSupplierPayload extends CreateSupplierPayload {}