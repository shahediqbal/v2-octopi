import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { SalesOrderForm } from '@/pages/sales-orders/SalesOrderForm'
import { PackagingItemTable } from '@/pages/sales-orders/PackagingItemTable'
import { applyAutoFill, removePackagingRow, updatePackagingRow, validatePackagingRows } from '@/pages/sales-orders/packagingUtils'
import {
  extractApiErrorMessage,
  extractApiResponseErrorMessage,
  mapDetailToFormValues,
  mapFormValuesToMutationPayload,
  mapPackagingDetailToRows,
  mapPackagingRowsToPayload,
  type PackagingRowValue,
} from '@/pages/sales-orders/stockOutMappers'
import type { StockOutFormValues } from '@/schemas/stockOutSchema'
import { EDIT_MODE_CONFIG } from '@/features/stock-out/modes'
import {
  useAdminSubmitPackaging,
  useAdminUpdateStockOut,
  usePackagingDetail,
  useStockOutDetail,
  useStockOutLookups,
  useUpdatePackaging,
  useUpdateStockOut,
} from '@/hooks/useStockOut'
import type { EditMode } from '@/types/stockOut'

interface EditSalesOrderPageProps {
  mode?: EditMode
}

interface EditLocationState {
  returnTo?: string
}

function getDefaultReturnPath(mode: EditMode) {
  switch (mode) {
    case 'admin-full':
      return '/sales-orders/admin/general'
    case 'admin-price-edit':
      return '/sales-orders/admin/pending-price'
    case 'admin-invoice-limited':
      return '/sales-orders/admin/limited-edit'
    case 'admin-packing-edit':
      return '/sales-orders/admin/general'
    case 'packing-edit':
      return '/sales-orders/packages'
    default:
      return '/sales-orders'
  }
}

function getSubmitLabel(mode: EditMode) {
  switch (mode) {
    case 'admin-price-edit':
      return 'Update pricing'
    case 'admin-invoice-limited':
      return 'Submit for packaging'
    case 'admin-packing-edit':
    case 'packing-edit':
      return 'Update packaging'
    default:
      return 'Update sales order'
  }
}

export function EditSalesOrderPage({ mode = 'standard' }: EditSalesOrderPageProps) {
  const { id } = useParams<{ id: string }>()
  const salesOrderId = Number(id)
  const navigate = useNavigate()
  const location = useLocation()
  const { data: detail, isLoading, isError, error } = useStockOutDetail(salesOrderId || undefined)
  const { data: packagingDetail, isLoading: isPackagingLoading, isError: isPackagingError, error: packagingError } = usePackagingDetail(
    mode === 'packing-edit' || mode === 'admin-packing-edit' ? salesOrderId || undefined : undefined,
  )
  const { data: lookups } = useStockOutLookups()
  const updateMutation = useUpdateStockOut()
  const adminUpdateMutation = useAdminUpdateStockOut()
  const adminSubmitPackagingMutation = useAdminSubmitPackaging()
  const updatePackagingMutation = useUpdatePackaging()
  const [serverError, setServerError] = useState('')
  const [packagingRows, setPackagingRows] = useState<PackagingRowValue[]>([])

  const isPackagingMode = mode === 'packing-edit' || mode === 'admin-packing-edit'
  const editConfig = EDIT_MODE_CONFIG[mode]
  const locationState = (location.state ?? {}) as EditLocationState
  const returnTo = locationState.returnTo ?? getDefaultReturnPath(mode)
  const backLinkState = mode === 'packing-edit' ? { defaultStatus: '3' } : undefined

  const formDefaults = useMemo<Partial<StockOutFormValues> | undefined>(() => {
    if (!detail || isPackagingMode) return undefined
    return mapDetailToFormValues(detail)
  }, [detail, isPackagingMode])

  useEffect(() => {
    if (isPackagingMode && packagingDetail) {
      setPackagingRows(mapPackagingDetailToRows(packagingDetail))
    }
  }, [isPackagingMode, packagingDetail])

  const packagingValidation = useMemo(() => validatePackagingRows(packagingRows), [packagingRows])

  const handleSubmit = async (values: StockOutFormValues) => {
    if (!detail) return
    setServerError('')
    const payload = mapFormValuesToMutationPayload(values, detail, {
      mode,
      useLegacyStandardPricing: mode === 'standard',
    })

    try {
      const response = await (mode === 'admin-full' || mode === 'admin-price-edit'
        ? adminUpdateMutation.mutateAsync(payload)
        : mode === 'admin-invoice-limited'
          ? adminSubmitPackagingMutation.mutateAsync(payload)
          : updateMutation.mutateAsync(payload))
      const responseError = extractApiResponseErrorMessage(response)
      if (responseError) {
        setServerError(responseError)
        return
      }
      navigate(returnTo)
    } catch (submitError) {
      setServerError(extractApiErrorMessage(submitError))
    }
  }

  const handlePackagingSubmit = async () => {
    setServerError('')
    if (!packagingValidation.isValid) {
      setServerError(packagingValidation.message)
      return
    }

    try {
      const response = await updatePackagingMutation.mutateAsync(mapPackagingRowsToPayload(salesOrderId, packagingRows))
      const responseError = extractApiResponseErrorMessage(response)
      if (responseError) {
        setServerError(responseError)
        return
      }
      navigate(returnTo)
    } catch (submitError) {
      setServerError(extractApiErrorMessage(submitError))
    }
  }

  if ((isPackagingMode && isPackagingLoading) || (!isPackagingMode && isLoading)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading sales order…</span>
      </div>
    )
  }

  if ((isPackagingMode && (isPackagingError || !packagingDetail)) || (!isPackagingMode && (isError || !detail))) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load sales order</p>
          <p className="mt-1 text-xs text-red-600">{((isPackagingMode ? packagingError : error) as Error)?.message ?? 'Sales order not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to={returnTo} state={backLinkState} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{editConfig.title}</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {isPackagingMode ? (packagingDetail?.soSystemNo ?? `ID #${salesOrderId}`) : (detail?.stockOutGeneralData.soSystemNo ?? `ID #${salesOrderId}`)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {isPackagingMode ? (
          <div className="space-y-5">
            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}
            <PackagingItemTable
              rows={packagingRows}
              packTypes={lookups?.packTypes ?? []}
              onToggleAutoFill={(rowId, enabled) => setPackagingRows((current) => applyAutoFill(current, rowId, enabled))}
              onFieldChange={(rowId, field, value) => setPackagingRows((current) => updatePackagingRow(current, rowId, field, value))}
              onRemove={(rowId) => setPackagingRows((current) => removePackagingRow(current, rowId))}
            />
            <button
              type="button"
              onClick={handlePackagingSubmit}
              disabled={updatePackagingMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updatePackagingMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Update packaging
            </button>
          </div>
        ) : (
          <SalesOrderForm
            mode={mode}
            defaultValues={formDefaults}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending || adminUpdateMutation.isPending || adminSubmitPackagingMutation.isPending}
            submitLabel={getSubmitLabel(mode)}
            serverError={serverError}
          />
        )}
      </div>
    </div>
  )
}