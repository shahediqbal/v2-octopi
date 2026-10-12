// ============================================================
// Stock-In — Stock Adjustment Page
// ============================================================
import { useState } from 'react'
import { ArrowLeft, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { stockAdjustmentSchema, type StockAdjustmentFormData } from '@/schemas/stockInSchema'
import { useAdjustStock, useStockInCurrentStock } from '@/hooks/useStockIn'
import { DropdownSelect } from '@/components/dropdowns/DropdownSelect'
import { PaginatedCombobox } from '@/components/dropdowns/PaginatedCombobox'

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50 disabled:text-gray-500'

const labelCls = 'block text-sm font-medium text-gray-700'

function extractError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred.'
}

/** Row that shows current stock for a selected product+channel */
function CurrentStockCell({ productId, channelId }: { productId: number | null; channelId: number | null }) {
  const { data, isLoading, isError } = useStockInCurrentStock(
    productId ?? undefined,
    channelId ?? undefined,
  )
  if (!productId || !channelId) return <span className="text-gray-400">—</span>
  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
  if (isError) return <span className="text-red-500">Error</span>

  const stockRow = data?.[0]
  const qty = stockRow?.currentQty ?? stockRow?.currentStock ?? stockRow?.quantity ?? null

  return (
    <span className={qty != null && qty < 0 ? 'font-semibold text-red-600' : 'text-gray-700'}>
      {qty ?? '—'}
    </span>
  )
}

export function StockAdjustmentPage() {
  const navigate = useNavigate()
  const adjustMutation = useAdjustStock()
  const [serverError, setServerError] = useState<string>()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      channelId: undefined,
      saReferanceNo: '',
      saDatetime: new Date().toISOString().slice(0, 16),
      stockAdjutmentRemark: '',
      stockAdjutmentProducts: [{ productId: undefined, productName: '', productQty: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stockAdjutmentProducts',
  })

  const watchedChannelId = useWatch({ control, name: 'channelId' })
  const watchedProducts = useWatch({ control, name: 'stockAdjutmentProducts' })

  async function onSubmit(values: StockAdjustmentFormData) {
    setServerError(undefined)
    try {
      const payload = {
        channelId: values.channelId,
        stockAdjutmentRemark: values.stockAdjutmentRemark ?? null,
        saDatetime: values.saDatetime,
        saReferanceNo: values.saReferanceNo,
        stockAdjutmentProducts: values.stockAdjutmentProducts.map((item) => ({
          productId: item.productId,
          productQty: Number(item.productQty),
        })),
      }

      const response = await adjustMutation.mutateAsync(payload)
      if ((response as { errMsg?: string })?.errMsg) {
        setServerError((response as { errMsg: string }).errMsg)
        return
      }
      if ((response as { title?: string })?.title === 'One or more validation errors occurred.') {
        setServerError('Something went wrong while submitting the adjustment.')
        return
      }
      navigate('/reports/stock-adjustment')
    } catch (error) {
      setServerError(extractError(error))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/stock-in"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Adjustment</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manually adjust stock quantities (positive or negative) for inventory discrepancies.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Fields */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Adjustment Details
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Reference No */}
            <div>
              <label htmlFor="saReferanceNo" className={labelCls}>
                Reference No. <span className="text-red-500">*</span>
              </label>
              <input
                id="saReferanceNo"
                {...register('saReferanceNo')}
                className={inputCls + ' mt-1'}
                placeholder="e.g. ADJ-2025-001"
              />
              {errors.saReferanceNo && (
                <p className="mt-1 text-xs text-red-600">{errors.saReferanceNo.message}</p>
              )}
            </div>

            {/* Channel */}
            <div>
              <label className={labelCls}>
                Channel <span className="text-red-500">*</span>
              </label>
              <Controller
                name="channelId"
                control={control}
                render={({ field }) => (
                  <DropdownSelect
                    type="channel"
                    value={field.value ?? null}
                    onValueChange={(id) => field.onChange(id)}
                    placeholder="Select channel"
                    hasError={!!errors.channelId}
                    className="mt-1"
                  />
                )}
              />
              {errors.channelId && (
                <p className="mt-1 text-xs text-red-600">{errors.channelId.message}</p>
              )}
            </div>

            {/* Datetime */}
            <div>
              <label htmlFor="saDatetime" className={labelCls}>
                Adjustment Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                id="saDatetime"
                type="datetime-local"
                {...register('saDatetime')}
                className={inputCls + ' mt-1'}
              />
              {errors.saDatetime && (
                <p className="mt-1 text-xs text-red-600">{errors.saDatetime.message}</p>
              )}
            </div>

            {/* Remark */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="stockAdjutmentRemark" className={labelCls}>
                Remark
              </label>
              <textarea
                id="stockAdjutmentRemark"
                rows={2}
                {...register('stockAdjutmentRemark')}
                className={inputCls + ' mt-1'}
                placeholder="Reason for adjustment (optional)"
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Products
            </h2>
            <button
              type="button"
              onClick={() => append({ productId: undefined, productName: '', productQty: 0 })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" /> Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3 min-w-[240px]">Product *</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3 text-right">Adjustment Qty *</th>
                  <th className="px-4 py-3 text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fields.map((field, index) => {
                  const watchedProduct = watchedProducts?.[index]
                  const watchedProductId = watchedProduct?.productId
                  return (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <Controller
                          name={`stockAdjutmentProducts.${index}.productId`}
                          control={control}
                          render={({ field: f }) => (
                            <PaginatedCombobox
                              type="product"
                              value={f.value ?? null}
                              onValueChange={(id) => f.onChange(id)}
                              onLabelChange={(label) => {
                                setValue(`stockAdjutmentProducts.${index}.productName`, label ?? '', {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                })
                              }}
                              selectedLabel={watchedProduct?.productName ?? null}
                              placeholder="Search product..."
                              hasError={!!errors.stockAdjutmentProducts?.[index]?.productId}
                            />
                          )}
                        />
                        {errors.stockAdjutmentProducts?.[index]?.productId && (
                          <p className="mt-1 text-xs text-red-600">
                            {String(errors.stockAdjutmentProducts[index]?.productId?.message)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <CurrentStockCell
                          productId={watchedProductId ?? null}
                          channelId={watchedChannelId ?? null}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="text"
                          inputMode="decimal"
                          {...register(`stockAdjutmentProducts.${index}.productQty`, {
                            setValueAs: (v) => {
                              const raw = String(v ?? '').trim()
                              if (raw === '') return 0
                              const normalized = raw.replace(/,/g, '')
                              return Number(normalized)
                            },
                          })}
                          className={inputCls + ' w-28 text-right'}
                          placeholder="e.g. -5 or 10"
                        />
                        {errors.stockAdjutmentProducts?.[index]?.productQty && (
                          <p className="mt-1 text-xs text-red-600">
                            {String(errors.stockAdjutmentProducts[index]?.productQty?.message)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="rounded p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {errors.stockAdjutmentProducts && !Array.isArray(errors.stockAdjutmentProducts) && (
            <div className="flex items-center gap-2 px-5 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {String((errors.stockAdjutmentProducts as { message?: string }).message)}
            </div>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={adjustMutation.isPending}
            className="action-insert inline-flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adjustMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Adjustment
          </button>
        </div>
      </form>
    </div>
  )
}
