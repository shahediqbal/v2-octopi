import { describe, expect, it } from 'vitest'
import {
  extractApiErrorMessage,
  extractApiResponseErrorMessage,
  getSerializedBatchValue,
  mapDetailToEscalationDefaults,
  mapDetailToFormValues,
  mapEscalationValuesToPayload,
  mapFormValuesToMutationPayload,
  mapOrderDetailToPackagingRows,
  mapPackagingDetailToRows,
  mapPackagingRowsToPayload,
  parseSerializedBatchValue,
} from '@/pages/sales-orders/stockOutMappers'
import type {
  StockOutFormValues,
  EscalateStockOutFormValues,
} from '@/schemas/stockOutSchema'
import type { StockOutOrderDetail, StockOutPackagingDetail } from '@/types/stockOut'

const detailFixture: StockOutOrderDetail = {
  stockOutGeneralData: {
    soSystemId: 77,
    soJobTypeId: 3,
    soOrderFromId: 4,
    soCurrentStatus: 1,
    soCustomerId: 10,
    soSupplierId: 20,
    soDestinationChannelId: 2,
    soCompanyId: 2,
    soPriceReview: 1,
    soRemarks: 'Handle with care',
    soCustomerReferance: 'REF-22',
    soRelatedLcId: 'LC-9',
    customerName: 'Acme Retail',
    invoiceDate: '2026-03-10T00:00:00.000Z',
    dateOfIssue: '2026-03-10T00:00:00.000Z',
  },
  stockOutItemsData: [
    {
      sodProductId: 101,
      sodQty: 3,
      sodConfirmedQty: 2,
      sodBaseUnitPrice: 100,
      sodUnitPrice: 100,
      sodUnitDiscountType: 'P',
      sodUnitDiscountRate: 10,
      sodUnitDiscountAmount: 30,
      sodUnitVatPercantage: 5,
      sodUnitAitPercantage: 1,
      sodFinalCalculatedUnitPrice: 286.2,
      sodMappedProductId: 1001,
      sodBatches: [{ batchId: 501, batchNo: 'B-501' }],
      itemRemark: 'Fragile',
      productName: 'Widget',
      mappedProductName: 'Mapped Widget',
    },
    {
      sodProductId: 202,
      sodQty: 1,
      sodConfirmedQty: 1,
      sodBaseUnitPrice: 50,
      sodUnitPrice: 50,
      sodUnitDiscountType: 'F',
      sodUnitDiscountRate: 5,
      sodUnitDiscountAmount: 5,
      sodUnitVatPercantage: 0,
      sodUnitAitPercantage: 0,
      sodFinalCalculatedUnitPrice: 45,
      sodMappedProductId: null,
      sodBatches: 'LooseBatch',
      itemRemark: '',
      productName: 'Cable',
    },
  ],
  stockOutBillData: {
    calculatedBill: 331.2,
    billDiscountType: 'P',
    billDiscountRate: 5,
    billDiscountAmount: 16.56,
    billVatPercantage: 2,
    billAitPercantage: 1,
    billAdjustmentAmount: 10,
    finalBill: 334.6416,
    sobCurrencyName: 'USD',
    sobCurrencyConversionRate: 110,
    sobFinalConvertedBill: 36810.576,
  },
}

const packagingFixture: StockOutPackagingDetail = {
  soSystemId: 77,
  soSystemNo: 'SO-77',
  customerName: 'Acme Retail',
  stockOutPackagingItems: [
    {
      soSystemId: 77,
      sodProductId: 101,
      sopProductId: 101,
      productName: 'Widget',
      sodConfirmedQty: 2,
      sopPackId: 31,
      packTypeName: 'Carton',
      sopProductQty: 2,
      sopPackSize: 1,
      sopNoPack: 2,
    },
  ],
}

describe('stock-out mappers', () => {
  it('extracts API error messages with the correct precedence', () => {
    expect(extractApiErrorMessage({ body: { errMsg: 'Server said no', message: 'Ignored' } })).toBe('Server said no')
    expect(
      extractApiErrorMessage({
        body: {
          title: 'One or more validation errors occurred.',
          errors: { invoiceDate: ['Invoice date is required'] },
        },
      }),
    ).toBe('Invoice date is required')
    expect(extractApiErrorMessage({ body: { message: 'Fallback body message' } })).toBe('Fallback body message')
    expect(extractApiErrorMessage(new Error('Native error'))).toBe('Native error')
    expect(extractApiErrorMessage(null)).toBe('Something went wrong')
  })

  it('extracts stock-out mutation response errors from validation-style bodies', () => {
    expect(extractApiResponseErrorMessage({ errMsg: 'Server said no' })).toBe('Server said no')
    expect(
      extractApiResponseErrorMessage({
        title: 'One or more validation errors occurred.',
        errors: { stockOutItemsData: ['Add at least one item'] },
      }),
    ).toBe('Add at least one item')
    expect(extractApiResponseErrorMessage({ title: 'One or more validation errors occurred.' })).toBe(
      'One or more validation errors occurred.',
    )
    expect(extractApiResponseErrorMessage({ title: 'Saved successfully' })).toBeNull()
  })

  it('maps detail data into form defaults', () => {
    const formValues = mapDetailToFormValues(detailFixture)

    expect(formValues).toMatchObject({
      soCustomerId: 10,
      soSupplierId: 20,
      soJobTypeId: 3,
      soOrderFromId: 4,
      invoiceDate: '2026-03-10',
      soCustomerReferance: 'REF-22',
      soRelatedLcId: 'LC-9',
      soRemarks: 'Handle with care',
      soPriceReview: true,
      billDiscountType: 'P',
      billDiscountRate: 5,
      sobCurrencyName: 'USD',
      sobCurrencyConversionRate: 110,
    })
    expect(formValues.items).toEqual([
      {
        productId: 101,
        productLabel: 'Widget',
        quantity: 3,
        unitPrice: 100,
        vatRate: 5,
        aitRate: 1,
        discountRate: 10,
        discountType: 'P',
        itemRemark: 'Fragile',
      },
      {
        productId: 202,
        productLabel: 'Cable',
        quantity: 1,
        unitPrice: 50,
        vatRate: 0,
        aitRate: 0,
        discountRate: 5,
        discountType: 'F',
        itemRemark: '',
      },
    ])
  })

  it('maps form values back into mutation payloads with recalculated totals', () => {
    const values: StockOutFormValues = {
      soCustomerId: 10,
      soSupplierId: 20,
      soJobTypeId: 3,
      soOrderFromId: 4,
      invoiceDate: '2026-03-11',
      soCustomerReferance: 'REF-UPDATED',
      soRelatedLcId: 'LC-10',
      soRemarks: 'Updated remarks',
      soPriceReview: false,
      billDiscountType: 'P',
      billDiscountRate: 5,
      billVatPercantage: 2,
      billAitPercantage: 1,
      billAdjustmentAmount: 10,
      sobCurrencyName: 'USD',
      sobCurrencyConversionRate: 110,
      items: [
        {
          productId: 101,
          productLabel: 'Widget Prime',
          quantity: 2,
          unitPrice: 120,
          vatRate: 5,
          aitRate: 1,
          discountRate: 10,
          discountType: 'P',
          itemRemark: 'Updated row',
        },
      ],
    }

    const payload = mapFormValuesToMutationPayload(values, detailFixture)

    expect(payload.stockOutGeneralData.soSystemId).toBe(77)
    expect(payload.stockOutGeneralData.soCurrentStatus).toBe(1)
    expect(payload.stockOutGeneralData.soPriceReview).toBe(0)
    expect(payload.stockOutGeneralData.invoiceDate).toBe('2026-03-11')
    expect(payload.stockOutItemsData).toHaveLength(1)
    expect(payload.stockOutItemsData[0]).toMatchObject({
      sodProductId: 101,
      sodQty: 2,
      sodUnitPrice: 120,
      sodUnitDiscountAmount: 24,
      sodFinalCalculatedUnitPrice: 228.96,
      productName: 'Widget Prime',
      itemRemark: 'Updated row',
    })
    expect(payload.stockOutBillData).toMatchObject({
      calculatedBill: 228.96,
      billDiscountAmount: 11.7914,
      finalBill: 214.0374,
      sobFinalConvertedBill: 23544.114,
    })
  })

  it('preserves legacy collapsed unit-price logic for standard mode payloads', () => {
    const values: StockOutFormValues = {
      soCustomerId: 10,
      soSupplierId: null,
      soJobTypeId: 3,
      soOrderFromId: 4,
      invoiceDate: '2026-03-11',
      soCustomerReferance: 'REF-LEGACY',
      soRelatedLcId: '',
      soRemarks: 'Legacy standard create',
      soPriceReview: false,
      billDiscountType: 'F',
      billDiscountRate: 0,
      billVatPercantage: 0,
      billAitPercantage: 0,
      billAdjustmentAmount: -5,
      sobCurrencyName: 'BDT',
      sobCurrencyConversionRate: 1,
      items: [
        {
          productId: 101,
          productLabel: 'Widget',
          quantity: 2,
          unitPrice: 96.3,
          baseUnitPrice: 100,
          vatRate: 5,
          aitRate: 2,
          discountRate: 10,
          discountType: 'P',
          itemRemark: '',
        },
      ],
    }

    const payload = mapFormValuesToMutationPayload(values, undefined, {
      mode: 'standard',
      useLegacyStandardPricing: true,
    })

    expect(payload.stockOutItemsData[0]).toMatchObject({
      sodBaseUnitPrice: 100,
      sodUnitPrice: 96.3,
      sodUnitDiscountAmount: 0,
      sodFinalCalculatedUnitPrice: 192.6,
    })
    expect(payload.stockOutBillData).toMatchObject({
      calculatedBill: 192.6,
      billAdjustmentAmount: -5,
      finalBill: 197.6,
      sobFinalConvertedBill: 197.6,
    })
  })

  it('serializes escalation defaults and maps escalation submissions back to payloads', () => {
    const escalationDefaults = mapDetailToEscalationDefaults(detailFixture)

    expect(escalationDefaults).toEqual({
      soSystemId: 77,
      items: [
        {
          sodProductId: 101,
          productName: 'Widget',
          quantity: 3,
          sodMappedProductId: 1001,
          sodBatchValue: JSON.stringify({ id: 501, label: 'B-501' }),
        },
        {
          sodProductId: 202,
          productName: 'Cable',
          quantity: 1,
          sodMappedProductId: null,
          sodBatchValue: JSON.stringify({ id: 0, label: 'LooseBatch' }),
        },
      ],
    })

    const escalationValues: EscalateStockOutFormValues = {
      soSystemId: 77,
      items: [
        {
          sodProductId: 101,
          productName: 'Widget',
          quantity: 3,
          sodMappedProductId: 1002,
          sodBatchValue: JSON.stringify({ id: 700, label: 'B-700' }),
        },
        {
          sodProductId: 202,
          productName: 'Cable',
          quantity: 1,
          sodMappedProductId: 2002,
          sodBatchValue: 'manual-batch',
        },
      ],
    }

    const payload = mapEscalationValuesToPayload(detailFixture, escalationValues)

    expect(payload.stockOutItemsData[0]).toMatchObject({
      sodMappedProductId: 1002,
      sodBatches: [{ batchId: 700, batchNo: 'B-700' }],
    })
    expect(payload.stockOutItemsData[1]).toMatchObject({
      sodMappedProductId: 2002,
      sodBatches: [{ batchId: null, batchNo: 'manual-batch' }],
    })
  })

  it('maps packaging rows in both directions and parses serialized batch values', () => {
    expect(getSerializedBatchValue([{ batchId: 9, batchNo: 'B-9' }])).toBe(JSON.stringify({ id: 9, label: 'B-9' }))
    expect(parseSerializedBatchValue(JSON.stringify({ id: 9, label: 'B-9' }))).toEqual({ batchId: 9, batchNo: 'B-9' })
    expect(parseSerializedBatchValue('manual-batch')).toEqual({ batchId: null, batchNo: 'manual-batch' })

    expect(mapOrderDetailToPackagingRows(detailFixture)).toEqual([
      {
        rowId: '101-0',
        productId: 101,
        productName: 'Widget',
        quantity: 3,
        packSize: '',
        packNo: '',
        packQuantity: '',
        sopPackId: '',
        packLabel: '',
      },
      {
        rowId: '202-1',
        productId: 202,
        productName: 'Cable',
        quantity: 1,
        packSize: '',
        packNo: '',
        packQuantity: '',
        sopPackId: '',
        packLabel: '',
      },
    ])

    expect(mapPackagingDetailToRows(packagingFixture)).toEqual([
      {
        rowId: '101-0',
        productId: 101,
        productName: 'Widget',
        quantity: 2,
        packSize: '1',
        packNo: '2',
        packQuantity: '2',
        sopPackId: '31',
        packLabel: 'Carton',
        delete: 1,
      },
    ])

    expect(
      mapPackagingRowsToPayload(77, [
        {
          rowId: '101-0',
          productId: 101,
          productName: 'Widget',
          quantity: 2,
          packSize: '1',
          packNo: '2',
          packQuantity: '2',
          sopPackId: '31',
          packLabel: 'Carton',
        },
      ]),
    ).toEqual([
      {
        soSystemId: 77,
        sopProductId: 101,
        sopPackId: 31,
        packInfo: 'Carton',
        sopProductQty: 2,
        sopPackSize: 1,
        sopNoPack: 2,
      },
    ])
  })
})