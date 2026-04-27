import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hookState = vi.hoisted(() => ({
  useStockOutList: vi.fn(),
  usePackagingDetail: vi.fn(),
  useStockOutDetail: vi.fn(),
}))

vi.mock('@/hooks/useStockOut', () => ({
  useStockOutList: hookState.useStockOutList,
  usePackagingDetail: hookState.usePackagingDetail,
  useStockOutDetail: hookState.useStockOutDetail,
}))

vi.mock('@/components/dropdowns', () => ({
  PaginatedCombobox: () => <div>CustomerFilter</div>,
}))

vi.mock('@/pages/sales-orders/SalesOrderInternalModal', () => ({
  SalesOrderInternalModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>InvoiceModalOpen</div> : null,
}))

vi.mock('@/pages/sales-orders/KarjadeshView', () => ({
  KarjadeshView: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>PackingListModalOpen</div> : null,
}))

vi.mock('@/pages/sales-orders/SalesOrderChalaanModal', () => ({
  SalesOrderChalaanModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>ChalaanModalOpen</div> : null,
}))

vi.mock('@/pages/sales-orders/SalesOrderStickerModal', () => ({
  SalesOrderStickerModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>StickerModalOpen</div> : null,
}))

import { PackingPrintPage } from '@/pages/sales-orders/PackingPrintPage'

const listRows = [
  {
    soSystemId: 101,
    soSystemNo: 'SO-101',
    invoiceDate: '2026-03-20',
    customerName: 'Acme Traders',
    customerAddress: 'Dhaka',
    jobType: 'Retail',
    finalBill: 1250,
  },
]

const packagingDetail = {
  soSystemId: 101,
  soSystemNo: 'SO-101',
  invoiceDate: '2026-03-20',
  customerName: 'Acme Traders',
  jobType: 'Retail',
  stockOutPackagingItems: [
    {
      sopProductId: 1,
      productName: 'Widget A',
      sopProductQty: 12,
      packTypeName: 'Box',
      sopPackSize: 6,
      sopNoPack: 2,
    },
  ],
}

const orderDetail = {
  stockOutGeneralData: {
    soSystemId: 101,
    soSystemNo: 'SO-101',
    customerName: 'Acme Traders',
    customerAddress: 'Dhaka',
    jobTypeName: 'Retail',
    invoiceDate: '2026-03-20',
    soCustomerReferance: 'REF-101',
    soRemarks: 'Handle with care',
    soJobTypeId: 1,
    soOrderFromId: 1,
    soCurrentStatus: 3,
    soCustomerId: 1,
  },
  stockOutItemsData: [],
  stockOutBillData: {
    calculatedBill: 1000,
    billDiscountType: 'F' as const,
    billDiscountRate: 0,
    billDiscountAmount: 0,
    billVatPercantage: 0,
    billAitPercantage: 0,
    billAdjustmentAmount: 0,
    finalBill: 1250,
    sobCurrencyName: 'BDT' as const,
    sobCurrencyConversionRate: 1,
    sobFinalConvertedBill: 1250,
  },
}

function renderPage(initialPath = '/sales-orders/packing-print') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/sales-orders/packing-print" element={<PackingPrintPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PackingPrintPage', () => {
  beforeEach(() => {
    hookState.useStockOutList.mockReturnValue({
      data: listRows,
      isLoading: false,
      isError: false,
      error: null,
    })

    hookState.usePackagingDetail.mockImplementation((id?: number) => ({
      data: id ? packagingDetail : undefined,
      isLoading: false,
      error: null,
    }))

    hookState.useStockOutDetail.mockImplementation((id?: number) => ({
      data: id ? orderDetail : undefined,
      isLoading: false,
      error: null,
    }))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('loads preview details from the orderId query parameter', async () => {
    renderPage('/sales-orders/packing-print?orderId=101')

    expect(await screen.findByText('Packing List Preview Source')).toBeTruthy()
    expect(screen.getAllByText('SO-101').length).toBeGreaterThan(1)
    expect(screen.getAllByText('Acme Traders').length).toBeGreaterThan(1)
    expect(screen.getByText('Widget A')).toBeTruthy()
    expect(hookState.usePackagingDetail).toHaveBeenLastCalledWith(101)
    expect(hookState.useStockOutDetail).toHaveBeenLastCalledWith(101)
  })

  it('opens the requested print modal from row actions', async () => {
    renderPage()

    const row = await screen.findByText('SO-101')
    const rowElement = row.closest('tr')
    expect(rowElement).toBeTruthy()

    fireEvent.click(within(rowElement as HTMLTableRowElement).getByRole('button', { name: 'Invoice' }))

    expect(await screen.findByText('InvoiceModalOpen')).toBeTruthy()
    expect(screen.getByText('Invoice Preview Source')).toBeTruthy()
  })

  it('renders handled error state when the package-done list fails', async () => {
    hookState.useStockOutList.mockReturnValueOnce({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error('API 401: Unauthorized'),
    })

    renderPage()

    expect(await screen.findByText('Failed to load packing print rows')).toBeTruthy()
    expect(screen.getByText('API 401: Unauthorized')).toBeTruthy()
  })
})