import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lcPaymentSchema } from '@/schemas/lcTrackingSchema'
import type { LcPaymentFormValues } from '@/schemas/lcTrackingSchema'
import { useCreateLcPayment, useLcPaymentSummary } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import { LC_PAYMENT_METHOD_ID } from '@/types/lcTracking'
import { LcPaymentForm } from './LcPaymentForm'
import { formatCurrency } from '@/lib/utils'

export function LcPaymentEntryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lcDocId = Number(searchParams.get('lcDocId') ?? 0)
  const showToast = useToastStore((s) => s.showToast)
  const [serverError, setServerError] = useState('')

  const { data: summary } = useLcPaymentSummary(lcDocId > 0 ? lcDocId : 0)
  const createMutation = useCreateLcPayment()

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

  const onSubmit = (data: LcPaymentFormValues) => {
    setServerError('')
    createMutation.mutate(
      {
        lcDocId,
        paymentMethodId: LC_PAYMENT_METHOD_ID,
        moenyRecepitNo: '',
        paymentCollectedBy: data.paymentCollectedBy,
        paymentCustomerId: 0,
        paymentDate: data.paymentDate,
        paymentAmount: data.paymentAmount,
        chequeAmount: null,
        lcAmountTransferAtBank: data.lcAmountTransferAtBank,
        lcAdjustmentAmount: data.lcAdjustmentAmount,
        lcCollectionConversionRate: data.lcCollectionConversionRate,
        paymentNote: data.paymentNote ?? '',
        isPaymentComplete: data.isPaymentComplete,
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
            showToast({ message: 'Payment recorded successfully', type: 'success' })
            navigate('/lc/payments')
          }
        },
        onError: (err) => setServerError((err as Error).message || 'Something went wrong'),
      },
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          to="/lc/payments"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">LC Payment Entry</h1>
          {lcDocId > 0 && <p className="text-xs text-gray-500">LC Document ID: {lcDocId}</p>}
        </div>
      </div>

      {/* LC Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs uppercase font-medium text-gray-400">LC Amount</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {formatCurrency(summary.lcAmount ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-gray-400">Total Paid</p>
            <p className="mt-0.5 text-lg font-bold text-emerald-700">
              {formatCurrency(summary.totalPaid ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-gray-400">Remaining</p>
            <p className="mt-0.5 text-lg font-bold text-amber-700">
              {formatCurrency(summary.remainingAmount ?? 0)}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <LcPaymentForm control={form.control} errors={form.formState.errors} />

          <div className="mt-8 flex items-center gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Record Payment
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
