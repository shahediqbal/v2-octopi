import type { EditMode, ListMode, PermissionProfile } from '@/types/stockOut'

export interface StockOutModeTab {
  value: string
  label: string
}

export interface ListModeConfig {
  title: string
  description: string
  tabs: StockOutModeTab[]
}

export interface EditModeConfig {
  title: string
  description: string
}

export const STANDARD_STOCK_OUT_TABS: StockOutModeTab[] = [
  { value: '0', label: 'Created' },
]

export const ADMIN_STOCK_OUT_TABS: StockOutModeTab[] = [
  { value: '0', label: 'Created' },
  { value: '1', label: 'Escalated' },
  { value: '2', label: 'In Progress' },
  { value: '3', label: 'Done' },
]

export const LIST_MODE_CONFIG: Record<ListMode, ListModeConfig> = {
  standard: {
    title: 'Sales Orders',
    description: 'Create, track, and prepare stock-out orders.',
    tabs: STANDARD_STOCK_OUT_TABS,
  },
  escalation: {
    title: 'Escalation Queue',
    description: 'Escalated orders waiting for invoicing, and invoiced orders awaiting packaging.',
    tabs: [
      { value: '1', label: 'Invoicing Queue' },
      { value: '2', label: 'Packaging Queue' },
    ],
  },
  packaging: {
    title: 'Packaging',
    description: 'Package Pending and Package Done orders.',
    tabs: [
      { value: '2', label: 'Package Pending' },
      { value: '3', label: 'Package Done' },
    ],
  },
  'package-done': {
    title: 'Completed Packaging',
    description: 'Orders with packaging completed (Done).',
    tabs: [],
  },
  'admin-general': {
    title: 'Admin Sales Orders',
    description: 'Administrative stock-out review across statuses.',
    tabs: ADMIN_STOCK_OUT_TABS,
  },
  'admin-pending-price': {
    title: 'Pending Price Orders',
    description: 'Orders waiting for price review.',
    tabs: ADMIN_STOCK_OUT_TABS,
  },
  'admin-limited-edit': {
    title: 'Limited Invoice Edit',
    description: 'Orders available for invoice-limited editing.',
    tabs: ADMIN_STOCK_OUT_TABS,
  },
}

export const EDIT_MODE_CONFIG: Record<EditMode, EditModeConfig> = {
  standard: {
    title: 'Edit Sales Order',
    description: 'Standard pre-escalation editing flow.',
  },
  'admin-full': {
    title: 'Admin Sales Order Edit',
    description: 'Administrative edit with full financial control.',
  },
  'admin-price-edit': {
    title: 'Price Review Edit',
    description: 'Adjust order pricing before packaging.',
  },
  'admin-invoice-limited': {
    title: 'Invoice Limited Edit',
    description: 'Limited invoice-side edits before packaging.',
  },
  'admin-packing-edit': {
    title: 'Admin Packaging Edit',
    description: 'Adjust completed packaging records.',
  },
  'packing-edit': {
    title: 'Packaging Edit',
    description: 'Adjust pack sizes and counts for completed orders.',
  },
}

export const PERMISSION_PROFILES: Record<PermissionProfile, { listModes: ListMode[]; editModes: EditMode[] }> = {
  standard: {
    listModes: ['standard', 'escalation', 'packaging', 'package-done'],
    editModes: ['standard', 'packing-edit'],
  },
  pricing: {
    listModes: ['admin-pending-price'],
    editModes: ['admin-price-edit', 'admin-invoice-limited'],
  },
  warehouse: {
    listModes: ['packaging', 'package-done'],
    editModes: ['admin-packing-edit', 'packing-edit'],
  },
  superadmin: {
    listModes: Object.keys(LIST_MODE_CONFIG) as ListMode[],
    editModes: Object.keys(EDIT_MODE_CONFIG) as EditMode[],
  },
}

export function getStatusLabel(status: number | string | null | undefined): string {
  switch (String(status ?? '0')) {
    case '0':
      return 'Created'
    case '1':
      return 'Escalated'
    case '2':
      return 'Packaging'
    case '3':
      return 'Done'
    default:
      return 'Unknown'
  }
}