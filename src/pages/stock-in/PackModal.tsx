// ============================================================
// Stock-In — Pack Add/Edit Modal
// ============================================================
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2 } from 'lucide-react'
import { useDropdown } from '@/hooks/useDropdown'
import { normalizeStockInPackForForm } from '@/pages/stock-in/stockInMappers'
import { stockInPackSchema, type StockInPackFormData } from '@/schemas/stockInSchema'

interface PackModalProps {
  open: boolean
  /** If provided, modal is in edit mode; otherwise add mode */
  pack?: StockInPackFormData | null
  onSave: (pack: StockInPackFormData) => void
  onClose: () => void
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

const numberInput = {
  setValueAs: (v: string | number | null | undefined) => {
    if (v === '' || v === undefined || v === null) return null
    return Number(v) || null
  },
}

export function PackModal({ open, pack, onSave, onClose }: PackModalProps) {
  const isEdit = !!pack
  const { data: packTypeOptions, isLoading: packTypesLoading, isError: packTypesError } = useDropdown('packType', open)

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StockInPackFormData>({
    resolver: zodResolver(stockInPackSchema),
    defaultValues: {
      packId: undefined,
      packDetails: '',
      packQuantity: null,
      packTypeId: null,
      packTypeName: null,
      sipPackTypeId: null,
      sipPackSize: null,
      sipPackQty: null,
      sipPackRemarks: null,
    },
  })

  const watchedPackSize = useWatch({ control, name: 'sipPackSize' })
  const watchedPackRemarks = useWatch({ control, name: 'sipPackRemarks' })
  const watchedPackTypeName = useWatch({ control, name: 'packTypeName' })

  useEffect(() => {
    if (open) {
      if (pack) {
        reset(normalizeStockInPackForForm(pack))
      } else {
        reset({
          packId: undefined,
          packDetails: '',
          packQuantity: null,
          packTypeId: null,
          packTypeName: null,
          sipPackTypeId: null,
          sipPackSize: null,
          sipPackQty: null,
          sipPackRemarks: null,
        })
      }
    }
  }, [open, pack, reset])

  useEffect(() => {
    const normalized = normalizeStockInPackForForm({
      packTypeName: watchedPackTypeName,
      sipPackSize: watchedPackSize,
      sipPackRemarks: watchedPackRemarks,
    })

    setValue('packDetails', normalized.packDetails, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    })
  }, [setValue, watchedPackRemarks, watchedPackSize, watchedPackTypeName])

  function onSubmit(data: StockInPackFormData) {
    onSave(normalizeStockInPackForForm(data))
  }

  function handleModalSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.stopPropagation()
    void handleSubmit(onSubmit)(event)
  }

  if (!open) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit Pack' : 'Add Pack'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleModalSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Pack Type
              </label>
              <Controller
                name="packTypeId"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const id = value === '' ? null : Number(value)
                        const selected = packTypeOptions?.find((option) => option.key === id)

                        field.onChange(id)
                        setValue('sipPackTypeId', id, { shouldDirty: true, shouldValidate: false })
                        setValue('packTypeName', selected?.value ?? null, {
                          shouldDirty: true,
                          shouldValidate: false,
                        })
                      }}
                      disabled={packTypesLoading}
                      className={inputCls + ' pr-9'}
                    >
                      <option value="">
                        {packTypesLoading ? 'Loading pack types...' : 'Select pack type'}
                      </option>
                      {(packTypeOptions ?? []).map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.value}
                        </option>
                      ))}
                    </select>
                    {packTypesLoading && (
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                )}
              />
              {packTypesError && (
                <p className="mt-1 text-xs text-red-600">Failed to load pack types.</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Pack Size <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('sipPackSize')}
                className={inputCls}
                placeholder="Enter pack size"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Pack Quantity
              </label>
              <input
                type="number"
                step="1"
                min="0"
                {...register('packQuantity', numberInput)}
                className={inputCls}
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <input
                type="text"
                {...register('sipPackRemarks')}
                className={inputCls}
                placeholder="Enter remarks"
              />
            </div>
          </div>

          <input type="hidden" {...register('packDetails')} />
          {errors.packDetails && (
            <p className="text-xs text-red-600">{errors.packDetails.message}</p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              {isEdit ? 'Save Changes' : 'Add Pack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  if (typeof document === 'undefined') {
    return modalContent
  }

  return createPortal(modalContent, document.body)
}
