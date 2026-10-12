import { useMemo, useState } from 'react'
import { AlertCircle, FileSpreadsheet, Loader2, RefreshCw, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import {
  useStockOutPendingGrid,
  useStockOutPendingPopup,
  useStockOutPendingStatuses,
  useUpdateStockOutStatus,
} from '@/hooks/useStockOut'
import { StatusUpdateModal } from '@/pages/sales-orders/StatusUpdateModal'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { StockOutListRow, StockOutPendingPopupItem } from '@/types/stockOut'

const PENDING_EXPORT_COLUMNS = [
  { key: 'soSystemNo', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'customerAddress', header: 'Customer Address' },
  { key: 'sobFinalBill', header: 'Invoice Value', format: 'number' as const },
  { key: 'jobType', header: 'Sales Type' },
  { key: 'soSystemPending', header: 'Work Pending' },
  { key: 'soDecesionPending', header: 'Decision Pending' },
  { key: 'actionTakenRemarks', header: 'Remarks' },
]

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

export function PendingStatusPage() {
  const [startDate, setStartDate] = useState(todayInput())
  const [endDate, setEndDate] = useState(todayInput())
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [selectedRow, setSelectedRow] = useState<StockOutListRow | null>(null)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useStockOutPendingGrid({ status: '0', startDate, endDate, customerId })
  const { data: pendingStatuses = [] } = useStockOutPendingStatuses('true')
  const { data: pendingPopup, isLoading: loadingPopup } = useStockOutPendingPopup(selectedRowId ?? undefined)
  const updateStatusMutation = useUpdateStockOutStatus()

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    let result = !query
      ? rows
      : rows.filter((row) =>
          [
            row.soSystemNo,
            row.customerName,
            row.customerAddress,
            row.soSystemPending,
            row.soDecesionPending,
            row.actionTakenRemarks,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(query),
        )

    if (sortCol) {
      result = [...result].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortCol] ?? ''
        const bVal = (b as Record<string, unknown>)[sortCol] ?? ''
        const cmp =
          typeof aVal === 'number' && typeof bVal === 'number'
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal))
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [rows, search, sortCol, sortDir])

  const handleSort = (col: string) => {
    setSortCol((prev) => {
      if (prev === col) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return col
      }
      setSortDir('asc')
      return col
    })
  }

  const sortIndicator = (col: string) =>
    sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  const handleExport = async () => {
    if (filteredRows.length === 0) return

    await exportExcelOnDemand({
      fileName: `StockOut_Pending_${startDate}_${endDate}`,
      title: 'Pending Status Management',
      subtitle: `${startDate} to ${endDate}`,
      sheetName: 'Pending Status',
      columns: PENDING_EXPORT_COLUMNS,
      data: filteredRows as unknown as Record<string, unknown>[],
      filters: [
        ['Start Date', startDate],
        ['End Date', endDate],
        ['Customer', customerId ? String(customerId) : 'All'],
      ],
      summaryCards: [['Rows', filteredRows.length]],
    })
  }

  const handleModalSubmit = async (statusId: number, remarks: string) => {
    if (!selectedRow) return

    await updateStatusMutation.mutateAsync({
      soSystemId: selectedRow.soSystemId,
      associateCurrenStatus: statusId,
      remarks,
    })

    setSelectedRow(null)
    setSelectedRowId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Status</h1>
        <p className="mt-1 text-sm text-gray-500">Review orders with pending work, filter by date or customer, and update the next operational status in place.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[12rem_12rem_16rem_minmax(0,1fr)_auto]">
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        <input
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        <PaginatedCombobox type="customer" value={customerId} onValueChange={setCustomerId} placeholder="Filter customer..." />
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoice, customer, pending state..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="action-report inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredRows.length === 0}
            className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading pending orders…</span>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load pending orders</p>
            <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Action</th>
                  <th className="cursor-pointer select-none px-5 py-3 hover:text-gray-600" onClick={() => handleSort('soSystemNo')}>Invoice No{sortIndicator('soSystemNo')}</th>
                  <th className="cursor-pointer select-none px-5 py-3 hover:text-gray-600" onClick={() => handleSort('invoiceDate')}>Invoice Date{sortIndicator('invoiceDate')}</th>
                  <th className="cursor-pointer select-none px-5 py-3 hover:text-gray-600" onClick={() => handleSort('customerName')}>Customer{sortIndicator('customerName')}</th>
                  <th className="cursor-pointer select-none px-5 py-3 hover:text-gray-600" onClick={() => handleSort('customerAddress')}>Address{sortIndicator('customerAddress')}</th>
                  <th className="cursor-pointer select-none px-5 py-3 hover:text-gray-600" onClick={() => handleSort('sobFinalBill')}>Invoice Value{sortIndicator('sobFinalBill')}</th>
                  <th className="cursor-pointer select-none px-5 py-3 hover:text-gray-600" onClick={() => handleSort('jobType')}>Sales Type{sortIndicator('jobType')}</th>
                  <th className="cursor-pointer select-none px-5 py-3 hover:text-gray-600" onClick={() => handleSort('soSystemPending')}>Work Pending{sortIndicator('soSystemPending')}</th>
                  <th className="cursor-pointer select-none px-5 py-3 hover:text-gray-600" onClick={() => handleSort('soDecesionPending')}>Decision Pending{sortIndicator('soDecesionPending')}</th>
                  <th className="px-5 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-gray-400">No pending orders matched the current filters.</td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.soSystemId} className="transition-colors hover:bg-gray-50/60">
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRow(row)
                            setSelectedRowId(row.soSystemId)
                          }}
                          className="action-update inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Update
                        </button>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">{row.soSystemNo ?? row.soSystemId}</td>
                      <td className="px-5 py-3 text-gray-700">{row.invoiceDate ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-700">{row.customerName ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{row.customerAddress ?? '—'}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{formatAmount(row.sobFinalBill ?? row.finalBill)}</td>
                      <td className="px-5 py-3 text-gray-700">{row.jobType ?? '—'}</td>
                      <td className="px-5 py-3"><PendingBadge value={row.soSystemPending} /></td>
                      <td className="px-5 py-3 text-gray-700">{row.soDecesionPending ?? 'No Status'}</td>
                      <td className="px-5 py-3 text-gray-600">{row.actionTakenRemarks ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRowId != null && (
        <StatusUpdateModal
          item={(pendingPopup ?? selectedRow) as StockOutPendingPopupItem | null}
          options={pendingStatuses}
          isSubmitting={updateStatusMutation.isPending || loadingPopup}
          onClose={() => {
            setSelectedRow(null)
            setSelectedRowId(null)
          }}
          onSubmit={(statusId, remarks) => void handleModalSubmit(statusId, remarks)}
        />
      )}
    </div>
  )
}

function PendingBadge({ value }: { value: string | null | undefined }) {
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
      {value ?? 'No Status'}
    </span>
  )
}

function formatAmount(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0)
  if (Number.isNaN(numeric)) return '0.00'
  return numeric.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}