import { z } from 'zod'

export const quotationItemSchema = z.object({
  pqdProductId: z
    .number({ error: 'Product is required' })
    .min(1, 'Product is required'),
  productName: z.string().optional().default(''),
  pqdProductUnitPrice: z
    .number({ error: 'Unit price is required' })
    .min(0, 'Price must be >= 0'),
  pqdAppliedVatPercantage: z.number().default(0),   // NOTE: backend typo
  pqdAppliedAitPercantage: z.number().default(0),
  pqdIncreasedType: z.string().default('F'),         // "F" flat | "P" percentage
  pqdIncreasedAmount: z.number().default(0),
  pqdAdustedAmount: z.number().default(0),           // NOTE: backend typo
  adjustableType: z.string().default('plus'),         // "plus" | "minus"
  pqdCalculatedPrice: z.number().default(0),
  pqdFinalPrice: z.number().default(0),
})

export const quotationSchema = z.object({
  customerId: z
    .number({ error: 'Customer is required' })
    .min(1, 'Customer is required'),
  pqCurrencyName: z.string().default('BDT'),
  items: z.array(quotationItemSchema).min(1, 'At least one product is required'),
})

export type QuotationItemFormValues = z.infer<typeof quotationItemSchema>
export type QuotationFormValues = z.infer<typeof quotationSchema>
