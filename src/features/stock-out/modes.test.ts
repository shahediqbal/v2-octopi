import { describe, expect, it } from 'vitest'
import {
  ADMIN_STOCK_OUT_TABS,
  EDIT_MODE_CONFIG,
  LIST_MODE_CONFIG,
  PERMISSION_PROFILES,
  STANDARD_STOCK_OUT_TABS,
  getStatusLabel,
} from '@/features/stock-out/modes'

describe('stock-out mode configuration', () => {
  it('uses the correct tab groups for standard and admin list modes', () => {
    expect(LIST_MODE_CONFIG.standard.tabs).toEqual(STANDARD_STOCK_OUT_TABS)
    expect(LIST_MODE_CONFIG['package-done'].tabs).toEqual(STANDARD_STOCK_OUT_TABS)
    expect(LIST_MODE_CONFIG['admin-general'].tabs).toEqual(ADMIN_STOCK_OUT_TABS)
    expect(LIST_MODE_CONFIG['admin-pending-price'].tabs).toEqual(ADMIN_STOCK_OUT_TABS)
  })

  it('describes edit modes with the expected workflow labels', () => {
    expect(EDIT_MODE_CONFIG.standard.title).toBe('Edit Sales Order')
    expect(EDIT_MODE_CONFIG['admin-full'].description).toContain('full financial control')
    expect(EDIT_MODE_CONFIG['admin-packing-edit'].title).toBe('Admin Packaging Edit')
    expect(EDIT_MODE_CONFIG['packing-edit'].description).toContain('pack sizes and counts')
  })

  it('assigns permission profiles to the intended list and edit modes', () => {
    expect(PERMISSION_PROFILES.standard.listModes).toEqual(['standard', 'escalation', 'packaging', 'package-done'])
    expect(PERMISSION_PROFILES.pricing.editModes).toEqual(['admin-price-edit', 'admin-invoice-limited'])
    expect(PERMISSION_PROFILES.warehouse.listModes).toEqual(['packaging', 'package-done'])
    expect(PERMISSION_PROFILES.superadmin.listModes.sort()).toEqual(Object.keys(LIST_MODE_CONFIG).sort())
    expect(PERMISSION_PROFILES.superadmin.editModes.sort()).toEqual(Object.keys(EDIT_MODE_CONFIG).sort())
  })

  it('normalizes status labels from numeric and nullable values', () => {
    expect(getStatusLabel(0)).toBe('Created')
    expect(getStatusLabel('1')).toBe('Escalated')
    expect(getStatusLabel(2)).toBe('Packaging')
    expect(getStatusLabel(3)).toBe('Done')
    expect(getStatusLabel(null)).toBe('Created')
    expect(getStatusLabel(99)).toBe('Unknown')
  })
})