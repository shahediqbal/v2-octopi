import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SalesOrderListPage } from '@/pages/sales-orders/SalesOrderListPage'

const hookState = vi.hoisted(() => ({
  useStockOutList: vi.fn(),
  useStockOutDetail: vi.fn(),
  usePackagingDetail: vi.fn(),
  useBulkEscalate: vi.fn(),
}))

const modalSpy = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useStockOut', () => ({
  useStockOutList: hookState.useStockOutList,
  useStockOutDetail: hookState.useStockOutDetail,
  usePackagingDetail: hookState.usePackagingDetail,
  useBulkEscalate: hookState.useBulkEscalate,
}))

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}))

vi.mock('@/components/dropdowns', () => ({
  PaginatedCombobox: () => <div>CustomerFilter</div>,
}))

vi.mock('@/pages/sales-orders/SalesOrderInternalModal', () => ({
  SalesOrderInternalModal: (props: { isOpen: boolean; showItemMetadata?: boolean; title?: string; viewVariant?: string }) => {
    modalSpy(props)
    return props.isOpen ? <div>{props.showItemMetadata ? 'ModalMetadataOn' : 'ModalMetadataOff'}</div> : null
  },
}))

vi.mock('@/pages/sales-orders/KarjadeshView', () => ({
  KarjadeshView: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>PackingListModalOpen</div> : null),
}))

vi.mock('@/pages/sales-orders/SalesOrderChalaanModal', () => ({
  SalesOrderChalaanModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>ChalaanModalOpen</div> : null),
}))

vi.mock('@/pages/sales-orders/SalesOrderStickerModal', () => ({
  SalesOrderStickerModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>StickerModalOpen</div> : null),
}))

describe('SalesOrderListPage packaging view metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    hookState.useStockOutList.mockReturnValue({
      data: [
        {
          soSystemId: 101,
          soSystemNo: 'SO-101',
          invoiceDate: '2026-03-20T14:25:00',
          customerName: 'Acme Traders',
          customerAddress: 'House 12, Road 7, Dhaka North',
          jobType: 'Retail',
          currentStatus: 2,
          finalBill: 1250,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    })

    hookState.useStockOutDetail.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    })

    hookState.usePackagingDetail.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    })

    hookState.useBulkEscalate.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })
  })

  it('passes item metadata through the view modal on the packaging list', () => {
    render(
      <MemoryRouter>
        <SalesOrderListPage mode="packaging" />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'View' }))

    expect(screen.getByText('ModalMetadataOn')).toBeTruthy()
    expect(
      modalSpy.mock.calls.some(
        ([props]) => props.isOpen === true && props.showItemMetadata === true,
      ),
    )
      .toBe(true)
  })

  it('shows inline print-surface buttons on the package-done list and hides the final bill column', () => {
    render(
      <MemoryRouter>
        <SalesOrderListPage mode="package-done" />
      </MemoryRouter>,
    )

    const viewButton = screen.getByRole('button', { name: 'View' })
    const printLink = screen.getByRole('link', { name: 'Print' })

    expect(viewButton).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Invoice' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chalaan' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Packing' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sticker' })).toBeTruthy()
    expect(printLink).toBeTruthy()
    expect(screen.queryByRole('columnheader', { name: 'Final Bill' })).toBeNull()
    expect(screen.getByText('2026-03-20')).toBeTruthy()
    expect(screen.queryByText('2026-03-20T14:25:00')).toBeNull()
    expect(screen.getByText('House 12, Road 7, Dhaka North').className).toContain('whitespace-normal')
    expect(viewButton.className).toContain('bg-violet-50')
    expect(printLink.className).toContain('bg-cyan-50')

    fireEvent.click(screen.getByRole('button', { name: 'Invoice' }))

    expect(modalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
        title: 'Invoice / Detail',
        viewVariant: 'packing-print',
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Chalaan' }))
    expect(screen.getByText('ChalaanModalOpen')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Sticker' }))
    expect(screen.getByText('StickerModalOpen')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Packing' }))
    expect(screen.getByText('PackingListModalOpen')).toBeTruthy()
  })
})