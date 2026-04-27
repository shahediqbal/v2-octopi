import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { StockInListPage } from '@/pages/stock-in/StockInListPage'

const mockUseStockInList = vi.fn()
const mockUseStockInListLazy = vi.fn()
const mockUseEscalateStockIn = vi.fn()
const mockUseStockInDetail = vi.fn()

vi.mock('@/hooks/useStockIn', () => ({
  useStockInList: (...args: unknown[]) => mockUseStockInList(...args),
  useStockInListLazy: (...args: unknown[]) => mockUseStockInListLazy(...args),
  useEscalateStockIn: (...args: unknown[]) => mockUseEscalateStockIn(...args),
  useStockInDetail: (...args: unknown[]) => mockUseStockInDetail(...args),
}))

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}))

describe('StockInListPage view action', () => {
  beforeEach(() => {
    mockUseStockInList.mockReset()
    mockUseStockInListLazy.mockReset()
    mockUseEscalateStockIn.mockReset()
    mockUseStockInDetail.mockReset()

    mockUseStockInList.mockReturnValue({
      data: [
        {
          siSystemId: 101,
          siSystemNo: 'SI-00101',
          siInvoiceNo: 'INV-101',
          siInvoiceDate: '2026-04-24T00:00:00',
          supplierName: 'Acme Supplier',
          customerName: null,
          sourceChannelName: 'Warehouse A',
          destinationChannelName: 'Warehouse B',
          jobType: 'Regular_Purchase',
          jobTypeName: 'Regular_Purchase',
          sidFinalAmount: 150.5,
          siCurrentStatus: 50,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    mockUseStockInListLazy.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    mockUseEscalateStockIn.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })

    mockUseStockInDetail.mockImplementation((id?: number) => {
      if (!id) {
        return {
          data: undefined,
          isLoading: false,
          isError: false,
          error: null,
        }
      }

      return {
        data: {
          stockInGeneralData: {
            siSystemId: 101,
            siSystemNo: 'SI-00101',
            siInvoiceNo: 'INV-101',
            siInvoiceDate: '2026-04-24T00:00:00',
            siJobTypeId: 2,
            jobTypeName: 'Regular_Purchase',
            siRemarks: 'Loaded from modal view',
            siSourceChannelId: 1,
            siSourceChannelName: 'Warehouse A',
            siDestinationChannelId: 2,
            siDestinationChannelName: 'Warehouse B',
            siSupplierId: 500,
            supplierName: 'Acme Supplier',
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
              sidProductId: 9001,
              productName: 'Vitamin C',
              sidDeclaredQty: 10,
              sidConfirmedQty: 8,
              sidDeclaredUnitPrice: 12.5,
              sidConfirmedUnitPrice: 12,
              sidProductStrength: '500mg',
              sidBatches: [{ batchNo: 'B-500' }],
              sidPacks: [{ packTypeName: 'Carton' }],
              sidMappedProductId: null,
              sidMappedProductName: null,
            },
          ],
          stockInBillData: {
            sibCalculatedAmount: 125,
            sibDiscountAmouunt: 5,
            sibAdjustedAmount: 2,
            sibFinalAmount: 122,
            sibCurrencyName: 'BDT',
          },
        },
        isLoading: false,
        isError: false,
        error: null,
      }
    })
  })

  it('opens the stock-in detail modal from the view action', async () => {
    render(
      <MemoryRouter>
        <StockInListPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /view/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Stock-In Detail' })).toBeTruthy()
    })

    expect(screen.getByText('Loaded from modal view')).toBeTruthy()
    expect(screen.getByText('Vitamin C')).toBeTruthy()
    expect(screen.getByText('B-500')).toBeTruthy()
    expect(screen.getByText('Carton')).toBeTruthy()
  })

  it('shows the full admin-approved list newest-first and filters it with client-side search', async () => {
    mockUseStockInList.mockReturnValue({
      data: [
        {
          siSystemId: 101,
          siSystemNo: 'SI-00101',
          siInvoiceNo: 'INV-101',
          siInvoiceDate: '2026-04-24T00:00:00',
          supplierName: 'Supplier 101',
          customerName: null,
          sourceChannelName: 'Warehouse A',
          destinationChannelName: 'Warehouse B',
          jobType: 'Regular_Purchase',
          jobTypeName: 'Regular_Purchase',
          sidFinalAmount: 150.5,
          siCurrentStatus: 52,
        },
        {
          siSystemId: 103,
          siSystemNo: 'SI-00103',
          siInvoiceNo: 'INV-103',
          siInvoiceDate: '2026-04-26T00:00:00',
          supplierName: 'Supplier 103',
          customerName: null,
          sourceChannelName: 'Warehouse A',
          destinationChannelName: 'Warehouse B',
          jobType: 'Regular_Purchase',
          jobTypeName: 'Regular_Purchase',
          sidFinalAmount: 170.5,
          siCurrentStatus: 52,
        },
        {
          siSystemId: 102,
          siSystemNo: 'SI-00102',
          siInvoiceNo: 'INV-102',
          siInvoiceDate: '2026-04-25T00:00:00',
          supplierName: 'Supplier 102',
          customerName: null,
          sourceChannelName: 'Warehouse A',
          destinationChannelName: 'Warehouse B',
          jobType: 'Regular_Purchase',
          jobTypeName: 'Regular_Purchase',
          sidFinalAmount: 160.5,
          siCurrentStatus: 52,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(
      <MemoryRouter>
        <StockInListPage mode="admin-approved" />
      </MemoryRouter>,
    )

    expect(mockUseStockInList).toHaveBeenCalledWith('admin-approved')
    expect(mockUseStockInListLazy).not.toHaveBeenCalled()
    expect(screen.getAllByText(/SI-0010[1-3]/).map((node) => node.textContent)).toEqual([
      'SI-00103',
      'SI-00102',
      'SI-00101',
    ])

    fireEvent.change(screen.getByPlaceholderText('Search by SI no., invoice, supplier, customer…'), {
      target: { value: 'SI-00102' },
    })

    await waitFor(() => {
      expect(screen.getByText('SI-00102')).toBeTruthy()
    })

    expect(screen.queryByText('SI-00103')).toBeNull()
    expect(screen.queryByText('SI-00101')).toBeNull()
  })
})