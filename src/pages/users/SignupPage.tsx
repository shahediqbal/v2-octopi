import { useState, useEffect } from 'react'
import { Loader2, Plus, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { PaginatedCombobox } from '@/components/dropdowns/PaginatedCombobox'
import { useSignup, useUserRoles, useCreateRole, useEmployeeDetail } from '@/hooks/useUserManagement'
import { useToastStore } from '@/stores/toastStore'

interface FormValues {
  customerId: number | null
  employeeId: number | null
  userFirstName: string
  userLastName: string
  userContactNo: string
  userMail: string
  roleId: number | null
  userPassword: string
  userConfirmPassword: string
  usernameType: 'email' | 'mobile'
}

const defaultValues: FormValues = {
  customerId: null,
  employeeId: null,
  userFirstName: '',
  userLastName: '',
  userContactNo: '',
  userMail: '',
  roleId: null,
  userPassword: '',
  userConfirmPassword: '',
  usernameType: 'email',
}

export function SignupPage() {
  const { data: roles = [], isLoading: rolesLoading } = useUserRoles()
  const { mutate: signup, isPending } = useSignup()
  const { mutate: createRole, isPending: creatingRole } = useCreateRole()
  const showToast = useToastStore((s) => s.showToast)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues })

  const employeeId = watch('employeeId')
  const { data: employeeDetail } = useEmployeeDetail(employeeId)

  // Auto-fill from employee when selected
  useEffect(() => {
    if (!employeeDetail) return
    setValue('userFirstName', employeeDetail.empFirstName ?? '')
    setValue('userLastName', employeeDetail.empLastName ?? '')
    const phone = employeeDetail.empContactNo ?? ''
    // strip leading +88 prefix if present
    setValue('userContactNo', phone.startsWith('+88') ? phone.slice(3) : phone)
  }, [employeeDetail, setValue])

  const onSubmit = (values: FormValues) => {
    setServerError('')
    if (!values.roleId) {
      setServerError('Please select a role.')
      return
    }
    if (values.userPassword !== values.userConfirmPassword) {
      setServerError('Passwords do not match.')
      return
    }

    const employeeCode = employeeDetail?.employeeCode ?? null

    signup(
      {
        userSystemId: 0,
        userUniqueCode:
          values.employeeId && employeeCode
            ? String(employeeCode)
            : String(values.customerId ?? 0),
        userFirstName: values.userFirstName,
        userLastName: values.userLastName,
        userAddress: 'string',
        userContactNo: values.userContactNo,
        userMail: values.userMail,
        userCategoryId: 0,
        userActiveStatus: 1,
        clientId: values.customerId ?? 0,
        userName:
          values.usernameType === 'email' ? values.userMail : values.userContactNo,
        userPassword: values.userPassword,
        userRoleId: values.roleId,
      },
      {
        onSuccess: (res: any) => {
          if (res?.errMsg) {
            setServerError(res.errMsg)
            return
          }
          showToast({ message: 'New Account Created', type: 'success' })
          reset(defaultValues)
        },
        onError: (err: any) => {
          setServerError(err?.response?.data?.errMsg ?? err?.message ?? 'Something went wrong')
        },
      },
    )
  }

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return
    createRole(
      { roleName: newRoleName.trim(), roleStatus: 1 },
      {
        onSuccess: () => {
          showToast({ message: 'New Role Created', type: 'success' })
          setNewRoleName('')
          setAddRoleOpen(false)
        },
        onError: () => {
          showToast({ message: 'Failed to create role', type: 'error' })
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Registration</h1>
        <p className="mt-1 text-sm text-gray-500">Create a new system user account.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ── Left column ── */}
          <div className="space-y-4">
            {/* Customer */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Customer
              </label>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <PaginatedCombobox
                    type="customer"
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v)
                      if (v) setValue('employeeId', null)
                    }}
                    placeholder="Search customer…"
                  />
                )}
              />
            </div>

            {/* Employee */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Employee
              </label>
              <Controller
                name="employeeId"
                control={control}
                render={({ field }) => (
                  <PaginatedCombobox
                    type="employee"
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v)
                      if (v) setValue('customerId', null)
                    }}
                    placeholder="Search employee…"
                  />
                )}
              />
            </div>

            {/* Role */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <Controller
                name="roleId"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    disabled={rolesLoading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="">Select role…</option>
                    {roles.map((r) => (
                      <option key={r.roleId} value={r.roleId}>
                        {r.roleName}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {/* Add new role inline */}
            {!addRoleOpen ? (
              <button
                type="button"
                onClick={() => setAddRoleOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                <Plus size={14} /> Create New Role
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Role name…"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
                <button
                  type="button"
                  onClick={handleCreateRole}
                  disabled={creatingRole || !newRoleName.trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {creatingRole ? <Loader2 size={13} className="animate-spin" /> : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddRoleOpen(false); setNewRoleName('') }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('userFirstName', { required: 'First name is required' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
              {errors.userFirstName && (
                <p className="mt-1 text-xs text-red-600">{errors.userFirstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('userLastName', { required: 'Last name is required' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
              {errors.userLastName && (
                <p className="mt-1 text-xs text-red-600">{errors.userLastName.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register('userContactNo', { required: 'Contact number is required' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
              {errors.userContactNo && (
                <p className="mt-1 text-xs text-red-600">{errors.userContactNo.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('userMail', { required: 'Email is required' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
              {errors.userMail && (
                <p className="mt-1 text-xs text-red-600">{errors.userMail.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Full-width bottom rows ── */}
        <div className="mt-6 space-y-4">
          {/* Username type toggle */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Username will be
            </label>
            <Controller
              name="usernameType"
              control={control}
              render={({ field }) => (
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      value="email"
                      checked={field.value === 'email'}
                      onChange={() => field.onChange('email')}
                      className="accent-gray-700"
                    />
                    Email address
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      value="mobile"
                      checked={field.value === 'mobile'}
                      onChange={() => field.onChange('mobile')}
                      className="accent-gray-700"
                    />
                    Mobile number
                  </label>
                </div>
              )}
            />
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('userPassword', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.userPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.userPassword.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('userConfirmPassword', {
                    required: 'Please confirm your password',
                  })}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.userConfirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.userConfirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={15} /> {serverError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {isPending && <Loader2 size={15} className="animate-spin" />}
              Register User
            </button>
            <button
              type="button"
              onClick={() => { reset(defaultValues); setServerError('') }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
