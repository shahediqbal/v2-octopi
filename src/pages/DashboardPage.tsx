import { LayoutDashboard } from 'lucide-react'

export function DashboardPage() {
  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <LayoutDashboard size={26} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Welcome to Octopi ERP</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Select an assigned module from the navigation menu to continue.
        </p>
      </div>
    </div>
  )
}
