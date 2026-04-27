import type { EditMode } from '@/types/stockOut'

export type StockOutFieldKey =
  | 'soCustomerId'
  | 'soSupplierId'
  | 'soJobTypeId'
  | 'soOrderFromId'
  | 'invoiceDate'
  | 'soCustomerReferance'
  | 'soRelatedLcId'
  | 'soRemarks'
  | 'soPriceReview'
  | 'billDiscountType'
  | 'billDiscountRate'
  | 'billVatPercantage'
  | 'billAitPercantage'
  | 'billAdjustmentAmount'
  | 'sobCurrencyName'
  | 'sobCurrencyConversionRate'
  | 'product'
  | 'quantity'
  | 'price'
  | 'discount'
  | 'tax'
  | 'packaging'

export type StockOutFieldRule = 'editable' | 'readonly' | 'hidden'

export const STOCK_OUT_FIELD_RULES: Record<EditMode, Record<StockOutFieldKey, StockOutFieldRule>> = {
  standard: {
    soCustomerId: 'editable',
    soSupplierId: 'editable',
    soJobTypeId: 'editable',
    soOrderFromId: 'editable',
    invoiceDate: 'editable',
    soCustomerReferance: 'editable',
    soRelatedLcId: 'editable',
    soRemarks: 'editable',
    soPriceReview: 'editable',
    billDiscountType: 'editable',
    billDiscountRate: 'editable',
    billVatPercantage: 'editable',
    billAitPercantage: 'editable',
    billAdjustmentAmount: 'editable',
    sobCurrencyName: 'editable',
    sobCurrencyConversionRate: 'editable',
    product: 'editable',
    quantity: 'editable',
    price: 'editable',
    discount: 'hidden',
    tax: 'hidden',
    packaging: 'hidden',
  },
  'admin-full': {
    soCustomerId: 'editable',
    soSupplierId: 'editable',
    soJobTypeId: 'editable',
    soOrderFromId: 'editable',
    invoiceDate: 'editable',
    soCustomerReferance: 'editable',
    soRelatedLcId: 'editable',
    soRemarks: 'editable',
    soPriceReview: 'editable',
    billDiscountType: 'editable',
    billDiscountRate: 'editable',
    billVatPercantage: 'editable',
    billAitPercantage: 'editable',
    billAdjustmentAmount: 'editable',
    sobCurrencyName: 'editable',
    sobCurrencyConversionRate: 'editable',
    product: 'editable',
    quantity: 'editable',
    price: 'editable',
    discount: 'editable',
    tax: 'editable',
    packaging: 'hidden',
  },
  'admin-price-edit': {
    soCustomerId: 'readonly',
    soSupplierId: 'readonly',
    soJobTypeId: 'readonly',
    soOrderFromId: 'readonly',
    invoiceDate: 'readonly',
    soCustomerReferance: 'editable',
    soRelatedLcId: 'editable',
    soRemarks: 'editable',
    soPriceReview: 'editable',
    billDiscountType: 'editable',
    billDiscountRate: 'editable',
    billVatPercantage: 'editable',
    billAitPercantage: 'editable',
    billAdjustmentAmount: 'editable',
    sobCurrencyName: 'editable',
    sobCurrencyConversionRate: 'editable',
    product: 'readonly',
    quantity: 'editable',
    price: 'editable',
    discount: 'editable',
    tax: 'editable',
    packaging: 'hidden',
  },
  'admin-invoice-limited': {
    soCustomerId: 'readonly',
    soSupplierId: 'readonly',
    soJobTypeId: 'readonly',
    soOrderFromId: 'readonly',
    invoiceDate: 'readonly',
    soCustomerReferance: 'editable',
    soRelatedLcId: 'readonly',
    soRemarks: 'editable',
    soPriceReview: 'readonly',
    billDiscountType: 'readonly',
    billDiscountRate: 'readonly',
    billVatPercantage: 'readonly',
    billAitPercantage: 'readonly',
    billAdjustmentAmount: 'readonly',
    sobCurrencyName: 'readonly',
    sobCurrencyConversionRate: 'readonly',
    product: 'readonly',
    quantity: 'editable',
    price: 'readonly',
    discount: 'readonly',
    tax: 'readonly',
    packaging: 'hidden',
  },
  'admin-packing-edit': {
    soCustomerId: 'readonly',
    soSupplierId: 'readonly',
    soJobTypeId: 'readonly',
    soOrderFromId: 'readonly',
    invoiceDate: 'readonly',
    soCustomerReferance: 'readonly',
    soRelatedLcId: 'readonly',
    soRemarks: 'readonly',
    soPriceReview: 'readonly',
    billDiscountType: 'hidden',
    billDiscountRate: 'hidden',
    billVatPercantage: 'hidden',
    billAitPercantage: 'hidden',
    billAdjustmentAmount: 'hidden',
    sobCurrencyName: 'hidden',
    sobCurrencyConversionRate: 'hidden',
    product: 'readonly',
    quantity: 'readonly',
    price: 'hidden',
    discount: 'hidden',
    tax: 'hidden',
    packaging: 'editable',
  },
  'packing-edit': {
    soCustomerId: 'readonly',
    soSupplierId: 'readonly',
    soJobTypeId: 'readonly',
    soOrderFromId: 'readonly',
    invoiceDate: 'readonly',
    soCustomerReferance: 'readonly',
    soRelatedLcId: 'readonly',
    soRemarks: 'readonly',
    soPriceReview: 'readonly',
    billDiscountType: 'hidden',
    billDiscountRate: 'hidden',
    billVatPercantage: 'hidden',
    billAitPercantage: 'hidden',
    billAdjustmentAmount: 'hidden',
    sobCurrencyName: 'hidden',
    sobCurrencyConversionRate: 'hidden',
    product: 'readonly',
    quantity: 'readonly',
    price: 'hidden',
    discount: 'hidden',
    tax: 'hidden',
    packaging: 'editable',
  },
}

export function getStockOutFieldRule(mode: EditMode, field: StockOutFieldKey): StockOutFieldRule {
  return STOCK_OUT_FIELD_RULES[mode][field]
}