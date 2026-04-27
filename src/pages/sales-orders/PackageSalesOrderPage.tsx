import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PackagingItemTable } from '@/pages/sales-orders/PackagingItemTable'
import {
  extractApiErrorMessage,
  extractApiResponseErrorMessage,
  mapOrderDetailToPackagingRows,
  mapPackagingRowsToPayload,
  type PackagingRowValue,
} from '@/pages/sales-orders/stockOutMappers'
import { applyAutoFill, removePackagingRow, updatePackagingRow, validatePackagingRows } from '@/pages/sales-orders/packagingUtils'
import { useCompletePackaging, useStockOutDetail, useStockOutLookups } from '@/hooks/useStockOut'

export function PackageSalesOrderPage() {
  const { id } = useParams<{ id: string }>()
  const salesOrderId = Number(id)
  const navigate = useNavigate()
  const { data: detail, isLoading, isError, error } = useStockOutDetail(salesOrderId || undefined)
  const { data: lookups } = useStockOutLookups()
  const packageMutation = useCompletePackaging()
  const [rows, setRows] = useState<PackagingRowValue[]>([])
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (detail) {
      setRows(mapOrderDetailToPackagingRows(detail))
    }
  }, [detail])

  const validation = useMemo(() => validatePackagingRows(rows), [rows])

  const handleSubmit = async () => {
    setServerError('')
    if (!validation.isValid) {
      setServerError(validation.message)
      return
    }

    try {
      const response = await packageMutation.mutateAsync(mapPackagingRowsToPayload(salesOrderId, rows))
      const responseError = extractApiResponseErrorMessage(response)
      if (responseError) {
        setServerError(responseError)
        return
      }
      navigate('/sales-orders/packages')
    } catch (submitError) {
      setServerError(extractApiErrorMessage(submitError))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading packaging data…</span>
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load packaging data</p>
          <p className="mt-1 text-xs text-red-600">{(error as Error)?.message ?? 'Sales order not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/sales-orders/packages" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Package Sales Order</h1>
          <p className="mt-0.5 text-sm text-gray-500">Complete pack sizes, pack types, and split rows so packed quantity matches confirmed quantity.</p>
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <PackagingItemTable
            rows={rows}
            packTypes={lookups?.packTypes ?? []}
            onToggleAutoFill={(rowId, enabled) => setRows((current) => applyAutoFill(current, rowId, enabled))}
            onFieldChange={(rowId, field, value) => setRows((current) => updatePackagingRow(current, rowId, field, value))}
            onRemove={(rowId) => setRows((current) => removePackagingRow(current, rowId))}
          />

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={packageMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {packageMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Submit packaging
            </button>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Order No</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{detail.stockOutGeneralData.soSystemNo ?? salesOrderId}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{detail.stockOutGeneralData.customerName ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Order Type</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{detail.stockOutGeneralData.jobTypeName ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Validation</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{validation.isValid ? 'Ready to submit' : 'Needs correction'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}