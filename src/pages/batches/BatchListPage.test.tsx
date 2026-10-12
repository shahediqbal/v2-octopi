import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BatchListPage } from '@/pages/batches/BatchListPage'

const mockUseBatchList = vi.fn()
const mockUseBatchDetail = vi.fn()
const mockUseUpdateBatch = vi.fn()
const showToast = vi.fn()

vi.mock('@/hooks/useBatches', () => ({
  useBatchList: (...args: unknown[]) => mockUseBatchList(...args),
  useBatchDetail: (...args: unknown[]) => mockUseBatchDetail(...args),
  useUpdateBatch: (...args: unknown[]) => mockUseUpdateBatch(...args),
}))

vi.mock('@/stores/toastStore', () => ({
  useToastStore: (selector: (store: { showToast: typeof showToast }) => unknown) => selector({ showToast }),
}))

const ACTIVE_ROW = {
  batchId: 1,
  batchNo: 'ACT-001',
  productName: 'Active Product',
  batchProductionDate: '2026-01-03T00:00:00',
  batchExpiryDate: '2027-01-03T00:00:00',
  batchCurrentStatus: 1,
}

const INACTIVE_ROW = {
  batchId: 2,
  batchNo: 'INA-002',
  productName: 'Inactive Product',
  batchProductionDate: '2026-02-11T00:00:00',
  batchExpiryDate: '2027-02-11T00:00:00',
  batchCurrentStatus: 2,
}

const ASUDEL_BLACK_ROW = {
  batchId: 11,
  batchNo: 'B-011',
  productName: 'ASUDEL BLACK M-SD',
  batchProductionDate: '2026-02-01T00:00:00',
  batchExpiryDate: '2027-02-01T00:00:00',
  batchCurrentStatus: 1,
}

const ASUDEL_OLIVE_ROW_1 = {
  batchId: 12,
  batchNo: 'B-012',
  productName: 'ASUDEL OLIVE GWL',
  batchProductionDate: '2026-02-02T00:00:00',
  batchExpiryDate: '2027-02-02T00:00:00',
  batchCurrentStatus: 1,
}

const ASUDEL_BROWN_ROW = {
  batchId: 13,
  batchNo: 'B-013',
  productName: 'ASUDEL BROWN GRL',
  batchProductionDate: '2026-02-03T00:00:00',
  batchExpiryDate: '2027-02-03T00:00:00',
  batchCurrentStatus: 1,
}

const ASUDEL_OLIVE_ROW_2 = {
  batchId: 14,
  batchNo: 'B-014',
  productName: 'ASUDEL OLIVE GWL',
  batchProductionDate: '2026-02-04T00:00:00',
  batchExpiryDate: '2027-02-04T00:00:00',
  batchCurrentStatus: 1,
}

describe('BatchListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseBatchList.mockReturnValue({ data: [], isLoading: false, isError: false })

    mockUseBatchDetail.mockReturnValue({ data: null, isLoading: false, isError: false })

    mockUseUpdateBatch.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('shows a prompt and no table rows on initial render', () => {
    render(<BatchListPage />)

    expect(screen.getByText('Select a status above to load batches.')).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('loads and shows data after user selects a status', () => {
    mockUseBatchList.mockReturnValue({ data: [ACTIVE_ROW], isLoading: false, isError: false })

    render(<BatchListPage />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } })

    expect(screen.getByText('ACT-001')).toBeTruthy()
    expect(screen.getByText('Active Product')).toBeTruthy()
  })

  it('searches all visible columns of the currently loaded status', () => {
    mockUseBatchList.mockReturnValue({ data: [ACTIVE_ROW, INACTIVE_ROW], isLoading: false, isError: false })

    render(<BatchListPage />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } })

    expect(screen.getByText('ACT-001')).toBeTruthy()
    expect(screen.getByText('INA-002')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Search batch, product, date, status...'), {
      target: { value: 'inactive' },
    })

    expect(screen.getByText('INA-002')).toBeTruthy()
    expect(screen.queryByText('ACT-001')).toBeNull()
  })

  it('matches formatted production-date fields in the search', () => {
    mockUseBatchList.mockReturnValue({ data: [ACTIVE_ROW, INACTIVE_ROW], isLoading: false, isError: false })

    render(<BatchListPage />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } })

    fireEvent.change(screen.getByPlaceholderText('Search batch, product, date, status...'), {
      target: { value: '11-Feb-2026' },
    })

    expect(screen.getByText('INA-002')).toBeTruthy()
    expect(screen.queryByText('ACT-001')).toBeNull()
  })

  it('keeps only rows that contain all typed product-name terms', () => {
    mockUseBatchList.mockReturnValue({
      data: [ASUDEL_BLACK_ROW, ASUDEL_OLIVE_ROW_1, ASUDEL_BROWN_ROW, ASUDEL_OLIVE_ROW_2],
      isLoading: false,
      isError: false,
    })

    render(<BatchListPage />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } })
    fireEvent.change(screen.getByPlaceholderText('Search batch, product, date, status...'), {
      target: { value: 'ASUDEL OLIVE GWL' },
    })

    expect(screen.getByText('B-012')).toBeTruthy()
    expect(screen.getByText('B-014')).toBeTruthy()
    expect(screen.queryByText('B-011')).toBeNull()
    expect(screen.queryByText('B-013')).toBeNull()
  })

  it('clears search when the status selection changes', () => {
    mockUseBatchList.mockReturnValue({ data: [ACTIVE_ROW], isLoading: false, isError: false })

    render(<BatchListPage />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } })
    fireEvent.change(screen.getByPlaceholderText('Search batch, product, date, status...'), {
      target: { value: 'active' },
    })

    expect((screen.getByPlaceholderText('Search batch, product, date, status...') as HTMLInputElement).value).toBe('active')

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } })

    expect((screen.getByPlaceholderText('Search batch, product, date, status...') as HTMLInputElement).value).toBe('')
  })
})