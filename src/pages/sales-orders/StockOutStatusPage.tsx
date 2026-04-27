import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, FileSpreadsheet, Loader2, RefreshCw, RotateCcw, Search } from 'lucide-react'
import {
  useStockOutPendingPopup,
  useStockOutPendingStatuses,
  useStockOutStatusList,
  useUpdateStockOutStatus,
} from '@/hooks/useStockOut'
import { StatusUpdateModal } from '@/pages/sales-orders/StatusUpdateModal'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { StockOutListRow, StockOutLookupOption, StockOutPendingPopupItem } from '@/types/stockOut'

const STATUS_EXPORT_COLUMNS = [
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

function getAllPendingOption(scope: 'work' | 'decision'): StockOutLookupOption {
  return {
    id: scope === 'work' ? -1 : -2,
    label: 'All pending',
  }
}

export function StockOutStatusPage() {
  const [pendingScope, setPendingScope] = useState<'work' | 'decision'>('work')
  const [selectedPendingId, setSelectedPendingId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [selectedRow, setSelectedRow] = useState<StockOutListRow | null>(null)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)

  const { data: pendingStatuses = [], isLoading: loadingStatuses } = useStockOutPendingStatuses('true')
  const statusOptions = useMemo(
    () => [getAllPendingOption(pendingScope), ...pendingStatuses],
    [pendingScope, pendingStatuses],
  )

  useEffect(() => {
    setSelectedPendingId(String(getAllPendingOption(pendingScope).id))
  }, [pendingScope])

  const currentStatus = selectedPendingId || String(getAllPendingOption(pendingScope).id)
  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useStockOutStatusList({ status: currentStatus })
  const { data: pendingPopup, isLoading: loadingPopup } = useStockOutPendingPopup(selectedRowId ?? undefined)
  const updateStatusMutation = useUpdateStockOutStatus()

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows

    return rows.filter((row) =>
      [
        row.soSystemNo,
        row.customerName,
        row.customerAddress,
        row.jobType,
        row.soSystemPending,
        row.soDecesionPending,
        row.actionTakenRemarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [rows, search])

  const handleExport = async () => {
    if (filteredRows.length === 0) return

    await exportExcelOnDemand({
      fileName: `StockOut_Status_${currentStatus}`,
      title: 'Stock-Out Status Monitoring',
      subtitle: pendingScope === 'decision' ? 'Decision pending view' : 'Work pending view',
      sheetName: 'Stock-Out Status',
      columns: STATUS_EXPORT_COLUMNS,
      data: filteredRows as unknown as Record<string, unknown>[],
      filters: [
        ['Pending Scope', pendingScope === 'decision' ? 'Decision Pending' : 'Work Pending'],
        ['Selected Pending', statusOptions.find((option) => String(option.id) === currentStatus)?.label ?? 'All pending'],
      ],
      summaryCards: [['Rows', filteredRows.length]],
    })
  }

  const handleResume = async (row: StockOutListRow) => {
    await updateStatusMutation.mutateAsync({
      soSystemId: row.soSystemId,
      associateCurrenStatus: 20,
      remarks: '',
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
        <h1 className="text-2xl font-bold text-gray-900">Stock-Out Status</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor pending workflow states and update the next operational decision without reloading the module.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[14rem_18rem_minmax(0,1fr)_auto]">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">Pending Scope</label>
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setPendingScope('work')}
                className={pendingScope === 'work'
                  ? 'flex-1 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white'
                  : 'flex-1 rounded-md px-3 py-2 text-sm font-semibold text-gray-700'}
              >
                Work Pending
              </button>
              <button
                type="button"
                onClick={() => setPendingScope('decision')}
                className={pendingScope === 'decision'
                  ? 'flex-1 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white'
                  : 'flex-1 rounded-md px-3 py-2 text-sm font-semibold text-gray-700'}
              >
                Decision Pending
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">Pending Type</label>
            <select
              value={currentStatus}
              onChange={(event) => setSelectedPendingId(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              disabled={loadingStatuses}
            >
              {statusOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">Search</label>
            <Search size={16} className="absolute left-3 top-[2.35rem] -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Invoice, customer, pending state..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={filteredRows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading stock-out status data…</span>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load stock-out status rows</p>
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
                  <th className="px-5 py-3">Invoice No</th>
                  <th className="px-5 py-3">Invoice Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Address</th>
                  <th className="px-5 py-3">Invoice Value</th>
                  <th className="px-5 py-3">Sales Type</th>
                  <th className="px-5 py-3">Work Pending</th>
                  <th className="px-5 py-3">Decision Pending</th>
                  <th className="px-5 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-gray-400">No status rows found for the selected pending state.</td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.soSystemId} className="transition-colors hover:bg-gray-50/60">
                      <td className="px-5 py-3">
                        {pendingScope === 'decision' ? (
                          <button
                            type="button"
                            onClick={() => void handleResume(row)}
                            disabled={updateStatusMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                          >
                            <RotateCcw size={12} /> Resume
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRow(row)
                              setSelectedRowId(row.soSystemId)
                            }}
                            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Update
                          </button>
                        )}
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