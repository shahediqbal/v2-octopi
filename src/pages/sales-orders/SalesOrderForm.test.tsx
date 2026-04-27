import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SalesOrderForm } from '@/pages/sales-orders/SalesOrderForm'
import type { StockOutFormValues } from '@/schemas/stockOutSchema'

const hookState = vi.hoisted(() => ({
  useStockOutLookups: vi.fn(),
  useCategories: vi.fn(),
  useSamplesByCategory: vi.fn(),
}))

vi.mock('@/hooks/useStockOut', () => ({
  useStockOutLookups: hookState.useStockOutLookups,
  useCategories: hookState.useCategories,
  useSamplesByCategory: hookState.useSamplesByCategory,
}))

vi.mock('@/components/dropdowns', () => ({
  PaginatedCombobox: ({ type, value, onValueChange, onLabelChange, disabled = false }: {
    type: string
    value?: number | null
    onValueChange: (value: number | null) => void
    onLabelChange?: (label: string | null) => void
    disabled?: boolean
  }) => {
    const nextValueByType: Record<string, number> = {
      product: 101,
      customer: 11,
      supplier: 21,
    }
    const nextLabelByType: Record<string, string> = {
      product: 'Widget',
      customer: 'Acme Retail',
      supplier: 'Supply Co',
    }

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          onValueChange(nextValueByType[type] ?? 1)
          onLabelChange?.(nextLabelByType[type] ?? `Option ${nextValueByType[type] ?? 1}`)
        }}
      >
        {`${type}-${value ?? 'empty'}`}
      </button>
    )
  },
}))

vi.mock('@/pages/sales-orders/PaymentInfo', () => ({
  PaymentInfo: () => <div>PaymentInfo</div>,
}))

vi.mock('@/auth/authBridge', () => ({
  getAccessToken: () => null,
}))

const lookups = {
  orderTypes: [
    { id: 1, label: 'Retail' },
    { id: 2, label: 'Warehouse_Transfer' },
  ],
  orderSources: [
    { id: 1, label: 'Main Warehouse' },
  ],
  packTypes: [],
}

function renderForm(props: Partial<React.ComponentProps<typeof SalesOrderForm>> = {}) {
  const onSubmit = vi.fn()
  render(
    <SalesOrderForm
      onSubmit={onSubmit}
      isSubmitting={false}
      submitLabel="Submit"
      {...props}
    />,
  )
  return { onSubmit }
}

describe('SalesOrderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hookState.useStockOutLookups.mockReturnValue({
      data: lookups,
      isLoading: false,
    })
    hookState.useCategories.mockReturnValue({ data: [] })
    hookState.useSamplesByCategory.mockReturnValue({ data: undefined, isFetching: false })
  })

  it('automatically enables price review for standard-mode lines priced at 1', async () => {
    const defaultValues: Partial<StockOutFormValues> = {
      soJobTypeId: 1,
      soOrderFromId: 1,
      invoiceDate: '2026-04-21',
      items: [
        {
          productId: 101,
          productLabel: 'Widget',
          quantity: 1,
          unitPrice: 1,
          vatRate: 0,
          aitRate: 0,
          discountRate: 0,
          discountType: 'F',
          itemRemark: '',
        },
      ],
    }

    renderForm({ defaultValues, mode: 'standard' })

    const priceReviewCheckbox = screen.getByLabelText('Requires price review') as HTMLInputElement

    await waitFor(() => {
      expect(priceReviewCheckbox.checked).toBe(true)
    })
    expect(priceReviewCheckbox.disabled).toBe(true)
  })

  it('locks header selections after the first standard-mode item is added', async () => {
    renderForm({ mode: 'standard' })

    const orderTypeField = screen.getByText('Order Type *').parentElement as HTMLElement
    const orderFromField = screen.getByText('Order From *').parentElement as HTMLElement
    const customerField = screen.getByText('Customer *').parentElement as HTMLElement

    const orderTypeSelect = within(orderTypeField).getByRole('combobox') as HTMLSelectElement
    const orderFromSelect = within(orderFromField).getByRole('combobox') as HTMLSelectElement
    const customerButton = within(customerField).getByRole('button') as HTMLButtonElement

    expect(orderTypeSelect.disabled).toBe(false)
    expect(orderFromSelect.disabled).toBe(false)
    expect(customerButton.disabled).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'product-empty' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }))

    await waitFor(() => {
      expect(orderTypeSelect.disabled).toBe(true)
    })

    expect(orderFromSelect.disabled).toBe(true)
    expect(customerButton.disabled).toBe(true)
    expect(screen.getByText('Widget')).toBeTruthy()
  })
})