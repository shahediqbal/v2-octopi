import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lcPaymentSchema } from '@/schemas/lcTrackingSchema'
import type { LcPaymentFormValues } from '@/schemas/lcTrackingSchema'
import { useLcPaymentDetail, useUpdateLcPayment, useLcPaymentSummary } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import { LC_PAYMENT_METHOD_ID } from '@/types/lcTracking'
import { LcPaymentForm } from './LcPaymentForm'
import { formatDate, formatCurrency } from '@/lib/utils'

const INFO_LABEL = 'text-xs uppercase font-medium text-gray-400'
const INFO_VALUE = 'mt-0.5 text-sm font-semibold text-gray-800'

export function LcPaymentEditPage() {
  const { id } = useParams<{ id: string }>()
  const paymentId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [serverError, setServerError] = useState('')

  const { data, isLoading, isError, refetch } = useLcPaymentDetail(paymentId)
  const { data: summary } = useLcPaymentSummary(data?.lcDocId)
  const updateMutation = useUpdateLcPayment()

  const form = useForm<LcPaymentFormValues>({
    resolver: zodResolver(lcPaymentSchema) as Resolver<LcPaymentFormValues>,
    defaultValues: {
      paymentCollectedBy: 0,
      paymentDate: '',
      paymentAmount: 0,
      lcAmountTransferAtBank: 0,
      lcAdjustmentAmount: 0,
      lcCollectionConversionRate: 0,
      paymentNote: '',
      isPaymentComplete: false,
    },
  })

  // Populate form when data loads
  useEffect(() => {
    if (data) {
      form.reset({
        paymentCollectedBy: data.paymentCollectedBy ?? 0,
        paymentDate: data.paymentDate ? data.paymentDate.split('T')[0] : '',
        paymentAmount: data.paymentAmount ?? 0,
        lcAmountTransferAtBank: data.lcAmountTransferAtBank ?? 0,
        lcAdjustmentAmount: data.lcAdjustmentAmount ?? 0,
        lcCollectionConversionRate: data.lcCollectionConversionRate ?? 0,
        paymentNote: data.paymentNote ?? '',
        isPaymentComplete: data.isPaymentComplete ?? false,
      })
    }
  }, [data, form])

  // Auto-calc: lcAdjustmentAmount = lcAmountTransferAtBank - paymentAmount
  const watchedAmount = useWatch({ control: form.control, name: 'paymentAmount' })
  const watchedBank = useWatch({ control: form.control, name: 'lcAmountTransferAtBank' })
  useEffect(() => {
    const ra = parseFloat(String(watchedAmount)) || 0
    const bank = parseFloat(String(watchedBank)) || 0
    if (bank !== 0 || ra !== 0) {
      form.setValue('lcAdjustmentAmount', parseFloat((bank - ra).toFixed(2)), { shouldDirty: false })
    }
  }, [watchedAmount, watchedBank, form])

  const handleReset = () => {
    refetch()
  }

  const handleFillBalance = () => {
    if (summary) {
      const remaining = (summary.remainingBalance ?? summary.remainingAmount ?? 0) + (data?.paymentAmount ?? 0)
      form.setValue('paymentAmount', parseFloat(remaining.toFixed(2)))
    }
  }

  const onSubmit = (formData: LcPaymentFormValues) => {
    setServerError('')
    updateMutation.mutate(
      {
        paymentSystemId: paymentId,
        lcDocId: data?.lcDocId ?? 0,
        paymentMethodId: LC_PAYMENT_METHOD_ID,
        moenyRecepitNo: data?.moenyRecepitNo ?? '',
        paymentCollectedBy: formData.paymentCollectedBy,
        paymentCustomerId: data?.paymentCustomerId ?? 0,
        paymentDate: formData.paymentDate,
        paymentAmount: formData.paymentAmount,
        chequeAmount: null,
        lcAmountTransferAtBank: formData.lcAmountTransferAtBank,
        lcAdjustmentAmount: formData.lcAdjustmentAmount,
        lcCollectionConversionRate: formData.lcCollectionConversionRate,
        paymentNote: formData.paymentNote ?? '',
        isPaymentComplete: formData.isPaymentComplete,
        paymentRelatedJobId: null,
        paymentChequeId: null,
        paymentAdjustedAmount: null,
        modifiedBy: null,
        modifiedDate: null,
        chequeBeneficiaryBankId: null,
        chequeStatusId: null,
        chequeActionDate: null,
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else {
            showToast({ message: 'LC Payment updated successfully', type: 'success' })
            navigate('/lc/payment/edit-list')
          }
        },
        onError: (err) => setServerError((err as Error).message || 'Something went wrong'),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading LC Payment Details...</span>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 text-red-500" />
          <p className="text-sm text-red-700">Failed to load payment details.</p>
        </div>
      </div>
    )
  }

  // Summary calculations
  const lcAmount = summary?.lcAmount ?? data.paymentAmount ?? 0
  const totalPaid = summary?.totalPaid ?? 0
  const remaining = summary?.remainingBalance ?? summary?.remainingAmount ?? 0
  const pct = lcAmount > 0 ? Math.min(100, (totalPaid / lcAmount) * 100) : 0
  const isFullyPaid = summary?.isFullyPaid ?? pct >= 100

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/lc/payment/edit-list"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back to LC Payment List
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">LC Payment Edit</h1>
          <p className="text-xs text-gray-500">
            Edit LC Payment: {data.lcNumber || 'N/A'}
          </p>
        </div>
      </div>

      {/* LC Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold" style={{ color: '#2E7D32' }}>LC Information</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <p className={INFO_LABEL}>PI Number</p>
            <p className={INFO_VALUE}>{data.piNumber || 'N/A'}</p>
          </div>
          <div>
            <p className={INFO_LABEL}>Customer</p>
            <p className={INFO_VALUE}>{data.customerName || 'N/A'}</p>
          </div>
          <div>
            <p className={INFO_LABEL}>LC Number</p>
            <p className={INFO_VALUE}>{data.lcNumber || 'N/A'}</p>
          </div>
          <div>
            <p className={INFO_LABEL}>LC Date</p>
            <p className={INFO_VALUE}>{data.lcDate ? formatDate(data.lcDate) : 'N/A'}</p>
          </div>
          <div>
            <p className={INFO_LABEL}>LC Amount</p>
            <p className={INFO_VALUE}>{formatCurrency(lcAmount)}</p>
          </div>
          <div>
            <p className={INFO_LABEL}>Payment ID</p>
            <p className={INFO_VALUE}>{paymentId}</p>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      {summary && (
        <div
          className="rounded-lg border p-5 shadow-sm"
          style={{ backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold" style={{ color: '#2E7D32' }}>Payment Summary</h2>
            {isFullyPaid && (
              <span className="rounded-full px-3 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: '#4CAF50' }}>
                Fully Paid
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: isFullyPaid ? '#4CAF50' : pct > 50 ? '#FF9800' : '#2196F3',
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">LC Amount</p>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(lcAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Paid</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Remaining</p>
              <p className="text-lg font-bold" style={{ color: remaining > 0 ? '#d32f2f' : '#2E7D32' }}>
                {formatCurrency(remaining)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Progress</p>
              <p className="text-lg font-bold text-gray-800">{pct.toFixed(1)}%</p>
            </div>
          </div>

          {/* Current payment being edited */}
          <div className="mt-3 rounded p-2 text-sm" style={{ backgroundColor: '#F1F8E9' }}>
            <p className="text-xs text-gray-500">Current Payment Being Edited</p>
            <p className="text-sm text-gray-700">
              Amount: <strong>{formatCurrency(data.paymentAmount ?? 0)}</strong>
              <span className="ml-3 text-xs text-gray-400">
                Max allowed: {formatCurrency(remaining + (data.paymentAmount ?? 0))}
              </span>
            </p>
          </div>

          {/* Fill remaining balance */}
          {remaining > 0 && (
            <button
              type="button"
              onClick={handleFillBalance}
              className="mt-3 inline-flex items-center gap-2 rounded border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-orange-50"
              style={{ color: '#FF9800', borderColor: '#FF9800' }}
            >
              Fill Remaining Balance ({formatCurrency(remaining)})
            </button>
          )}

          {isFullyPaid && (
            <div className="mt-3 rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
              This LC is already fully paid. Editing amounts may require adjustments to other payments.
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold" style={{ color: '#2E7D32' }}>Payment Details</h2>

        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <LcPaymentForm control={form.control} errors={form.formState.errors} />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#2E7D32' }}
            >
              {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {updateMutation.isPending ? 'Updating...' : 'Update Payment'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-green-50"
              style={{ color: '#2E7D32', borderColor: '#2E7D32' }}
            >
              <RefreshCw size={14} /> Reset Form
            </button>

            <Link
              to="/lc/payment/edit-list"
              className="ml-auto inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-green-50"
              style={{ color: '#2E7D32', borderColor: '#2E7D32' }}
            >
              <ArrowLeft size={14} /> Back to LC Payment List
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
