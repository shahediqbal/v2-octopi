import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Search,
  LogOut,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { getLegacyUserInfo, logoutFromBridge } from '@/auth/authBridge'
import { useState, useRef, useEffect } from 'react'

export function Header() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleCollapse = useUIStore((s) => s.toggleSidebarCollapse)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  const userInfo = getLegacyUserInfo()
  const displayName = (userInfo as Record<string, unknown> | null)?.userName as string | undefined

  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logoutFromBridge()
    window.location.href = '/signin'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-2">
        {/* mobile toggle */}
        <button
          type="button"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu size={20} />
        </button>

        {/* desktop collapse */}
        <button
          type="button"
          className="hidden lg:flex rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          onClick={toggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        {/* search bar */}
        <div className="relative hidden md:block ml-2">
          <Search size={16} className="absolute left-3 top-1/2 -trangray-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* notifications */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-700">
              <User size={16} />
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {displayName || 'User'}
            </span>
          </button>

          {profileOpen && (
            <div
              className={cn(
                'absolute right-0 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg',
              )}
            >
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
