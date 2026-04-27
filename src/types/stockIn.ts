// ============================================================
// Stock-In Module — V2 Type Definitions
// ============================================================

// ── Mode Types ────────────────────────────────────────────────
export type StockInListMode =
  | 'standard'        // Pending/draft orders (status 50)
  | 'confirm-qty'     // Escalated orders awaiting qty confirmation (status 51)
  | 'admin-approved'  // Approved/received orders (status 52)
  | 'price-update'    // Orders eligible for price update

export type StockInEditMode =
  | 'standard'     // Full edit — all fields editable
  | 'price-edit'   // Only prices/batches/packs editable
  | 'admin-revert' // All fields read-only — confirm before reverting

// ── Order Type Enum ─────────────────────────────────────────
export type StockInOrderType =
  | 'Sample_Receive'
  | 'Regular_Purchase'
  | 'Excess_From_Intact'
  | 'Exchange_Inward'
  | 'Sales_Return'
  | 'Loan_Receive'
  | 'Mixing_Received'
  | 'Internal_Transfer'
  | 'Warehouse_Transfer'
  | 'Sample_Issue'

// ── Batch & Pack ──────────────────────────────────────────────
export interface StockInBatch {
  batchId?: number
  batchNo?: string | null
  batchProductionDate?: string | null
  batchNumber: string
  expiryDate: string   // ISO date string
  batchExpiryDate?: string | null
  batchCertificateNo?: string | null
  batchTestDate?: string | null
  batchTestReport?: number | boolean | null
  quantity?: number | null
}

export interface StockInPack {
  packId?: number
  packDetails: string
  packQuantity?: number | null
  packTypeId?: number | null
  packTypeName?: string | null
  sipPackTypeId?: number | null
  sipPackSize?: string | null
  sipPackQty?: number | null
  sipPackRemarks?: string | null
}

// ── Line Item ─────────────────────────────────────────────────
export interface StockInItemData {
  sidId?: number
  sidProductId: number
  productName: string
  sidDeclaredQty: number
  sidConfirmedQty: number | null
  sidDeclaredUnitPrice: number
  sidConfirmedUnitPrice: number | null
  sidProductStrength: string | null
  sidBatches: StockInBatch[]
  sidPacks: StockInPack[]
  sidMappedProductId: number | null
  sidMappedProductName: string | null
}

// ── Bill / Financial Summary ──────────────────────────────────
export interface StockInBillData {
  sibCalculatedAmount: number   // Subtotal (sum of line totals)
  sibDiscountAmouunt: number    // Discount amount (legacy typo kept)
  sibAdjustedAmount: number     // VAT/AIT/adjustment amount
  sibFinalAmount: number        // Final total
  sibCurrencyName: string       // e.g. "BDT"
}

// ── General / Header ─────────────────────────────────────────
export interface StockInGeneralData {
  siSystemId: number
  siSystemNo: string
  siInvoiceNo: string                  // External invoice/reference number
  siInvoiceDate: string                // ISO date string
  siInvoiceDateInText?: string
  siJobTypeId: number                  // Order type enum ID
  jobTypeName: string                  // Order type label (e.g. "Regular_Purchase")
  siRemarks: string | null
  siSourceChannelId: number
  siSourceChannelName: string | null
  siDestinationChannelId: number
  siDestinationChannelName: string | null
  siSupplierId: number | null
  supplierName: string | null
  supplierAddress: string | null
  siCustomerId: number | null
  customerName: string | null
  customerAddress: string | null
  siInvoiceReceiveStatus?: boolean     // Whether physical invoice was received
  siInvoiceReceiveDate?: string | null // Date physical invoice was received
  siCurrentStatus?: number
}

// ── Complete Order Detail ─────────────────────────────────────
export interface StockInOrderDetail {
  stockInGeneralData: StockInGeneralData
  stockInItemsData: StockInItemData[]
  stockInBillData: StockInBillData
}

// ── List Row (Grid) ───────────────────────────────────────────
export interface StockInListRow {
  siSystemId: number
  siSystemNo: string
  siInvoiceNo: string
  siInvoiceDate: string
  supplierName: string | null
  customerName: string | null
  sourceChannelName: string | null
  destinationChannelName: string | null
  jobType: string | null
  jobTypeName: string | null
  sidFinalAmount: number | null
  siCurrentStatus: number
}

// ── Stock Adjustment ──────────────────────────────────────────
export interface StockAdjustmentItem {
  productId: number
  productName?: string
  productQty: number   // Can be negative for deductions
  currentStock?: number
}

export interface StockAdjustmentPayload {
  channelId: number
  stockAdjutmentRemark: string | null
  saDatetime: string       // ISO datetime
  saReferanceNo: string | null
  stockAdjutmentProducts: StockAdjustmentItem[]
}

// ── Invoice / Challan ─────────────────────────────────────────
export interface StockInInvoiceListRow {
  siSystemId: number
  siSystemNo: string
  siInvoiceNo: string
  siInvoiceDate: string
  supplierName: string | null
  customerName: string | null
  jobType: string | null
  jobTypeName: string | null
  sibFinalAmount: number | null
}

export interface StockInChallanItem {
  sidProductId: number
  productName: string
  sidDeclaredQty: number
  sidConfirmedQty: number | null
  sidDeclaredUnitPrice: number
  sidConfirmedUnitPrice: number | null
  packTypeName?: string | null
  sipPackSize?: number | string | null
  sipPackQty?: number | null
}

export interface StockInChallan {
  stockInGeneralData: StockInGeneralData
  stockInItemsData: StockInChallanItem[]
  stockInBillData: StockInBillData
}

// ── Payloads ──────────────────────────────────────────────────
export interface CreateStockInPayload {
  stockInGeneralData: Omit<StockInGeneralData, 'siCurrentStatus'>
  stockInItemsData: StockInItemData[]
  stockInBillData: StockInBillData
}

export interface UpdateStockInPayload {
  stockInGeneralData: StockInGeneralData
  stockInItemsData: StockInItemData[]
  stockInBillData: StockInBillData
}

export interface EscalationPayload {
  ids: number[]   // Array of siSystemId values
}

export interface QuantityConfirmationItem {
  sidProductId: number
  sidConfirmedQty: number
  sidConfirmedUnitPrice: number
}

export interface RevertItem {
  sidProductId: number
  sidConfirmedQty: number
}

// ── Filters ───────────────────────────────────────────────────
export interface StockInListFilters {
  status?: number | string
  searchTerm?: string
  startDate?: string
  endDate?: string
  supplierId?: number
  customerId?: number
}

export interface StockInInvoiceFilters {
  supplierId?: number
  customerId?: number
  startDate?: string
  endDate?: string
}

/** Alias kept for import compatibility */
export type StockInInvoiceListFilters = StockInInvoiceFilters

// ── API Response Wrapper ──────────────────────────────────────
export interface StockInApiResponse<T = unknown> {
  dataObj: T
  errMsg?: string
  title?: string
}

// ── Lookup / Dropdown ─────────────────────────────────────────
export interface StockInLookupOption {
  id: number
  label: string
}

// Hard-coded order types (verify IDs against backend if needed)
export const STOCK_IN_ORDER_TYPES: StockInLookupOption[] = [
  { id: 1, label: 'Sample Receive' },
  { id: 2, label: 'Regular Purchase' },
  { id: 3, label: 'Excess From Intact' },
  { id: 4, label: 'Exchange Inward' },
  { id: 5, label: 'Sales Return' },
  { id: 6, label: 'Loan Receive' },
  { id: 7, label: 'Mixing Received' },
  { id: 8, label: 'Internal Transfer' },
  { id: 9, label: 'Warehouse Transfer' },
  { id: 10, label: 'Sample Issue' },
]

// Job type names that require a supplier
export const SUPPLIER_ORDER_TYPES: string[] = [
  'Sample_Receive',
  'Regular_Purchase',
  'Excess_From_Intact',
  'Warehouse_Transfer',
  'Sample_Issue',
]

// Job type names that require a customer
export const CUSTOMER_ORDER_TYPES: string[] = [
  'Exchange_Inward',
  'Sales_Return',
  'Loan_Receive',
]
