import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useCustomerDetail, useUpdateCustomer } from '@/hooks/useCustomers'
import { CustomerForm } from './CustomerForm'
import type { CustomerFormData } from '@/schemas/customerSchema'
import {
  paymentIntervals,
  paymentCycleTypes,
  paymentModes,
  currentStatusOptions,
} from '@/schemas/customerSchema'

export function EditCustomerPage() {
  const { id } = useParams<{ id: string }>()
  const customerId = Number(id)
  const navigate = useNavigate()

  const { data: customer, isLoading, isError, error } = useCustomerDetail(customerId || undefined)
  const updateMutation = useUpdateCustomer()
  const [serverError, setServerError] = useState('')

  /* map API entity → form defaults (reverse-map title → title for selects) */
  const formDefaults = useMemo<Partial<CustomerFormData> | undefined>(() => {
    if (!customer) return undefined
    return {
      customerName: customer.customerName ?? '',
      customerAddress: customer.customerAddress ?? '',
      contactPersonName: customer.contactPersonName ?? '',
      contactNumber: customer.contactNumber ?? '',
      designationId: customer.designationId,
      channelId: customer.channelId,
      employeeId: customer.employeeId === 0 ? null : customer.employeeId,
      paymentInterval:
        paymentIntervals.find((p) => p.title === customer.paymentInterval)?.title ?? '',
      paymentCycleType:
        paymentCycleTypes.find((p) => p.title === customer.paymentCycleType)?.title ?? '',
      paymentCycleValue: customer.paymentCycleValue,
      paymentMode: paymentModes.find((p) => p.title === customer.paymentMode)?.title ?? '',
      currentStatus:
        currentStatusOptions.find((p) => p.title === customer.currentStatus)?.title ?? '',
      linkCustomerId: customer.linkCustomerId,
      specialNote: customer.specialNote ?? '',
      disputeAmount: customer.disputeAmount ?? 0,
    }
  }, [customer])

  const handleSubmit = (data: CustomerFormData) => {
    setServerError('')

    updateMutation.mutate(
      {
        customerId,
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

  /* loading state */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading customer…</span>
      </div>
    )
  }

  /* error state */
  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load customer</p>
          <p className="text-xs text-red-600 mt-1">{(error as Error)?.message}</p>
        </div>
      </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {customer?.customerName} — ID #{customerId}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <CustomerForm
          defaultValues={formDefaults}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel="Update Customer"
          serverError={serverError}
        />
      </div>
    </div>
  )
}
