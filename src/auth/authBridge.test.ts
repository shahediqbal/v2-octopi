import { beforeEach, describe, expect, it, vi } from 'vitest'

const jwtDecodeMock = vi.fn()

vi.mock('jwt-decode', () => ({
  jwtDecode: jwtDecodeMock,
}))

describe('authBridge access helpers', () => {
  beforeEach(() => {
    localStorage.clear()
    jwtDecodeMock.mockReset()
  })

  it('extracts normalized and legacy menu paths from both menu tokens', async () => {
    localStorage.setItem(
      'userInfo',
      JSON.stringify({
        token: 'access-token',
        menuToken: 'menu-token',
        menuInPlainListToken: 'plain-token',
      }),
    )

    jwtDecodeMock
      .mockReturnValueOnce({
        UserMenus: JSON.stringify([
          {
            MenuId: 1,
            MenuName: 'Sales Order',
            MenuURL: '/salesorderinternal',
            ChildMenus: [{ MenuId: 2, MenuName: 'Packing Print', MenuURL: '/packingessential/packingrelatedprint' }],
          },
        ]),
      })
      .mockReturnValueOnce({
        UserMenuPlainList: JSON.stringify([
          { MenuId: 3, MenuName: 'Status', MenuURL: '/stockout/status' },
        ]),
      })

    const { getAccessibleMenuPaths, isAuthenticated } = await import('@/auth/authBridge')

    expect(isAuthenticated()).toBe(true)
    expect(getAccessibleMenuPaths()).toEqual(
      expect.arrayContaining([
        '/salesorderinternal',
        '/sales-orders',
        '/packingessential/packingrelatedprint',
        '/sales-orders/packing-print',
        '/stockout/status',
        '/sales-orders/status',
      ]),
    )
  })

  it('returns empty path lists when token decoding fails', async () => {
    localStorage.setItem(
      'userInfo',
      JSON.stringify({ token: 'access-token', menuToken: 'broken-token' }),
    )

    jwtDecodeMock.mockImplementation(() => {
      throw new Error('bad token')
    })

    const { getAccessibleMenuPaths, getUserMenusFromMenuToken } = await import('@/auth/authBridge')

    expect(getUserMenusFromMenuToken()).toEqual([])
    expect(getAccessibleMenuPaths()).toEqual([])
  })
})