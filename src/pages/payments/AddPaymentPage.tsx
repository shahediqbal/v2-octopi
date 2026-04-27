import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PaymentForm, buildPaymentPayload } from './PaymentForm'
import { useCreatePayment } from '@/hooks/usePayments'
import type { CreatePaymentPayload } from '@/types/payment'

export function AddPaymentPage() {
  const navigate = useNavigate()
  const [stayInPage, setStayInPage] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [serverError, setServerError] = useState<string | undefined>()

  const createPayment = useCreatePayment()

  const handleSubmit = (payload: CreatePaymentPayload | ReturnType<typeof buildPaymentPayload>) => {
    setServerError(undefined)
    createPayment.mutate(payload as CreatePaymentPayload, {
      onSuccess: () => {
        if (stayInPage) {
          // Reset the form by remounting via key
          setFormKey((k) => k + 1)
        } else {
          navigate('/payments')
        }
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Failed to create payment. Please try again.'
        setServerError(message)
      },
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/payments"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={14} />
          Back to Payments
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Add Payment</h1>
        <p className="mt-1 text-sm text-gray-500">Record a new customer payment</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <PaymentForm
          key={formKey}
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={createPayment.isPending}
          submitLabel={createPayment.isPending ? 'Saving…' : 'Save Payment'}
          serverError={serverError}
          stayInPage={stayInPage}
          onStayInPageChange={setStayInPage}
        />
      </div>
    </div>
  )
}
