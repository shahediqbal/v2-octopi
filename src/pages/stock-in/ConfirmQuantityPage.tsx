// ============================================================
// Stock-In — Confirm Received Quantity Page
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useStockInChallan, useStockInDetail, useConfirmStockInQty } from '@/hooks/useStockIn'
import { normalizeStockInItemForForm } from '@/pages/stock-in/stockInMappers'
import { confirmQtySchema, type ConfirmQtyFormData } from '@/schemas/stockInSchema'
import type { StockInOrderDetail } from '@/types/stockIn'

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'

function extractError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred.'
}

function extractLoadError(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'body' in error &&
    error.body &&
    typeof error.body === 'object'
  ) {
    const body = error.body as Record<string, unknown>
    const candidates = [body.errMsg, body.message, body.title]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate
      }
    }
  }

  return extractError(error)
}

function mapChallanToOrderDetail(
  challan: ReturnType<typeof useStockInChallan>['data'],
): StockInOrderDetail | undefined {
  if (!challan) return undefined

  return {
    stockInGeneralData: challan.stockInGeneralData,
    stockInBillData: challan.stockInBillData,
    stockInItemsData: (challan.stockInItemsData ?? []).map((item) => ({
      ...item,
      sidProductStrength: null,
      sidBatches: [],
      sidPacks: [],
      sidMappedProductId: null,
      sidMappedProductName: null,
    })),
  }
}

function getCurrencyPrefix(currencyName: string | null | undefined) {
  switch ((currencyName ?? '').toUpperCase()) {
    case 'BDT':
      return 'TK'
    case 'USD':
      return '$'
    default:
      return currencyName ?? ''
  }
}

function formatAmount(value: number | null | undefined) {
  return Number(value ?? 0).toFixed(2)
}

function formatQuantity(value: number) {
  const rounded = Number(value.toFixed(3))
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

export function ConfirmQuantityPage() {
  const { id } = useParams<{ id: string }>()
  const orderId = Number(id)
  const navigate = useNavigate()

  const detailQuery = useStockInDetail(orderId)
  const challanQuery = useStockInChallan(
    orderId,
    Number.isFinite(orderId) && orderId > 0 && !detailQuery.isLoading && !detailQuery.data,
  )
  const confirmMutation = useConfirmStockInQty()
  const [serverError, setServerError] = useState<string>()
  const [confirmedPriceInputs, setConfirmedPriceInputs] = useState<Record<number, string>>({})

  const detail = useMemo(
    () => detailQuery.data ?? mapChallanToOrderDetail(challanQuery.data),
    [challanQuery.data, detailQuery.data],
  )

  const isLoading = detailQuery.isLoading || (!detailQuery.data && challanQuery.isLoading)
  const loadError = detailQuery.error ?? challanQuery.error
  const loadErrorMessage = loadError ? extractLoadError(loadError) : undefined
  const isError = !isLoading && !detail

  const defaultValues: ConfirmQtyFormData | undefined = useMemo(() => {
    if (!detail) return undefined
    return {
      items: detail.stockInItemsData.map((item) => ({
        ...normalizeStockInItemForForm(item),
        sidConfirmedQty: item.sidConfirmedQty ?? item.sidDeclaredQty ?? 0,
        sidConfirmedUnitPrice: item.sidConfirmedUnitPrice ?? item.sidDeclaredUnitPrice ?? 0,
      })),
    }
  }, [detail])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ConfirmQtyFormData>({
    resolver: zodResolver(confirmQtySchema),
    values: defaultValues,
  })
  const watchedItems = useWatch({ control, name: 'items' })

  useEffect(() => {
    setConfirmedPriceInputs({})
  }, [detail])

  async function onSubmit(values: ConfirmQtyFormData) {
    setServerError(undefined)
    try {
      const items = values.items.map((item) => ({
        sidProductId: item.sidProductId,
        sidConfirmedQty: item.sidConfirmedQty,
        sidConfirmedUnitPrice: item.sidConfirmedUnitPrice,
      }))
      const response = await confirmMutation.mutateAsync({ id: orderId, items })
      if ((response as { errMsg?: string })?.errMsg) {
        setServerError((response as { errMsg: string }).errMsg)
        return
      }
      navigate('/stock-in/confirm-qty')
    } catch (error) {
      setServerError(extractError(error))
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-red-600">
        <AlertCircle className="h-6 w-6" />
        <p className="text-sm font-medium">Failed to load order details.</p>
        {loadErrorMessage && <p className="max-w-md text-center text-xs text-red-500">{loadErrorMessage}</p>}
        <Link to="/stock-in/confirm-qty" className="text-xs text-gray-500 underline">
          Back to list
        </Link>
      </div>
    )
  }

  const g = detail.stockInGeneralData
  const b = detail.stockInBillData
  const isLoan = (g.jobTypeName ?? '').toLowerCase().includes('loan')
  const currencyPrefix = getCurrencyPrefix(b.sibCurrencyName)
  const summaryItems = watchedItems ?? defaultValues?.items ?? []
  const totalDeclared = useMemo(
    () => summaryItems.reduce((sum, item) => sum + Number(item.sidDeclaredQty ?? 0), 0),
    [summaryItems],
  )
  const totalConfirmed = useMemo(
    () => summaryItems.reduce((sum, item) => sum + Number(item.sidConfirmedQty ?? 0), 0),
    [summaryItems],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/stock-in/confirm-qty"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confirm Received Quantities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Order:{' '}
            <span className="font-medium text-gray-700">{g.siSystemNo}</span> &mdash;{' '}
            {g.supplierName ?? g.customerName ?? '—'}
          </p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Invoice No.</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{g.siInvoiceNo ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Invoice Date</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {g.siInvoiceDate?.slice(0, 10) ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Order Type</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{g.jobTypeName ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Channel</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {g.siSourceChannelName ?? '—'} → {g.siDestinationChannelName ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Product</th>
                  {isLoan && <th className="px-4 py-3">Mapped Product</th>}
                  <th className="px-4 py-3 text-right">Declared Price</th>
                  <th className="px-4 py-3 text-right">Confirmed Price *</th>
                  <th className="px-4 py-3 text-right">Declared Qty</th>
                  <th className="px-4 py-3 text-right">Confirmed Qty *</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(defaultValues?.items ?? []).map((item, index) => (
                  <tr key={item.sidProductId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{item.productName}</span>
                      {item.sidProductStrength && (
                        <span className="ml-1 text-xs text-gray-500">({item.sidProductStrength})</span>
                      )}
                    </td>
                    {isLoan && (
                      <td className="px-4 py-3 text-gray-700">
                        {item.sidMappedProductName ?? '—'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.sidDeclaredUnitPrice?.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Controller
                        name={`items.${index}.sidConfirmedUnitPrice`}
                        control={control}
                        render={({ field }) => {
                          const fieldValue =
                            typeof field.value === 'number' ? field.value : Number(field.value ?? 0)
                          const displayValue =
                            confirmedPriceInputs[index] ??
                            (Number.isFinite(fieldValue) ? fieldValue.toFixed(4) : '')

                          return (
                            <input
                              type="text"
                              inputMode="decimal"
                              value={displayValue}
                              onChange={(event) => {
                                const nextValue = event.target.value
                                setConfirmedPriceInputs((prev) => ({
                                  ...prev,
                                  [index]: nextValue,
                                }))

                                const parsed = Number(nextValue)
                                field.onChange(nextValue.trim() === '' || Number.isNaN(parsed) ? 0 : parsed)
                              }}
                              onBlur={() => {
                                setConfirmedPriceInputs((prev) => ({
                                  ...prev,
                                  [index]: Number(field.value ?? 0).toFixed(4),
                                }))
                                field.onBlur()
                              }}
                              className={inputCls + ' w-28 text-right'}
                            />
                          )
                        }}
                      />
                      {errors.items?.[index]?.sidConfirmedUnitPrice && (
                        <p className="mt-1 text-xs text-red-600">
                          {String(errors.items[index]?.sidConfirmedUnitPrice?.message)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.sidDeclaredQty}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        {...register(`items.${index}.sidConfirmedQty`, {
                          setValueAs: (v) => (v === '' ? 0 : Number(v)),
                        })}
                        className={inputCls + ' w-24 text-right'}
                      />
                      {errors.items?.[index]?.sidConfirmedQty && (
                        <p className="mt-1 text-xs text-red-600">
                          {String(errors.items[index]?.sidConfirmedQty?.message)}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start justify-between gap-4">
                <span className="font-semibold text-gray-900">Subtotal:</span>
                <span>{`${currencyPrefix}${formatAmount(b.sibCalculatedAmount)}`}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-semibold text-gray-900">Discount:</span>
                <span>{`${currencyPrefix}${formatAmount(b.sibDiscountAmouunt)}`}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-semibold text-gray-900">Adjustment amount:</span>
                <span>{`${currencyPrefix}${formatAmount(b.sibAdjustedAmount)}`}</span>
              </div>
            </div>

            <div className="my-3 border-t border-gray-200" />

            <div className="space-y-2 text-base">
              <div className="flex items-start justify-between gap-4 font-semibold text-gray-900">
                <span>Total:</span>
                <span>{`${currencyPrefix}${formatAmount(b.sibFinalAmount)}`}</span>
              </div>
              <div className="flex items-start justify-between gap-4 font-semibold text-gray-900">
                <span>Total Decleared:</span>
                <span>{`${formatQuantity(totalDeclared)} Kg`}</span>
              </div>
              <div className="flex items-start justify-between gap-4 font-semibold text-green-700">
                <span>Total Confirmed:</span>
                <span>{`${formatQuantity(totalConfirmed)} Kg`}</span>
              </div>
            </div>
          </div>
        </div>

        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={confirmMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Received Quantities
          </button>
        </div>
      </form>
    </div>
  )
}
