import { describe, expect, it } from 'vitest'
import { mapLegacyMenuToAppMenu, mapLegacyPathToV2Path } from '@/auth/menuMapper'
import type { LegacyMenuItem } from '@/types/auth'

describe('menuMapper', () => {
  it('maps stock-out legacy paths to the expected V2 routes', () => {
    expect(mapLegacyPathToV2Path('/salesorderinternal')).toBe('/sales-orders')
    expect(mapLegacyPathToV2Path('/salesorderinternal/create')).toBe('/sales-orders/create')
    expect(mapLegacyPathToV2Path('/salesorderinternal/escalationlist')).toBe('/sales-orders/escalations')
    expect(mapLegacyPathToV2Path('/salesorderinternal/general')).toBe('/sales-orders/admin/general')
    expect(mapLegacyPathToV2Path('/salesorderinternal/pendingprice')).toBe('/sales-orders/admin/pending-price')
    expect(mapLegacyPathToV2Path('/salesorderinternal/packagelist')).toBe('/sales-orders/packages')
    expect(mapLegacyPathToV2Path('/salesorderinternal/packagelist/done')).toBe('/sales-orders/packages/done')
    expect(mapLegacyPathToV2Path('/salesorder/limitededit')).toBe('/sales-orders/admin/limited-edit')
    expect(mapLegacyPathToV2Path('/stockout/status')).toBe('/sales-orders/status')
    expect(mapLegacyPathToV2Path('/stockout/update')).toBe('/sales-orders/pending')
    expect(mapLegacyPathToV2Path('/salesoperation/stockoutstockrevert')).toBe('/sales-orders/delivery-return')
    expect(mapLegacyPathToV2Path('/packingessential/packingrelatedprint')).toBe('/sales-orders/packing-print')
  })

  it('normalizes missing leading slashes and leaves unknown routes unchanged', () => {
    expect(mapLegacyPathToV2Path('salesorderinternal')).toBe('/sales-orders')
    expect(mapLegacyPathToV2Path('unknown/route')).toBe('/unknown/route')
    expect(mapLegacyPathToV2Path(undefined)).toBeUndefined()
  })

  it('maps visible legacy menus and their children into app menu items', () => {
    const legacyMenus: LegacyMenuItem[] = [
      {
        MenuId: 1,
        MenuName: 'Stock Out',
        MenuURL: '/salesorderinternal',
        MenuIsVisible: true,
        ChildMenus: [
          {
            MenuId: 2,
            MenuName: 'Create',
            MenuURL: '/salesorderinternal/create',
            MenuIsVisible: true,
          },
          {
            MenuId: 3,
            MenuName: 'Hidden Child',
            MenuURL: '/salesorderinternal/pendingprice',
            MenuIsVisible: false,
          },
        ],
      },
      {
        MenuId: 4,
        MenuName: 'Hidden Parent',
        MenuURL: '/stockout/status',
        MenuIsVisible: false,
      },
    ]

    expect(mapLegacyMenuToAppMenu(legacyMenus)).toEqual([
      {
        id: '1',
        label: 'Stock Out',
        path: '/sales-orders',
        children: [
          {
            id: '2',
            label: 'Create',
            path: '/sales-orders/create',
          },
        ],
      },
    ])
  })
})