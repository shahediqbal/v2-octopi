import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hookState = vi.hoisted(() => ({
  useCurrentStock: vi.fn(),
}))

vi.mock('@/hooks/useCurrentStock', () => ({
  useCurrentStock: hookState.useCurrentStock,
}))

vi.mock('@/components/dropdowns', () => ({
  PaginatedCombobox: ({ onValueChange }: { onValueChange: (value: number | null, label?: string | null) => void }) => (
    <button type="button" onClick={() => onValueChange(22, 'Widget 22')}>
      Pick Product
    </button>
  ),
  DropdownSelect: ({ onValueChange }: { onValueChange: (value: number | null, label?: string | null) => void }) => (
    <button type="button" onClick={() => onValueChange(3, 'Main Channel')}>
      Pick Channel
    </button>
  ),
}))

vi.mock('@/utils/lazyExportExcel', () => ({
  exportExcelOnDemand: vi.fn(),
}))

import { CurrentStockReportPage } from '@/pages/reports/CurrentStockReportPage'

describe('CurrentStockReportPage', () => {
  beforeEach(() => {
    hookState.useCurrentStock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    })
  })

  it('does not auto load until the user requests data', async () => {
    render(<CurrentStockReportPage />)

    expect(hookState.useCurrentStock).toHaveBeenLastCalledWith({ productId: 0, channelId: 0 }, 0, false)
    expect(screen.getByText('Load Stock Records')).toBeTruthy()

    fireEvent.click(screen.getByText('Pick Product'))
    fireEvent.click(screen.getByText('Pick Channel'))
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }))

    await waitFor(() => {
      expect(hookState.useCurrentStock).toHaveBeenLastCalledWith({ productId: 22, channelId: 3 }, 1, true)
    })
  })
})