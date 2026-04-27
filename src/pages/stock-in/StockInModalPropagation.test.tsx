import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BatchModal } from '@/pages/stock-in/BatchModal'
import { PackModal } from '@/pages/stock-in/PackModal'

vi.mock('@/hooks/useDropdown', () => ({
  useDropdown: () => ({
    data: [
      { key: 1, value: 'Carton' },
      { key: 2, value: 'Poly Pack' },
    ],
    isLoading: false,
    isError: false,
  }),
}))

function renderInsideParentForm(child: React.ReactNode, parentSubmit: () => void) {
  return render(
    <form
      onSubmit={(event) => {
        event.preventDefault()
        parentSubmit()
      }}
    >
      {child}
    </form>,
  )
}

describe('stock-in modal submit isolation', () => {
  it('does not submit the parent form when adding a batch', async () => {
    const parentSubmit = vi.fn()
    const onSave = vi.fn()

    renderInsideParentForm(
      <BatchModal open batch={null} onSave={onSave} onClose={vi.fn()} />,
      parentSubmit,
    )

    fireEvent.change(screen.getByPlaceholderText('Enter batch number'), {
      target: { value: 'B-101' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add Batch' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })
    expect(parentSubmit).not.toHaveBeenCalled()
  })

  it('does not submit the parent form when adding a pack', async () => {
    const parentSubmit = vi.fn()
    const onSave = vi.fn()

    renderInsideParentForm(
      <PackModal open pack={null} onSave={onSave} onClose={vi.fn()} />,
      parentSubmit,
    )

    fireEvent.change(screen.getByPlaceholderText('Enter pack size'), {
      target: { value: '12 pcs' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add Pack' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })
    expect(parentSubmit).not.toHaveBeenCalled()
  })
})