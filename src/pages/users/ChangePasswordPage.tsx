import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Eye, EyeOff, Lock } from 'lucide-react'
import { jwtDecode } from 'jwt-decode'
import { getLegacyUserInfo } from '@/auth/authBridge'
import { useChangePassword } from '@/hooks/useUserManagement'
import { useToastStore } from '@/stores/toastStore'

interface FormValues {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const labelCls = 'mb-1 block text-sm font-medium text-gray-700'

export function ChangePasswordPage() {
  const { mutate: changePassword, isPending } = useChangePassword()
  const showToast = useToastStore((s) => s.showToast)

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  })

  const newPassword = watch('newPassword')

  function getUserSystemId(): number | null {
    try {
      const token = getLegacyUserInfo()?.token
      if (!token) return null
      const decoded = jwtDecode<{ UserSystemId?: number }>(token)
      return decoded.UserSystemId ?? null
    } catch {
      return null
    }
  }

  function onSubmit(values: FormValues) {
    setServerError('')
    const userSystemId = getUserSystemId()
    if (!userSystemId) {
      setServerError('Could not identify current user. Please sign in again.')
      return
    }

    changePassword(
      {
        userSystemId,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          showToast('Password changed successfully.', 'success')
          reset()
        },
        onError: (err: unknown) => {
          const msg =
            err instanceof Error ? err.message : 'Failed to change password. Please try again.'
          setServerError(msg)
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Lock className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Change Password</h1>
            <p className="text-sm text-gray-500">Update your account password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Old Password */}
          <div>
            <label className={labelCls}>
              Old Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                {...register('oldPassword', { required: 'Old password is required' })}
                className={inputCls + ' pr-10'}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowOld((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.oldPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className={labelCls}>
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  validate: (v) => {
                    const hasUpper = /[A-Z]/.test(v)
                    const hasLower = /[a-z]/.test(v)
                    const hasNumber = /[0-9]/.test(v)
                    const hasSymbol = /[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]/.test(v)
                    if (hasUpper && hasLower && hasNumber && hasSymbol) return true
                    return 'Must contain uppercase, lowercase, a number and a symbol'
                  },
                })}
                className={inputCls + ' pr-10'}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className={labelCls}>
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (v) => v === newPassword || 'Passwords do not match',
                })}
                className={inputCls + ' pr-10'}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
