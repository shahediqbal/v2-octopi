export interface CurrentStockItem {
  productCategoryName: string | null
  productId: number | null
  productName: string | null
  currentQty: number | null
}

export interface CurrentStockFilters {
  productId: number
  channelId: number
}
