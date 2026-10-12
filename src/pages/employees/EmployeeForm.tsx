import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  employeeSchema,
  type EmployeeFormData,
  bloodGroupOptions,
} from '@/schemas/employeeSchema'
import { useChannels, useDesignations, useDepartments } from '@/hooks/useCustomers'
import { useEmployeeTypes } from '@/hooks/useEmployees'
import { getSubmitToneClass } from '@/lib/actionButtonStyles'

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormData>
  onSubmit: (data: EmployeeFormData) => void
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
}

export function EmployeeForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  serverError,
}: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      empFirstName: '',
      empLastName: '',
      designationId: 0,
      bloodGroup: '',
      empPresentAddress: '',
      empParmanentAddress: '',
      dateOfJoining: '',
      departmentId: 0,
      channelId: 0,
      empTypeId: 0,
      empContactNo: '',
      guardianContactNo: '',
      ...defaultValues,
    },
  })

  /* re-sync when defaultValues change (edit page loads data async) */
  useEffect(() => {
    if (defaultValues) reset({ ...defaultValues })
  }, [defaultValues, reset])

  /* dropdown data */
  const { data: designations, isLoading: loadingDesignations } = useDesignations()
  const { data: departments, isLoading: loadingDepartments } = useDepartments()
  const { data: channels, isLoading: loadingChannels } = useChannels()
  const { data: employeeTypes, isLoading: loadingEmpTypes } = useEmployeeTypes()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* server error */}
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* ── Personal Info ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Personal Information
        </legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="First Name *" error={errors.empFirstName?.message}>
            <input
              {...register('empFirstName')}
              className={inputCls}
              placeholder="First name"
            />
          </Field>

          <Field label="Last Name *" error={errors.empLastName?.message}>
            <input
              {...register('empLastName')}
              className={inputCls}
              placeholder="Last name"
            />
          </Field>

          <Field label="Contact Number *" error={errors.empContactNo?.message}>
            <input
              {...register('empContactNo')}
              className={inputCls}
              placeholder="Contact number"
            />
          </Field>

          <Field label="Guardian Contact" error={errors.guardianContactNo?.message}>
            <input
              {...register('guardianContactNo')}
              className={inputCls}
              placeholder="Guardian contact (optional)"
            />
          </Field>

          <Field label="Blood Group *" error={errors.bloodGroup?.message}>
            <select {...register('bloodGroup')} className={inputCls}>
              <option value="">Select blood group</option>
              {bloodGroupOptions.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date of Joining *" error={errors.dateOfJoining?.message}>
            <input
              type="date"
              {...register('dateOfJoining')}
              className={inputCls}
            />
          </Field>
        </div>
      </fieldset>

      {/* ── Address ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Address
        </legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Present Address *" error={errors.empPresentAddress?.message}>
            <input
              {...register('empPresentAddress')}
              className={inputCls}
              placeholder="Present address"
            />
          </Field>

          <Field label="Permanent Address *" error={errors.empParmanentAddress?.message}>
            <input
              {...register('empParmanentAddress')}
              className={inputCls}
              placeholder="Permanent address"
            />
          </Field>
        </div>
      </fieldset>

      {/* ── Organisation ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Organisation
        </legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Designation *" error={errors.designationId?.message}>
            <select
              {...register('designationId', numericRequired)}
              className={inputCls}
              disabled={loadingDesignations}
            >
              <option value="">Select designation</option>
              {designations?.map((d) => (
                <option key={d.designationId} value={d.designationId}>
                  {d.designation1}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Department *" error={errors.departmentId?.message}>
            <select
              {...register('departmentId', numericRequired)}
              className={inputCls}
              disabled={loadingDepartments}
            >
              <option value="">Select department</option>
              {departments?.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Location / Channel *" error={errors.channelId?.message}>
            <select
              {...register('channelId', numericRequired)}
              className={inputCls}
              disabled={loadingChannels}
            >
              <option value="">Select location</option>
              {channels?.map((ch) => (
                <option key={ch.channelId} value={ch.channelId}>
                  {ch.channelName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Employee Type *" error={errors.empTypeId?.message}>
            <select
              {...register('empTypeId', numericRequired)}
              className={inputCls}
              disabled={loadingEmpTypes}
            >
              <option value="">Select type</option>
              {employeeTypes?.map((et) => (
                <option key={et.empTypeId} value={et.empTypeId}>
                  {et.employeeTypeName}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      {/* actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${getSubmitToneClass(submitLabel)} inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

/* ─── shared styling / helpers ─── */

/** For required selects: empty string → 0, which fails z.number().min(1) */
const numericRequired = {
  setValueAs: (v: string | number | null | undefined) =>
    v === '' || v === undefined || v === null ? 0 : Number(v),
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
