import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useCreateRole,
  useRoleDetails,
  useRoles,
  useUpdateRoleDetails,
} from '@/hooks/useRoleAndMenu'
import { roleSchema, type RoleFormData } from '@/schemas/roleSchema'
import type { MenuItem } from '@/types/roleAndMenu'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function ManageRoleAndMenuPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)

  // Local copies of the menu lists — mutated on assign / remove without API call
  const [localUnassigned, setLocalUnassigned] = useState<MenuItem[]>([])
  const [localAssigned, setLocalAssigned] = useState<MenuItem[]>([])
  const [isDirty, setIsDirty] = useState(false)

  // Checkbox selections (by menuId)
  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<number[]>([])
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<number[]>([])

  // Search text per panel
  const [roleSearch, setRoleSearch] = useState('')
  const [unassignedSearch, setUnassignedSearch] = useState('')
  const [assignedSearch, setAssignedSearch] = useState('')

  const [showAddRoleModal, setShowAddRoleModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Data hooks ────────────────────────────────────────────────────────────
  const { data: roles = [], isLoading: rolesLoading } = useRoles()
  const { data: roleDetails, isLoading: detailsLoading } = useRoleDetails(selectedRoleId)
  const createRole = useCreateRole()
  const updateRoleDetails = useUpdateRoleDetails()

  // ── Sync server data → local state whenever a new role is selected ────────
  useEffect(() => {
    if (roleDetails) {
      setLocalUnassigned(roleDetails.menuList ?? [])
      setLocalAssigned(roleDetails.permittedMenuList ?? [])
      setSelectedUnassignedIds([])
      setSelectedAssignedIds([])
      setUnassignedSearch('')
      setAssignedSearch('')
      setIsDirty(false)
    }
  }, [roleDetails])

  // ── Auto-dismiss toast after 3 s ─────────────────────────────────────────
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(id)
  }, [toast])

  // ── Add-role form ─────────────────────────────────────────────────────────
  const form = useForm<RoleFormData>({ resolver: zodResolver(roleSchema) })

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles
    const q = roleSearch.toLowerCase()
    return roles.filter((r) => (r.roleName ?? '').toLowerCase().includes(q))
  }, [roles, roleSearch])

  const filteredUnassigned = useMemo(() => {
    if (!unassignedSearch.trim()) return localUnassigned
    const q = unassignedSearch.toLowerCase()
    return localUnassigned.filter(
      (m) =>
        (m.menuName ?? '').toLowerCase().includes(q) ||
        (m.menuParentName ?? '').toLowerCase().includes(q),
    )
  }, [localUnassigned, unassignedSearch])

  const filteredAssigned = useMemo(() => {
    if (!assignedSearch.trim()) return localAssigned
    const q = assignedSearch.toLowerCase()
    return localAssigned.filter(
      (m) =>
        (m.menuName ?? '').toLowerCase().includes(q) ||
        (m.menuParentName ?? '').toLowerCase().includes(q),
    )
  }, [localAssigned, assignedSearch])

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleSelectRole = (roleId: number) => {
    setSelectedRoleId(roleId)
    setRoleSearch('')
  }

  /** Move checked items from unassigned → assigned (local state only) */
  const handleAssign = () => {
    if (selectedUnassignedIds.length === 0) return
    const toMove = localUnassigned.filter((m) => selectedUnassignedIds.includes(m.menuId))
    setLocalAssigned((prev) => [...prev, ...toMove])
    setLocalUnassigned((prev) => prev.filter((m) => !selectedUnassignedIds.includes(m.menuId)))
    setSelectedUnassignedIds([])
    setIsDirty(true)
  }

  /** Move checked items from assigned → unassigned (local state only) */
  const handleRemove = () => {
    if (selectedAssignedIds.length === 0) return
    const toMove = localAssigned.filter((m) => selectedAssignedIds.includes(m.menuId))
    setLocalUnassigned((prev) => [...prev, ...toMove])
    setLocalAssigned((prev) => prev.filter((m) => !selectedAssignedIds.includes(m.menuId)))
    setSelectedAssignedIds([])
    setIsDirty(true)
  }

  /** Persist current assigned list to the API */
  const handleUpdate = () => {
    if (!isDirty) {
      setToast({ message: 'No changes detected', type: 'error' })
      return
    }
    if (!roleDetails) return

    updateRoleDetails.mutate(
      {
        roleId: roleDetails.roleId,
        roleName: roleDetails.roleName,
        roleActiveStatus: roleDetails.roleActiveStatus,
        rolePermissionIdList: localAssigned.map((m) => m.menuId),
      },
      {
        onSuccess: () => {
          setToast({ message: 'Permissions updated successfully', type: 'success' })
          setIsDirty(false)
        },
        onError: () => setToast({ message: 'Update failed — please try again', type: 'error' }),
      },
    )
  }

  const handleAddRole = (values: RoleFormData) => {
    createRole.mutate(values, {
      onSuccess: () => {
        setToast({ message: 'Role created successfully', type: 'success' })
        setShowAddRoleModal(false)
        form.reset()
      },
      onError: () => setToast({ message: 'Failed to create role', type: 'error' }),
    })
  }

  // ── Checkbox helpers ──────────────────────────────────────────────────────

  const toggleUnassigned = (id: number) =>
    setSelectedUnassignedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const toggleAssigned = (id: number) =>
    setSelectedAssignedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const toggleAllUnassigned = () =>
    setSelectedUnassignedIds(
      selectedUnassignedIds.length === filteredUnassigned.length
        ? []
        : filteredUnassigned.map((m) => m.menuId),
    )

  const toggleAllAssigned = () =>
    setSelectedAssignedIds(
      selectedAssignedIds.length === filteredAssigned.length
        ? []
        : filteredAssigned.map((m) => m.menuId),
    )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-6">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Manage Role &amp; Menu</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Extend and limit user access by assigning menu permissions to roles
        </p>
      </div>

      {/* ── 3-Panel Layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_1fr]">

        {/* ── Panel 1: Roles ── */}
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">Roles</span>
            <button
              onClick={() => setShowAddRoleModal(true)}
              className="flex items-center gap-1 rounded-lg bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700"
            >
              <Plus size={12} />
              Add Role
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-gray-100 px-3 py-2">
            <SearchInput
              value={roleSearch}
              onChange={setRoleSearch}
              placeholder="Search roles..."
            />
          </div>

          {/* Role rows */}
          <div className="flex-1 overflow-y-auto">
            {rolesLoading ? (
              <LoadingState />
            ) : filteredRoles.length === 0 ? (
              <EmptyState message="No roles found" />
            ) : (
              filteredRoles.map((role) => (
                <button
                  key={role.roleId}
                  onClick={() => handleSelectRole(role.roleId)}
                  className={cn(
                    'flex w-full items-center justify-between border-b border-gray-50 px-4 py-2.5 text-sm transition-colors last:border-0',
                    selectedRoleId === role.roleId
                      ? 'bg-gray-100 font-medium text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Shield size={14} className="shrink-0 text-gray-400" />
                    {role.roleName}
                  </span>
                  {selectedRoleId === role.roleId && (
                    <ChevronRight size={14} className="text-gray-400" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Panel 2: Unassigned Menus ── */}
        <MenuPanel
          title="Unassigned Menus"
          badge={localUnassigned.length}
          items={filteredUnassigned}
          selectedIds={selectedUnassignedIds}
          onToggle={toggleUnassigned}
          onToggleAll={toggleAllUnassigned}
          allSelected={
            filteredUnassigned.length > 0 &&
            selectedUnassignedIds.length === filteredUnassigned.length
          }
          search={unassignedSearch}
          onSearch={setUnassignedSearch}
          loading={detailsLoading}
          noSelection={selectedRoleId === null}
          actions={
            <button
              disabled={selectedUnassignedIds.length === 0}
              onClick={handleAssign}
              className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={12} />
              Assign{selectedUnassignedIds.length > 0 ? ` (${selectedUnassignedIds.length})` : ''}
            </button>
          }
        />

        {/* ── Panel 3: Assigned Menus ── */}
        <MenuPanel
          title="Assigned Menus"
          badge={localAssigned.length}
          items={filteredAssigned}
          selectedIds={selectedAssignedIds}
          onToggle={toggleAssigned}
          onToggleAll={toggleAllAssigned}
          allSelected={
            filteredAssigned.length > 0 &&
            selectedAssignedIds.length === filteredAssigned.length
          }
          search={assignedSearch}
          onSearch={setAssignedSearch}
          loading={detailsLoading}
          noSelection={selectedRoleId === null}
          actions={
            <>
              <button
                disabled={selectedAssignedIds.length === 0}
                onClick={handleRemove}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={12} />
                Remove{selectedAssignedIds.length > 0 ? ` (${selectedAssignedIds.length})` : ''}
              </button>
              <button
                disabled={!isDirty || updateRoleDetails.isPending}
                onClick={handleUpdate}
                className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw
                  size={12}
                  className={updateRoleDetails.isPending ? 'animate-spin' : ''}
                />
                {updateRoleDetails.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          }
        />
      </div>

      {/* ── Add Role Modal ──────────────────────────────────────────── */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Create New Role</h2>
              <button
                onClick={() => {
                  setShowAddRoleModal(false)
                  form.reset()
                }}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={form.handleSubmit(handleAddRole)} className="flex flex-col gap-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...form.register('rolename')}
                  placeholder="e.g. Sales Manager"
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
                {form.formState.errors.rolename && (
                  <p className="mt-1 text-xs text-red-600">
                    {form.formState.errors.rolename.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoleModal(false)
                    form.reset()
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRole.isPending}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                >
                  {createRole.isPending ? 'Creating…' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast notification ──────────────────────────────────────── */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg',
            toast.type === 'success'
              ? 'bg-gray-900 text-white'
              : 'bg-red-600 text-white',
          )}
        >
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

interface MenuPanelProps {
  title: string
  badge: number
  items: MenuItem[]
  selectedIds: number[]
  onToggle: (id: number) => void
  onToggleAll: () => void
  allSelected: boolean
  search: string
  onSearch: (v: string) => void
  loading: boolean
  noSelection: boolean
  actions: React.ReactNode
}

function MenuPanel({
  title,
  badge,
  items,
  selectedIds,
  onToggle,
  onToggleAll,
  allSelected,
  search,
  onSearch,
  loading,
  noSelection,
  actions,
}: MenuPanelProps) {
  return (
    <div className="flex min-h-[500px] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header — title + badge + action buttons */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{badge}</span>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>

      {/* Search */}
      <div className="border-b border-gray-100 px-3 py-2">
        <SearchInput
          value={search}
          onChange={onSearch}
          disabled={noSelection || loading}
          placeholder="Search by name or group…"
        />
      </div>

      {/* Column headings */}
      {!noSelection && !loading && items.length > 0 && (
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="rounded border-gray-300 text-gray-800 focus:ring-gray-300"
          />
          <span className="w-28 shrink-0">Group</span>
          <span>Action / Menu</span>
        </div>
      )}

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingState />
        ) : noSelection ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8">
            <Shield size={32} className="text-gray-200" />
            <p className="text-center text-sm text-gray-400">
              Select a role to view its menu permissions
            </p>
          </div>
        ) : items.length === 0 ? (
          <EmptyState message="No menus found" />
        ) : (
          items.map((item) => {
            const checked = selectedIds.includes(item.menuId)
            return (
              <label
                key={item.menuId}
                className={cn(
                  'flex cursor-pointer items-center gap-3 border-b border-gray-50 px-4 py-2 text-sm last:border-0',
                  checked ? 'bg-gray-50' : 'hover:bg-gray-50',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.menuId)}
                  className="rounded border-gray-300 text-gray-800 focus:ring-gray-300"
                />
                <span className="w-28 shrink-0 truncate text-xs text-gray-500">
                  {item.menuParentName}
                </span>
                <span className="text-gray-900">{item.menuName}</span>
              </label>
            )
          })
        )}
      </div>

    </div>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-40"
      />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-6">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
      <p className="text-xs text-gray-400">Loading…</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center p-6 text-sm text-gray-400">{message}</div>
  )
}
