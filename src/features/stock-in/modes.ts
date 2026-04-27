// ============================================================
// Stock-In Module — Mode Configuration
// ============================================================
import type { StockInListMode, StockInEditMode } from '@/types/stockIn'

export interface StockInModeTab {
  value: string
  label: string
}

export interface StockInListModeConfig {
  title: string
  description: string
  statusCode: number   // API status code to pass to /StockIn/StockInOrderGridData/{code}
  tabs: StockInModeTab[]
}

export interface StockInEditModeConfig {
  title: string
  description: string
}

export const LIST_MODE_CONFIG: Record<StockInListMode, StockInListModeConfig> = {
  standard: {
    title: 'Stock-In Orders',
    description: 'Create and manage inbound inventory orders.',
    statusCode: 50,
    tabs: [],
  },
  'confirm-qty': {
    title: 'Pending Quantity Confirmation',
    description: 'Verify and confirm received quantities from escalated orders.',
    statusCode: 51,
    tabs: [],
  },
  'admin-approved': {
    title: 'Approved Stock-In Orders',
    description: 'Approved/received orders. Admin can revert if needed.',
    statusCode: 52,
    tabs: [],
  },
  'price-update': {
    title: 'Price Update',
    description: 'Update item prices on existing stock-in orders.',
    statusCode: 52,
    tabs: [],
  },
}

export const EDIT_MODE_CONFIG: Record<StockInEditMode, StockInEditModeConfig> = {
  standard: {
    title: 'Edit Stock-In Order',
    description: 'Edit all fields of a pending stock-in order.',
  },
  'price-edit': {
    title: 'Update Prices',
    description: 'Update unit prices and batch/pack details only.',
  },
  'admin-revert': {
    title: 'Revert Approved Stock-In',
    description: 'Review the approved order and revert quantities from inventory.',
  },
}

/**
 * Returns true if the given jobTypeName requires a supplier selection.
 */
export function requiresSupplier(jobTypeName: string | null | undefined): boolean {
  const name = (jobTypeName ?? '').toLowerCase()
  return (
    name.includes('sample_receive') ||
    name.includes('regular_purchase') ||
    name.includes('excess_from_intact') ||
    // Also match space-separated labels from the dropdown
    name.includes('sample receive') ||
    name.includes('regular purchase') ||
    name.includes('excess from intact')
  )
}

/**
 * Returns true if the given jobTypeName requires a customer selection.
 */
export function requiresCustomer(jobTypeName: string | null | undefined): boolean {
  const name = (jobTypeName ?? '').toLowerCase()
  return (
    name.includes('exchange_inward') ||
    name.includes('sales_return') ||
    name.includes('loan_receive') ||
    name.includes('exchange inward') ||
    name.includes('sales return') ||
    name.includes('loan receive')
  )
}

/**
 * Returns true if the order type is Loan Receive (requires mapped product selection).
 */
export function isLoanReceive(jobTypeName: string | null | undefined): boolean {
  const name = (jobTypeName ?? '').toLowerCase()
  return name.includes('loan_receive') || name.includes('loan receive')
}
