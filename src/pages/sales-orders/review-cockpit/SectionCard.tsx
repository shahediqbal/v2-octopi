import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  subtitle?: string
  right?: ReactNode
  action?: ReactNode
  children: ReactNode
}

export function SectionCard({ title, subtitle, right, action, children }: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {right}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}
