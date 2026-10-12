import { beforeEach, describe, expect, it, vi } from 'vitest'

const pdfState = vi.hoisted(() => ({
  autoTableMock: vi.fn(),
  saveMock: vi.fn(),
  textMock: vi.fn(),
}))

vi.mock('jspdf', () => ({
  jsPDF: class JsPdfMock {
    internal = {
      pageSize: {
        getWidth: () => 595.28,
        getHeight: () => 841.89,
      },
    }

    addImage = vi.fn()
    addPage = vi.fn()
    rect = vi.fn()
    roundedRect = vi.fn()
    save = pdfState.saveMock
    setDrawColor = vi.fn()
    setFillColor = vi.fn()
    setFont = vi.fn()
    setFontSize = vi.fn()
    setTextColor = vi.fn()
    splitTextToSize = vi.fn((value: string) => [value])
    text = pdfState.textMock
  },
}))

vi.mock('jspdf-autotable', () => ({
  default: pdfState.autoTableMock,
}))

import { exportDeliveryConveyancePdf } from '@/utils/exportDeliveryConveyancePdf'

describe('exportDeliveryConveyancePdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pdfState.autoTableMock.mockImplementation((doc: { lastAutoTable?: { finalY: number } }) => {
      doc.lastAutoTable = { finalY: 260 }
    })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('skip images')))
  })

  it('builds the legacy conveyance bill table with the added Description column', async () => {
    await exportDeliveryConveyancePdf(
      [
        {
          taskId: 101,
          taskName: 'Delivery Run',
          taskDescription: 'Urgent fabric drop',
          taskDestination: 'Abir Fashion',
          vehicleName: 'Truck 7',
          taskTransportationCost: 550,
          startLocation: null,
          endLocation: null,
          taskTransportationStartLocation: 'Gazipur',
          taskTransportationEndLocation: 'Uttara',
          employeeId: 9,
          employeeName: 'Md. Sobuj',
          billBy: 'Md. Sobuj',
          invoiceNo: 'INV-77',
          soSystemNo: 'INV-77',
        },
      ],
      {
        startDate: '2026-05-01',
        endDate: '2026-05-20',
        employeeLabel: 'Md. Sobuj',
      },
    )

    expect(pdfState.autoTableMock).toHaveBeenCalledTimes(2)
    const autoTableArgs = pdfState.autoTableMock.mock.calls[0][1]
    expect(autoTableArgs.head[0]).toEqual([
      'Task Name',
      'Invoice Id',
      'Factory Name',
      'Description',
      'From',
      'To',
      'Transport',
      'Fair',
    ])
    expect(autoTableArgs.body[0]).toEqual([
      'Delivery Run',
      'INV-77',
      'Abir Fashion',
      'Urgent fabric drop',
      'Gazipur',
      'Uttara',
      'Truck 7',
      '550.00',
    ])
    expect(pdfState.saveMock).toHaveBeenCalledWith('employee-conveyance-INV-77.pdf')
    expect(pdfState.textMock).toHaveBeenCalledWith('Conveyance Bill', expect.any(Number), expect.any(Number), { align: 'center' })
    expect(pdfState.autoTableMock.mock.calls[1][1].body[0]).toEqual(['', 'Total Conveyance Amount', '550.00'])
  })
})