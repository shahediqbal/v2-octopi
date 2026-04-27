// ============================================================
// Stock-In Module — Field Editability Rules
// ============================================================
import type { StockInEditMode } from '@/types/stockIn'

export type StockInFieldKey =
  | 'siInvoiceNo'
  | 'siInvoiceDate'
  | 'siJobTypeId'
  | 'siSourceChannelId'
  | 'siDestinationChannelId'
  | 'siSupplierId'
  | 'siCustomerId'
  | 'siRemarks'
  | 'siInvoiceReceiveStatus'
  | 'siInvoiceReceiveDate'
  | 'product'
  | 'declaredQty'
  | 'declaredUnitPrice'
  | 'batches'
  | 'packs'

export type StockInFieldRule = 'editable' | 'readonly' | 'hidden'

export const STOCK_IN_FIELD_RULES: Record<StockInEditMode, Record<StockInFieldKey, StockInFieldRule>> =
  {
    standard: {
      siInvoiceNo: 'editable',
      siInvoiceDate: 'editable',
      siJobTypeId: 'editable',
      siSourceChannelId: 'editable',
      siDestinationChannelId: 'editable',
      siSupplierId: 'editable',
      siCustomerId: 'editable',
      siRemarks: 'editable',
      siInvoiceReceiveStatus: 'editable',
      siInvoiceReceiveDate: 'editable',
      product: 'editable',
      declaredQty: 'editable',
      declaredUnitPrice: 'editable',
      batches: 'editable',
      packs: 'editable',
    },
    'price-edit': {
      siInvoiceNo: 'readonly',
      siInvoiceDate: 'readonly',
      siJobTypeId: 'readonly',
      siSourceChannelId: 'readonly',
      siDestinationChannelId: 'readonly',
      siSupplierId: 'readonly',
      siCustomerId: 'readonly',
      siRemarks: 'readonly',
      siInvoiceReceiveStatus: 'readonly',
      siInvoiceReceiveDate: 'readonly',
      product: 'readonly',
      declaredQty: 'readonly',
      declaredUnitPrice: 'editable',  // Only prices editable in price-edit mode
      batches: 'editable',
      packs: 'editable',
    },
    'admin-revert': {
      siInvoiceNo: 'readonly',
      siInvoiceDate: 'readonly',
      siJobTypeId: 'readonly',
      siSourceChannelId: 'readonly',
      siDestinationChannelId: 'readonly',
      siSupplierId: 'readonly',
      siCustomerId: 'readonly',
      siRemarks: 'readonly',
      siInvoiceReceiveStatus: 'readonly',
      siInvoiceReceiveDate: 'readonly',
      product: 'readonly',
      declaredQty: 'readonly',
      declaredUnitPrice: 'readonly',
      batches: 'readonly',
      packs: 'readonly',
    },
  }

export function getFieldRule(mode: StockInEditMode, field: StockInFieldKey): StockInFieldRule {
  return STOCK_IN_FIELD_RULES[mode][field]
}

export function isEditable(mode: StockInEditMode, field: StockInFieldKey): boolean {
  return getFieldRule(mode, field) === 'editable'
}

export function isReadonly(mode: StockInEditMode, field: StockInFieldKey): boolean {
  return getFieldRule(mode, field) === 'readonly'
}
