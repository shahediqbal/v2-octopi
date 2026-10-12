import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EscalateOrderPage } from '@/pages/sales-orders/EscalateOrderPage'

const hookState = vi.hoisted(() => ({
  useLatestStockOutBatchMap: vi.fn(),
  useStockOutBatches: vi.fn(),
  useStockOutDetail: vi.fn(),
  useSubmitPackaging: vi.fn(),
}))

vi.mock('@/hooks/useStockOut', () => ({
  useLatestStockOutBatchMap: hookState.useLatestStockOutBatchMap,
  useStockOutBatches: hookState.useStockOutBatches,
  useStockOutDetail: hookState.useStockOutDetail,
  useSubmitPackaging: hookState.useSubmitPackaging,
}))

const submitMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
}

const detailFixture = {
  stockOutGeneralData: {
    soSystemId: 32951,
    soSystemNo: 'SO-32951',
    soJobTypeId: 1,
    soOrderFromId: 1,
    soCurrentStatus: 0,
    soCustomerId: 77,
    customerName: 'Acme Traders',
    customerAddress: 'Dhaka',
    jobTypeName: 'Retail',
    invoiceDate: '2026-05-23',
    soRemarks: 'Needs batch mapping',
  },
  stockOutItemsData: [
    {
      sodProductId: 101,
      sodQty: 3,
      sodBaseUnitPrice: 100,
      sodUnitPrice: 120,
      sodUnitDiscountType: 'F' as const,
      sodUnitDiscountRate: 0,
      sodUnitDiscountAmount: 0,
      sodUnitVatPercantage: 0,
      sodUnitAitPercantage: 0,
      sodFinalCalculatedUnitPrice: 120,
      sodMappedProductId: null,
      sodBatches: [{ batchId: 10, batchNo: 'B-10' }],
      productName: 'Widget',
      itemRemark: '',
    },
  ],
  stockOutBillData: {
    calculatedBill: 360,
    billDiscountType: 'F' as const,
    billDiscountRate: 0,
    billDiscountAmount: 0,
    billVatPercantage: 0,
    billAitPercantage: 0,
    billAdjustmentAmount: 0,
    finalBill: 360,
    sobCurrencyName: 'BDT',
    sobCurrencyConversionRate: 1,
    sobFinalConvertedBill: 360,
  },
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/sales-orders/32951/escalate']}>
      <Routes>
        <Route path="/sales-orders/:id/escalate" element={<EscalateOrderPage />} />
        <Route path="/sales-orders/escalations" element={<div>Escalations List</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EscalateOrderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    submitMutation.mutateAsync.mockResolvedValue({})
    hookState.useLatestStockOutBatchMap.mockReturnValue({ data: undefined, isLoading: false })
    hookState.useStockOutBatches.mockReturnValue({
      data: {
        finalBatch: [
          { id: 10, label: 'B-10' },
          { id: 11, label: 'B-11' },
          { id: 12, label: 'B-12' },
        ],
        finalMappedItem: [],
      },
      isLoading: false,
    })
    hookState.useStockOutDetail.mockReturnValue({
      data: detailFixture,
      isLoading: false,
      isError: false,
      error: null,
    })
    hookState.useSubmitPackaging.mockReturnValue(submitMutation)
  })

  it('submits every selected batch for a single product line', async () => {
    renderPage()

    fireEvent.click(await screen.findByRole('combobox', { name: 'Widget add batch' }))
    fireEvent.click(await screen.findByRole('option', { name: 'B-11' }))

    expect(await screen.findByRole('combobox', { name: 'Widget batch 2' })).toBeTruthy()
    expect(screen.getByText('2 batches selected')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(submitMutation.mutateAsync).toHaveBeenCalledTimes(1))

    expect(submitMutation.mutateAsync.mock.calls[0][0].stockOutItemsData[0].sodBatches).toEqual([
      { batchId: 10, batchNo: 'string' },
      { batchId: 11, batchNo: 'string' },
    ])
  })
})