import { jwtDecode } from 'jwt-decode'
import { mapLegacyPathToV2Path } from '@/auth/menuMapper'
import type { LegacyMenuItem, LegacyUserInfo } from '@/types/auth'

const USER_INFO_KEY = 'userInfo'

export function getLegacyUserInfo(): LegacyUserInfo | null {
  const raw = localStorage.getItem(USER_INFO_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as LegacyUserInfo
  } catch {
    return null
  }
}

export function getAccessToken(): string | null {
  return getLegacyUserInfo()?.token ?? null
}

export function isAuthenticated(): boolean {
  const token = getAccessToken()
  if (!token) return false
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token)
    // exp is in seconds, Date.now() is in milliseconds
    // if no exp claim, treat as valid (some internal tokens omit it)
    return exp ? exp * 1000 > Date.now() : true
  } catch {
    return false
  }
}

export function getUserMenusFromMenuToken(): LegacyMenuItem[] {
  const menuToken = getLegacyUserInfo()?.menuToken
  if (!menuToken) return []

  try {
    const decoded = jwtDecode<{ UserMenus?: string }>(menuToken)
    return decoded.UserMenus ? (JSON.parse(decoded.UserMenus) as LegacyMenuItem[]) : []
  } catch {
    return []
  }
}

export function getUserMenusFromPlainToken(): LegacyMenuItem[] {
  const menuInPlainListToken = getLegacyUserInfo()?.menuInPlainListToken
  if (!menuInPlainListToken) return []

  try {
    const decoded = jwtDecode<{ UserMenuPlainList?: string }>(menuInPlainListToken)
    return decoded.UserMenuPlainList
      ? (JSON.parse(decoded.UserMenuPlainList) as LegacyMenuItem[])
      : []
  } catch {
    return []
  }
}

function flattenMenuUrls(items: LegacyMenuItem[]): string[] {
  return items.flatMap((item) => {
    const own = item.MenuURL ? [item.MenuURL] : []
    const childUrls = item.ChildMenus ? flattenMenuUrls(item.ChildMenus) : []
    return [...own, ...childUrls]
  })
}

export function getAccessibleMenuPaths(): string[] {
  const sources = [getUserMenusFromMenuToken(), getUserMenusFromPlainToken()]
  const paths = new Set<string>()

  sources.forEach((menus) => {
    flattenMenuUrls(menus).forEach((url) => {
      const normalized = mapLegacyPathToV2Path(url)
      if (normalized) {
        paths.add(normalized)
      }

      if (url) {
        paths.add(url.startsWith('/') ? url : `/${url}`)
      }
    })
  })

  return [...paths]
}

export function getDefaultAuthenticatedRoute(): string {
  const paths = getAccessibleMenuPaths()
  return paths.includes('/super-admin/dashboard') ? '/super-admin/dashboard' : '/dashboard'
}

export function logoutFromBridge() {
  localStorage.removeItem(USER_INFO_KEY)
}
