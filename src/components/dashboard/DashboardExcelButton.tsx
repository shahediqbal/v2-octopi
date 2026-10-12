import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface DashboardExcelButtonProps {
  onExport: () => Promise<void>
  disabled?: boolean
  label?: string
}

export function DashboardExcelButton({
  onExport,
  disabled = false,
  label = 'Excel',
}: DashboardExcelButtonProps) {
  const [exporting, setExporting] = useState(false)

  const runExport = async () => {
    if (disabled || exporting) return
    setExporting(true)
    try {
      await onExport()
    } finally {
      setExporting(false)
    }
  }

  return <button
    type="button"
    disabled={disabled || exporting}
    onClick={() => void runExport()}
    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
    {exporting ? 'Exporting…' : label}
  </button>
}
