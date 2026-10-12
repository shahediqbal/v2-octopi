import { describe, expect, it } from 'vitest'
import { buildStockInInvoiceListUrl } from '@/hooks/useStockIn'

describe('buildStockInInvoiceListUrl', () => {
  it('keeps the legacy supplier and customer path when optional filters are absent', () => {
    expect(buildStockInInvoiceListUrl({ supplierId: 5, customerId: 0 })).toBe(
      '/StockIn/GetStockInInvoiceList/5/0',
    )
  })

  it('appends date range filters when they are provided', () => {
    expect(
      buildStockInInvoiceListUrl({
        supplierId: 5,
        customerId: 0,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }),
    ).toBe('/StockIn/GetStockInInvoiceList/5/0?startDate=2024-01-01&endDate=2024-12-31')
  })

  it('appends a job type filter on its own', () => {
    expect(
      buildStockInInvoiceListUrl({
        supplierId: 5,
        customerId: 0,
        jobTypeId: 1,
      }),
    ).toBe('/StockIn/GetStockInInvoiceList/5/0?jobTypeId=1')
  })

  it('appends date and job type filters together', () => {
    expect(
      buildStockInInvoiceListUrl({
        supplierId: 5,
        customerId: 0,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        jobTypeId: 2,
      }),
    ).toBe(
      '/StockIn/GetStockInInvoiceList/5/0?startDate=2024-01-01&endDate=2024-12-31&jobTypeId=2',
    )
  })

  it('omits blank and zero-valued optional filters', () => {
    expect(
      buildStockInInvoiceListUrl({
        supplierId: 0,
        customerId: 0,
        startDate: '',
        endDate: '',
        jobTypeId: 0,
      }),
    ).toBe('/StockIn/GetStockInInvoiceList/0/0')
  })
})