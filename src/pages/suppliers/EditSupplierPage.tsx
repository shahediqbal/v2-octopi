import { useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SupplierForm } from './SupplierForm'
import type { SupplierFormData } from '@/schemas/supplierSchema'
import { useDeleteSupplier, useSupplierDetail, useUpdateSupplier } from '@/hooks/useSuppliers'

function extractErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'body' in error) {
    const body = (error as { body?: { errMsg?: string; message?: string } }).body
    if (body?.errMsg) return body.errMsg
    if (body?.message) return body.message
  }
  return (error as Error)?.message || 'Something went wrong'
}

export function EditSupplierPage() {
  const { id } = useParams<{ id: string }>()
  const supplierId = Number(id)
  const navigate = useNavigate()
  const { data: supplier, isLoading, isError, error } = useSupplierDetail(supplierId || undefined)
  const updateMutation = useUpdateSupplier()
  const deleteMutation = useDeleteSupplier()
  const [serverError, setServerError] = useState('')

  const formDefaults = useMemo<Partial<SupplierFormData> | undefined>(() => {
    if (!supplier) return undefined
    return {
      supplierName: supplier.supplierName ?? '',
      supplierAddress: supplier.supplierAddress ?? '',
      supplierContactPerson: supplier.supplierContactPerson ?? '',
      supplierContactNumber: supplier.supplierContactNumber ?? '',
    }
  }, [supplier])

  const handleSubmit = (data: SupplierFormData) => {
    setServerError('')

    updateMutation.mutate(
      {
        supplierId,
        supplierName: data.supplierName,
        supplierAddress: data.supplierAddress,
        supplierContactPerson: data.supplierContactPerson,
        supplierContactNumber: data.supplierContactNumber,
        supplierLat: supplier?.supplierLat ?? null,
        supplierLong: supplier?.supplierLong ?? null,
      },
      {
        onSuccess: (response) => {
          if (response.errMsg) {
            setServerError(response.errMsg)
          } else {
            navigate('/suppliers')
          }
        },
        onError: (submitError) => {
          setServerError(extractErrorMessage(submitError))
        },
      },
    )
  }

  const handleDelete = () => {
    if (!supplierId || !window.confirm('Delete this supplier? This action cannot be undone.')) return
    deleteMutation.mutate(supplierId, {
      onSuccess: () => navigate('/suppliers'),
      onError: (deleteError) => setServerError(extractErrorMessage(deleteError)),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading supplier…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load supplier</p>
          <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/suppliers" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Supplier</h1>
            <p className="mt-0.5 text-sm text-gray-500">{supplier?.supplierName} — ID #{supplierId}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          Delete Supplier
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <SupplierForm
          defaultValues={formDefaults}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel="Update Supplier"
          serverError={serverError}
        />
      </div>
    </div>
  )
}