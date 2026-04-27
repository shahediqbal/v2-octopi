import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { SupplierForm } from './SupplierForm'
import type { SupplierFormData } from '@/schemas/supplierSchema'
import { useCreateSupplier } from '@/hooks/useSuppliers'

function extractErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'body' in error) {
    const body = (error as { body?: { errMsg?: string; message?: string } }).body
    if (body?.errMsg) return body.errMsg
    if (body?.message) return body.message
  }
  return (error as Error)?.message || 'Something went wrong'
}

export function AddSupplierPage() {
  const navigate = useNavigate()
  const createMutation = useCreateSupplier()
  const [serverError, setServerError] = useState('')

  const handleSubmit = (data: SupplierFormData) => {
    setServerError('')

    createMutation.mutate(
      {
        supplierId: 0,
        supplierName: data.supplierName,
        supplierAddress: data.supplierAddress,
        supplierContactPerson: data.supplierContactPerson,
        supplierContactNumber: data.supplierContactNumber,
        supplierLat: null,
        supplierLong: null,
      },
      {
        onSuccess: (response) => {
          if (response.errMsg) {
            setServerError(response.errMsg)
          } else {
            navigate('/suppliers')
          }
        },
        onError: (error) => {
          setServerError(extractErrorMessage(error))
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/suppliers" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Supplier</h1>
          <p className="mt-0.5 text-sm text-gray-500">Create a new supplier record</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <SupplierForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Supplier"
          serverError={serverError}
        />
      </div>
    </div>
  )
}