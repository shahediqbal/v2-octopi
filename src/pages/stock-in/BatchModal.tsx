// ============================================================
// Stock-In — Batch Add/Edit Modal
// ============================================================
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { normalizeStockInBatchForForm } from '@/pages/stock-in/stockInMappers'
import { stockInBatchSchema, type StockInBatchFormData } from '@/schemas/stockInSchema'

interface BatchModalProps {
  open: boolean
  /** If provided, modal is in edit mode; otherwise add mode */
  batch?: StockInBatchFormData | null
  onSave: (batch: StockInBatchFormData) => void
  onClose: () => void
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

const numberInput = {
  setValueAs: (v: string | number | null | undefined) => {
    if (v === '' || v === undefined || v === null) return null
    const parsed = Number(v)
    return Number.isFinite(parsed) ? parsed : null
  },
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function getEmptyBatch(): StockInBatchFormData {
  const today = todayIso()
  return {
    batchId: undefined,
    batchNumber: '',
    batchNo: null,
    batchProductionDate: today,
    expiryDate: today,
    batchExpiryDate: today,
    batchCertificateNo: null,
    batchTestDate: today,
    batchTestReport: 1,
    quantity: null,
  }
}

export function BatchModal({ open, batch, onSave, onClose }: BatchModalProps) {
  const isEdit = !!batch

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockInBatchFormData>({
    resolver: zodResolver(stockInBatchSchema),
    defaultValues: getEmptyBatch(),
  })

  useEffect(() => {
    if (open) {
      if (batch) {
        reset(normalizeStockInBatchForForm(batch))
      } else {
        reset(getEmptyBatch())
      }
    }
  }, [open, batch, reset])

  function onSubmit(data: StockInBatchFormData) {
    onSave(normalizeStockInBatchForForm(data))
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
            {isEdit ? 'Edit Batch' : 'Add Batch'}
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
                Batch No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('batchNumber')}
                className={inputCls}
                placeholder="Enter batch number"
              />
              {errors.batchNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.batchNumber.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Production Date
              </label>
              <input
                type="date"
                {...register('batchProductionDate')}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('expiryDate')}
                className={inputCls}
              />
              {errors.expiryDate && (
                <p className="mt-1 text-xs text-red-600">{errors.expiryDate.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Batch Certificate No
              </label>
              <input
                type="text"
                {...register('batchCertificateNo')}
                className={inputCls}
                placeholder="Enter certificate number"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Test Date
              </label>
              <input
                type="date"
                {...register('batchTestDate')}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('quantity', numberInput)}
                className={inputCls}
                placeholder="Optional"
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-red-600">{String(errors.quantity.message)}</p>
              )}
            </div>
          </div>

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
              className={`${isEdit ? 'action-update' : 'action-insert'} rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700`}
            >
              {isEdit ? 'Save Changes' : 'Add Batch'}
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
