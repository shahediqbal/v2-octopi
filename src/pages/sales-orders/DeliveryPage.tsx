import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Circle,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import {
  useDeliveryTaskList,
  useTaskDetail,
  useStartTask,
  useEndTask,
  useCompleteChecklist,
  useAddTransport,
  useUpdateTransport,
  useDeleteTransport,
  useMarkDestinationReached,
} from '@/hooks/useTask'
import { useDropdown } from '@/hooks/useDropdown'
import { PaginatedCombobox } from '@/components/dropdowns'
import type { TaskTransportItem } from '@/types/task'

// ─────────────────────────────────────────────────────────────────────────────
// Page — Delivery man task management
// Mirrors legacy /delivery/create (AddDelivery.js)
// ─────────────────────────────────────────────────────────────────────────────

export function DeliveryPage() {
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null)
  const [showAddTransport, setShowAddTransport] = useState(false)
  const [editingTransport, setEditingTransport] = useState<TaskTransportItem | null>(null)
  const [showCongrats, setShowCongrats] = useState(false)

  const {
    data: tasks = [],
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = useDeliveryTaskList()
  const { data: taskDetail, isLoading: loadingDetail } = useTaskDetail(
    activeTaskId ?? undefined,
  )

  // ── Set initial active task when list loads ────────────────────────────────
  useEffect(() => {
    if (tasks.length === 0 || activeTaskId != null) return
    const inProgress = tasks.find(
      (t) => t.taskStartTime != null && t.taskEndTime == null,
    )
    setActiveTaskId(inProgress?.taskId ?? tasks[0].taskId)
  }, [tasks, activeTaskId])

  // ── Derived state ──────────────────────────────────────────────────────────
  const activeTask = tasks.find((t) => t.taskId === activeTaskId)
  const isStarted =
    activeTask?.taskStartTime != null && activeTask?.taskEndTime == null
  const isEnded = activeTask?.taskEndTime != null
  const hasAnyInProgress = tasks.some(
    (t) => t.taskStartTime != null && t.taskEndTime == null,
  )

  const checklists = taskDetail?.taskChecklistsData ?? []
  const transports = taskDetail?.taskTransportationData ?? []

  const allChecklistsDone =
    checklists.length === 0 ||
    checklists.every((c) => c.checklistCompletionStatus === 1)

  const hasUnreachedTransport = transports.some(
    (t) => t.taskTransportationEndLat == null,
  )

  // ── Mutations ──────────────────────────────────────────────────────────────
  const startTask = useStartTask()
  const endTask = useEndTask()
  const completeChecklist = useCompleteChecklist()
  const deleteTransport = useDeleteTransport()
  const markReached = useMarkDestinationReached()

  const isBusy =
    startTask.isPending ||
    endTask.isPending ||
    completeChecklist.isPending ||
    deleteTransport.isPending ||
    markReached.isPending

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStart = () => {
    if (!activeTaskId || isStarted || isEnded) return
    if (hasUnreachedTransport) {
      alert('You have not clicked the Reached button for all transports!')
      return
    }
    if (!window.confirm(`Start task "${activeTask?.taskName}"?`)) return
    startTask.mutate(activeTaskId)
  }

  const handleAccomplish = async () => {
    if (!activeTaskId || !isStarted) return
    if (hasUnreachedTransport) {
      alert('You have not clicked the Reached button for all transports!')
      return
    }
    if (!allChecklistsDone) {
      alert('You must complete all checklists before accomplishing this task.')
      return
    }
    if (!window.confirm(`Are you sure "${activeTask?.taskName}" is complete?`)) return

    await endTask.mutateAsync(activeTaskId)

    // Auto-advance to next pending task — mirrors legacy AddDelivery behavior
    const nextTask = tasks.find(
      (t) => t.taskStartTime == null && t.taskEndTime == null && t.taskId !== activeTaskId,
    )
    if (nextTask) {
      setActiveTaskId(nextTask.taskId)
    } else {
      setShowCongrats(true)
      // Remain on the accomplished task so the finished badge is visible
    }
  }

  const handleCompleteChecklist = (checklistAutoId: number | undefined) => {
    if (!activeTaskId || !checklistAutoId) return
    if (!isStarted) {
      alert('You must start the task before completing a checklist.')
      return
    }
    if (!window.confirm('Mark this checklist item as complete?')) return
    completeChecklist.mutate({ checklistAutoId, taskId: activeTaskId })
  }

  const handleDeleteTransport = (transportationId: number) => {
    if (!activeTaskId) return
    if (!window.confirm('Delete this transport record?')) return
    deleteTransport.mutate({ transportationId, taskId: activeTaskId })
  }

  const handleMarkReached = (transport: TaskTransportItem) => {
    if (!activeTaskId) return
    if (!window.confirm(`Mark "${transport.taskTransportationEndLocation}" as reached?`))
      return
    markReached.mutate({
      taskId: activeTaskId,
      taskTransportationAutoId: transport.taskTransportationAutoId,
      taskTransportationEndLat: 0,
      taskTransportationEndLong: 0,
      taskTransportationEndLocation: transport.taskTransportationEndLocation ?? '',
    })
  }

  // ── Loading / empty states ─────────────────────────────────────────────────
  if (loadingTasks) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-gray-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading your tasks…
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-10 py-12 text-center">
          <Truck className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-semibold text-gray-700">No tasks assigned</p>
          <p className="mt-1 text-sm text-gray-400">Check back later for new delivery tasks.</p>
          <button
            type="button"
            onClick={() => refetchTasks()}
            className="mt-4 flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 mx-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Congratulations banner — shown when all tasks are accomplished */}
      {showCongrats && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">CONGRATULATIONS!</p>
              <p className="text-sm text-green-700">All of your tasks are finished!</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCongrats(false)}
            className="text-green-500 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery</h1>
          <p className="mt-1 text-sm text-gray-500">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetchTasks()}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Task tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tasks.map((task) => {
          const taskStarted = task.taskStartTime != null && task.taskEndTime == null
          const taskDone = task.taskEndTime != null
          const isActive = task.taskId === activeTaskId
          const isDisabled = !isActive && hasAnyInProgress && !taskStarted && !taskDone

          return (
            <button
              key={task.taskId}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) setActiveTaskId(task.taskId)
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors
                ${isActive
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : taskDone
                  ? 'border-gray-200 bg-green-50 text-green-700 hover:bg-green-100'
                  : taskStarted
                  ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : isDisabled
                  ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              {taskDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              ) : taskStarted ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
              ) : null}
              {task.taskName ?? `Task #${task.taskId}`}
            </button>
          )
        })}
      </div>

      {/* Task detail panel */}
      {activeTask && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Task info bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">
                {activeTask.taskName ?? `Task #${activeTask.taskId}`}
              </span>
              {isEnded ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Accomplished
                </span>
              ) : isStarted ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  In Progress
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  Not Started
                </span>
              )}
              {activeTask.jobType && (
                <span className="text-xs text-gray-400">{activeTask.jobType}</span>
              )}
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* ── Checklists ─────────────────────── */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Checklists
              </h3>

              {loadingDetail ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : checklists.length === 0 ? (
                <p className="text-sm text-gray-400">No checklists for this task.</p>
              ) : (
                <div className="divide-y divide-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                  {checklists.map((item) => {
                    const done = item.checklistCompletionStatus === 1
                    return (
                      <div
                        key={item.taskChecklistAutoId ?? item.taskChecklistId}
                        className={`flex items-center justify-between px-4 py-3 ${
                          done ? 'bg-green-50' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                          )}
                          <span
                            className={`text-sm ${
                              done ? 'text-green-700 line-through' : 'text-gray-800'
                            }`}
                          >
                            {item.taskChecklistName}
                          </span>
                        </div>
                        {!done && (
                          <button
                            type="button"
                            disabled={isBusy || !isStarted}
                            onClick={() => handleCompleteChecklist(item.taskChecklistAutoId)}
                            className="ml-3 flex items-center gap-1 rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Done
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Transports ─────────────────────── */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Transportation
                </h3>
                {isStarted && !isEnded && (
                  <button
                    type="button"
                    onClick={() => setShowAddTransport(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Transport
                  </button>
                )}
              </div>

              {loadingDetail ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : transports.length === 0 ? (
                <p className="text-sm text-gray-400">No transportation records yet.</p>
              ) : (
                <div className="space-y-2">
                  {transports.map((transport) => {
                    const reached = transport.taskTransportationEndLat != null
                    return (
                      <div
                        key={transport.taskTransportationAutoId}
                        className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                              <Truck className="h-3.5 w-3.5 text-gray-400" />
                              {transport.vehicleName ?? `Vehicle #${transport.taskTransportationVehicleId}`}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{transport.taskTransportationStartLocation ?? '—'}</span>
                              <ChevronRight className="h-3 w-3" />
                              <span>{transport.taskTransportationEndLocation ?? '—'}</span>
                            </div>
                            {transport.taskTransportationCost != null && (
                              <div className="text-xs text-gray-500">
                                Fare: <span className="font-medium">৳{transport.taskTransportationCost}</span>
                              </div>
                            )}
                            {reached && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <MapPin className="h-3 w-3" />
                                Destination reached
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {!reached && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleMarkReached(transport)}
                                className="flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <MapPin className="h-3 w-3" />
                                Reached
                              </button>
                            )}
                            {/* Edit — mirrors legacy EditTransport popup */}
                            {!isEnded && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => setEditingTransport(transport)}
                                className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-blue-50 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleDeleteTransport(transport.taskTransportationAutoId)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Action buttons ─────────────────── */}
            <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
              {/* Start */}
              {!isStarted && !isEnded && (
                <button
                  type="button"
                  disabled={isBusy || loadingDetail}
                  onClick={handleStart}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {startTask.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Start Task
                </button>
              )}

              {/* In-progress badge */}
              {isStarted && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-800">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  Task in progress
                </div>
              )}

              {/* Accomplish */}
              {!isEnded && (
                <button
                  type="button"
                  disabled={isBusy || loadingDetail || isEnded}
                  onClick={handleAccomplish}
                  className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {endTask.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Accomplish
                </button>
              )}

              {/* Done badge */}
              {isEnded && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm font-medium text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {activeTask.taskName} — Finished
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Transport modal */}
      {showAddTransport && activeTaskId != null && (
        <TransportModal
          mode="add"
          taskId={activeTaskId}
          onClose={() => setShowAddTransport(false)}
        />
      )}

      {/* Edit Transport modal — mirrors legacy EditTransport.js */}
      {editingTransport != null && activeTaskId != null && (
        <TransportModal
          mode="edit"
          taskId={activeTaskId}
          existing={editingTransport}
          onClose={() => setEditingTransport(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified Add / Edit Transport modal
// Mirrors legacy AddTransport.js + EditTransport.js
// ─────────────────────────────────────────────────────────────────────────────

interface TransportFormState {
  vehicleId: number | null
  fromLocationId: number | null
  fromLocationLabel: string
  toLocationId: number | null
  toLocationLabel: string
  fare: string
  remarks: string
}

function TransportModal({
  mode,
  taskId,
  existing,
  onClose,
}: {
  mode: 'add' | 'edit'
  taskId: number
  existing?: TaskTransportItem
  onClose: () => void
}) {
  const [form, setForm] = useState<TransportFormState>(() => ({
    vehicleId: existing?.taskTransportationVehicleId ?? null,
    fromLocationId: existing?.taskTransportationStartLocationId ?? null,
    fromLocationLabel: existing?.taskTransportationStartLocation ?? '',
    toLocationId: existing?.taskTransportationEndLocationId ?? null,
    toLocationLabel: existing?.taskTransportationEndLocation ?? '',
    fare:
      existing?.taskTransportationCost != null ? String(existing.taskTransportationCost) : '',
    remarks: existing?.taskTransportationRemarks ?? '',
  }))
  const [formError, setFormError] = useState<string | null>(null)

  const { data: vehicles = [], isLoading: loadingVehicles } = useDropdown('vehicle')
  const addTransport = useAddTransport()
  const updateTransport = useUpdateTransport()
  const isPending = addTransport.isPending || updateTransport.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.vehicleId) {
      setFormError('Please select a vehicle.')
      return
    }
    if (!form.fromLocationId || !form.toLocationId) {
      setFormError('Please select both from and to locations.')
      return
    }
    if (!form.fare || Number(form.fare) <= 0) {
      setFormError('Please enter a valid fare amount.')
      return
    }

    try {
      if (mode === 'add') {
        await addTransport.mutateAsync({
          taskId,
          taskTransportationVehicleId: form.vehicleId,
          taskTransportationCost: Number(form.fare),
          taskTransportationStartLat: 0,
          taskTransportationStartLong: 0,
          taskTransportationEndLat: null,
          taskTransportationEndLong: null,
          taskTransportationStartLocation: form.fromLocationLabel,
          taskTransportationEndLocation: form.toLocationLabel,
          taskTransportationRemarks: form.remarks || undefined,
        })
      } else {
        await updateTransport.mutateAsync({
          taskId,
          taskTransportationAutoId: existing!.taskTransportationAutoId,
          taskTransportationVehicleId: form.vehicleId,
          taskTransportationCost: Number(form.fare),
          taskTransportationStartLat: 0,
          taskTransportationStartLong: 0,
          taskTransportationEndLat: null,
          taskTransportationEndLong: null,
          taskTransportationStartLocation: form.fromLocationLabel,
          taskTransportationEndLocation: form.toLocationLabel,
          taskTransportationRemarks: form.remarks || undefined,
        })
      }
      onClose()
    } catch {
      setFormError(
        mode === 'add'
          ? 'Failed to add transport. Please try again.'
          : 'Failed to update transport. Please try again.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === 'add' ? 'Add Transportation' : 'Update Transportation'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Vehicle <span className="text-red-500">*</span>
            </label>
            <select
              value={form.vehicleId ?? ''}
              disabled={loadingVehicles}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  vehicleId: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                {loadingVehicles ? 'Loading vehicles…' : 'Select vehicle…'}
              </option>
              {vehicles.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              From <span className="text-red-500">*</span>
            </label>
            <PaginatedCombobox
              type="location"
              value={form.fromLocationId}
              selectedLabel={form.fromLocationLabel || null}
              onValueChange={(v) => setForm((prev) => ({ ...prev, fromLocationId: v }))}
              onLabelChange={(l) => setForm((prev) => ({ ...prev, fromLocationLabel: l ?? '' }))}
              placeholder="Search starting location…"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              To <span className="text-red-500">*</span>
            </label>
            <PaginatedCombobox
              type="location"
              value={form.toLocationId}
              selectedLabel={form.toLocationLabel || null}
              onValueChange={(v) => setForm((prev) => ({ ...prev, toLocationId: v }))}
              onLabelChange={(l) => setForm((prev) => ({ ...prev, toLocationLabel: l ?? '' }))}
              placeholder="Search destination location…"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Fare (৳) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.fare}
              onChange={(e) => setForm((prev) => ({ ...prev, fare: e.target.value }))}
              placeholder="0.00"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Remarks</label>
            <input
              type="text"
              value={form.remarks}
              onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
              placeholder="Optional notes…"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'add' ? 'Add Transport' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
