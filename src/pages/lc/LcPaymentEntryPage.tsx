import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2, RefreshCw, CheckCircle } from 'lucide-react'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lcPaymentSchema } from '@/schemas/lcTrackingSchema'
import type { LcPaymentFormValues } from '@/schemas/lcTrackingSchema'
import {
  useCreateLcPayment,
  useLcPaymentSummary,
  useLcPaymentHistory,
  useLcDetail,
} from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import { LC_PAYMENT_METHOD_ID } from '@/types/lcTracking'
import { LcPaymentForm } from './LcPaymentForm'

const TODAY = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SECTION = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'
const LABEL_SM = 'text-xs font-medium text-gray-500 uppercase tracking-wide'
const VALUE_SM = 'mt-0.5 text-sm font-semibold text-gray-900'

export function LcPaymentEntryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lcDocId = Number(searchParams.get('lcDocId') ?? 0)
  const customerId = Number(searchParams.get('customerId') ?? 0)
  const showToast = useToastStore((s) => s.showToast)

  const { data: lcDoc } = useLcDetail(lcDocId > 0 ? lcDocId : undefined)
  const { data: summary, refetch: refetchSummary } = useLcPaymentSummary(lcDocId > 0 ? lcDocId : undefined)
  const { data: history = [], isLoading: historyLoading, refetch: refetchHistory } = useLcPaymentHistory(lcDocId > 0 ? lcDocId : undefined)
  const createMutation = useCreateLcPayment()

  const form = useForm<LcPaymentFormValues>({
    resolver: zodResolver(lcPaymentSchema) as Resolver<LcPaymentFormValues>,
    defaultValues: {
      paymentCollectedBy: 0,
      paymentDate: TODAY(),
      paymentAmount: 0,
      lcAmountTransferAtBank: 0,
      lcAdjustmentAmount: 0,
      lcCollectionConversionRate: 0,
      paymentNote: '',
      isPaymentComplete: false,
    },
  })

  const { setValue, control, handleSubmit, formState: { errors }, reset } = form

  // Auto-calc: lcAdjustmentAmount = lcAmountTransferAtBank - paymentAmount
  const watchedAmount = useWatch({ control, name: 'paymentAmount' })
  const watchedBank = useWatch({ control, name: 'lcAmountTransferAtBank' })
  useEffect(() => {
    const ra = Number(watchedAmount) || 0
    const bank = Number(watchedBank) || 0
    if (ra > 0 || bank > 0) {
      setValue('lcAdjustmentAmount', parseFloat((bank - ra).toFixed(2)))
    }
  }, [watchedAmount, watchedBank, setValue])

  const isComplete = useWatch({ control, name: 'isPaymentComplete' })

  const handleReset = () =>
    reset({
      paymentCollectedBy: 0,
      paymentDate: TODAY(),
      paymentAmount: 0,
      lcAmountTransferAtBank: 0,
      lcAdjustmentAmount: 0,
      lcCollectionConversionRate: 0,
      paymentNote: '',
      isPaymentComplete: false,
    })

  const onSubmit = (data: LcPaymentFormValues) => {
    createMutation.mutate(
      {
        lcDocId,
        paymentMethodId: LC_PAYMENT_METHOD_ID,
        moenyRecepitNo: '',
        paymentCollectedBy: data.paymentCollectedBy,
        paymentCustomerId: customerId,
        paymentDate: data.paymentDate,
        paymentAmount: data.paymentAmount,
        chequeAmount: null,
        lcAmountTransferAtBank: data.lcAmountTransferAtBank,
        lcAdjustmentAmount: data.lcAdjustmentAmount,
        lcCollectionConversionRate: data.lcCollectionConversionRate,
        paymentNote: data.paymentNote ?? '',
        isPaymentComplete: data.isPaymentComplete,
        paymentRelatedJobId: lcDocId,
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
          if (res.errMsg) {
            showToast({ message: res.errMsg, type: 'error' })
          } else {
            showToast({
              message: data.isPaymentComplete
                ? 'Payment recorded & LC marked as COMPLETE!'
                : 'Payment recorded successfully!',
              type: 'success',
            })
            navigate('/lc/payments')
          }
        },
        onError: (err) =>
          showToast({ message: (err as Error).message || 'Something went wrong', type: 'error' }),
      },
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/lc/payments"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">LC Payment Entry</h1>
          {lcDoc && (
            <p className="text-xs text-gray-500">Add Payment for LC: {lcDoc.lcNumber || 'N/A'}</p>
          )}
        </div>
      </div>

      {/* ── LC Information ── */}
      {lcDoc && (
        <div className={SECTION}>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">LC Information</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <p className={LABEL_SM}>PI System ID</p>
              <p className={VALUE_SM}>{lcDoc.piSystemId}</p>
            </div>
            <div>
              <p className={LABEL_SM}>Customer Name</p>
              <p className={VALUE_SM}>{lcDoc.customerName || 'N/A'}</p>
            </div>
            <div>
              <p className={LABEL_SM}>LC Number</p>
              <p className={VALUE_SM}>{lcDoc.lcNumber || 'N/A'}</p>
            </div>
            <div>
              <p className={LABEL_SM}>LC Date</p>
              <p className={VALUE_SM}>
                {lcDoc.lcDate ? new Date(lcDoc.lcDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className={LABEL_SM}>LC Amount</p>
              <p className={VALUE_SM}>
                {lcDoc.lcAmount ? `$${lcDoc.lcAmount.toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className={LABEL_SM}>LC Document ID</p>
              <p className={VALUE_SM}>{lcDocId}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment History ── */}
      {(historyLoading || history.length > 0) && (
        <div className={SECTION}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Payment History</h2>
            <button
              type="button"
              onClick={() => { void refetchHistory(); void refetchSummary() }}
              disabled={historyLoading}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >
              <RefreshCw size={12} className={historyLoading ? 'animate-spin' : ''} />
              {historyLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
                  <th className="px-3 py-2 text-left font-semibold">Payment Date</th>
                  <th className="px-3 py-2 text-right font-semibold">Amount</th>
                  <th className="px-3 py-2 text-left font-semibold">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                      ${p.paymentAmount?.toLocaleString() ?? '0'}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{p.paymentNote || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── New Payment Entry ── */}
      <div className={SECTION}>
        <h2 className="mb-4 text-sm font-semibold text-gray-700">New Payment Entry</h2>

        {/* Payment Progress */}
        {summary && (
          <div className="mb-5 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">Payment Progress</span>
              <span className="text-xs text-gray-500">
                {summary.lcAmount > 0
                  ? ((summary.totalPaid / summary.lcAmount) * 100).toFixed(1)
                  : '0'}% Complete
              </span>
            </div>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${Math.min(100, summary.lcAmount > 0 ? (summary.totalPaid / summary.lcAmount) * 100 : 0)}%`,
                }}
              />
            </div>
            <div className="mb-3 flex justify-between text-xs text-gray-500">
              <span>Paid: ${summary.totalPaid?.toLocaleString()}</span>
              <span>Balance: ${summary.remainingAmount?.toLocaleString()}</span>
              <span>Total: ${summary.lcAmount?.toLocaleString()}</span>
            </div>
            {summary.remainingAmount > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue('paymentAmount', summary.remainingAmount)
                    setValue('isPaymentComplete', true)
                  }}
                  className="inline-flex items-center gap-1 rounded border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                >
                  <CheckCircle size={12} /> Pay Full Balance &amp; Complete
                </button>
                <button
                  type="button"
                  onClick={() => setValue('paymentAmount', parseFloat((summary.remainingAmount / 2).toFixed(2)))}
                  className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Pay 50% of Balance
                </button>
                <button
                  type="button"
                  onClick={() => setValue('paymentAmount', parseFloat((summary.remainingAmount / 4).toFixed(2)))}
                  className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Pay 25% of Balance
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <LcPaymentForm control={control} errors={errors} />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${isComplete ? 'bg-amber-600 hover:bg-amber-500' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {isComplete ? 'Complete LC & Submit' : 'Submit Payment'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={createMutation.isPending}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              Reset Form
            </button>
            <Link
              to="/lc/payments"
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
