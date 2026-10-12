// ============================================================
// Stock-In Module — Zod Schemas
// ============================================================
import { z } from 'zod'

// ── Batch Schema ──────────────────────────────────────────────
export const stockInBatchSchema = z.object({
  batchId: z.number().optional(),
  batchNumber: z.string().min(1, 'Batch number is required'),
  batchNo: z.string().nullable().optional(),
  batchProductionDate: z.string().nullable().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  batchExpiryDate: z.string().nullable().optional(),
  batchCertificateNo: z.string().nullable().optional(),
  batchTestDate: z.string().nullable().optional(),
  batchTestReport: z.union([z.number(), z.boolean()]).nullable().optional(),
  quantity: z.number().nullable().optional(),
})

export type StockInBatchFormData = z.infer<typeof stockInBatchSchema>

// ── Pack Schema ───────────────────────────────────────────────
export const stockInPackSchema = z.object({
  packId: z.number().optional(),
  packDetails: z.string().min(1, 'Pack details are required'),
  packQuantity: z.number().nullable().optional(),
  packTypeId: z.number().nullable().optional(),
  packTypeName: z.string().nullable().optional(),
  sipPackTypeId: z.number().nullable().optional(),
  sipPackSize: z.string().nullable().optional(),
  sipPackQty: z.number().nullable().optional(),
  sipPackRemarks: z.string().nullable().optional(),
})

export type StockInPackFormData = z.infer<typeof stockInPackSchema>

// ── Item Schema ───────────────────────────────────────────────
export const stockInItemSchema = z.object({
  sidId: z.number().optional(),
  sidProductId: z.number({ error: 'Product is required' }).min(1, 'Product is required'),
  productName: z.string(),
  sidDeclaredQty: z
    .number({ error: 'Quantity is required' })
    .min(0.001, 'Quantity must be positive'),
  sidConfirmedQty: z.number().nullable().optional(),
  sidDeclaredUnitPrice: z
    .number({ error: 'Unit price is required' })
    .min(0, 'Price cannot be negative'),
  sidConfirmedUnitPrice: z.number().nullable().optional(),
  sidProductStrength: z.string().nullable().optional(),
  sidBatches: z.array(stockInBatchSchema).default([]),
  sidPacks: z.array(stockInPackSchema).default([]),
  sidMappedProductId: z.number().nullable().optional(),
  sidMappedProductName: z.string().nullable().optional(),
})

export type StockInItemFormData = z.infer<typeof stockInItemSchema>

// ── Create/Edit Stock-In Schema ───────────────────────────────
export const stockInSchema = z
  .object({
    siSystemId: z.number().optional(),  // Present on edit, absent on create
    siSystemNo: z.string().optional(),
    siInvoiceNo: z.string().min(1, 'Invoice/reference number is required'),
    siInvoiceDate: z.string().min(1, 'Date is required'),
    siJobTypeId: z.number({ error: 'Order type is required' }).min(1, 'Order type is required'),
    jobTypeName: z.string().default(''),
    siRemarks: z.string().nullable().optional(),
    siSourceChannelId: z.number({ error: 'Source channel is required' }).min(1, 'Source channel is required'),
    siSourceChannelName: z.string().nullable().optional(),
    siDestinationChannelId: z.number({ error: 'Destination channel is required' }).min(1, 'Destination channel is required'),
    siDestinationChannelName: z.string().nullable().optional(),
    siSupplierId: z.number().nullable().optional(),
    supplierName: z.string().nullable().optional(),
    supplierAddress: z.string().nullable().optional(),
    siCustomerId: z.number().nullable().optional(),
    customerName: z.string().nullable().optional(),
    customerAddress: z.string().nullable().optional(),
    siInvoiceReceiveStatus: z.boolean().optional().default(false),
    siInvoiceReceiveDate: z.string().nullable().optional(),

    // Bill fields
    sibCalculatedAmount: z.number().default(0),
    sibDiscountAmouunt: z.number().default(0),
    sibAdjustedAmount: z.number().default(0),
    sibFinalAmount: z.number().default(0),
    sibCurrencyName: z.string().default('BDT'),

    items: z.array(stockInItemSchema).min(1, 'At least one item is required'),
  })
  .refine(
    (data) => data.siSourceChannelId !== data.siDestinationChannelId,
    {
      message: 'Source and destination channels must be different',
      path: ['siDestinationChannelId'],
    },
  )

export type StockInFormData = z.infer<typeof stockInSchema>

// ── Quantity Confirmation Schema ──────────────────────────────
export const confirmQtyItemSchema = z.object({
  sidProductId: z.number(),
  productName: z.string(),
  sidDeclaredQty: z.number(),
  sidDeclaredUnitPrice: z.number(),
  sidConfirmedQty: z
    .number({ error: 'Confirmed quantity is required' })
    .min(0, 'Confirmed qty cannot be negative'),
  sidConfirmedUnitPrice: z
    .number({ error: 'Confirmed unit price is required' })
    .min(0, 'Confirmed price cannot be negative'),
  sidProductStrength: z.string().nullable().optional(),
  sidBatches: z.array(stockInBatchSchema).default([]),
  sidPacks: z.array(stockInPackSchema).default([]),
  sidMappedProductId: z.number().nullable().optional(),
  sidMappedProductName: z.string().nullable().optional(),
})

export const confirmQtySchema = z.object({
  items: z.array(confirmQtyItemSchema).min(1),
})

export type ConfirmQtyFormData = z.infer<typeof confirmQtySchema>

// ── Stock Adjustment Schema ───────────────────────────────────
export const stockAdjustmentItemSchema = z.object({
  productId: z.number({ error: 'Product is required' }).min(1, 'Product is required'),
  productQty: z.number({ error: 'Quantity is required' }).refine(
    (val) => val !== 0,
    'Quantity cannot be zero',
  ),
  currentStock: z.number().optional(),
})

export const stockAdjustmentSchema = z.object({
  saReferanceNo: z.string().min(1, 'Reference number is required'),
  channelId: z.number({ error: 'Channel is required' }).min(1, 'Channel is required'),
  saDatetime: z.string().min(1, 'Date is required'),
  stockAdjutmentRemark: z.string().nullable().optional(),
  stockAdjutmentProducts: z
    .array(stockAdjustmentItemSchema)
    .min(1, 'At least one item is required'),
})

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>

// ── Invoice Search Schema ─────────────────────────────────────
export const stockInInvoiceFilterSchema = z.object({
  supplierId: z.number().default(0),
  customerId: z.number().default(0),
  jobTypeId: z.number().default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type StockInInvoiceFilterData = z.infer<typeof stockInInvoiceFilterSchema>

// ── Invoice Report Schema ─────────────────────────────────────
export const stockInInvoiceReportSchema = z.object({
  siSystemId: z.number({ error: 'System ID is required' }).min(1, 'System ID is required'),
})

export type StockInInvoiceReportFormData = z.infer<typeof stockInInvoiceReportSchema>
