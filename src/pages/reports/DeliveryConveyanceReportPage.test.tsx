import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hookState = vi.hoisted(() => ({
  useDeliveryConveyance: vi.fn(),
}))

const exportState = vi.hoisted(() => ({
  exportExcelOnDemand: vi.fn(),
  exportDeliveryConveyancePdf: vi.fn(),
  triggerPrintWindow: vi.fn(),
}))

vi.mock('@/hooks/useDeliveryConveyance', () => ({
  useDeliveryConveyance: hookState.useDeliveryConveyance,
}))

vi.mock('@/components/dropdowns', () => ({
  PaginatedCombobox: ({ onValueChange, onLabelChange }: { onValueChange: (value: number | null) => void; onLabelChange?: (label: string | null) => void }) => (
    <button
      type="button"
      onClick={() => {
        onValueChange(9)
        onLabelChange?.('Md. Sobuj')
      }}
    >
      Pick Employee
    </button>
  ),
}))

vi.mock('@/utils/lazyExportExcel', () => ({
  exportExcelOnDemand: exportState.exportExcelOnDemand,
}))

vi.mock('@/utils/exportDeliveryConveyancePdf', () => ({
  exportDeliveryConveyancePdf: exportState.exportDeliveryConveyancePdf,
}))

vi.mock('@/pages/sales-orders/printUtils', () => ({
  triggerPrintWindow: exportState.triggerPrintWindow,
  formatPrintAmount: (value: number | string | null | undefined) => Number(value ?? 0).toFixed(2),
}))

import { DeliveryConveyanceReportPage } from '@/pages/reports/DeliveryConveyanceReportPage'

describe('DeliveryConveyanceReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens a legacy-style preview modal from the PDF button and supports print and download actions', async () => {
    hookState.useDeliveryConveyance.mockReturnValue({
      data: [
        {
          taskId: 101,
          taskName: 'Delivery Run',
          taskDescription: 'Urgent fabric drop',
          taskDestination: 'Abir Fashion',
          vehicleName: 'Truck 7',
          taskTransportationCost: 550,
          startLocation: 'Gazipur',
          endLocation: 'Uttara',
          employeeId: 9,
          employeeName: 'Md. Sobuj',
          billBy: 'Md. Sobuj',
          invoiceNo: 'INV-77',
          soSystemNo: 'INV-77',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<DeliveryConveyanceReportPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Load Data' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'PDF' })).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: 'PDF' }))

    expect(screen.getByText('Bill By: Md. Sobuj')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Print This Out' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Print This Out' }))
    expect(exportState.triggerPrintWindow).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }))

    await waitFor(() => {
      expect(exportState.exportDeliveryConveyancePdf).toHaveBeenCalledTimes(1)
    })

    expect(exportState.exportDeliveryConveyancePdf).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          taskDescription: 'Urgent fabric drop',
          soSystemNo: 'INV-77',
        }),
      ]),
      expect.objectContaining({
        employeeLabel: null,
        startDate: expect.any(String),
        endDate: expect.any(String),
      }),
    )
    expect(exportState.exportExcelOnDemand).not.toHaveBeenCalled()
  })

  it('keeps the last loaded report active until refresh applies the new filters', async () => {
    hookState.useDeliveryConveyance.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(<DeliveryConveyanceReportPage />)
    const dateInputs = container.querySelectorAll('input[type="date"]')
    const initialFrom = (dateInputs[0] as HTMLInputElement).value
    const initialTo = (dateInputs[1] as HTMLInputElement).value

    expect(hookState.useDeliveryConveyance).toHaveBeenLastCalledWith(
      { startDate: initialFrom, endDate: initialTo, employeeId: 0 },
      false,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Load Data' }))

    await waitFor(() => {
      expect(hookState.useDeliveryConveyance).toHaveBeenLastCalledWith(
        { startDate: initialFrom, endDate: initialTo, employeeId: 0 },
        true,
      )
    })

    fireEvent.change(dateInputs[0], { target: { value: '2026-05-05' } })
    fireEvent.click(screen.getByText('Pick Employee'))

    expect(hookState.useDeliveryConveyance).toHaveBeenLastCalledWith(
      { startDate: initialFrom, endDate: initialTo, employeeId: 0 },
      true,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    await waitFor(() => {
      expect(hookState.useDeliveryConveyance).toHaveBeenLastCalledWith(
        { startDate: '2026-05-05', endDate: initialTo, employeeId: 9 },
        true,
      )
    })
  })

  it('exports all-employee identity and insert time using API field names', async () => {
    hookState.useDeliveryConveyance.mockReturnValue({
      data: [{
        taskId: 102,
        taskName: 'Delivery Run',
        taskDescription: null,
        taskDestination: 'Dhaka',
        vehicleName: 'Bike',
        taskTransportationCost: 100,
        startLocation: null,
        endLocation: null,
        taskAssignedTo: 9,
        billBy: 'Md. Sobuj',
        employeeId: null,
        employeeName: null,
        insertedAt: '2026-05-03T15:11:04.27',
        invoiceNo: null,
      }],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<DeliveryConveyanceReportPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Load Data' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Excel' }))

    await waitFor(() => expect(exportState.exportExcelOnDemand).toHaveBeenCalledTimes(1))
    expect(exportState.exportExcelOnDemand).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([expect.objectContaining({
        employeeId: 9,
        employeeName: 'Md. Sobuj',
        insertedAt: expect.stringContaining('03/05/2026'),
      })]),
    }))
  })
})
