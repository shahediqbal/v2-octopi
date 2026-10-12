import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  AddTransportPayload,
  AssignedTaskListApiResponse,
  AssignedTaskListRow,
  CreateTaskPayload,
  DeliveryTaskListApiResponse,
  DeliveryTaskRow,
  IncompleteTaskListApiResponse,
  IncompleteTaskListRow,
  PendingChecklistApiResponse,
  PendingChecklistDetailApiResponse,
  PendingChecklistRow,
  TaskCreateResponse,
  TaskDetail,
  TaskDetailApiResponse,
  TaskNameResponse,
  TaskTransportItem,
  TaskUpdateResponse,
  TransportEndLocationPayload,
  UpdateTaskPayload,
  UpdateTransportPayload,
} from '@/types/task'
import { stockOutKeys } from '@/hooks/useStockOut'

interface TransportMutationResponse {
  dataObj?: {
    data?: number | null
  }
}

function buildCachedTransport(
  payload: AddTransportPayload | UpdateTransportPayload,
  taskTransportationAutoId: number,
): TaskTransportItem {
  return {
    taskTransportationAutoId,
    taskTransportationVehicleId: payload.taskTransportationVehicleId,
    vehicleName: payload.vehicleName ?? null,
    taskTransportationStartLocationId: payload.taskTransportationStartLocationId ?? null,
    taskTransportationStartLocation: payload.taskTransportationStartLocation,
    taskTransportationEndLocationId: payload.taskTransportationEndLocationId ?? null,
    taskTransportationEndLocation: payload.taskTransportationEndLocation,
    taskTransportationStartLat: payload.taskTransportationStartLat,
    taskTransportationStartLong: payload.taskTransportationStartLong,
    taskTransportationEndLat: payload.taskTransportationEndLat,
    taskTransportationEndLong: payload.taskTransportationEndLong,
    taskTransportationCost: payload.taskTransportationCost,
    taskTransportationRemarks: payload.taskTransportationRemarks ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Query Keys
// ─────────────────────────────────────────────────────────────────────────────

export const taskKeys = {
  all: ['task'] as const,
  name: () => [...taskKeys.all, 'name'] as const,
  vehicles: () => [...taskKeys.all, 'vehicles'] as const,
  assignedList: () => [...taskKeys.all, 'assigned-list'] as const,
  incompleteList: () => [...taskKeys.all, 'incomplete-list'] as const,
  pendingChecklistList: () => [...taskKeys.all, 'pending-checklist-list'] as const,
  pendingChecklistDetail: (id: number) => [...taskKeys.all, 'pending-checklist-detail', id] as const,
  detail: (id: number) => [...taskKeys.all, 'detail', id] as const,
  deliveryList: () => [...taskKeys.all, 'delivery-list'] as const,
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches an auto-generated task name from the backend.
 * GET /Task/GetTaskName
 */
export function useTaskName() {
  return useQuery({
    queryKey: taskKeys.name(),
    queryFn: () =>
      apiClient
        .get<TaskNameResponse>('/Task/GetTaskName')
        .then((r) => r.dataObj?.data ?? ''),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

/**
 * Fetches the delivery transport vehicle list.
 * GET /Task/GetVehicles
 */
export function useTaskVehicles() {
  return useQuery({
    queryKey: taskKeys.vehicles(),
    queryFn: () =>
      apiClient
        .get<{ dataObj?: { data?: Array<{ key: number; value: string }> } }>('/Task/GetVehicles')
        .then((r) => (r.dataObj?.data ?? []).map((item) => ({ key: item.key, value: item.value }))),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Fetches all assigned tasks.
 * GET /Task/GetAssignedTaskList
 */
// export function useAssignedTaskList() {
//   return useQuery({
//     queryKey: taskKeys.assignedList(),
//     queryFn: () =>
//       apiClient
//         .get<AssignedTaskListApiResponse>('/Task/GetAssignedTaskList')
//         .then((r): AssignedTaskListRow[] => r.dataObj?.data ?? []),
//     staleTime: 60_000,
//     refetchOnWindowFocus: false,
//   })
// }


function isDeliveredTask(row: AssignedTaskListRow): boolean {
  const status = String(row.taskStatus ?? '').trim().toLowerCase()

  return (
    status === 'delivered' ||
    status === 'delivery completed' ||
    status === 'completed' ||
    status === 'complete' ||
    row.taskStatusId === 1 ||
    !!row.taskEndTime ||
    !!row.delivered ||
    !!row.deliveredTime
  )
}

export function useAssignedTaskList() {
  return useQuery({
    queryKey: taskKeys.assignedList(),
    queryFn: () =>
      apiClient
        .get<AssignedTaskListApiResponse>('/Task/GetAssignedTaskList')
        .then((r): AssignedTaskListRow[] => {
          const rows = r.dataObj?.data ?? []
          return rows.filter((row) => !isDeliveredTask(row))
        }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
/**
 * Fetches incomplete tasks list.
 * GET /Task/GetTasks/0/0
 */
export function useIncompleteTaskList() {
  return useQuery({
    queryKey: taskKeys.incompleteList(),
    queryFn: () =>
      apiClient
        .get<IncompleteTaskListApiResponse>('/Task/GetTasks/0/0')
        .then((r): IncompleteTaskListRow[] => r.dataObj?.data ?? []),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Fetches the list of tasks that have incomplete checklists.
 * GET /Task/GetCompleteTasksHavingIncompleteChecklist
 */
export function usePendingChecklistList() {
  return useQuery({
    queryKey: taskKeys.pendingChecklistList(),
    queryFn: () =>
      apiClient
        .get<PendingChecklistApiResponse>('/Task/GetCompleteTasksHavingIncompleteChecklist')
        .then((r): PendingChecklistRow[] => r.dataObj?.data ?? []),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Fetches the pending (incomplete) checklists for a specific task.
 * GET /Task/GetCompleteTasksHavingIncompleteChecklistDetails/{id}
 * taskChecklistsData on the result contains only the PENDING checklists.
 */
export function usePendingChecklistDetail(id: number | undefined) {
  return useQuery({
    queryKey: taskKeys.pendingChecklistDetail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<PendingChecklistDetailApiResponse>(`/Task/GetCompleteTasksHavingIncompleteChecklistDetails/${id}`)
        .then((r): TaskDetail => r.dataObj.data),
    staleTime: 0,
    refetchOnWindowFocus: false,
    enabled: !!id,
  })
}

/**
 * Fetches full task details for editing.
 * GET /Task/GetTaskDetails/{id}
 */
export function useTaskDetail(id: number | undefined) {
  return useQuery({
    queryKey: taskKeys.detail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<TaskDetailApiResponse>(`/Task/GetTaskDetails/${id}`)
        .then((r): TaskDetail => r.dataObj.data),
    staleTime: 0,
    refetchOnWindowFocus: false,
    enabled: !!id,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new task assignment.
 * POST /Task/AddTask
 */
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation<TaskCreateResponse, Error, CreateTaskPayload>({
    mutationFn: (payload) =>
      apiClient.post<TaskCreateResponse>('/Task/AddTask', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stockOutKeys.lists() })
      qc.invalidateQueries({ queryKey: taskKeys.assignedList() })
      qc.invalidateQueries({ queryKey: taskKeys.incompleteList() })
      qc.invalidateQueries({ queryKey: taskKeys.pendingChecklistList() })
    },
  })
}

/**
 * Updates an existing task.
 * PUT /Task/UpdateTask
 */
export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation<TaskUpdateResponse, Error, UpdateTaskPayload>({
    mutationFn: (payload) =>
      apiClient.put<TaskUpdateResponse>('/Task/UpdateTask', payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: taskKeys.assignedList() })
      qc.invalidateQueries({ queryKey: taskKeys.incompleteList() })
      qc.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) })
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery (AddDelivery) — /sales-orders/delivery
// Mirrors legacy /delivery/create (AddDelivery.js)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all tasks assigned to the current employee (for delivery workflow).
 * GET /Task/GetTasks/0/-1
 */
export function useDeliveryTaskList() {
  return useQuery({
    queryKey: taskKeys.deliveryList(),
    queryFn: () =>
      apiClient
        .get<DeliveryTaskListApiResponse>('/Task/GetTasks/0/-1')
        .then((r): DeliveryTaskRow[] => r.dataObj?.data ?? []),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Starts a task.
 * GET /Task/DeclareTaskStart/{taskId}
 */
export function useStartTask() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, number>({
    mutationFn: (taskId) => apiClient.get(`/Task/DeclareTaskStart/${taskId}`),
    onSuccess: (_, taskId) => {
      qc.invalidateQueries({ queryKey: taskKeys.deliveryList() })
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    },
  })
}

/**
 * Ends/accomplishes a task.
 * GET /Task/DeclareTaskCompletion/{taskId}
 */
export function useEndTask() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, number>({
    mutationFn: (taskId) => apiClient.get(`/Task/DeclareTaskCompletion/${taskId}`),
    onSuccess: (_, taskId) => {
      qc.invalidateQueries({ queryKey: taskKeys.deliveryList() })
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    },
  })
}

/**
 * Marks a single checklist item as complete.
 * GET /Task/DeclareChecklistCompletion/{checklistAutoId}
 */
export function useCompleteChecklist() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { checklistAutoId: number; taskId: number }>({
    mutationFn: ({ checklistAutoId }) =>
      apiClient.get(`/Task/DeclareChecklistCompletion/${checklistAutoId}`),
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    },
  })
}

/**
 * Adds a new transportation record to a task.
 * POST /Task/AddTaskTransportation/{taskId}
 */
export function useAddTransport() {
  const qc = useQueryClient()
  return useMutation<TransportMutationResponse, Error, AddTransportPayload>({
    mutationFn: ({
      vehicleName: _vehicleName,
      taskTransportationStartLocationId: _taskTransportationStartLocationId,
      taskTransportationEndLocationId: _taskTransportationEndLocationId,
      ...payload
    }) => apiClient.post(`/Task/AddTaskTransportation/${payload.taskId}`, payload),
    onSuccess: (response, variables) => {
      const taskTransportationAutoId = response.dataObj?.data
      if (typeof taskTransportationAutoId !== 'number') {
        qc.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) })
        return
      }

      qc.setQueryData<TaskDetail | undefined>(taskKeys.detail(variables.taskId), (current) => {
        if (!current) return current

        return {
          ...current,
          taskTransportationData: [
            ...(current.taskTransportationData ?? []),
            buildCachedTransport(variables, taskTransportationAutoId),
          ],
        }
      })
    },
  })
}

/**
 * Updates an existing transportation record.
 * PUT /Task/UpdateTaskTransportation/{taskId}
 */
export function useUpdateTransport() {
  const qc = useQueryClient()
  return useMutation<TransportMutationResponse, Error, UpdateTransportPayload>({
    mutationFn: ({
      vehicleName: _vehicleName,
      taskTransportationStartLocationId: _taskTransportationStartLocationId,
      taskTransportationEndLocationId: _taskTransportationEndLocationId,
      ...payload
    }) => apiClient.put(`/Task/UpdateTaskTransportation/${payload.taskId}`, payload),
    onSuccess: (_response, variables) => {
      qc.setQueryData<TaskDetail | undefined>(taskKeys.detail(variables.taskId), (current) => {
        if (!current) return current

        return {
          ...current,
          taskTransportationData: (current.taskTransportationData ?? []).map((transport) =>
            transport.taskTransportationAutoId === variables.taskTransportationAutoId
              ? {
                  ...transport,
                  ...buildCachedTransport(variables, variables.taskTransportationAutoId),
                  taskTransportationEndLat: transport.taskTransportationEndLat,
                  taskTransportationEndLong: transport.taskTransportationEndLong,
                }
              : transport,
          ),
        }
      })
    },
  })
}

/**
 * Deletes a transportation record.
 * DELETE /Task/DeleteTaskTransportation/{transportationId}/{taskId}
 */
export function useDeleteTransport() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { transportationId: number; taskId: number }>({
    mutationFn: ({ transportationId, taskId }) =>
      apiClient.delete(`/Task/DeleteTaskTransportation/${transportationId}/${taskId}`),
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    },
  })
}

/**
 * Marks a transport destination as reached (posts end-location without GPS).
 * POST /Task/AddTransportationEndLocation/{taskId}
 */
export function useMarkDestinationReached() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, TransportEndLocationPayload>({
    mutationFn: (payload) =>
      apiClient.post(`/Task/AddTransportationEndLocation/${payload.taskId}`, payload),
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    },
  })
}
