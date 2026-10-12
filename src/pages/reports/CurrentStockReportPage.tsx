import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Database, FileSpreadsheet, PackagePlus, RefreshCw, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { DropdownSelect } from '@/components/dropdowns'
import { useCurrentStock } from '@/hooks/useCurrentStock'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { CurrentStockFilters } from '@/types/currentStock'

function fmtQty(value: number | null) {
  if (value == null) return '-'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const EXCEL_COLUMNS = [
  { key: 'productCategoryName', header: 'Category' },
  { key: 'productId', header: 'Product ID', format: 'integer' as const },
  { key: 'productName', header: 'Product Name' },
  { key: 'channelName', header: 'Channel' },
  { key: 'currentQty', header: 'Current Qty', format: 'number' as const },
] as const

export function CurrentStockReportPage() {
  const [productId, setProductId] = useState<number | null>(null)
  const [productLabel, setProductLabel] = useState<string | null>(null)
  const [channelId, setChannelId] = useState<number | null>(null)
  const [channelLabel, setChannelLabel] = useState<string | null>(null)
  const [hasRequested, setHasRequested] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<CurrentStockFilters>({ productId: 0, channelId: 0 })
  const [appliedProductLabel, setAppliedProductLabel] = useState<string | null>(null)
  const [appliedChannelLabel, setAppliedChannelLabel] = useState<string | null>(null)
  const [requestToken, setRequestToken] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const draftFilters: CurrentStockFilters = useMemo(
    () => ({ productId: productId ?? 0, channelId: channelId ?? 0 }),
    [productId, channelId],
  )

  const {
    data: reportData = [],
    isLoading,
    isError,
    error,
  } = useCurrentStock(appliedFilters, requestToken, hasRequested)

  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return reportData
    return reportData.filter(
      (item) =>
        item.productName?.toLowerCase().includes(q) ||
        item.productCategoryName?.toLowerCase().includes(q) ||
        item.channelName?.toLowerCase().includes(q),
    )
  }, [reportData, searchTerm])

  const totalQty = useMemo(
    () => reportData.reduce((s, i) => s + (i.currentQty ?? 0), 0),
    [reportData],
  )

  const isAllFiltersApplied = appliedFilters.productId === 0 && appliedFilters.channelId === 0

  const handleRefresh = useCallback(() => {
    setHasRequested(true)
    setAppliedProductLabel(productLabel ?? null)
    setAppliedChannelLabel(channelLabel ?? null)
    setAppliedFilters(draftFilters)
    setRequestToken((token) => token + 1)
  }, [draftFilters, productLabel, channelLabel])

  const handleExport = useCallback(async () => {
    if (filteredData.length === 0) return
    try {
      await exportExcelOnDemand({
        fileName: `Current_Stock_${appliedProductLabel ?? 'All'}_${appliedChannelLabel ?? 'All'}`,
        title: 'Current Stock Report',
        subtitle: `Product: ${appliedProductLabel ?? 'All'} | Channel: ${appliedChannelLabel ?? 'All'}`,
        sheetName: 'Current Stock',
        columns: [...EXCEL_COLUMNS],
        data: filteredData as unknown as Record<string, unknown>[],
        filters: [
          ['Product', appliedProductLabel || 'All'],
          ['Channel', appliedChannelLabel || 'All'],
        ],
        summaryCards: [
          ['Total Records', reportData.length],
          ['Filtered', filteredData.length],
          ['Total Qty', fmtQty(totalQty)],
        ],
      })
    } catch {
      alert('Failed to export Excel file. Please try again.')
    }
  }, [filteredData, appliedProductLabel, appliedChannelLabel, reportData.length, totalQty])

  const noData = hasRequested && reportData.length === 0
  const showInitialState = !hasRequested && !isLoading && !isError

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Current Stock Report</h1>
        <p className="mt-1 text-sm text-gray-500">Set filters if needed, then click Refresh to load current stock data.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-4 py-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Product</label>
            <PaginatedCombobox
              type="product"
              value={productId}
              onValueChange={(v, l) => { setProductId(v); setProductLabel(l ?? null) }}
              placeholder="All Products"
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Channel</label>
            <DropdownSelect
              type="channel"
              value={channelId}
              onValueChange={(v, l) => { setChannelId(v); setChannelLabel(l ?? null) }}
              placeholder="All Channels"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Product, category…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="action-report inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={filteredData.length === 0}
              className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileSpreadsheet size={14} />Excel
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="h-1 w-full overflow-hidden bg-gray-100">
            <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded bg-gray-400" />
          </div>
        )}
        {isError && (
          <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle size={14} /> {(error as Error)?.message ?? 'Failed to load data'}
          </div>
        )}

        {showInitialState && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Database size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Load Stock Records</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Use filters if needed, then click Refresh to load stock records.
            </p>
          </div>
        )}

        {!isLoading && noData && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              {isAllFiltersApplied ? <PackagePlus size={28} /> : <Database size={28} />}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Records Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {isAllFiltersApplied
                ? 'No stock records are available right now.'
                : 'No stock records match the selected filters.'}
            </p>
          </div>
        )}

        {!showInitialState && !noData && (
          <>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <StatCard label="Total Records" value={String(reportData.length)} />
                <StatCard label="Filtered" value={String(filteredData.length)} />
                <StatCard label="Total Qty" value={fmtQty(totalQty)} accent />
              </div>
            </div>

            <div className="max-h-[calc(100vh-400px)] overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Product ID</th>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Channel</th>
                    <th className="px-4 py-3 font-semibold text-right">Current Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400">No records match your search</td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-600">{item.productCategoryName || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.productId ?? '-'}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{item.productName || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.channelName || '-'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium text-emerald-700">{fmtQty(item.currentQty)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
              <p className="text-xs text-gray-500">Showing {filteredData.length} of {reportData.length} records</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'
function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-gray-800' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}
