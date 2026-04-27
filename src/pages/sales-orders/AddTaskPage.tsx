import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckSquare, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useTaskName, useCreateTask } from '@/hooks/useTask'
import { useDropdown } from '@/hooks/useDropdown'
import { PaginatedCombobox } from '@/components/dropdowns'
import { taskSchema, TRANSPORT_OPTIONAL_ASSIGNEES } from '@/schemas/taskSchema'
import type { TaskFormValues } from '@/schemas/taskSchema'
import type { TaskChecklistItem } from '@/types/task'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function todayString() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Page — standalone add task (no invoice / sales order pre-fill)
// Mirrors legacy /task/newtask (AddTaskInvoiceFree.js)
// ─────────────────────────────────────────────────────────────────────────────

export function AddTaskPage() {
  const navigate = useNavigate()

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: taskName, isLoading: loadingTaskName } = useTaskName()
  const { data: transportOptions = [], isLoading: loadingTransport } = useDropdown('taskMovementTransport')
  const { data: checklistOptions = [], isLoading: loadingChecklists } = useDropdown('taskChecklist')

  const createTask = useCreateTask()

  // ── Local state ────────────────────────────────────────────────────────────
  const [checklistItems, setChecklistItems] = useState<TaskChecklistItem[]>([])
  const [selectedChecklistKey, setSelectedChecklistKey] = useState<number | null>(null)
  const [isTransportOptional, setIsTransportOptional] = useState(false)
  const [employeeLabel, setEmployeeLabel] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const usedChecklistIds = useMemo(() => new Set(checklistItems.map((c) => c.id)), [checklistItems])
  const availableChecklists = useMemo(
    () => checklistOptions.filter((opt) => !usedChecklistIds.has(opt.key)),
    [checklistOptions, usedChecklistIds],
  )

  // ── Form ───────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues, unknown, TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      taskName: '',
      taskDescription: '',
      destinationName: '',
      destinationAddress: '',
      employeeId: 0,
      employeeLabel: '',
      movementTransportId: null,
      eveningTask: false,
    },
  })

  // Pre-fill task name once loaded
  useEffect(() => {
    if (taskName) setValue('taskName', taskName)
  }, [taskName, setValue])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEmployeeChange = useCallback(
    (employeeId: number | null) => {
      setValue('employeeId', employeeId ?? 0, { shouldValidate: true })
    },
    [setValue],
  )

  const handleEmployeeLabel = useCallback(
    (label: string | null) => {
      setEmployeeLabel(label)
      const cleaned = (label ?? '').trim().toLowerCase()
      setIsTransportOptional(TRANSPORT_OPTIONAL_ASSIGNEES.has(cleaned))
      setValue('employeeLabel', label ?? '')
    },
    [setValue],
  )

  const handleAddChecklist = () => {
    if (selectedChecklistKey == null) return
    const option = checklistOptions.find((opt) => opt.key === selectedChecklistKey)
    if (!option) return
    setChecklistItems((prev) => [
      ...prev,
      { id: option.key, name: option.value, serialno: prev.length + 1 },
    ])
    setSelectedChecklistKey(null)
  }

  const handleRemoveChecklist = (id: number) => {
    setChecklistItems((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      return updated.map((c, i) => ({ ...c, serialno: i + 1 }))
    })
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values: TaskFormValues) => {
    if (checklistItems.length === 0) {
      setServerError('Please select at least one checklist item.')
      return
    }

    if (!isTransportOptional && !values.movementTransportId) {
      setServerError('Please select a Movement Transport for this employee.')
      return
    }

    setServerError(null)

    const payload = {
      taskName: values.taskName,
      taskDescription: values.taskDescription ?? '',
      taskDestination: values.destinationName ?? '',
      taskDestinationAddress: values.destinationAddress ?? '',
      taskJobTypeId: null as null,
      // no related invoice — standalone task
      taskRelatedInvoiceId: null,
      taskRelatedInvoiceName: null,
      taskAssignedTo: values.employeeId,
      taskRelatedTaskId: '0',
      movementTransportId: values.movementTransportId ?? 0,
      eveningTask: values.eveningTask ? (1 as const) : (0 as const),
      taskChecklists: checklistItems.map((c) => c.id),
    }

    const result = await createTask.mutateAsync(payload)

    if (result?.errMsg) {
      setServerError(result.errMsg)
      return
    }

    navigate('/sales-orders/task-incomplete')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Task</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new standalone task and assign it to an employee.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/sales-orders/task-incomplete')}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Task details */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-600">
            Task Details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Task Name <span className="text-red-500">*</span>
              </label>
              {loadingTaskName ? (
                <div className="flex h-10 items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </div>
              ) : (
                <input
                  {...register('taskName')}
                  className={`h-10 w-full rounded-lg border px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                    errors.taskName
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-300 focus:border-gray-500'
                  }`}
                />
              )}
              {errors.taskName && (
                <p className="mt-1 text-xs text-red-500">{errors.taskName.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Task Date</label>
              <input
                type="date"
                defaultValue={todayString()}
                readOnly
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('taskDescription')}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Destination Name
              </label>
              <input
                {...register('destinationName')}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Destination Address
              </label>
              <input
                {...register('destinationAddress')}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <Controller
                name="eveningTask"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="eveningTask"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900"
                  />
                )}
              />
              <label htmlFor="eveningTask" className="text-sm font-medium text-gray-700">
                Evening Task
              </label>
            </div>
          </div>
        </div>

        {/* Assignment */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-600">
            Assignment
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Assign To (Employee) <span className="text-red-500">*</span>
              </label>
              <Controller
                name="employeeId"
                control={control}
                render={({ field, fieldState }) => (
                  <PaginatedCombobox
                    type="employee"
                    value={field.value || null}
                    onValueChange={(v) => {
                      field.onChange(v ?? 0)
                      handleEmployeeChange(v)
                    }}
                    onLabelChange={handleEmployeeLabel}
                    placeholder="Search employee…"
                    hasError={!!fieldState.error}
                  />
                )}
              />
              {errors.employeeId && (
                <p className="mt-1 text-xs text-red-500">{errors.employeeId.message}</p>
              )}
              {isTransportOptional && (
                <p className="mt-1 text-xs text-gray-500">
                  Movement transport is optional for <strong>{employeeLabel}</strong>.
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Movement Transport{' '}
                {!isTransportOptional && <span className="text-red-500">*</span>}
              </label>
              <select
                disabled={loadingTransport}
                onChange={(e) =>
                  setValue('movementTransportId', e.target.value ? Number(e.target.value) : null)
                }
                className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {loadingTransport ? 'Loading…' : 'Select movement transport…'}
                </option>
                {transportOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Checklists */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-600">
            Checklists{' '}
            <span className="font-normal text-gray-400">(required — add at least one)</span>
          </h2>

          <div className="flex gap-2">
            <select
              value={selectedChecklistKey ?? ''}
              disabled={loadingChecklists}
              onChange={(e) =>
                setSelectedChecklistKey(e.target.value ? Number(e.target.value) : null)
              }
              className="h-10 flex-1 appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                {loadingChecklists ? 'Loading…' : 'Select checklist item…'}
              </option>
              {availableChecklists.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.value}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddChecklist}
              disabled={selectedChecklistKey == null}
              className="flex h-10 items-center gap-1.5 rounded-lg bg-gray-900 px-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {checklistItems.length === 0 ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-400">
              <CheckSquare className="h-4 w-4" />
              No checklist items added yet.
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Checklist Item
                    </th>
                    <th className="w-12 px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {checklistItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-xs text-gray-400">{item.serialno}</td>
                      <td className="px-4 py-2 text-gray-800">{item.name}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklist(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/sales-orders/task-incomplete')}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createTask.isPending}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {(isSubmitting || createTask.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Add Task
          </button>
        </div>
      </form>
    </div>
  )
}
