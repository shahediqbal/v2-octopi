import { describe, expect, it } from 'vitest'
import { requiresCustomer, requiresSupplier } from '@/features/stock-in/modes'

describe('stock-in mode helpers', () => {
  it('keeps only the legacy supplier order types as supplier flows', () => {
    expect(requiresSupplier('Sample_Receive')).toBe(true)
    expect(requiresSupplier('Regular_Purchase')).toBe(true)
    expect(requiresSupplier('Excess_From_Intact')).toBe(true)
    expect(requiresSupplier('Warehouse_Transfer')).toBe(false)
    expect(requiresSupplier('Sample_Issue')).toBe(false)
    expect(requiresSupplier('Warehouse Transfer')).toBe(false)
    expect(requiresSupplier('Sample Issue')).toBe(false)
  })

  it('keeps the legacy customer order types as customer flows', () => {
    expect(requiresCustomer('Exchange_Inward')).toBe(true)
    expect(requiresCustomer('Sales_Return')).toBe(true)
    expect(requiresCustomer('Loan_Receive')).toBe(true)
    expect(requiresCustomer('Warehouse_Transfer')).toBe(false)
    expect(requiresCustomer('Sample_Issue')).toBe(false)
  })
})