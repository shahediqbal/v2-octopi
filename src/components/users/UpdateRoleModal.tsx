import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useUserRoles, useUpdateUserRole } from '@/hooks/useUserManagement'
import { useToastStore } from '@/stores/toastStore'
import type { UserWithRole } from '@/types/userManagement'

interface UpdateRoleModalProps {
  user: UserWithRole
  onClose: () => void
}

export function UpdateRoleModal({ user, onClose }: UpdateRoleModalProps) {
  const { data: roles = [], isLoading: rolesLoading } = useUserRoles()
  const { mutate: updateRole, isPending } = useUpdateUserRole()
  const showToast = useToastStore((s) => s.showToast)
  const [roleId, setRoleId] = useState(user.userRoleId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateRole(
      { userSystemId: user.userSystemId, userRoleId: roleId },
      {
        onSuccess: () => {
          showToast({ message: 'Role updated', type: 'success' })
          onClose()
        },
        onError: () => {
          showToast({ message: 'Failed to update role', type: 'error' })
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Update Role</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          {user.userFirstName} {user.userLastName}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
              disabled={rolesLoading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              {roles.map((r) => (
                <option key={r.roleId} value={r.roleId}>
                  {r.roleName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="action-update inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
