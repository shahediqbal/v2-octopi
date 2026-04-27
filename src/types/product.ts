export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}

export interface Product {
  productId: number
  productName: string
  productCategoryId?: number | null
  categoryId?: number | null
  productCategoryName?: string | null
  functionId?: number | null
  functionName?: string | null
  cooId?: number | null
  countryOfOrigin?: string | null
  brandId?: number | null
  brandName?: string | null
  groupId?: number | null
  groupName?: string | null
  hsCode?: string | null
  productLevel?: string | null
  productShelfLife?: number | null
  productPackSize?: string | null
  mappedWith?: number | null
  mappedProduct?: string | null
  sampleProduct?: number | null
}

export interface ProductLookupOption {
  id: number
  label: string
}

export interface CreateProductPayload {
  productName: string
  functionId: number | null
  categoryId: number
  mappedWith: number | null
  hsCode: string | null
  cooId: number | null
  brandId: number | null
  groupId: number | null
  sampleProduct: number
  productLevel: string | null
  productShelfLife: number
  createdBy?: number | string | null
  createdDate?: string | null
  modifiedBy?: number | string | null
  modifitedDate?: string | null
  productPackSize: string | null
}

export interface UpdateProductPayload extends CreateProductPayload {
  productId: number
}

export interface MapProductPayload {
  productId: number
  mappedIds: number[]
}

export interface ProductSampleUpdateItem {
  productId: number
  sampleProduct: 0 | 1
}