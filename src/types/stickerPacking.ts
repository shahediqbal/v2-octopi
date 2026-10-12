// ─── Sticker Order List Row ───
export interface StickerOrderRow {
  soSystemId: number
  soSystemNo: string
  invoiceDate: string
  customerName: string
  customerAddress: string
  jobType: string
  soCustomerId: number
  soJobTypeId: number
}

// ─── Pack Type ───
export interface PackType {
  packId: number
  packTypeName: string
}

// ─── Packing Item (one row per product in the order) ───
export interface PackingItem {
  index: string
  productId: number
  productName: string
  packSize: number | string
  packNo: number | string
  packQuantity: number | string
  quantity: number
  sopPackId: number | null
  packedBy: number | null
}

// ─── Create Packing Payload ───
export type CreateStickerPackagingPayload = StickerPackagingItemPayload[]

// ─── Update Packing Payload ───
export type UpdateStickerPackagingPayload = StickerPackagingItemPayload[]

// ─── Sticker Packaging Item Payload ───
export interface StickerPackagingItemPayload {
  soSystemId: number
  sopProductId: number
  sopPackSize: number
  sopNoPack: number
  sopProductQty: number
  sopPackId: number | null
  packedBy: number | null
}

// ─── Edit/Detail Response ───
export interface StickerPackagingDetail {
  soSystemId: number
  soSystemNo: string
  invoiceDate: string
  customerName: string
  jobType: string
  stockOutPackagingItems: StickerPackagingDetailItem[]
}

export interface StickerPackagingDetailItem {
  sopProductId: number
  productName: string
  sopPackSize: number
  sopNoPack: number
  sopProductQty: number
  sopPackId: number | null
  packTypeName: string | null
  packedBy: number | null
  sodConfirmedQty: number
}

// ─── Sales Order Detail for Define Packing ───
export interface SalesOrderInternalDetail {
  soSystemId: number
  soSystemNo: string
  invoiceDate: string
  customerName: string
  jobType: string
  stockOutItemsData: SalesOrderInternalItem[]
}

export interface SalesOrderInternalItem {
  sodProductId: number
  productName: string | null
  sodQty?: number | null
  sodConfirmedQty: number | null
}
