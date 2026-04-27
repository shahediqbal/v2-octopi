import { describe, expect, it } from 'vitest'
import { getStockOutFieldRule, STOCK_OUT_FIELD_RULES } from '@/features/stock-out/fieldRules'

describe('stock-out field rules', () => {
  it('keeps standard mode fully editable except packaging', () => {
    expect(getStockOutFieldRule('standard', 'soCustomerId')).toBe('editable')
    expect(getStockOutFieldRule('standard', 'product')).toBe('editable')
    expect(getStockOutFieldRule('standard', 'price')).toBe('editable')
    expect(getStockOutFieldRule('standard', 'packaging')).toBe('hidden')
  })

  it('locks invoice-limited mode to quantity and reference-level changes', () => {
    expect(getStockOutFieldRule('admin-invoice-limited', 'soCustomerReferance')).toBe('editable')
    expect(getStockOutFieldRule('admin-invoice-limited', 'quantity')).toBe('editable')
    expect(getStockOutFieldRule('admin-invoice-limited', 'price')).toBe('readonly')
    expect(getStockOutFieldRule('admin-invoice-limited', 'billDiscountRate')).toBe('readonly')
    expect(getStockOutFieldRule('admin-invoice-limited', 'product')).toBe('readonly')
  })

  it('exposes only packaging controls in packing edit modes', () => {
    expect(getStockOutFieldRule('packing-edit', 'packaging')).toBe('editable')
    expect(getStockOutFieldRule('packing-edit', 'quantity')).toBe('readonly')
    expect(getStockOutFieldRule('packing-edit', 'price')).toBe('hidden')
    expect(getStockOutFieldRule('admin-packing-edit', 'billVatPercantage')).toBe('hidden')
    expect(getStockOutFieldRule('admin-packing-edit', 'soRemarks')).toBe('readonly')
  })

  it('defines a rule for every field in every mode', () => {
    const expectedFields = Object.keys(STOCK_OUT_FIELD_RULES.standard).sort()

    Object.values(STOCK_OUT_FIELD_RULES).forEach((rules) => {
      expect(Object.keys(rules).sort()).toEqual(expectedFields)
    })
  })
})