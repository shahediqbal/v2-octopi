export type DiscountType = 'F' | 'P'

export type ListMode =
  | 'standard'
  | 'escalation'
  | 'packaging'
  | 'package-done'
  | 'admin-general'
  | 'admin-pending-price'
  | 'admin-limited-edit'

export type EditMode =
  | 'standard'
  | 'admin-full'
  | 'admin-price-edit'
  | 'admin-invoice-limited'
  | 'admin-packing-edit'
  | 'packing-edit'

export type PermissionProfile = 'standard' | 'pricing' | 'warehouse' | 'superadmin'

export interface StockOutApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
  statusCode?: number
  message?: string
  errors?: Record<string, string[] | undefined> | null
}

export interface StockOutLookupOption {
  id: number
  label: string
}

export interface StockOutGeneralData {
  soSystemId: number
  soSystemNo?: string | null
  soJobTypeId: number | null
  soOrderFromId: number | null
  soCurrentStatus: number
  soCustomerId: number | null
  soSupplierId?: number | null
  soDestinationChannelId?: number | null
  soCompanyId?: number | null
  soPriceReview?: number | boolean | null
  soAssociateCurrentStatus?: number | null
  soRemarks?: string | null
  soCustomerReferance?: string | null
  soRelatedLcId?: string | null
  customerName?: string | null
  supplierName?: string | null
  customerAddress?: string | null
  supplierAddress?: string | null
  jobTypeName?: string | null
  marketingPersonnel?: string | null
  invoiceDate?: string | null
  dateOfIssue?: string | null
}

export interface StockOutItemData {
  sodProductId: number
  sodQty: number
  sodConfirmedQty?: number | null
  sodBaseUnitPrice: number
  sodUnitPrice: number
  sodUnitDiscountType: DiscountType | null
  sodUnitDiscountRate: number
  sodUnitDiscountAmount: number
  sodUnitVatPercantage: number
  sodUnitAitPercantage: number
  sodFinalCalculatedUnitPrice: number
  sodMappedProductId?: number | null
  sodBatches?: Array<{ batchId?: number | null; batchNo?: string | null }> | string | null
  sodRealatedBatchNo?: string | null
  itemRemark?: string | null
  productName?: string | null
  mappedProductName?: string | null
}

export interface StockOutBillData {
  calculatedBill: number
  billDiscountType: DiscountType | null
  billDiscountRate: number
  billDiscountAmount: number
  billVatPercantage: number
  billAitPercantage: number
  billAdjustmentAmount: number
  finalBill: number
  sobCurrencyName: 'BDT' | 'USD' | 'TK' | string
  sobCurrencyConversionRate: number
  sobFinalConvertedBill: number
}

export interface StockOutOrderDetail {
  stockOutGeneralData: StockOutGeneralData
  stockOutItemsData: StockOutItemData[]
  stockOutBillData: StockOutBillData
}

export interface StockOutListRow {
  soSystemId: number
  soSystemNo?: string | null
  invoiceDate?: string | null
  customerName?: string | null
  supplierName?: string | null
  customerAddress?: string | null
  supplierAddress?: string | null
  jobType?: string | null
  jobTypeName?: string | null
  soCurrentStatus?: number | null
  currentStatus?: number | null
  currentStatusName?: string | null
  soCustomerReferance?: string | null
  soOrderFrom?: string | null
  soSystemPending?: string | null
  soDecesionPending?: string | null
  actionTakenRemarks?: string | null
  soAssociateCurrentStatus?: number | null
  sobFinalBill?: number | string | null
  finalBill?: number | string | null
  calculatedBill?: number | string | null
}

export interface StockOutListFilters {
  status: string
  searchTerm?: string
  startDate?: string
  endDate?: string
  customerId?: number | null
}

export interface StockOutBatchLookup {
  finalBatch: StockOutLookupOption[]
  finalMappedItem: StockOutLookupOption[]
}

export interface StockOutLatestBatchInfo {
  batchNo?: string | null
  maxInvoiceDate?: string | null
}

export interface StockOutLatestMapProductInfo {
  mapProduct?: string | null
  invoiceDate?: string | null
}
export interface StockOutLastBatchInfo {
  batchNo?: string | null
  maxInvoiceDate?: string | null
}

export interface StockOutLastMapProductInfo {
  sodMappedProductId?: number | null
  mapProduct?: string | null
  invoiceDate?: string | null
}

export interface StockOutLatestBatchMap {
  // Old/single response support
  batchNo?: string | null
  maxInvoiceDate?: string | null
  mappedProductName?: string | null
  mapProduct?: string | null
  invoiceDate?: string | null
  sodMappedProductId?: number | null

  // Current backend response
  lastBatch?: StockOutLastBatchInfo | null
  lastMapProduct?: StockOutLastMapProductInfo | null
  lastBatches?: StockOutLastBatchInfo[]
  lastMapProducts?: StockOutLastMapProductInfo[]
}
// export interface StockOutLatestBatchMap {
//   sodMappedProductId?: number | null
//   sodBatches?: string | null
//   mappedProductName?: string | null
//   mapProduct?: string | null
//   batchNo?: string | null
//   maxInvoiceDate?: string | null
//   invoiceDate?: string | null
//   lastBatch?: StockOutLatestBatchInfo | null
//   lastMapProduct?: StockOutLatestMapProductInfo | null
// }
// export interface StockOutLastBatchMapOrder {
//   soSystemId?: number | null
//   soSystemNo?: string | null
//   invoiceDate?: string | null
//   batchNo?: string | null
//   mappedProductName?: string | null
//   mapProduct?: string | null
// }
export interface StockOutPackagingInfoItem {
  soSystemId: number
  sodProductId?: number | null
  sodMappedProductId?: number | null
  sopProductId: number
  productName?: string | null
  mappedProductName?: string | null
  sodConfirmedQty?: number | null
  sopPackId?: number | null
  packTypeName?: string | null
  packInfo?: string | null
  sopProductQty?: number | null
  sopPackSize?: number | null
  sopNoPack?: number | null
  sodBatches?: Array<{ batchId?: number | null; batchNo?: string | null }> | null
  lotNo?: string | null
}

export interface StockOutPackagingDetail {
  soSystemId?: number | null
  soSystemNo?: string | null
  invoiceDate?: string | null
  customerName?: string | null
  supplierName?: string | null
  jobType?: string | null
  customerFlag?: 0 | 1 | null
  stockOutPackagingItems: StockOutPackagingInfoItem[]
}

export interface StockOutStatusUpdatePayload {
  soSystemId: number
  associateCurrenStatus: number
  remarks?: string
}

export interface StockOutMutationPayload {
  stockOutGeneralData: StockOutGeneralData
  stockOutItemsData: StockOutItemData[]
  stockOutBillData: StockOutBillData
}

export interface StockOutPackagingPayloadItem {
  soSystemId: number
  sopProductId: number
  sopPackId: number | null
  packInfo?: string | null
  sopProductQty: number
  sopPackSize: number
  sopNoPack: number
}

export interface StockOutJobSearchResult {
  soSystemId: number
  soSystemNo?: string | null
  customerName?: string | null
}

export interface StockOutPendingPopupItem extends StockOutListRow {
  soSystemPending?: string | null
  soDecesionPending?: string | null
  actionTakenRemarks?: string | null
}

export interface StockOutCurrentStockItem {
  currentStockAutoId?: number | null
  productId?: number | null
  productName?: string | null
  currentQty?: number | null
  channelId?: number | null
  channelName?: string | null
  productCategoryId?: number | null
  productCategoryName?: string | null
}

export interface StockOutRestorePreviewItem {
  productName: string
  originalProductId?: number | null
  mappedProductName?: string | null
  effectiveProductId: number
  quantityToRestore: number
  currentStock: number
  estimatedAfterStock: number
}

export interface StockOutCustomerCredit {
  customerId?: number | null
  openingCredit?: number | null
  totalSale?: number | null
  totalPaid?: number | null
  totalDue?: number | null
  customerName?: string | null
}

export interface StockOutCustomerLastPayment {
  paymentSystemId?: number | null
  paymentCustomerId?: number | null
  customerName?: string | null
  customerAddress?: string | null
  paymentAmount?: number | null
  paymentDate?: string | null
}

export interface StockOutPriceSummaryItem {
  soCustomerId?: number | null
  sodProductId?: number | null
  sodConfirmedUnitPrice?: number | null
  invoiceDate?: string | null
}

export interface StockOutCategoryOption {
  id: number
  label: string
}

export interface StockOutSampleProduct {
  productId: number
  productName: string
}