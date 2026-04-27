import { z } from 'zod'

// ── Selling Price ──

export const sellingPriceSchema = z.object({
  productId: z
    .number({ error: 'Product is required' })
    .min(1, 'Product is required'),
  productPrice: z
    .number({ error: 'Price is required' })
    .min(0.01, 'Price must be greater than 0'),
})

export type SellingPriceFormValues = z.infer<typeof sellingPriceSchema>

// ── Purchase Price ──

export const purchasePriceSchema = z.object({
  productId: z
    .number({ error: 'Product is required' })
    .min(1, 'Product is required'),
  purchasePrice: z
    .number({ error: 'Price is required' })
    .min(0.01, 'Price must be greater than 0'),
})

export type PurchasePriceFormValues = z.infer<typeof purchasePriceSchema>
