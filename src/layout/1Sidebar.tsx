import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FileBarChart,
  GitCompareArrows,
  Truck,
  Users,
  ShieldCheck,
  Wallet,
  Boxes,
  Package,
  Workflow,
  Building2,
  ReceiptText,
  MapPin,
  UserPlus,
  Tags,
  PackageSearch,
  Receipt,
  Layers,
  ArrowLeftRight,
  BookOpen,
  CalendarRange,
  Scale,
  PackageOpen,
  PackagePlus,
  TrendingUp,
  ClipboardList,
  AlertTriangle,
  CalendarClock,
  BadgeCheck,
  CreditCard,
  BarChart3,
  Printer,
  Sticker,
  Search,
  Pin,
  PinOff,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { AppMenuItem } from '@/types/auth'
import { useUIStore } from '@/stores/uiStore'
import { usePinnedMenuStore } from '@/stores/pinnedMenuStore'

/* ─── static v2 nav items (always shown) ─── */
export const staticNav = [
  { id: 'customers', label: 'Customers', path: '/customers', icon: Users },
  { id: 'assign-customers', label: 'Assign Customers', path: '/customers/assign-employees', icon: UserPlus },
  { id: 'customer-flag', label: 'Customer Flag Update', path: '/customers/flag-update', icon: Users },
  { id: 'suppliers', label: 'Suppliers', path: '/suppliers', icon: Building2 },
  { id: 'locations', label: 'Locations', path: '/locations', icon: MapPin },
  { id: 'products', label: 'Products', path: '/products', icon: Boxes },
  { id: 'cheques', label: 'Cheques', path: '/cheques', icon: ReceiptText },
  { id: 'payments', label: 'Payments', path: '/payments', icon: Wallet },
  { id: 'product-functions', label: 'Product Functions', path: '/products/functions', icon: Workflow },
  { id: 'payment-report', label: 'Payment Report', path: '/reports/payment', icon: Wallet },
  { id: 'sales-report', label: 'Sales Report', path: '/reports/sales', icon: FileBarChart },
  { id: 'mapping-report', label: 'Mapping Report', path: '/reports/mapping', icon: GitCompareArrows },
  { id: 'repacking-packed-by-report', label: 'Repacking Packed By Report', path: '/reports/repacking-packed-by', icon: Package },
  { id: 'delivery-report', label: 'Delivery Report', path: '/reports/delivery', icon: Truck },
  { id: 'stockout-salesreturn', label: 'StockOut + Sales Return', path: '/reports/stockout-salesreturn', icon: ArrowLeftRight },
  { id: 'product-loan', label: 'Product Loan Details', path: '/reports/product-loan', icon: Package },
  { id: 'loan-reports', label: 'Loan Reports', path: '/reports/loan', icon: BookOpen },
  { id: 'monthly-credit', label: 'Monthly Credit', path: '/reports/monthly-credit', icon: CalendarRange },
  { id: 'reconcile-audit', label: 'Stock Reconcile & Audit', path: '/reports/reconcile-audit', icon: Scale },
  { id: 'delivery-conveyance', label: 'Delivery Conveyance', path: '/reports/delivery-conveyance', icon: Truck },
  { id: 'stockout-batch', label: 'StockOut Batch Report', path: '/reports/stockout-batch', icon: PackageOpen },
  { id: 'stockin-batch', label: 'StockIn Batch Report', path: '/reports/stockin-batch', icon: PackagePlus },
  { id: 'purchase-price', label: 'Purchase Price History', path: '/reports/purchase-price-history', icon: TrendingUp },
  { id: 'tax-ait-details', label: 'Tax AIT Details', path: '/reports/tax-ait-details', icon: Receipt },
  { id: 'tax-ait-summary', label: 'Tax AIT Summary', path: '/reports/tax-ait-summary', icon: ReceiptText },
  { id: 'employee-task', label: 'Employee Task Report', path: '/reports/employee-task', icon: ClipboardList },
  { id: 'pending-cancel', label: 'Pending & Cancel', path: '/reports/pending-cancel', icon: AlertTriangle },
  { id: 'daily-invoice-tracking', label: 'Daily Invoice Tracking', path: '/reports/daily-invoice-tracking', icon: CalendarClock },
  { id: 'allowance-checking', label: 'Allowance Checking', path: '/reports/allowance-checking', icon: BadgeCheck },
  { id: 'customer-credit', label: 'Customer Credit', path: '/reports/customer-credit', icon: CreditCard },
  { id: 'sales-payment-dash', label: 'Sales & Payment', path: '/reports/sales-payment-dashboard', icon: BarChart3 },
  { id: 'customer-lookup', label: 'Customer Lookup', path: '/customers/lookup', icon: Search },
  { id: 'packing-print', label: 'Packing Print Panel', path: '/packing/print-panel', icon: Printer },
  { id: 'sample-sticker', label: 'Sample Sticker Print', path: '/sample-sticker/print-panel', icon: Sticker },
  { id: 'sticker-orders', label: 'Sticker Packing Orders', path: '/sticker-packing/orders', icon: PackageSearch },
  { id: 'sticker-print-panel', label: 'Sticker Print Panel', path: '/sticker-packing/print-panel', icon: Tags },
  { id: 'tax-duty', label: 'Tax & Duty', path: '/tax-duty', icon: Receipt },
  { id: 'batches', label: 'Batches', path: '/batches', icon: Layers },
]

const dashboardItem = { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }

const adminNav = [
  { id: 'manage-roles', label: 'Manage Role & Menu', path: '/admin/roles', icon: ShieldCheck },
  { id: 'user-signup', label: 'User Registration', path: '/users/signup', icon: UserPlus },
  { id: 'user-roles', label: 'User Roles', path: '/users/roles', icon: Users },
]

interface SidebarProps {
  dynamicMenus: AppMenuItem[]
}

export function Sidebar({ dynamicMenus }: SidebarProps) {
  const location = useLocation()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const [browseOpen, setBrowseOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const pinnedIds = usePinnedMenuStore((s) => s.pinnedIds)
  const pinItem = usePinnedMenuStore((s) => s.pin)
  const unpinItem = usePinnedMenuStore((s) => s.unpin)
  const canPin = usePinnedMenuStore((s) => s.canPin)

  const staticFallbackPaths = new Set(['/locations', '/customers/assign-employees'])
  const visibleStaticNav = dynamicMenus.length === 0
    ? staticNav
    : staticNav.filter((item) => !staticFallbackPaths.has(item.path))

  const pinnedItems = visibleStaticNav.filter((item) => pinnedIds.includes(item.id))
  const filteredBrowseItems = visibleStaticNav.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const isActive = (path?: string) => path && location.pathname === path

  const closeMobileSidebar = () => setSidebarOpen(false)

  return (
    <>
      {/* ── mobile overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-200 overflow-y-auto',
          // Desktop: collapse/expand
          collapsed ? 'lg:w-16' : 'lg:w-64',
          // Mobile: slide in/out
          sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* ── logo area ── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img src="/images/trade.png" alt="Trade" className="h-8 w-auto shrink-0" />
            {!collapsed && (
              <span className="text-sm font-semibold tracking-wide text-gray-800">Octopi ERP</span>
            )}
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
            onClick={closeMobileSidebar}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Main section: Dashboard + Pinned ── */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <SectionLabel collapsed={collapsed}>Main</SectionLabel>

          {/* Dashboard – always visible */}
          <Link
            to={dashboardItem.path}
            onClick={closeMobileSidebar}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(dashboardItem.path)
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </Link>

          {/* Pinned items */}
          {pinnedItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.id} className="group relative flex items-center">
                <Link
                  to={item.path}
                  onClick={closeMobileSidebar}
                  className={cn(
                    'flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive(item.path)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
                {!collapsed && (
                  <button
                    type="button"
                    title="Unpin"
                    onClick={() => unpinItem(item.id)}
                    className="absolute right-1 opacity-0 group-hover:opacity-100 rounded p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-opacity"
                  >
                    <PinOff size={14} />
                  </button>
                )}
              </div>
            )
          })}

          {/* Browse All Pages button */}
          {!collapsed && (
            <button
              type="button"
              onClick={() => setBrowseOpen((o) => !o)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
            >
              <MoreHorizontal size={16} className="shrink-0" />
              <span>Browse All Pages</span>
              <span className="ml-auto text-[10px] text-gray-300">
                {pinnedIds.length}/5 pinned
              </span>
            </button>
          )}

          {/* Browse All Pages panel */}
          {browseOpen && !collapsed && (
            <div className="mx-1 mb-2 rounded-lg border border-gray-200 bg-gray-50/50">
              <div className="px-2 pt-2 pb-1">
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200"
                />
              </div>
              <div className="max-h-52 overflow-y-auto px-1 py-1 space-y-0.5">
                {filteredBrowseItems.map((item) => {
                  const Icon = item.icon
                  const pinned = pinnedIds.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-gray-600 hover:bg-white transition-colors"
                    >
                      <Icon size={14} className="shrink-0 text-gray-400" />
                      <Link
                        to={item.path}
                        onClick={() => {
                          setBrowseOpen(false)
                          setSearchTerm('')
                          closeMobileSidebar()
                        }}
                        className="flex-1 truncate hover:text-gray-900"
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        title={pinned ? 'Unpin' : canPin() ? 'Pin to Main' : 'Max 5 pinned'}
                        disabled={!pinned && !canPin()}
                        onClick={() => (pinned ? unpinItem(item.id) : pinItem(item.id))}
                        className={cn(
                          'rounded p-0.5 transition-colors',
                          pinned
                            ? 'text-blue-500 hover:text-red-500'
                            : canPin()
                              ? 'text-gray-300 hover:text-blue-500'
                              : 'text-gray-200 cursor-not-allowed',
                        )}
                      >
                        {pinned ? <PinOff size={13} /> : <Pin size={13} />}
                      </button>
                    </div>
                  )
                })}
                {filteredBrowseItems.length === 0 && (
                  <p className="px-2 py-2 text-[11px] text-gray-400">No matching pages</p>
                )}
              </div>
            </div>
          )}

          {/* ── dynamic menus from API / token ── */}
          {dynamicMenus.length > 0 && (
            <>
              <SectionLabel collapsed={collapsed}>Modules</SectionLabel>
              {dynamicMenus.map((menu) => (
                <DynamicMenuItem key={menu.id} item={menu} collapsed={collapsed} onNavigate={closeMobileSidebar} />
              ))}
            </>
          )}

          {/* ── admin nav ── */}
          <SectionLabel collapsed={collapsed}>Admin</SectionLabel>
          {adminNav.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={closeMobileSidebar}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* ── footer ── */}
        {!collapsed && (
          <div className="border-t border-gray-100 px-4 py-3">
            <p className="text-[11px] text-gray-400">Octopi v2 · ERP Platform</p>
          </div>
        )}
      </aside>
    </>
  )
}

/* ─── helpers ─── */
function SectionLabel({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  if (collapsed) return <div className="my-2 border-t border-gray-100" />
  return (
    <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </p>
  )
}

function DynamicMenuItem({ item, collapsed, onNavigate }: { item: AppMenuItem; collapsed: boolean; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const hasChildren = item.children && item.children.length > 0
  const isActive = item.path && location.pathname === item.path

  if (!hasChildren) {
    return item.path ? (
      <Link
        to={item.path}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
        )}
      >
        {!collapsed && <span>{item.label}</span>}
      </Link>
    ) : null
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
      >
        {!collapsed && <span>{item.label}</span>}
        {!collapsed && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
      </button>

      {open && !collapsed && (
        <div className="ml-3 border-l border-gray-200 pl-3 space-y-0.5">
          {item.children!.map((child) =>
            child.path ? (
              <Link
                key={child.id}
                to={child.path}
                onClick={onNavigate}
                className={cn(
                  'block rounded-lg px-3 py-1.5 text-[15px] transition-colors',
                  location.pathname === child.path
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                {child.label}
              </Link>
            ) : (
              <span key={child.id} className="block px-3 py-1.5 text-[15px] text-gray-400">
                {child.label}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  )
}
