import { z } from 'zod'
import { optionalDropdownId, requiredDropdownId } from '@/schemas/dropdown'

export const discountTypeSchema = z.enum(['F', 'P'])

const nonNegativeNumber = z.number().min(0, 'Value cannot be negative')

export const stockOutItemSchema = z.object({
  productId: requiredDropdownId,
  productLabel: z.string().trim().optional(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPrice: nonNegativeNumber,
  baseUnitPrice: nonNegativeNumber.optional(),
  vatRate: nonNegativeNumber,
  aitRate: nonNegativeNumber,
  discountRate: nonNegativeNumber,
  discountType: discountTypeSchema,
  itemRemark: z.string().trim(),
})

export const createStockOutSchema = z.object({
  soCustomerId: optionalDropdownId,
  soSupplierId: optionalDropdownId,
  soJobTypeId: optionalDropdownId.refine((value) => value !== null && value >= 1, {
    message: 'Please select an option',
  }),
  soOrderFromId: optionalDropdownId.refine((value) => value !== null && value >= 1, {
    message: 'Please select an option',
  }),
  invoiceDate: z.string().trim().min(1, 'Order date is required'),
  soCustomerReferance: z.string().trim(),
  soRelatedLcId: z.string().trim(),
  soRemarks: z.string().trim(),
  soPriceReview: z.boolean(),
  billDiscountType: discountTypeSchema,
  billDiscountRate: nonNegativeNumber,
  billVatPercantage: nonNegativeNumber,
  billAitPercantage: nonNegativeNumber,
  billAdjustmentAmount: z.number(),
  sobCurrencyName: z.enum(['BDT', 'USD']),
  sobCurrencyConversionRate: z.number().positive('Conversion rate must be greater than 0'),
  items: z.array(stockOutItemSchema).min(1, 'Add at least one product line'),
})

export const editStockOutSchema = createStockOutSchema.extend({
  soSystemId: z.number().int().positive(),
})

export const escalateStockOutItemSchema = z.object({
  sodProductId: z.number().int().positive(),
  productName: z.string().trim().optional(),
  quantity: z.number().positive().optional(),
  sodMappedProductId: optionalDropdownId.refine((value) => value !== null && value >= 1, {
    message: 'Please select a mapped product',
  }),
  sodBatchValue: z.string().trim().min(1, 'Please select a batch'),
})

export const escalateStockOutSchema = z.object({
  soSystemId: z.number().int().positive(),
  items: z.array(escalateStockOutItemSchema).min(1),
})

export const packagingStockOutItemSchema = z.object({
  soSystemId: z.number().int().positive(),
  sopProductId: z.number().int().positive(),
  sopPackId: optionalDropdownId,
  sopPackSize: z.number().positive('Pack size must be greater than 0'),
  sopNoPack: z.number().int().positive('Pack count must be greater than 0'),
  sopProductQty: z.number().positive('Product quantity must be greater than 0'),
  packInfo: z.string().trim().optional(),
})

export const packagingStockOutSchema = z.object({
  items: z.array(packagingStockOutItemSchema).min(1),
})

export const stockOutStatusUpdateSchema = z.object({
  soSystemId: z.number().int().positive(),
  associateCurrenStatus: z.number().int().min(0),
})

export type StockOutFormValues = z.infer<typeof createStockOutSchema>
export type EditStockOutFormValues = z.infer<typeof editStockOutSchema>
export type EscalateStockOutFormValues = z.infer<typeof escalateStockOutSchema>
export type PackagingStockOutFormValues = z.infer<typeof packagingStockOutSchema>