import { describe, expect, it } from 'vitest'
import {
  DISCOUNT_TYPE_FIXED,
  DISCOUNT_TYPE_PERCENTAGE,
  calculateCompleteBill,
  calculateFinalTotal,
  calculateProductLineTotal,
  recalculateItemOnEdit,
  validateFinancialInputs,
  validateSellingPrice,
} from '@/features/stock-out/calculations'

describe('stock-out calculations', () => {
  it('calculates product line totals with percentage discount and tax', () => {
    const result = calculateProductLineTotal({
      unitPrice: 100,
      quantity: 2,
      discount: 10,
      discountType: DISCOUNT_TYPE_PERCENTAGE,
      vatRate: 5,
      aitRate: 2,
    })

    expect(result).toEqual({
      baseAmount: '200.0000',
      discountAmount: '20.0000',
      vatAmount: '9.0000',
      aitAmount: '3.6000',
      lineTotal: '192.6000',
      vatAitTotal: '12.6000',
    })
  })

  it('calculates final totals with fixed discount and adjustment', () => {
    const result = calculateFinalTotal({
      subtotal: 500,
      discount: 25,
      discountType: DISCOUNT_TYPE_FIXED,
      vatRate: 10,
      aitRate: 5,
      adjustmentAmount: 15,
    })

    expect(result.finalTotal).toBe('535.0000')
    expect(result.newTotal).toBe('575.0000')
    expect(result.discountAmount).toBe('25.0000')
    expect(result.adjustmentAmount).toBe('15.0000')
  })

  it('aggregates a complete bill and converted total', () => {
    const result = calculateCompleteBill({
      items: [{ lineTotal: 100 }, { lineTotal: 50.5 }],
      discount: 10,
      discountType: DISCOUNT_TYPE_PERCENTAGE,
      vatRate: 5,
      aitRate: 0,
      adjustmentAmount: 5,
      conversionRate: 1.5,
    })

    expect(result.itemCount).toBe(2)
    expect(result.finalTotal).toBe('137.2225')
    expect(result.convertedTotal).toBe('205.8338')
    expect(result.currencyConversionRate).toBe(1.5)
  })

  it('recalculates a row when quantity changes', () => {
    const result = recalculateItemOnEdit({
      item: {
        quantity: 2,
        unitPrice: 50,
        discountRate: 10,
        discountType: DISCOUNT_TYPE_PERCENTAGE,
        vat: 5,
        ait: 0,
        lineTotal: '0.0000',
        discountAmmount: '0.0000',
      },
      fieldName: 'quantity',
      newValue: 3,
    })

    expect(result.discountAmmount).toBe('15.0000')
    expect(result.lineTotal).toBe('141.7500')
  })

  it('validates selling price and financial input constraints', () => {
    expect(validateSellingPrice(90, 100)).toEqual({
      isValid: false,
      message: 'Selling price (90) is below purchase price (100)',
    })

    expect(validateFinancialInputs({ quantity: 0, unitPrice: -1, discount: -5, vatRate: -1, aitRate: -2 })).toEqual({
      isValid: false,
      errors: [
        'Quantity must be greater than 0',
        'Unit price cannot be negative',
        'Discount cannot be negative',
        'VAT rate cannot be negative',
        'AIT rate cannot be negative',
      ],
    })
  })
})