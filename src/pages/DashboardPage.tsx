import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Truck,
  Users,
  ArrowUpRight,
  BarChart3,
  Package,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── summary cards ─── */
const summaryCards = [
  {
    title: 'Total Revenue',
    value: '৳ 12,45,890',
    change: '+12.5%',
    trend: 'up' as const,
    icon: DollarSign,
    color: 'bg-emerald-500',
  },
  {
    title: 'Total Orders',
    value: '1,284',
    change: '+8.2%',
    trend: 'up' as const,
    icon: ShoppingCart,
    color: 'bg-gray-500',
  },
  {
    title: 'Deliveries',
    value: '956',
    change: '-3.1%',
    trend: 'down' as const,
    icon: Truck,
    color: 'bg-gray-600',
  },
  {
    title: 'Active Customers',
    value: '342',
    change: '+5.7%',
    trend: 'up' as const,
    icon: Users,
    color: 'bg-amber-500',
  },
]

/* ─── recent orders placeholder ─── */
const recentOrders = [
  { id: 'SO-10234', customer: 'Dhaka Traders Ltd', amount: '৳ 45,200', status: 'Delivered', date: '24 Feb 2026' },
  { id: 'SO-10233', customer: 'Chittagong Exports', amount: '৳ 1,28,500', status: 'In Transit', date: '24 Feb 2026' },
  { id: 'SO-10232', customer: 'Sylhet Agro Corp', amount: '৳ 22,800', status: 'Processing', date: '23 Feb 2026' },
  { id: 'SO-10231', customer: 'Rajshahi Retail', amount: '৳ 67,350', status: 'Delivered', date: '23 Feb 2026' },
  { id: 'SO-10230', customer: 'Khulna Industries', amount: '৳ 93,100', status: 'Pending', date: '22 Feb 2026' },
]

const statusColor: Record<string, string> = {
  Delivered: 'bg-emerald-100 text-emerald-700',
  'In Transit': 'bg-gray-200 text-gray-700',
  Processing: 'bg-amber-100 text-amber-700',
  Pending: 'bg-gray-100 text-gray-600',
}

/* ─── quick actions ─── */
const quickActions = [
  { label: 'New Sales Order', icon: ShoppingCart, href: '#' },
  { label: 'Sales Report', icon: BarChart3, href: '/reports/sales' },
  { label: 'Delivery Report', icon: Truck, href: '/reports/delivery' },
  { label: 'Stock Overview', icon: Package, href: '#' },
]

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back — here's what's happening today.</p>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-white', card.color)}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                {card.trend === 'up' ? (
                  <TrendingUp size={14} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={14} className="text-red-500" />
                )}
                <span className={card.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}>
                  {card.change}
                </span>
                <span className="text-gray-400">vs last month</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* recent orders table */}
        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
            <button className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-600">
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-700">{order.id}</td>
                    <td className="px-5 py-3 text-gray-700">{order.customer}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{order.amount}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                          statusColor[order.status] ?? 'bg-gray-100 text-gray-600',
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* right sidebar widgets */}
        <div className="space-y-6">
          {/* quick actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <a
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center hover:border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    <Icon size={20} className="text-gray-700" />
                    <span className="text-xs font-medium text-gray-700">{action.label}</span>
                  </a>
                )
              })}
            </div>
          </div>

          {/* activity feed */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { text: 'Invoice #INV-4521 generated', time: '2 min ago' },
                { text: 'Stock entry for Warehouse A', time: '15 min ago' },
                { text: 'Delivery confirmed: SO-10234', time: '1 hour ago' },
                { text: 'New customer: Khulna Industries', time: '3 hours ago' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{item.text}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
