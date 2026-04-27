import { useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LocationForm } from './LocationForm'
import type { LocationFormData } from '@/schemas/locationSchema'
import { useDeleteLocation, useLocationDetail, useUpdateLocation } from '@/hooks/useLocations'
import { useToastStore } from '@/stores/toastStore'

function extractErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'body' in error) {
    const body = (error as { body?: { errMsg?: string; message?: string } }).body
    if (body?.errMsg) return body.errMsg
    if (body?.message) return body.message
  }
  return (error as Error)?.message || 'Something went wrong'
}

export function EditLocationPage() {
  const { id } = useParams<{ id: string }>()
  const locationId = Number(id)
  const navigate = useNavigate()
  const { data: location, isLoading, isError, error } = useLocationDetail(locationId || undefined)
  const updateMutation = useUpdateLocation()
  const deleteMutation = useDeleteLocation()
  const [serverError, setServerError] = useState('')
  const showToast = useToastStore((state) => state.showToast)

  const formDefaults = useMemo<Partial<LocationFormData> | undefined>(() => {
    if (!location) return undefined
    return {
      locationName: location.locationName ?? '',
    }
  }, [location])

  const handleSubmit = (data: LocationFormData) => {
    setServerError('')

    updateMutation.mutate(
      {
        locationId,
        locationName: data.locationName,
      },
      {
        onSuccess: (response) => {
          if (response.errMsg) {
            setServerError(response.errMsg)
            showToast({ message: response.errMsg, type: 'error' })
          } else {
            showToast({ message: 'Location updated successfully', type: 'success' })
            navigate('/locations')
          }
        },
        onError: (submitError) => {
          const message = extractErrorMessage(submitError)
          setServerError(message)
          showToast({ message, type: 'error' })
        },
      },
    )
  }

  const handleDelete = () => {
    if (!locationId || !window.confirm('Delete this location? This action cannot be undone.')) return
    deleteMutation.mutate(locationId, {
      onSuccess: (response) => {
        if (response.errMsg) {
          setServerError(response.errMsg)
          showToast({ message: response.errMsg, type: 'error' })
          return
        }
        showToast({ message: 'Location deleted successfully', type: 'success' })
        navigate('/locations')
      },
      onError: (deleteError) => {
        const message = extractErrorMessage(deleteError)
        setServerError(message)
        showToast({ message, type: 'error' })
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading location…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load location</p>
          <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/locations" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Location</h1>
            <p className="mt-0.5 text-sm text-gray-500">{location?.locationName} — ID #{locationId}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          Delete Location
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <LocationForm
          defaultValues={formDefaults}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel="Update Location"
          serverError={serverError}
        />
      </div>
    </div>
  )
}