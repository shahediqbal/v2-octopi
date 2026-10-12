import { useEffect, useMemo, useState } from 'react'
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
  useTaskVehicles,
  useStartTask,
  useEndTask,
  useCompleteChecklist,
  useAddTransport,
  useUpdateTransport,
  useDeleteTransport,
  useMarkDestinationReached,
} from '@/hooks/useTask'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useToastStore } from '@/stores/toastStore'
import type { TaskTransportItem } from '@/types/task'

// ─────────────────────────────────────────────────────────────────────────────
// Page — Delivery man task management
// Mirrors legacy /delivery/create (AddDelivery.js)
// ─────────────────────────────────────────────────────────────────────────────

export function DeliveryPage() {
  const showToast = useToastStore((s) => s.showToast)
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null)
  const [showAddTransport, setShowAddTransport] = useState(false)
  const [editingTransport, setEditingTransport] = useState<TaskTransportItem | null>(null)
  const [showCongrats, setShowCongrats] = useState(false)
  const [dialog, setDialog] = useState<DeliveryDialogState | null>(null)

  const {
    data: tasks = [],
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = useDeliveryTaskList()
  const { data: vehicleOptions = [] } = useTaskVehicles()
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
      setDialog({
        kind: 'info',
        title: 'Transport Pending',
        message: 'You have not clicked the Reached button for all transports!',
        confirmLabel: 'OK',
        confirmCls: 'bg-amber-600 hover:bg-amber-500',
      })
      return
    }
    setDialog({
      kind: 'confirm',
      title: 'Start Task',
      message: `Start task "${activeTask?.taskName}"?`,
      confirmLabel: 'Start Task',
      confirmCls: 'bg-green-600 hover:bg-green-500',
      onConfirm: () => startTask.mutate(activeTaskId),
    })
  }

  const handleAccomplish = async () => {
    if (!activeTaskId || !isStarted) return
    if (hasUnreachedTransport) {
      setDialog({
        kind: 'info',
        title: 'Transport Pending',
        message: 'You have not clicked the Reached button for all transports!',
        confirmLabel: 'OK',
        confirmCls: 'bg-amber-600 hover:bg-amber-500',
      })
      return
    }
    const confirmMsg = allChecklistsDone
      ? `Are you sure "${activeTask?.taskName}" is complete?`
      : `Some checklists are still pending. Are you sure you want to accomplish "${activeTask?.taskName}" anyway?`
    setDialog({
      kind: 'confirm',
      title: 'Accomplish Task',
      message: confirmMsg,
      confirmLabel: 'Accomplish',
      confirmCls: 'bg-gray-900 hover:bg-gray-700',
      onConfirm: async () => {
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
      },
    })
  }

  const handleCompleteChecklist = (checklistAutoId: number | undefined) => {
    if (!activeTaskId || !checklistAutoId) return
    if (isEnded) return
    setDialog({
      kind: 'confirm',
      title: 'Complete Checklist',
      message: 'Mark this checklist item as complete?',
      confirmLabel: 'Mark Complete',
      confirmCls: 'bg-gray-900 hover:bg-gray-700',
      onConfirm: () => completeChecklist.mutate({ checklistAutoId, taskId: activeTaskId }),
    })
  }

  const handleDeleteTransport = async (transportationId: number) => {
    if (!activeTaskId) return
    setDialog({
      kind: 'confirm',
      title: 'Delete Transport',
      message: 'Delete this transport record? This action cannot be undone.',
      confirmLabel: 'Delete',
      confirmCls: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        try {
          await deleteTransport.mutateAsync({ transportationId, taskId: activeTaskId })
        } catch {
          showToast({ message: 'Failed to delete transport record', type: 'error' })
        }
      },
    })
  }

  const handleMarkReached = (transport: TaskTransportItem) => {
    if (!activeTaskId) return
    setDialog({
      kind: 'confirm',
      title: 'Mark Destination Reached',
      message: `Mark "${transport.taskTransportationEndLocation}" as reached?`,
      confirmLabel: 'Reached',
      confirmCls: 'bg-amber-600 hover:bg-amber-500',
      onConfirm: () =>
        markReached.mutate({
          taskId: activeTaskId,
          taskTransportationAutoId: transport.taskTransportationAutoId,
          taskTransportationEndLat: 0,
          taskTransportationEndLong: 0,
          taskTransportationEndLocation: transport.taskTransportationEndLocation ?? '',
        }),
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
            <div className="flex flex-col gap-1.5">
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
              {/* Invoice / Destination info — mirrors legacy CheckListItem info section */}
              {!loadingDetail && taskDetail && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                  {taskDetail.soSystemNo && (
                    <span>Invoice: <span className="font-semibold text-gray-700">{taskDetail.soSystemNo}</span></span>
                  )}
                  {taskDetail.taskDestination && (
                    <span>Destination: <span className="font-semibold text-gray-700">{taskDetail.taskDestination}</span></span>
                  )}
                  {taskDetail.taskDestinationAddress && (
                    <span>Address: <span className="font-semibold text-gray-700">{taskDetail.taskDestinationAddress}</span></span>
                  )}
                </div>
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
                            disabled={isBusy || isEnded}
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
                    const vehicleLabel = resolveTransportVehicleLabel(transport, vehicleOptions)
                    return (
                      <div
                        key={transport.taskTransportationAutoId}
                        className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                              <Truck className="h-3.5 w-3.5 text-gray-400" />
                              {vehicleLabel || 'Unknown vehicle'}
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
                                onClick={() =>
                                  setEditingTransport({
                                    ...transport,
                                    vehicleName: vehicleLabel || transport.vehicleName,
                                  })
                                }
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
                                void handleDeleteTransport(transport.taskTransportationAutoId)
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
          key={`add-${activeTaskId}`}
          mode="add"
          taskId={activeTaskId}
          onClose={() => setShowAddTransport(false)}
        />
      )}

      {/* Edit Transport modal — mirrors legacy EditTransport.js */}
      {editingTransport != null && activeTaskId != null && (
        <TransportModal
          key={`edit-${editingTransport.taskTransportationAutoId}`}
          mode="edit"
          taskId={activeTaskId}
          existing={editingTransport}
          onClose={() => setEditingTransport(null)}
        />
      )}

      {dialog && (
        <DeliveryDialog
          dialog={dialog}
          onClose={() => setDialog(null)}
          loading={dialog.kind === 'confirm' && isBusy}
        />
      )}
    </div>
  )
}

type DeliveryDialogState =
  | {
      kind: 'info'
      title: string
      message: string
      confirmLabel?: string
      confirmCls?: string
    }
  | {
      kind: 'confirm'
      title: string
      message: string
      onConfirm: () => void | Promise<void>
      confirmLabel?: string
      confirmCls?: string
    }

// ─────────────────────────────────────────────────────────────────────────────
// Unified Add / Edit Transport modal
// Mirrors legacy AddTransport.js + EditTransport.js
// ─────────────────────────────────────────────────────────────────────────────

interface TransportFormState {
  vehicleId: number | null
  vehicleLabel: string
  fromLocationId: number | null
  fromLocationLabel: string
  toLocationId: number | null
  toLocationLabel: string
  fare: string
  remarks: string
}

interface TransportCoordinates {
  latitude: number
  longitude: number
}

interface GeolocationErrorLike {
  code?: number
  message?: string
}

function coerceOptionalNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildTransportFormState(
  existing: TaskTransportItem | undefined,
  vehicles: Array<{ key: number; value: string }> = [],
): TransportFormState {
  const vehicleId = coerceOptionalNumber(existing?.taskTransportationVehicleId)

  return {
    vehicleId,
    vehicleLabel: getVehicleSelectLabel(vehicleId, existing?.vehicleName ?? '', vehicles),
    fromLocationId: coerceOptionalNumber(existing?.taskTransportationStartLocationId),
    fromLocationLabel: existing?.taskTransportationStartLocation ?? '',
    toLocationId: coerceOptionalNumber(existing?.taskTransportationEndLocationId),
    toLocationLabel: existing?.taskTransportationEndLocation ?? '',
    fare:
      existing?.taskTransportationCost != null ? String(existing.taskTransportationCost) : '',
    remarks: existing?.taskTransportationRemarks ?? '',
  }
}

function getVehicleSelectLabel(
  vehicleId: number | null,
  fallbackLabel: string,
  vehicles: Array<{ key: number; value: string }>,
): string {
  if (vehicleId == null) return fallbackLabel
  const matchedVehicle = vehicles.find((vehicle) => String(vehicle.key) === String(vehicleId))
  if (matchedVehicle?.value) return matchedVehicle.value
  if (fallbackLabel.trim().length > 0) return fallbackLabel
  return `Vehicle #${vehicleId}`
}

function resolveTransportVehicleLabel(
  transport: TaskTransportItem,
  vehicles: Array<{ key: number; value: string }>,
): string {
  return getVehicleSelectLabel(
    coerceOptionalNumber(transport.taskTransportationVehicleId),
    transport.vehicleName ?? '',
    vehicles,
  )
}

function requestCurrentTransportCoordinates(): Promise<TransportCoordinates> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('Location access is not supported in this browser.'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    )
  })
}

function getTransportLocationErrorMessage(error: unknown): string {
  const geolocationError = error as GeolocationErrorLike | null | undefined

  switch (geolocationError?.code) {
    case 1:
      return 'Location permission is required to save transportation.'
    case 2:
      return 'Unable to determine your current location. Please try again.'
    case 3:
      return 'Location request timed out. Please try again.'
    default:
      if (error instanceof Error && error.message.trim().length > 0) {
        return error.message
      }
      return 'Unable to access your current location. Please try again.'
  }
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
  const { data: vehicles = [], isLoading: loadingVehicles } = useTaskVehicles()
  const [form, setForm] = useState<TransportFormState>(() =>
    buildTransportFormState(existing, vehicles),
  )
  const [formError, setFormError] = useState<string | null>(null)
  const addTransport = useAddTransport()
  const updateTransport = useUpdateTransport()
  const isPending = addTransport.isPending || updateTransport.isPending
  const selectedVehicleValue = form.vehicleId != null ? String(form.vehicleId) : ''
  const selectedVehicleLabel = useMemo(
    () =>
      getVehicleSelectLabel(
        form.vehicleId,
        form.vehicleLabel || existing?.vehicleName || '',
        vehicles,
      ),
    [existing?.vehicleName, form.vehicleId, form.vehicleLabel, vehicles],
  )
  const hasVehicleOption = useMemo(
    () =>
      form.vehicleId != null &&
      vehicles.some((vehicle) => String(vehicle.key) === selectedVehicleValue),
    [form.vehicleId, selectedVehicleValue, vehicles],
  )

  useEffect(() => {
    if (!existing) return

    setForm((current) => {
      if (current.vehicleId == null || current.vehicleLabel.trim().length > 0) {
        return current
      }

      return {
        ...current,
        vehicleLabel: getVehicleSelectLabel(
          current.vehicleId,
          existing.vehicleName ?? '',
          vehicles,
        ),
      }
    })
  }, [existing, vehicles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.vehicleId) {
      setFormError('Please select a vehicle.')
      return
    }
    if (!form.fromLocationLabel.trim() || !form.toLocationLabel.trim()) {
      setFormError('Please select both from and to locations.')
      return
    }
    const fareValue = form.fare.trim() === '' ? 0 : Number(form.fare)
    if (isNaN(fareValue) || fareValue < 0) {
      setFormError('Please enter a valid fare amount (0 or more).')
      return
    }

    let coordinates: TransportCoordinates

    try {
      coordinates = await requestCurrentTransportCoordinates()
    } catch (error) {
      setFormError(getTransportLocationErrorMessage(error))
      return
    }

    try {
      if (mode === 'add') {
        await addTransport.mutateAsync({
          taskId,
          taskTransportationVehicleId: form.vehicleId,
          vehicleName: selectedVehicleLabel || undefined,
          taskTransportationCost: fareValue,
          taskTransportationStartLat: coordinates.latitude,
          taskTransportationStartLong: coordinates.longitude,
          taskTransportationEndLat: null,
          taskTransportationEndLong: null,
          taskTransportationStartLocationId: form.fromLocationId,
          taskTransportationStartLocation: form.fromLocationLabel,
          taskTransportationEndLocationId: form.toLocationId,
          taskTransportationEndLocation: form.toLocationLabel,
          taskTransportationRemarks: form.remarks || undefined,
        })
      } else {
        await updateTransport.mutateAsync({
          taskId,
          taskTransportationAutoId: existing!.taskTransportationAutoId,
          taskTransportationVehicleId: form.vehicleId,
          vehicleName: selectedVehicleLabel || undefined,
          taskTransportationCost: fareValue,
          taskTransportationStartLat: coordinates.latitude,
          taskTransportationStartLong: coordinates.longitude,
          taskTransportationEndLat: null,
          taskTransportationEndLong: null,
          taskTransportationStartLocationId: form.fromLocationId,
          taskTransportationStartLocation: form.fromLocationLabel,
          taskTransportationEndLocationId: form.toLocationId,
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
              value={selectedVehicleValue}
              disabled={loadingVehicles}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  vehicleId: e.target.value ? Number(e.target.value) : null,
                  vehicleLabel: e.target.options[e.target.selectedIndex]?.text ?? '',
                }))
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {loadingVehicles ? (
                <option value={selectedVehicleValue}>
                  {selectedVehicleLabel ? `${selectedVehicleLabel} (loading…)` : 'Loading vehicles…'}
                </option>
              ) : (
                <option value="">Select vehicle…</option>
              )}
              {!loadingVehicles && form.vehicleId != null && !hasVehicleOption && (
                <option value={selectedVehicleValue}>{selectedVehicleLabel}</option>
              )}
              {vehicles.map((v) => (
                <option key={v.key} value={String(v.key)}>
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

function DeliveryDialog({
  dialog,
  onClose,
  loading,
}: {
  dialog: DeliveryDialogState
  onClose: () => void
  loading?: boolean
}) {
  const isConfirm = dialog.kind === 'confirm'

  const handleConfirm = async () => {
    if (dialog.kind !== 'confirm') {
      onClose()
      return
    }
    try {
      await dialog.onConfirm()
      onClose()
    } catch {
      // Keep the dialog open if the action fails.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-gray-900">{dialog.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{dialog.message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          {isConfirm && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${dialog.confirmCls ?? 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-60`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {dialog.confirmLabel ?? (isConfirm ? 'Confirm' : 'OK')}
          </button>
        </div>
      </div>
    </div>
  )
}
