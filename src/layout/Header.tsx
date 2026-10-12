import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Search,
  LogOut,
  User,
  KeyRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { getLegacyUserInfo, logoutFromBridge } from '@/auth/authBridge'
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

export function Header() {
  const navigate = useNavigate()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleCollapse = useUIStore((s) => s.toggleSidebarCollapse)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  const userInfo = getLegacyUserInfo()
  const displayName = (() => {
    try {
      const token = userInfo?.token
      if (!token) return undefined
      const decoded = jwtDecode<{ UserFullName?: string }>(token)
      return decoded.UserFullName
    } catch {
      return undefined
    }
  })()

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
    navigate('/signin', { replace: true })
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
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold text-sm shrink-0">
              {displayName ? displayName.charAt(0).toUpperCase() : <User size={16} />}
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-xs text-gray-400 font-normal">Logged in as</span>
              <span className="text-sm font-semibold text-gray-800">
                {displayName || 'User'}
              </span>
            </div>
          </button>

          {profileOpen && (
            <div
              className={cn(
                'absolute right-0 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg',
              )}
            >
              <Link
                to="/users/change-password"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <KeyRound size={16} />
                Change Password
              </Link>
              <div className="my-1 border-t border-gray-100" />
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
