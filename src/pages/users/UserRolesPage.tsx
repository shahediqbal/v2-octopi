import { useMemo, useState } from 'react'
import { Search, Pencil, Loader2, AlertCircle } from 'lucide-react'
import { useUsersWithRoles } from '@/hooks/useUserManagement'
import { UpdateRoleModal } from '@/components/users/UpdateRoleModal'
import type { UserWithRole } from '@/types/userManagement'

export function UserRolesPage() {
  const { data: users = [], isLoading, isError } = useUsersWithRoles()
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) =>
      `${u.userFirstName} ${u.userLastName}`.toLowerCase().includes(q),
    )
  }, [users, search])

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Roles</h1>
        <p className="mt-1 text-sm text-gray-500">Manage role assignments for all system users.</p>
      </div>

      {/* search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>

      {/* loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <Loader2 size={18} className="animate-spin" /> Loading users…
        </div>
      )}

      {/* error */}
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> Failed to load users.
        </div>
      )}

      {/* table */}
      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-16">Edit</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-20">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-32">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Full Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Address</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.userSystemId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="Edit role"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{user.userSystemId}</td>
                    <td className="px-4 py-3 text-gray-500">{user.userUniqueCode}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.userFirstName} {user.userLastName}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{user.roleName}</td>
                    <td className="px-4 py-3 text-gray-500">{user.userAddress}</td>
                    <td className="px-4 py-3 text-gray-500">{user.userContactNo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* role edit modal */}
      {selectedUser && (
        <UpdateRoleModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  )
}
