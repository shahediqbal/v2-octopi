import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { useLcPaymentDetail, useLcPaymentSummary } from '@/hooks/useLcTracking'
import { formatCurrency, formatDate } from '@/lib/utils'

const INFO_LABEL = 'text-xs uppercase font-medium text-gray-400'
const INFO_VALUE = 'mt-0.5 text-sm font-semibold text-gray-800'

export function LcPaymentViewPage() {
  const { id } = useParams<{ id: string }>()
  const paymentId = Number(id)
  const location = useLocation()
  const state = location.state as { returnTo?: string } | null
  const returnTo = typeof state?.returnTo === 'string' ? state.returnTo : '/lc/payments/completed'

  const { data, isLoading, isError } = useLcPaymentDetail(paymentId)
  const { data: summary } = useLcPaymentSummary(data?.lcDocId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading LC payment details...</span>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 text-red-500" />
          <p className="text-sm text-red-700">Failed to load LC payment details.</p>
        </div>
      </div>
    )
  }

  const lcAmount = summary?.lcAmount ?? data.paymentAmount ?? 0
  const totalPaid = summary?.totalPaid ?? data.paymentAmount ?? 0
  const remaining = summary?.remainingBalance ?? summary?.remainingAmount ?? 0
  const pct = lcAmount > 0 ? Math.min(100, (totalPaid / lcAmount) * 100) : 0
  const employeeName = [data.empFirstName, data.empLastName].filter(Boolean).join(' ')
  const employeeDisplay = employeeName || data.employeeCode || 'N/A'

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          to={returnTo}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">LC Payment View</h1>
          <p className="text-xs text-gray-500">Payment ID: {paymentId}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: '#2E7D32' }}>LC Information</h2>
          <span
            className="rounded-full px-3 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: data.isPaymentComplete ? '#2E7D32' : '#FF9800' }}
          >
            {data.isPaymentComplete ? 'Completed' : 'Partial'}
          </span>
        </div>
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
            <p className={INFO_LABEL}>LC Doc ID</p>
            <p className={INFO_VALUE}>{data.lcDocId}</p>
          </div>
        </div>
      </div>

      {summary && (
        <div
          className="rounded-lg border p-5 shadow-sm"
          style={{ backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }}
        >
          <h2 className="mb-3 text-base font-bold" style={{ color: '#2E7D32' }}>Payment Summary</h2>
          <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: summary.isFullyPaid ?? pct >= 100 ? '#4CAF50' : '#2196F3',
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
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-gray-900">Payment Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className={INFO_LABEL}>Payment Date</p>
            <p className={INFO_VALUE}>{data.paymentDate ? formatDate(data.paymentDate) : 'N/A'}</p>
          </div>
          <div>
            <p className={INFO_LABEL}>Payment Amount</p>
            <p className={INFO_VALUE}>{formatCurrency(data.paymentAmount ?? 0)}</p>
          </div>
          <div>
            <p className={INFO_LABEL}>Collected By</p>
            <p className={INFO_VALUE}>{employeeDisplay}</p>
          </div>
          <div>
            <p className={INFO_LABEL}>Amount Transfer At Bank</p>
            <p className={INFO_VALUE}>{formatCurrency(data.lcAmountTransferAtBank ?? 0)}</p>
          </div>
          <div>
            <p className={INFO_LABEL}>Adjustment Amount</p>
            <p className={INFO_VALUE}>{formatCurrency(data.lcAdjustmentAmount ?? 0)}</p>
          </div>
          <div>
            <p className={INFO_LABEL}>Conversion Rate</p>
            <p className={INFO_VALUE}>{data.lcCollectionConversionRate ?? 0}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <p className={INFO_LABEL}>Payment Note</p>
          <p className="mt-1 text-sm text-gray-700">{data.paymentNote || 'No note provided'}</p>
        </div>
      </div>
    </div>
  )
}