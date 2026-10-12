import { Suspense, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { cn } from '@/lib/utils'
import { env } from '@/config/env'
import { getAccessToken, getUserMenusFromMenuToken } from '@/auth/authBridge'
import { mapLegacyMenuToAppMenu } from '@/auth/menuMapper'
import { useUIStore } from '@/stores/uiStore'
import { AppToast } from '@/components/AppToast'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import type { LegacyMenuItem } from '@/types/auth'

function RouteFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center py-16">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        Loading page…
      </div>
    </div>
  )
}

export function AppShell() {
  const [apiMenus, setApiMenus] = useState<LegacyMenuItem[]>([])
  const [menuError, setMenuError] = useState('')
  const collapsed = useUIStore((s) => s.sidebarCollapsed)

  const tokenMenus = getUserMenusFromMenuToken()
  const mappedTokenMenus = useMemo(() => mapLegacyMenuToAppMenu(tokenMenus), [tokenMenus])
  const mappedApiMenus = useMemo(() => mapLegacyMenuToAppMenu(apiMenus), [apiMenus])
  const activeMenus = mappedTokenMenus.length > 0 ? mappedTokenMenus : mappedApiMenus

  useEffect(() => {
    if (mappedTokenMenus.length > 0) return

    const token = getAccessToken()
    if (!token) return

    let roleId: string | number | undefined
    try {
      const decoded = jwtDecode<{ UserRoleId?: string | number }>(token)
      roleId = decoded.UserRoleId
    } catch {
      setMenuError('Could not decode role from token.')
      return
    }

    if (!roleId) {
      setMenuError('Role id missing in token.')
      return
    }

    const loadMenus = async () => {
      try {
        const response = await fetch(
          `${env.apiBaseUrl}/Menu/GetUserMenus?roleId=${roleId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        const json = await response.json()
        const menus = json?.dataObj
        if (Array.isArray(menus)) {
          setApiMenus(menus as LegacyMenuItem[])
          setMenuError('')
        } else {
          setMenuError('Menu API did not return an array.')
        }
      } catch {
        setMenuError('Failed to load menus from API.')
      }
    }

    loadMenus()
  }, [mappedTokenMenus.length])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar dynamicMenus={activeMenus} />

      <main
        className={cn(
          'pt-16 transition-all duration-200',
          collapsed ? 'lg:pl-16' : 'lg:pl-64',
        )}
      >
        <div className="p-6">
          {menuError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {menuError}
            </div>
          )}
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <AppToast />
    </div>
  )
}
