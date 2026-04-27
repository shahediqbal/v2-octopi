import { z } from 'zod'

// ── PI item ──

export const piItemSchema = z.object({
  piProductId: z
    .number({ error: 'Product is required' })
    .min(1, 'Product is required'),
  productName: z.string().optional().default(''),
  piProductQuantity: z
    .number({ error: 'Quantity is required' })
    .min(1, 'Qty must be >= 1'),
  piProductPrice: z
    .number({ error: 'Price is required' })
    .min(0, 'Price must be >= 0'),
  piProductPriceConvertionRate: z.number().default(1),
  piLineTotalAmount: z.number().default(0),
})

// ── PI form ──

export const piSchema = z.object({
  piCustmomerId: z                       // NOTE: backend typo "Custmomer"
    .number({ error: 'Customer is required' })
    .min(1, 'Customer is required'),
  piDate: z.string().min(1, 'PI date is required'),
  piRef: z.string().optional().default(''),
  piCurrency: z.string().default('USD'),
  piConversionRate: z.number().default(1),
  piBenificaryBankId: z
    .number({ error: 'Bank is required' })
    .min(1, 'Bank is required'),
  piBranchBankLocationId: z
    .number({ error: 'Location is required' })
    .min(1, 'Location is required'),
  lcPaymentTermsId: z
    .number({ error: 'Payment terms required' })
    .min(1, 'Payment terms required'),
  piNote: z.string().optional().default(''),
  piNumberMapped: z.string().nullable().default(null),
  mapWithExistingPi: z.boolean().default(false),
  items: z.array(piItemSchema).min(1, 'At least one product is required'),
})

export type PiItemFormValues = z.infer<typeof piItemSchema>
export type PiFormValues = z.infer<typeof piSchema>

// ── LC Document create ──

export const lcCreateSchema = z.object({
  lcNumber: z.string().min(1, 'LC number is required'),
  lcAmount: z
    .number({ error: 'LC amount is required' })
    .min(0.01, 'Amount must be > 0'),
  lcDate: z.string().min(1, 'LC date is required'),
  chequeBankId: z
    .number({ error: 'Issuer bank is required' })
    .min(1, 'Issuer bank is required'),
  locationId: z
    .number({ error: 'Branch location required' })
    .min(1, 'Branch location required'),
})

export type LcCreateFormValues = z.infer<typeof lcCreateSchema>

// ── LC Document update (3-part timeline) ──

export const lcDocUpdateSchema = z.object({
  docPrepDate: z.string().nullable().default(null),
  docSumbitDate: z.string().nullable().default(null),
  docCustomerAcceptedDate: z.string().nullable().default(null),
  docBenificerySubmissionDate: z.string().nullable().default(null),  // NOTE: backend typo
  ibcNumber: z.string().nullable().default(null),
  bankAcceptanceDate: z.string().nullable().default(null),
  maturityDate: z.string().nullable().default(null),
  revisedMaturityDate: z.string().nullable().default(null),
})

export type LcDocUpdateFormValues = z.infer<typeof lcDocUpdateSchema>

// ── LC Limited Update ──

export const lcLimitedUpdateSchema = z.object({
  lcNumber: z.string().min(1, 'LC number is required'),
  lcAmount: z
    .number({ error: 'LC amount is required' })
    .min(0.01, 'Amount must be > 0'),
  lcDate: z.string().min(1, 'LC date is required'),
  chequeBankId: z
    .number({ error: 'Issuer bank is required' })
    .min(1, 'Issuer bank is required'),
  locationId: z
    .number({ error: 'Branch location required' })
    .min(1, 'Branch location required'),
})

export type LcLimitedUpdateFormValues = z.infer<typeof lcLimitedUpdateSchema>

// ── LC Payment ──

export const lcPaymentSchema = z.object({
  paymentCollectedBy: z
    .number({ error: 'Employee is required' })
    .min(1, 'Employee is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentAmount: z
    .number({ error: 'Amount is required' })
    .min(0.01, 'Amount must be > 0'),
  lcAmountTransferAtBank: z.number().default(0),
  lcAdjustmentAmount: z.number().default(0),
  lcCollectionConversionRate: z.number().default(0),
  paymentNote: z.string().optional().default(''),
  isPaymentComplete: z.boolean().default(false),
})

export type LcPaymentFormValues = z.infer<typeof lcPaymentSchema>
