// ─────────────────────────────────────────────────────────────────────────────
// Price Module Types — Selling Price & Purchase Price
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}

// ── Selling Price ──

export interface SellingPrice {
  productId: number
  productName: string
  productPrice: number
  productDicsountedPrice: number        // NOTE: backend typo — exact spelling required
  productPriceActiveFrom: string | null
  productPriceCode: string
  categoryId: number
  productPriceActiveStatus: number
}

export interface SellingPriceHistory {
  productId: number
  productName: string
  productPrice: number
  productDicsountedPrice: number
  productPriceActiveFrom: string | null
  productPriceActiveTo: string | null
  productPriceCode: string
}

export interface CreateSellingPricePayload {
  productId: number
  productPriceCode: string              // always "NoOffer"
  productPrice: number
  productProfitPercentage: number       // always 0
  productDicsountedPrice: number        // same as productPrice
  productPriceActiveFrom: null
  productPriceActiveTo: null
}

export interface UpdateSellingPricePayload {
  productId: number
  productPrice: number
  productDicsountedPrice: number        // same as productPrice
}

// ── Purchase Price ──

export interface PurchasePrice {
  productId: number
  productName: string
  purchasePrice: number
  purchasePriceActiveFrom: string | null
  purchasePriceActiveStatus: number
}

export interface PurchasePriceHistory {
  productId: number
  productName: string
  purchasePrice: number
  purchasePriceActiveFrom: string | null
  purchasePriceActiveTo: string | null
}

export interface CreatePurchasePricePayload {
  purchasePriceAtuoId: number           // NOTE: backend typo — send 0 for create
  productId: number
  purchasePrice: number
  purchasePriceActiveFrom: null
  purchasePriceActiveTo: null
}

export interface UpdatePurchasePricePayload {
  productId: number
  productName: string
  purchasePrice: number
  purchasePriceActiveFrom: null
  purchasePriceActiveTo: null
  purchasePriceActiveStatus: number     // 1 for active
}
