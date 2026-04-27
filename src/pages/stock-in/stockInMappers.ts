import type {
  StockInBatchFormData,
  StockInItemFormData,
  StockInPackFormData,
} from '@/schemas/stockInSchema'
import type { StockInItemData } from '@/types/stockIn'

function pickText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return ''
}

function toInputDate(value: string | null | undefined) {
  if (!value) return ''
  return value.slice(0, 10)
}

function toNullableNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildPackDetails(pack: Partial<StockInPackFormData>) {
  const explicit = pickText(pack.packDetails)
  if (explicit) return explicit

  const packSize = pickText(pack.sipPackSize)
  const remarks = pickText(pack.sipPackRemarks)
  const packTypeName = pickText(pack.packTypeName)

  if (packSize && remarks) return `${packSize} - ${remarks}`
  return pickText(packSize, remarks, packTypeName)
}

export function normalizeStockInBatchForForm(
  batch: Partial<StockInBatchFormData> | null | undefined,
): StockInBatchFormData {
  const batchNumber = pickText(batch?.batchNumber, batch?.batchNo)
  const expiryDate = pickText(
    toInputDate(batch?.expiryDate),
    toInputDate(batch?.batchExpiryDate),
  )

  return {
    batchId: batch?.batchId,
    batchNumber,
    batchNo: batchNumber,
    batchProductionDate: toInputDate(batch?.batchProductionDate),
    expiryDate,
    batchExpiryDate: expiryDate,
    batchCertificateNo: pickText(batch?.batchCertificateNo) || null,
    batchTestDate: toInputDate(batch?.batchTestDate),
    batchTestReport: batch?.batchTestReport ?? 1,
    quantity: toNullableNumber(batch?.quantity),
  }
}

export function normalizeStockInPackForForm(
  pack: Partial<StockInPackFormData> | null | undefined,
): StockInPackFormData {
  const packTypeId = toNullableNumber(pack?.packTypeId ?? pack?.sipPackTypeId)
  const packQuantity = toNullableNumber(pack?.packQuantity ?? pack?.sipPackQty)
  const packTypeName = pickText(pack?.packTypeName)
  const packDetails = buildPackDetails(pack ?? {})
  const packSize = pickText(pack?.sipPackSize, packDetails)
  const packRemarks = pickText(pack?.sipPackRemarks) || null

  return {
    packId: pack?.packId,
    packDetails,
    packQuantity,
    packTypeId,
    packTypeName: packTypeName || null,
    sipPackTypeId: packTypeId,
    sipPackSize: packSize || null,
    sipPackQty: packQuantity,
    sipPackRemarks: packRemarks,
  }
}

export function normalizeStockInItemForForm(item: StockInItemData): StockInItemFormData {
  return {
    sidId: item.sidId,
    sidProductId: item.sidProductId,
    productName: item.productName ?? '',
    sidDeclaredQty: item.sidDeclaredQty ?? 0,
    sidConfirmedQty: item.sidConfirmedQty ?? null,
    sidDeclaredUnitPrice: item.sidDeclaredUnitPrice ?? 0,
    sidConfirmedUnitPrice: item.sidConfirmedUnitPrice ?? null,
    sidProductStrength: item.sidProductStrength ?? null,
    sidBatches: (item.sidBatches ?? []).map((batch) => normalizeStockInBatchForForm(batch)),
    sidPacks: (item.sidPacks ?? []).map((pack) => normalizeStockInPackForForm(pack)),
    sidMappedProductId: item.sidMappedProductId ?? null,
    sidMappedProductName: item.sidMappedProductName ?? null,
  }
}

export function mapStockInBatchToPayload(batch: StockInBatchFormData) {
  const normalized = normalizeStockInBatchForForm(batch)

  return {
    batchId: normalized.batchId ?? 0,
    batchNo: normalized.batchNo,
    batchProductionDate: normalized.batchProductionDate || null,
    batchExpiryDate: normalized.batchExpiryDate || null,
    batchCertificateNo: normalized.batchCertificateNo ?? null,
    batchTestDate: normalized.batchTestDate || null,
    batchTestReport: normalized.batchTestReport ?? 1,
  }
}

export function mapStockInPackToPayload(pack: StockInPackFormData) {
  const normalized = normalizeStockInPackForForm(pack)

  return {
    sipPackTypeId: normalized.sipPackTypeId ?? null,
    sipPackSize: toNullableNumber(normalized.sipPackSize),
    sipPackQty: normalized.sipPackQty ?? null,
    sipPackRemarks: normalized.sipPackRemarks ?? null,
    packTypeName: normalized.packTypeName ?? null,
  }
}

export function mapStockInItemToPayload(item: StockInItemFormData) {
  return {
    sidId: item.sidId,
    sidProductId: item.sidProductId,
    productName: item.productName,
    sidDeclaredQty: item.sidDeclaredQty,
    sidConfirmedQty: item.sidConfirmedQty ?? null,
    sidDeclaredUnitPrice: item.sidDeclaredUnitPrice,
    sidConfirmedUnitPrice: item.sidConfirmedUnitPrice ?? null,
    sidProductStrength: item.sidProductStrength ?? null,
    sidBatches: (item.sidBatches ?? []).map(mapStockInBatchToPayload),
    sidPacks: (item.sidPacks ?? []).map(mapStockInPackToPayload),
    sidMappedProductId: item.sidMappedProductId ?? null,
    sidMappedProductName: item.sidMappedProductName ?? null,
  }
}

export function mapPriceEditItemToPayload(item: StockInItemFormData) {
  const payload = mapStockInItemToPayload(item)

  return {
    ...payload,
    // Legacy price update submits confirmed values from the declared values.
    sidConfirmedQty: item.sidDeclaredQty,
    sidConfirmedUnitPrice: item.sidDeclaredUnitPrice,
  }
}