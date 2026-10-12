import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCreateCustomer } from '@/hooks/useCustomers'
import { CustomerForm } from './CustomerForm'
import type { CustomerFormData } from '@/schemas/customerSchema'

export function AddCustomerPage() {
  const navigate = useNavigate()
  const createMutation = useCreateCustomer()
  const [serverError, setServerError] = useState('')

  const handleSubmit = (data: CustomerFormData) => {
    setServerError('')

    createMutation.mutate(
      {
        customerName: data.customerName,
        customerAddress: data.customerAddress,
        locationId: null,
        contactPersonName: data.contactPersonName || null,
        contactNumber: data.contactNumber || null,
        designationId: data.designationId,
        channelId: data.channelId,
        employeeId: data.employeeId,
        customerLat: null,
        customerLong: null,
        paymentInterval: data.paymentInterval ?? '',
        paymentCycleType: data.paymentCycleType ?? '',
        paymentCycleValue: data.paymentCycleValue,
        paymentMode: data.paymentMode ?? '',
        currentStatus: data.currentStatus ?? '',
        linkCustomerId: data.linkCustomerId,
        specialNote: data.specialNote ?? '',
        disputeAmount: data.disputeAmount,
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) {
            setServerError(res.errMsg)
          } else {
            navigate('/customers')
          }
        },
        onError: (err) => {
          setServerError((err as Error).message || 'Something went wrong')
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Customer</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create a new customer record</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <CustomerForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Customer"
          serverError={serverError}
        />
      </div>
    </div>
  )
}
