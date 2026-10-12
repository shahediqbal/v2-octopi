import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { locationSchema, type LocationFormData } from '@/schemas/locationSchema'
import { getSubmitToneClass } from '@/lib/actionButtonStyles'

interface LocationFormProps {
  defaultValues?: Partial<LocationFormData>
  onSubmit: (data: LocationFormData) => void
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
}

export function LocationForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  serverError,
}: LocationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      locationName: '',
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (defaultValues) {
      reset({
        locationName: '',
        ...defaultValues,
      })
    }
  }, [defaultValues, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-gray-700">Location Information</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Location Name *" error={errors.locationName?.message}>
            <input {...register('locationName')} className={inputCls} placeholder="Location name" />
          </Field>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${getSubmitToneClass(submitLabel)} inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}