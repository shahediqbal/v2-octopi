import { useEffect, useMemo } from 'react'
import { Clock3, X } from 'lucide-react'
import { DashboardDataTable } from '@/components/dashboard/DashboardDataTable'
import { DashboardExcelButton } from '@/components/dashboard/DashboardExcelButton'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { CreditRiskCustomer } from '@/types/superAdminDashboard'
import type { CreditRiskAnalysisRow } from '@/utils/creditRiskAnalysis'

export type CreditAgingBucket = 'days0To30' | 'days31To60' | 'days61To90' | 'daysOver90'

const bucketLabels: Record<CreditAgingBucket, string> = {
  days0To30: '0–30 days',
  days31To60: '31–60 days',
  days61To90: '61–90 days',
  daysOver90: 'Over 90 days',
}

interface CreditAgingDrilldownModalProps {
  bucket: CreditAgingBucket
  asOfDate: string
  customers: CreditRiskCustomer[]
  accountingRows: CreditRiskAnalysisRow[]
  isLoading: boolean
  isError: boolean
  onClose: () => void
}

interface AgingCustomerRow {
  customerId: number
  customerName: string
  marketingName: string
  opening: number
  sales: number
  payment: number
  closing: number
  agingAmount: number
  agingDays: number
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function money(value: number) {
  return `৳ ${value.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function CreditAgingDrilldownModal({
  bucket,
  asOfDate,
  customers,
  accountingRows,
  isLoading,
  isError,
  onClose,
}: CreditAgingDrilldownModalProps) {
  const label = bucketLabels[bucket]
  const rows = useMemo(() => {
    const accountingByCustomer = new Map(
      accountingRows.map(row => [normalizeName(row.customerName), row]),
    )

    return customers
      .filter(customer => customer[bucket] > 0)
      .map<AgingCustomerRow>(customer => {
        const accounting = accountingByCustomer.get(normalizeName(customer.customerName))
        return {
          customerId: customer.customerId,
          customerName: customer.customerName,
          marketingName: accounting?.marketingName || customer.marketingName || 'Unassigned',
          opening: accounting?.opening ?? 0,
          sales: accounting?.sales ?? 0,
          payment: accounting?.payment ?? 0,
          closing: accounting?.closing ?? customer.totalDue,
          agingAmount: customer[bucket],
          agingDays: customer.oldestDueDays,
        }
      })
  }, [accountingRows, bucket, customers])

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
      fileName: `Dashboard_Customer_Aging_${bucket}_${asOfDate}`,
      title: `Customer Credit Aging — ${label}`,
      subtitle: `As of ${asOfDate}`,
      sheetName: 'Customer Aging',
      columns: [
        { key: 'customerName', header: 'Customer', width: 30 },
        { key: 'marketingName', header: 'Marketing', width: 22 },
        { key: 'opening', header: 'Opening', format: 'number' },
        { key: 'sales', header: 'Sales', format: 'number' },
        { key: 'payment', header: 'Payment / Recovery', format: 'number' },
        { key: 'closing', header: 'Closing', format: 'number' },
        { key: 'agingAmount', header: `${label} Due`, format: 'number' },
        { key: 'agingDays', header: 'Oldest Aging Days', format: 'integer' },
      ],
      data: rows as unknown as Record<string, unknown>[],
      filters: [
        ['Aging Range', label],
        ['As of Date', asOfDate],
      ],
      summaryCards: [
        ['Customers', rows.length],
        [`${label} Due`, rows.reduce((sum, row) => sum + row.agingAmount, 0)],
        ['Closing Balance', rows.reduce((sum, row) => sum + row.closing, 0)],
      ],
    })
  }

  return <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="credit-aging-title"
    onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}
  >
    <div className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-xl bg-red-100 p-2.5 text-red-700"><Clock3 size={20} /></div>
          <div>
            <h2 id="credit-aging-title" className="text-lg font-bold text-slate-950">Customer Credit Aging — {label}</h2>
            <p className="mt-0.5 text-xs text-slate-500">Opening, sales, recovery, closing and bucket due · as of {asOfDate}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close aging details">
          <X size={19} />
        </button>
      </header>

      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-500">{rows.length} customers · {money(rows.reduce((sum, row) => sum + row.agingAmount, 0))}</p>
        <DashboardExcelButton disabled={isLoading || isError || !rows.length} onExport={exportRows} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {!isLoading && !isError && <DashboardDataTable
          rows={rows}
          minWidthClassName="min-w-[1180px]"
          defaultSort={{ columnId: 'agingAmount', direction: 'desc' }}
          initialRowCount={20}
          rowKey={row => row.customerId}
          columns={[
            { id: 'customer', header: 'Customer', sortValue: row => row.customerName, render: row => <span className="font-semibold text-slate-900">{row.customerName}</span> },
            { id: 'marketing', header: 'Marketing', sortValue: row => row.marketingName, render: row => row.marketingName },
            { id: 'opening', header: 'Opening', align: 'right', sortValue: row => row.opening, render: row => money(row.opening) },
            { id: 'sales', header: 'Sales', align: 'right', sortValue: row => row.sales, render: row => money(row.sales) },
            { id: 'payment', header: 'Payment / recovery', align: 'right', sortValue: row => row.payment, render: row => <span className="font-semibold text-emerald-700">{money(row.payment)}</span> },
            { id: 'closing', header: 'Closing', align: 'right', sortValue: row => row.closing, render: row => money(row.closing) },
            { id: 'agingAmount', header: `${label} due`, align: 'right', sortValue: row => row.agingAmount, render: row => <span className="font-semibold text-red-700">{money(row.agingAmount)}</span> },
            { id: 'agingDays', header: 'Oldest aging', align: 'right', sortValue: row => row.agingDays, render: row => `${row.agingDays} days` },
          ]}
        />}
        {isLoading && <p className="py-10 text-center text-sm text-slate-500">Loading aging details…</p>}
        {isError && <p className="py-10 text-center text-sm font-medium text-red-600">Credit-aging details could not be loaded.</p>}
      </div>
    </div>
  </div>
}
