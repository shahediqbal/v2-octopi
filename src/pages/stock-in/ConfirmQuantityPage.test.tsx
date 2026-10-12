import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfirmQuantityPage } from '@/pages/stock-in/ConfirmQuantityPage'

const mockUseStockInDetail = vi.fn()
const mockUseStockInChallan = vi.fn()
const mockUseConfirmStockInQty = vi.fn()

vi.mock('@/hooks/useStockIn', () => ({
  useStockInDetail: (...args: unknown[]) => mockUseStockInDetail(...args),
  useStockInChallan: (...args: unknown[]) => mockUseStockInChallan(...args),
  useConfirmStockInQty: (...args: unknown[]) => mockUseConfirmStockInQty(...args),
}))

describe('ConfirmQuantityPage summary', () => {
  beforeEach(() => {
    mockUseStockInDetail.mockReset()
    mockUseStockInChallan.mockReset()
    mockUseConfirmStockInQty.mockReset()

    mockUseStockInDetail.mockReturnValue({
      data: {
        stockInGeneralData: {
          siSystemId: 8524,
          siSystemNo: 'SI-08524',
          siInvoiceNo: 'INV-8524',
          siInvoiceDate: '2026-04-24T00:00:00',
          siJobTypeId: 2,
          jobTypeName: 'Regular_Purchase',
          siRemarks: 'Ready for confirmation',
          siSourceChannelId: 1,
          siSourceChannelName: 'Factory',
          siDestinationChannelId: 2,
          siDestinationChannelName: 'Warehouse',
          siSupplierId: 200,
          supplierName: 'ACME Pharma',
          supplierAddress: null,
          siCustomerId: null,
          customerName: null,
          customerAddress: null,
          siInvoiceReceiveStatus: true,
          siInvoiceReceiveDate: '2026-04-25T00:00:00',
        },
        stockInItemsData: [
          {
            sidId: 1,
            sidProductId: 1001,
            productName: 'Raw Material A',
            sidDeclaredQty: 123,
            sidConfirmedQty: 123,
            sidDeclaredUnitPrice: 111,
            sidConfirmedUnitPrice: 111,
            sidProductStrength: null,
            sidBatches: [],
            sidPacks: [],
            sidMappedProductId: null,
            sidMappedProductName: null,
          },
        ],
        stockInBillData: {
          sibCalculatedAmount: 13653,
          sibDiscountAmouunt: 0,
          sibAdjustedAmount: 0,
          sibFinalAmount: 13653,
          sibCurrencyName: 'BDT',
        },
      },
      isLoading: false,
      error: null,
    })

    mockUseStockInChallan.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })

    mockUseConfirmStockInQty.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })
  })

  it('renders legacy summary values and updates total confirmed when qty changes', async () => {
    render(
      <MemoryRouter initialEntries={['/stock-in/8524/confirm-qty']}>
        <Routes>
          <Route path="/stock-in/:id/confirm-qty" element={<ConfirmQuantityPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Subtotal:')).toBeTruthy()
    expect(screen.getAllByText('TK13653.00').length).toBe(2)
    expect(screen.getByText('Discount:')).toBeTruthy()
    expect(screen.getAllByText('TK0.00').length).toBe(2)
    expect(screen.getByText('Adjustment amount:')).toBeTruthy()
    expect(screen.getByText('Total:')).toBeTruthy()
    expect(screen.getByText('Total Decleared:')).toBeTruthy()
    expect(screen.getAllByText('123 Kg').length).toBe(2)
    expect(screen.getByText('Total Confirmed:')).toBeTruthy()
    expect(
      screen.getByRole('columnheader', { name: 'Declared Price' }).compareDocumentPosition(
        screen.getByRole('columnheader', { name: 'Confirmed Price *' }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      screen.getByRole('columnheader', { name: 'Confirmed Price *' }).compareDocumentPosition(
        screen.getByRole('columnheader', { name: 'Declared Qty' }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.getByDisplayValue('111.0000')).toBeTruthy()

    fireEvent.change(screen.getAllByRole('spinbutton')[0], {
      target: { value: '120' },
    })

    await waitFor(() => {
      expect(screen.getByText('120 Kg')).toBeTruthy()
    })
  })

  it('keeps the hook order stable when the first render loads and the second render has data', async () => {
    const loadedResponse = mockUseStockInDetail()
    const detailState = {
      data: undefined,
      isLoading: true,
      error: null,
    }

    mockUseStockInDetail.mockImplementation(() => detailState)

    const renderPage = () => (
      <MemoryRouter initialEntries={['/stock-in/8524/confirm-qty']}>
        <Routes>
          <Route path="/stock-in/:id/confirm-qty" element={<ConfirmQuantityPage />} />
        </Routes>
      </MemoryRouter>
    )

    const { rerender } = render(renderPage())

    detailState.data = loadedResponse.data
    detailState.isLoading = false

    rerender(renderPage())

    await waitFor(() => {
      expect(screen.getByText('Total Confirmed:')).toBeTruthy()
    })
  })

  it('surfaces a validation banner when malformed invoice data blocks submission before the request is sent', async () => {
    const mutateAsync = vi.fn()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockUseStockInDetail.mockReturnValue({
      data: {
        stockInGeneralData: {
          siSystemId: 9078,
          siSystemNo: 'SI-09078',
          siInvoiceNo: 'INV-9078',
          siInvoiceDate: '2026-06-03T00:00:00',
          siJobTypeId: 2,
          jobTypeName: 'Regular_Purchase',
          siRemarks: 'Malformed confirmed price for regression coverage',
          siSourceChannelId: 1,
          siSourceChannelName: 'Factory',
          siDestinationChannelId: 2,
          siDestinationChannelName: 'Warehouse',
          siSupplierId: 200,
          supplierName: 'ACME Pharma',
          supplierAddress: null,
          siCustomerId: null,
          customerName: null,
          customerAddress: null,
          siInvoiceReceiveStatus: true,
          siInvoiceReceiveDate: '2026-06-03T00:00:00',
        },
        stockInItemsData: [
          {
            sidId: 1,
            sidProductId: 1001,
            productName: 'Raw Material A',
            sidDeclaredQty: 123,
            sidConfirmedQty: 123,
            sidDeclaredUnitPrice: 111,
            sidConfirmedUnitPrice: Number.NaN,
            sidProductStrength: null,
            sidBatches: [],
            sidPacks: [],
            sidMappedProductId: null,
            sidMappedProductName: null,
          },
        ],
        stockInBillData: {
          sibCalculatedAmount: 13653,
          sibDiscountAmouunt: 0,
          sibAdjustedAmount: 0,
          sibFinalAmount: 13653,
          sibCurrencyName: 'BDT',
        },
      },
      isLoading: false,
      error: null,
    })

    mockUseConfirmStockInQty.mockReturnValue({
      mutateAsync,
      isPending: false,
    })

    render(
      <MemoryRouter initialEntries={['/stock-in/9078/confirm-qty']}>
        <Routes>
          <Route path="/stock-in/:id/confirm-qty" element={<ConfirmQuantityPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Received Quantities' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy()
      expect(screen.getByText(/Submission blocked by validation/i)).toBeTruthy()
      expect(screen.getByText(/Row 1 confirmed price/i)).toBeTruthy()
    })

    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(mutateAsync).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})