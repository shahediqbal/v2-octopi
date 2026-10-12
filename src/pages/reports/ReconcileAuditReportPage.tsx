import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Database, FileSpreadsheet, Loader2, RefreshCw, Scale, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { DropdownSelect } from '@/components/dropdowns'
import { useReconciliation, useAudit } from '@/hooks/useReconcileAudit'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { ReconcileAuditFilters } from '@/types/reconcileAuditReport'

function todayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
function firstDayOfMonth() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), '01'].join('-')
}
function fmtDate(value: string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateShort(value: string) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function fmtQty(value: number | null) {
  if (value == null) return '-'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const RECONCILIATION_COLUMNS = [
  { key: 'channelName', header: 'Channel' },
  { key: 'productName', header: 'Product' },
  { key: 'openingStock', header: 'Opening Stock', format: 'number' as const },
  { key: 'stockInQty', header: 'Stock In', format: 'number' as const },
  { key: 'stockOutQty', header: 'Stock Out', format: 'number' as const },
  { key: 'adjustmentQty', header: 'Adjustment', format: 'number' as const },
  { key: 'calculatedClosing', header: 'Calc. Closing', format: 'number' as const },
  { key: 'currentQty', header: 'Current Qty', format: 'number' as const },
  { key: 'variance', header: 'Variance', format: 'number' as const },
] as const

const AUDIT_COLUMNS = [
  { key: 'channelName', header: 'Channel' },
  { key: 'productName', header: 'Product' },
  { key: 'movementDate', header: 'Movement Date', format: 'date' as const },
  { key: 'movementType', header: 'Movement Type' },
  { key: 'referenceNo', header: 'Reference No' },
  { key: 'qtyIn', header: 'Qty In', format: 'number' as const },
  { key: 'qtyOut', header: 'Qty Out', format: 'number' as const },
  { key: 'qtyAdj', header: 'Qty Adj', format: 'number' as const },
  { key: 'qtyChange', header: 'Qty Change', format: 'number' as const },
  { key: 'runningBalance', header: 'Running Balance', format: 'number' as const },
  { key: 'openingBalanceAtStart', header: 'Opening Balance', format: 'number' as const },
  { key: 'remarks', header: 'Remarks', width: 25 },
] as const

export function ReconcileAuditReportPage() {
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'audit'>('reconciliation')
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [productId, setProductId] = useState<number | null>(null)
  const [productLabel, setProductLabel] = useState<string | null>(null)
  const [channelId, setChannelId] = useState<number | null>(null)
  const [channelLabel, setChannelLabel] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [reconcileRequested, setReconcileRequested] = useState(false)
  const [auditRequested, setAuditRequested] = useState(false)

  const filters: ReconcileAuditFilters = useMemo(
    () => ({
      productId: productId ?? 0,
      channelId: channelId ?? 0,
      dateFrom: fromDate,
      dateTo: toDate,
    }),
    [productId, channelId, fromDate, toDate],
  )

  const auditEnabled = productId != null && channelId != null && auditRequested

  const {
    data: reconcileData = [],
    isLoading: reconcileLoading,
    isError: reconcileError,
    error: reconcileErr,
    refetch: refetchReconcile,
  } = useReconciliation(filters, reconcileRequested)

  const {
    data: auditData = [],
    isLoading: auditLoading,
    isError: auditErrorState,
    error: auditErr,
    refetch: refetchAudit,
  } = useAudit(filters, auditEnabled)

  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return 'Both dates are required'
    if (new Date(fromDate) > new Date(toDate)) return "'From' date cannot be after 'To' date"
    return ''
  }, [fromDate, toDate])

  const auditDisabledMsg = productId == null || channelId == null
    ? 'Select both a Product and Channel to load the Audit tab'
    : ''

  const filteredReconcileData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return reconcileData
    return reconcileData.filter(
      (item) =>
        item.channelName?.toLowerCase().includes(q) ||
        item.productName?.toLowerCase().includes(q),
    )
  }, [reconcileData, searchTerm])

  const filteredAuditData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return auditData
    return auditData.filter(
      (item) =>
        item.referenceNo?.toLowerCase().includes(q) ||
        item.movementType?.toLowerCase().includes(q) ||
        item.productName?.toLowerCase().includes(q),
    )
  }, [auditData, searchTerm])

  // Reconcile stats
  const totalStockIn = useMemo(() => reconcileData.reduce((s, i) => s + (i.stockInQty ?? 0), 0), [reconcileData])
  const totalStockOut = useMemo(() => reconcileData.reduce((s, i) => s + (i.stockOutQty ?? 0), 0), [reconcileData])
  const totalAdjustment = useMemo(() => reconcileData.reduce((s, i) => s + (i.adjustmentQty ?? 0), 0), [reconcileData])
  const totalVariance = useMemo(() => reconcileData.reduce((s, i) => s + (i.variance ?? 0), 0), [reconcileData])
  // Audit stats
  const totalQtyIn = useMemo(() => auditData.reduce((s, i) => s + (i.qtyIn ?? 0), 0), [auditData])
  const totalQtyOut = useMemo(() => auditData.reduce((s, i) => s + (i.qtyOut ?? 0), 0), [auditData])
  const totalQtyChange = useMemo(() => auditData.reduce((s, i) => s + (i.qtyChange ?? 0), 0), [auditData])

  const resetLoad = useCallback(() => {
    setReconcileRequested(false)
    setAuditRequested(false)
  }, [])

  const handleLoad = useCallback(() => {
    if (dateError) return
    setReconcileRequested(true)
    void refetchReconcile()
    if (productId != null && channelId != null) {
      setAuditRequested(true)
      void refetchAudit()
    }
  }, [dateError, refetchReconcile, refetchAudit, productId, channelId])

  const handleExportReconcile = useCallback(async () => {
    if (filteredReconcileData.length === 0) return
    await exportExcelOnDemand({
      fileName: `Stock_Reconciliation_${fromDate}_to_${toDate}`,
      title: 'Stock Reconciliation Report',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Reconciliation',
      columns: [...RECONCILIATION_COLUMNS],
      data: filteredReconcileData as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Product', productLabel || 'All'],
        ['Channel', channelLabel || 'All'],
      ],
      summaryCards: [
        ['Total Products', reconcileData.length],
        ['Total Stock In', fmtQty(totalStockIn)],
        ['Total Stock Out', fmtQty(totalStockOut)],
        ['Total Variance', fmtQty(totalVariance)],
      ],
    })
  }, [filteredReconcileData, fromDate, toDate, productLabel, channelLabel, reconcileData.length, totalStockIn, totalStockOut, totalVariance])

  const handleExportAudit = useCallback(async () => {
    if (filteredAuditData.length === 0) return
    await exportExcelOnDemand({
      fileName: `Stock_Audit_${fromDate}_to_${toDate}`,
      title: 'Stock Audit Report',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Audit',
      columns: [...AUDIT_COLUMNS],
      data: filteredAuditData as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Product', productLabel || 'All'],
        ['Channel', channelLabel || 'All'],
      ],
      summaryCards: [
        ['Total Movements', auditData.length],
        ['Total Qty In', fmtQty(totalQtyIn)],
        ['Total Qty Out', fmtQty(totalQtyOut)],
        ['Total Qty Change', fmtQty(totalQtyChange)],
      ],
    })
  }, [filteredAuditData, fromDate, toDate, productLabel, channelLabel, auditData.length, totalQtyIn, totalQtyOut, totalQtyChange])

  const isLoading = reconcileLoading || (auditEnabled && auditLoading)
  const reconcileNoData = reconcileData.length === 0
  const auditNoData = auditData.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Reconcile &amp; Audit</h1>
        <p className="mt-1 text-sm text-gray-500">
          Reconcile stock movements and audit inventory changes by product and channel.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* ── Filters ── */}
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-4 py-4">
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); resetLoad() }}
              className={inputCls}
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); resetLoad() }}
              className={inputCls}
            />
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Product</label>
            <PaginatedCombobox
              type="product"
              value={productId}
              onValueChange={(value) => { setProductId(value); resetLoad() }}
              onLabelChange={setProductLabel}
              selectedLabel={productLabel}
              placeholder="All Products"
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Channel</label>
            <DropdownSelect
              type="channel"
              value={channelId}
              onValueChange={(value) => { setChannelId(value); resetLoad() }}
              onLabelChange={setChannelLabel}
              selectedLabel={channelLabel}
              placeholder="All Channels"
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Product, channel…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reconcileNoData ? (
              <button
                onClick={handleLoad}
                disabled={isLoading || !!dateError}
                className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Loading…' : 'Load Data'}
              </button>
            ) : (
              <>
                <button
                  onClick={activeTab === 'reconciliation' ? handleExportReconcile : handleExportAudit}
                  disabled={activeTab === 'reconciliation' ? filteredReconcileData.length === 0 : filteredAuditData.length === 0}
                  className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>
                <button
                  onClick={handleLoad}
                  disabled={isLoading || !!dateError}
                  className="action-report inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>

        {dateError && (
          <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle size={14} /> {dateError}
          </div>
        )}
        {isLoading && (
          <div className="h-1 w-full overflow-hidden bg-gray-100">
            <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded bg-gray-400" />
          </div>
        )}
        {reconcileError && (
          <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle size={14} /> {(reconcileErr as Error)?.message ?? 'Failed to load reconciliation data'}
          </div>
        )}

        {!isLoading && reconcileNoData && !reconcileRequested && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Scale size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Select filters and click Load Data. For the Audit tab, select both a Product and Channel.
            </p>
          </div>
        )}

        {!isLoading && reconcileRequested && reconcileNoData && !reconcileError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Database size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">No reconciliation records found for the selected filters.</p>
          </div>
        )}

        {/* ── Tabs ── */}
        {(!reconcileNoData || !auditNoData) && (
          <>
            <div className="flex border-b border-gray-200 px-4">
              <button
                onClick={() => setActiveTab('reconciliation')}
                className={`mr-4 border-b-2 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'reconciliation'
                    ? 'border-gray-800 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Reconciliation ({reconcileData.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                disabled={!!auditDisabledMsg && auditNoData}
                title={auditDisabledMsg}
                className={`mr-4 border-b-2 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 ${
                  activeTab === 'audit'
                    ? 'border-gray-800 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Audit ({auditData.length})
              </button>
            </div>

            {/* Reconciliation content */}
            {activeTab === 'reconciliation' && (
              <>
                {reconcileData.length > 0 && (
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                      <StatCard label="Total Products" value={String(reconcileData.length)} />
                      <StatCard label="Total Stock In" value={fmtQty(totalStockIn)} />
                      <StatCard label="Total Stock Out" value={fmtQty(totalStockOut)} />
                      <StatCard label="Total Adjustment" value={fmtQty(totalAdjustment)} />
                      <StatCard label="Total Variance" value={fmtQty(totalVariance)} accent />
                    </div>
                  </div>
                )}
                <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Channel</th>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold text-right">Opening</th>
                        <th className="px-4 py-3 font-semibold text-right">Stock In</th>
                        <th className="px-4 py-3 font-semibold text-right">Stock Out</th>
                        <th className="px-4 py-3 font-semibold text-right">Adjustment</th>
                        <th className="px-4 py-3 font-semibold text-right">Calc. Closing</th>
                        <th className="px-4 py-3 font-semibold text-right">Current Qty</th>
                        <th className="px-4 py-3 font-semibold text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredReconcileData.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                            No records match your search
                          </td>
                        </tr>
                      ) : (
                        filteredReconcileData.map((item, idx) => (
                          <tr key={idx} className="transition-colors hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-600">{item.channelName || '-'}</td>
                            <td className="px-4 py-2.5 font-medium text-gray-900">{item.productName || '-'}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.openingStock)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{fmtQty(item.stockInQty)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-amber-700">{fmtQty(item.stockOutQty)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.adjustmentQty)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.calculatedClosing)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900">{fmtQty(item.currentQty)}</td>
                            <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${(item.variance ?? 0) !== 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                              {fmtQty(item.variance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Audit content */}
            {activeTab === 'audit' && (
              <>
                {auditDisabledMsg && auditNoData ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                      <AlertCircle size={24} />
                    </div>
                    <p className="text-sm text-gray-500">{auditDisabledMsg}</p>
                  </div>
                ) : (
                  <>
                    {auditErrorState && (
                      <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                        <AlertCircle size={14} /> {(auditErr as Error)?.message ?? 'Failed to load audit data'}
                      </div>
                    )}
                    {auditData.length > 0 && (
                      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <StatCard label="Total Movements" value={String(auditData.length)} />
                          <StatCard label="Total Qty In" value={fmtQty(totalQtyIn)} />
                          <StatCard label="Total Qty Out" value={fmtQty(totalQtyOut)} />
                          <StatCard label="Total Qty Change" value={fmtQty(totalQtyChange)} accent />
                        </div>
                      </div>
                    )}
                    <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Channel</th>
                            <th className="px-4 py-3 font-semibold">Product</th>
                            <th className="px-4 py-3 font-semibold">Movement Date</th>
                            <th className="px-4 py-3 font-semibold">Movement Type</th>
                            <th className="px-4 py-3 font-semibold">Reference No</th>
                            <th className="px-4 py-3 font-semibold text-right">Qty In</th>
                            <th className="px-4 py-3 font-semibold text-right">Qty Out</th>
                            <th className="px-4 py-3 font-semibold text-right">Qty Adj</th>
                            <th className="px-4 py-3 font-semibold text-right">Qty Change</th>
                            <th className="px-4 py-3 font-semibold text-right">Running Bal.</th>
                            <th className="px-4 py-3 font-semibold">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredAuditData.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="px-4 py-10 text-center text-gray-400">
                                {auditNoData ? 'No audit records found' : 'No records match your search'}
                              </td>
                            </tr>
                          ) : (
                            filteredAuditData.map((item, idx) => (
                              <tr key={idx} className="transition-colors hover:bg-gray-50">
                                <td className="px-4 py-2.5 text-gray-600">{item.channelName || '-'}</td>
                                <td className="px-4 py-2.5 font-medium text-gray-900">{item.productName || '-'}</td>
                                <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.movementDate)}</td>
                                <td className="px-4 py-2.5 text-gray-600">{item.movementType || '-'}</td>
                                <td className="px-4 py-2.5 text-gray-700">{item.referenceNo || '-'}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{fmtQty(item.qtyIn)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-amber-700">{fmtQty(item.qtyOut)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.qtyAdj)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900">{fmtQty(item.qtyChange)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.runningBalance)}</td>
                                <td className="max-w-[160px] truncate px-4 py-2.5 text-gray-500" title={item.remarks ?? ''}>{item.remarks || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
              <p className="text-xs text-gray-500">
                {activeTab === 'reconciliation'
                  ? `Showing ${filteredReconcileData.length} of ${reconcileData.length} reconciliation records`
                  : `Showing ${filteredAuditData.length} of ${auditData.length} audit movements`}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-gray-800' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}
