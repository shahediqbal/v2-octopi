import { useEffect } from 'react'
import { Users, X } from 'lucide-react'
import { DashboardDataTable } from '@/components/dashboard/DashboardDataTable'
import { DashboardExcelButton } from '@/components/dashboard/DashboardExcelButton'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { CreditRiskAnalysisRow } from '@/utils/creditRiskAnalysis'

interface MarketingPerformanceDrilldownModalProps {
  marketingName: string
  startDate: string
  endDate: string
  rows: CreditRiskAnalysisRow[]
  isLoading: boolean
  isError: boolean
  onClose: () => void
}

function money(value: number) {
  return `৳ ${value.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function MarketingPerformanceDrilldownModal({
  marketingName,
  startDate,
  endDate,
  rows,
  isLoading,
  isError,
  onClose,
}: MarketingPerformanceDrilldownModalProps) {
  const safeMarketingName = marketingName.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '')

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const exportRows = async () => {
    await exportExcelOnDemand({
      fileName: `Dashboard_Marketing_Customers_${safeMarketingName || 'Unassigned'}_${startDate}_to_${endDate}`,
      title: 'Marketing Performance — Customer Details',
      subtitle: `${marketingName} · ${startDate} to ${endDate}`,
      sheetName: 'Customer Details',
      columns: [
        { key: 'customerName', header: 'Customer Name', width: 32 },
        { key: 'opening', header: 'Opening Balance', format: 'number' },
        { key: 'sales', header: 'Sales', format: 'number' },
        { key: 'recovery', header: 'Recovery', format: 'number' },
        { key: 'closing', header: 'Closing Balance', format: 'number' },
      ],
      data: rows.map(row => ({
        customerName: row.customerName,
        opening: row.opening,
        sales: row.sales,
        recovery: row.payment,
        closing: row.closing,
      })),
      filters: [
        ['Marketing', marketingName],
        ['Date Range', `${startDate} – ${endDate}`],
      ],
      summaryCards: [
        ['Customers', rows.length],
        ['Opening Balance', rows.reduce((sum, row) => sum + row.opening, 0)],
        ['Sales', rows.reduce((sum, row) => sum + row.sales, 0)],
        ['Recovery', rows.reduce((sum, row) => sum + row.payment, 0)],
        ['Closing Balance', rows.reduce((sum, row) => sum + row.closing, 0)],
      ],
    })
  }

  return <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="marketing-performance-drilldown-title"
    onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}
  >
    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700"><Users size={20} /></div>
          <div className="min-w-0">
            <h2 id="marketing-performance-drilldown-title" className="truncate text-lg font-bold text-slate-950">
              {marketingName} — Customer Details
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Opening, sales, recovery and closing balance · {startDate} to {endDate}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Close customer details"
        >
          <X size={19} />
        </button>
      </header>

      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-500">{rows.length} customers</p>
        <DashboardExcelButton
          disabled={isLoading || isError || !rows.length}
          onExport={exportRows}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {!isLoading && !isError && <DashboardDataTable
          rows={rows}
          minWidthClassName="min-w-[820px]"
          defaultSort={{ columnId: 'closing', direction: 'desc' }}
          initialRowCount={20}
          rowKey={(row, index) => `${row.customerName}-${index}`}
          columns={[
            {
              id: 'customer',
              header: 'Customer name',
              sortValue: row => row.customerName,
              render: row => <span className="font-semibold text-slate-900">{row.customerName}</span>,
            },
            {
              id: 'opening',
              header: 'Opening',
              align: 'right',
              sortValue: row => row.opening,
              render: row => money(row.opening),
            },
            {
              id: 'sales',
              header: 'Sales',
              align: 'right',
              sortValue: row => row.sales,
              render: row => money(row.sales),
            },
            {
              id: 'recovery',
              header: 'Recovery',
              align: 'right',
              sortValue: row => row.payment,
              render: row => <span className="font-semibold text-emerald-700">{money(row.payment)}</span>,
            },
            {
              id: 'closing',
              header: 'Closing',
              align: 'right',
              sortValue: row => row.closing,
              render: row => <span className={row.closing > 0 ? 'font-semibold text-red-700' : 'font-semibold text-slate-900'}>{money(row.closing)}</span>,
            },
          ]}
        />}

        {isLoading && <p className="py-10 text-center text-sm text-slate-500">Loading customer details…</p>}
        {isError && <p className="py-10 text-center text-sm font-medium text-red-600">Customer details could not be loaded. Please try again.</p>}
      </div>
    </div>
  </div>
}
