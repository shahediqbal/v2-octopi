import { calculateCompleteBill, calculateProductLineTotal, parseNumeric } from '@/features/stock-out/calculations'
import type {
  EditMode,
  StockOutItemData,
  StockOutMutationPayload,
  StockOutOrderDetail,
  StockOutPackagingDetail,
  StockOutPackagingPayloadItem,
} from '@/types/stockOut'
import type {
  EscalateStockOutFormValues,
  StockOutFormValues,
} from '@/schemas/stockOutSchema'

interface StockOutMutationMappingOptions {
  mode?: EditMode
  useLegacyStandardPricing?: boolean
}

const VALIDATION_ERROR_TITLE = 'One or more validation errors occurred.'

function flattenValidationErrors(errors: Record<string, string[] | undefined> | null | undefined): string[] {
  return Object.values(errors ?? {}).flatMap((messages) =>
    Array.isArray(messages)
      ? messages.filter((message): message is string => typeof message === 'string' && message.trim().length > 0)
      : [],
  )
}

function calculateLegacyStandardLineTotal(item: StockOutFormValues['items'][number]) {
  return parseNumeric(item.quantity) * parseNumeric(item.unitPrice)
}

function resolveProductLabel(item: StockOutFormValues['items'][number], existingItem?: StockOutItemData) {
  return item.productLabel?.trim() || existingItem?.productName || null
}

export function extractApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'body' in error) {
    const body = (error as {
      body?: {
        errMsg?: string
        message?: string
        title?: string
        errors?: Record<string, string[] | undefined> | null
      }
    }).body
    const responseError = extractApiResponseErrorMessage(body)
    if (responseError) return responseError
    if (body?.errMsg) return body.errMsg
    if (body?.message) return body.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

export function extractApiResponseErrorMessage(
  response:
    | {
        errMsg?: string
        message?: string
        title?: string
        errors?: Record<string, string[] | undefined> | null
      }
    | null
    | undefined,
): string | null {
  if (!response) {
    return null
  }

  if (typeof response.errMsg === 'string' && response.errMsg.trim().length > 0) {
    return response.errMsg
  }

  const validationMessages = flattenValidationErrors(response.errors)
  if (validationMessages.length > 0) {
    return validationMessages[0]
  }

  if (response.title === VALIDATION_ERROR_TITLE) {
    return response.title
  }

  return null
}

export function getSerializedBatchValue(
  batches: StockOutItemData['sodBatches'],
): string {
  if (Array.isArray(batches) && batches.length > 0) {
    return JSON.stringify({
      id: batches[0]?.batchId ?? 0,
      label: batches[0]?.batchNo ?? '',
    })
  }

  if (typeof batches === 'string' && batches.trim()) {
    return JSON.stringify({ id: 0, label: batches.trim() })
  }

  return ''
}

export function parseSerializedBatchValue(value: string) {
  if (!value.trim()) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as { id?: number; label?: string }
    return {
      batchId: parsed.id ? Number(parsed.id) : null,
      batchNo: parsed.label ? String(parsed.label) : '',
    }
  } catch {
    return { batchId: null, batchNo: value }
  }
}

export function mapDetailToFormValues(detail: StockOutOrderDetail): StockOutFormValues {
  return {
    soCustomerId: detail.stockOutGeneralData.soCustomerId,
    soSupplierId: detail.stockOutGeneralData.soSupplierId ?? null,
    soJobTypeId: detail.stockOutGeneralData.soJobTypeId,
    soOrderFromId: detail.stockOutGeneralData.soOrderFromId,
    invoiceDate: detail.stockOutGeneralData.invoiceDate
      ? new Date(detail.stockOutGeneralData.invoiceDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    soCustomerReferance: detail.stockOutGeneralData.soCustomerReferance ?? '',
    soRelatedLcId: detail.stockOutGeneralData.soRelatedLcId ?? '',
    soRemarks: detail.stockOutGeneralData.soRemarks ?? '',
    soPriceReview: Boolean(detail.stockOutGeneralData.soPriceReview),
    billDiscountType: detail.stockOutBillData.billDiscountType === 'P' ? 'P' : 'F',
    billDiscountRate: parseNumeric(detail.stockOutBillData.billDiscountRate),
    billVatPercantage: parseNumeric(detail.stockOutBillData.billVatPercantage),
    billAitPercantage: parseNumeric(detail.stockOutBillData.billAitPercantage),
    billAdjustmentAmount: parseNumeric(detail.stockOutBillData.billAdjustmentAmount),
    sobCurrencyName: detail.stockOutBillData.sobCurrencyName === 'USD' ? 'USD' : 'BDT',
    sobCurrencyConversionRate: parseNumeric(detail.stockOutBillData.sobCurrencyConversionRate) || 1,
    items: detail.stockOutItemsData.map((item) => ({
      productId: item.sodProductId,
      productLabel: item.productName ?? '',
      quantity: parseNumeric(item.sodQty),
      unitPrice: parseNumeric(item.sodUnitPrice),
      ...(parseNumeric(item.sodBaseUnitPrice) !== parseNumeric(item.sodUnitPrice)
        ? { baseUnitPrice: parseNumeric(item.sodBaseUnitPrice) }
        : {}),
      vatRate: parseNumeric(item.sodUnitVatPercantage),
      aitRate: parseNumeric(item.sodUnitAitPercantage),
      discountRate: parseNumeric(item.sodUnitDiscountRate),
      discountType: item.sodUnitDiscountType === 'P' ? 'P' : 'F',
      itemRemark: item.itemRemark ?? '',
    })),
  }
}

export function mapFormValuesToMutationPayload(
  values: StockOutFormValues,
  existingDetail?: StockOutOrderDetail,
  options: StockOutMutationMappingOptions = {},
): StockOutMutationPayload {
  const useLegacyStandardPricing = options.useLegacyStandardPricing || options.mode === 'standard'
  const itemCalculations = values.items.map((item) =>
    calculateProductLineTotal({
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      discount: item.discountRate,
      discountType: item.discountType,
      vatRate: item.vatRate,
      aitRate: item.aitRate,
    }),
  )

  const itemLineTotals = values.items.map((item, index) =>
    useLegacyStandardPricing
      ? calculateLegacyStandardLineTotal(item)
      : parseNumeric(itemCalculations[index]?.lineTotal),
  )

  const billSummary = calculateCompleteBill({
    items: itemLineTotals.map((lineTotal) => ({ lineTotal })),
    discount: values.billDiscountRate,
    discountType: values.billDiscountType,
    vatRate: values.billVatPercantage,
    aitRate: values.billAitPercantage,
    adjustmentAmount: values.billAdjustmentAmount,
    conversionRate: values.sobCurrencyConversionRate,
  })

  return {
    stockOutGeneralData: {
      ...existingDetail?.stockOutGeneralData,
      soSystemId: existingDetail?.stockOutGeneralData.soSystemId ?? 0,
      soJobTypeId: values.soJobTypeId,
      soOrderFromId: values.soOrderFromId,
      soCurrentStatus: existingDetail?.stockOutGeneralData.soCurrentStatus ?? 0,
      soCustomerId: values.soCustomerId,
      soSupplierId: values.soSupplierId,
      soDestinationChannelId: existingDetail?.stockOutGeneralData.soDestinationChannelId ?? 2,
      soCompanyId: existingDetail?.stockOutGeneralData.soCompanyId ?? 2,
      soPriceReview: values.soPriceReview ? 1 : 0,
      soRemarks: values.soRemarks,
      soCustomerReferance: values.soCustomerReferance,
      soRelatedLcId: values.soRelatedLcId,
      invoiceDate: values.invoiceDate,
      dateOfIssue: values.invoiceDate,
    },
    stockOutItemsData: values.items.map((item, index) => {
      const existingItem = existingDetail?.stockOutItemsData[index]
      return {
        ...existingItem,
        sodProductId: item.productId,
        sodQty: item.quantity,
        sodBaseUnitPrice: item.baseUnitPrice ?? item.unitPrice,
        sodUnitPrice: item.unitPrice,
        sodUnitDiscountType: item.discountType,
        sodUnitDiscountRate: item.discountRate,
        sodUnitDiscountAmount: useLegacyStandardPricing
          ? 0
          : parseNumeric(itemCalculations[index]?.discountAmount),
        sodUnitVatPercantage: item.vatRate,
        sodUnitAitPercantage: item.aitRate,
        sodFinalCalculatedUnitPrice: itemLineTotals[index],
        itemRemark: item.itemRemark,
        productName: resolveProductLabel(item, existingItem),
      }
    }),
    stockOutBillData: {
      ...existingDetail?.stockOutBillData,
      calculatedBill: parseNumeric(billSummary.subtotal),
      billDiscountType: values.billDiscountType,
      billDiscountRate: values.billDiscountRate,
      billDiscountAmount: parseNumeric(billSummary.discountAmount),
      billVatPercantage: values.billVatPercantage,
      billAitPercantage: values.billAitPercantage,
      billAdjustmentAmount: values.billAdjustmentAmount,
      finalBill: parseNumeric(billSummary.finalTotal),
      sobCurrencyName: values.sobCurrencyName,
      sobCurrencyConversionRate: values.sobCurrencyConversionRate,
      sobFinalConvertedBill: parseNumeric(billSummary.convertedTotal),
    },
  }
}

export function mapDetailToEscalationDefaults(detail: StockOutOrderDetail): EscalateStockOutFormValues {
  return {
    soSystemId: detail.stockOutGeneralData.soSystemId,
    items: detail.stockOutItemsData.map((item) => ({
      sodProductId: item.sodProductId,
      productName: item.productName ?? '',
      quantity: parseNumeric(item.sodQty),
      sodMappedProductId: item.sodMappedProductId ?? null,
      sodBatchValue: getSerializedBatchValue(item.sodBatches),
    })),
  }
}

export function mapEscalationValuesToPayload(
  detail: StockOutOrderDetail,
  values: EscalateStockOutFormValues,
): StockOutMutationPayload {
  return {
    stockOutGeneralData: {
      ...detail.stockOutGeneralData,
      soSystemId: detail.stockOutGeneralData.soSystemId,
    },
    stockOutItemsData: detail.stockOutItemsData.map((item, index) => {
      const batch = parseSerializedBatchValue(values.items[index]?.sodBatchValue ?? '')
      return {
        ...item,
        sodMappedProductId: values.items[index]?.sodMappedProductId ?? null,
        sodBatches: batch ? [{ batchId: batch.batchId, batchNo: batch.batchNo }] : null,
      }
    }),
    stockOutBillData: {
      ...detail.stockOutBillData,
    },
  }
}

export interface PackagingRowValue {
  rowId: string
  productId: number
  productName: string
  quantity: number
  packSize: string
  packNo: string
  packQuantity: string
  sopPackId: string
  packLabel: string
  delete?: 1
}

export function mapOrderDetailToPackagingRows(detail: StockOutOrderDetail): PackagingRowValue[] {
  return detail.stockOutItemsData.map((item, index) => ({
    rowId: `${item.sodProductId}-${index}`,
    productId: item.sodProductId,
    productName: item.productName ?? '',
    quantity: parseNumeric(item.sodQty),
    packSize: '',
    packNo: '',
    packQuantity: '',
    sopPackId: '',
    packLabel: '',
  }))
}

export function mapPackagingDetailToRows(detail: StockOutPackagingDetail): PackagingRowValue[] {
  return (detail.stockOutPackagingItems ?? []).map((item, index) => ({
    rowId: `${item.sodProductId ?? item.sopProductId}-${index}`,
    productId: Number(item.sodProductId ?? item.sopProductId ?? 0),
    productName: item.productName ?? '',
    quantity: parseNumeric(item.sodConfirmedQty ?? item.sopProductQty),
    packSize: item.sopPackSize != null ? String(item.sopPackSize) : '',
    packNo: item.sopNoPack != null ? String(item.sopNoPack) : '',
    packQuantity: item.sopProductQty != null ? String(item.sopProductQty) : '',
    sopPackId: item.sopPackId != null ? String(item.sopPackId) : '',
    packLabel: item.packTypeName ?? '',
    delete: 1,
  }))
}

export function mapPackagingRowsToPayload(
  salesOrderId: number,
  rows: PackagingRowValue[],
): StockOutPackagingPayloadItem[] {
  return rows.map((row) => ({
    soSystemId: salesOrderId,
    sopProductId: row.productId,
    sopPackId: Number(row.sopPackId),
    packInfo: row.packLabel,
    sopProductQty: parseNumeric(row.packQuantity),
    sopPackSize: parseNumeric(row.packSize),
    sopNoPack: parseNumeric(row.packNo),
  }))
}