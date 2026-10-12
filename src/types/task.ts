// ─────────────────────────────────────────────────────────────────────────────
// Task Types — task assign + task create
// Mirrors legacy /task/assign and /task/:id/create flows
// ─────────────────────────────────────────────────────────────────────────────

export interface TaskChecklistItem {
  id: number
  name: string
  serialno: number
}

// ─── API shapes ──────────────────────────────────────────────────────────────

export interface CreateTaskPayload {
  taskName: string
  taskDescription: string
  taskDestination: string
  taskDestinationAddress: string
  /** Always null — job type assignment is not used in this flow */
  taskJobTypeId: null
  taskRelatedInvoiceId: number | null
  taskRelatedInvoiceName: string | null
  /** Employee ID (numeric) to assign the task to */
  taskAssignedTo: number
  /** "0" = invoice-related task */
  taskRelatedTaskId: string
  /** From taskMovementTransport dropdown; 0 when transport is optional and unset */
  movementTransportId: number
  /** 1 = evening task, 0 = regular */
  eveningTask: 0 | 1
  taskChecklists: number[]
}

/** Extends CreateTaskPayload with task id for update */
export interface UpdateTaskPayload extends CreateTaskPayload {
  taskId: number
}

export interface TaskNameResponse {
  statusCode: number
  message: string
  dataObj: { data: string }
}

export interface TaskCreateResponse {
  statusCode: number
  message: string
  errMsg?: string
  title?: string
  dataObj: unknown
}

export interface TaskUpdateResponse {
  statusCode: number
  message: string
  errMsg?: string
  title?: string
  dataObj: unknown
}

// ─── Task detail from GET /Task/GetTaskDetails/{id} ──────────────────────────

export interface TaskChecklistDataItem {
  taskChecklistId: number
  taskChecklistName: string
  /** Auto-ID of the task-checklist assignment record — populated by GetTaskDetails in delivery flow */
  taskChecklistAutoId?: number
  /** 0 = incomplete, 1 = complete — populated in delivery flow */
  checklistCompletionStatus?: 0 | 1
  checklistCompletionTime?: string | null
}

export interface TaskDetail {
  taskId: number
  taskName: string | null
  taskDescription: string | null
  taskDestination: string | null
  taskDestinationAddress: string | null
  taskRelatedTaskId: string | null
  taskRelatedInvoiceId: number | null
  soSystemNo: string | null
  taskAssignedTo: number | null
  empFirstName: string | null
  empLastName: string | null
  employeeCode: string | null
  taskAssignTime: string | null
  jobTypeId: number | null
  jobType: string | null
  /** Multiple possible field names from the backend */
  movementTransportId?: number | null
  taskMovementTransportId?: number | null
  movementTransportID?: number | null
  movementTransportName?: string | null
  taskMovementTransportName?: string | null
  movementTransport?: string | null
  eveningTask: 0 | 1
  taskStartTime?: string | null
  taskEndTime?: string | null
  taskChecklistsData: TaskChecklistDataItem[]
  taskTransportationData?: TaskTransportItem[]
}

export interface TaskDetailApiResponse {
  statusCode: number
  message: string
  dataObj: { data: TaskDetail }
}

// ─── Assigned task list row from GET /Task/GetAssignedTaskList ───────────────

// export interface AssignedTaskListRow {
//   taskId: number
//   taskName: string | null
//   empFirstName: string | null
//   empLastName: string | null
//   taskDestination: string | null
//   taskDestinationAddress: string | null
//   taskAssignTime?: string | null
// }

export interface AssignedTaskListRow {
  taskId: number
  taskName: string | null
  empFirstName: string | null
  empLastName: string | null
  taskDestination: string | null
  taskDestinationAddress: string | null
  taskAssignTime?: string | null

  // Backend may return one or more of these for delivered/completed task status
  taskStatus?: string | null
  taskStatusId?: number | null
  taskEndTime?: string | null
  delivered?: string | null
  deliveredTime?: string | null
}
export interface AssignedTaskListApiResponse {
  statusCode: number
  message: string
  dataObj: { data: AssignedTaskListRow[] }
}

// ─── Incomplete task list row from GET /Task/GetTasks/0/0 ────────────────────

/** Same shape as AssignedTaskListRow — different endpoint, same fields */
export type IncompleteTaskListRow = AssignedTaskListRow

export interface IncompleteTaskListApiResponse {
  statusCode: number
  message: string
  dataObj: { data: IncompleteTaskListRow[] }
}

// ─── Pending checklist list from GET /Task/GetCompleteTasksHavingIncompleteChecklist ─

export interface PendingChecklistRow {
  taskId: number
  taskName?: string | null
  taskDestination: string | null
  taskDestinationAddress: string | null
}

export interface PendingChecklistApiResponse {
  statusCode: number
  message: string
  dataObj: { data: PendingChecklistRow[] }
}

/**
 * GET /Task/GetCompleteTasksHavingIncompleteChecklistDetails/{id}
 * Returns same shape as TaskDetailApiResponse — taskChecklistsData holds PENDING (incomplete) checklists only.
 */
export type PendingChecklistDetailApiResponse = TaskDetailApiResponse

// ─── Delivery (AddDelivery) types ────────────────────────────────────────────

/** One transport record attached to a task — from GetTaskDetails.taskTransportationData */
export interface TaskTransportItem {
  taskTransportationAutoId: number
  taskTransportationVehicleId: number | null
  vehicleName: string | null
  taskTransportationStartLocationId: number | null
  taskTransportationStartLocation: string | null
  taskTransportationEndLocationId: number | null
  taskTransportationEndLocation: string | null
  taskTransportationStartLat: number | null
  taskTransportationStartLong: number | null
  taskTransportationEndLat: number | null
  taskTransportationEndLong: number | null
  taskTransportationCost: number | null
  taskTransportationRemarks: string | null
}

/** Row from GET /Task/GetTasks/0/-1 — all tasks for current employee */
export interface DeliveryTaskRow {
  taskId: number
  taskName: string | null
  jobType: string | null
  taskAssignTime: string | null
  taskStartTime: string | null
  taskEndTime: string | null
  taskStatus: string | null
}

export interface DeliveryTaskListApiResponse {
  statusCode: number
  message: string
  dataObj: { data: DeliveryTaskRow[] }
}

/** POST /Task/AddTaskTransportation/{taskId} payload */
export interface AddTransportPayload {
  taskId: number
  taskTransportationVehicleId: number
  /** Local cache label used by the delivery page after add/edit; not required by the API. */
  vehicleName?: string
  taskTransportationCost: number
  taskTransportationStartLat: number
  taskTransportationStartLong: number
  taskTransportationEndLat: number | null
  taskTransportationEndLong: number | null
  /** Local cache ids used by the delivery page after add/edit; not required by the API. */
  taskTransportationStartLocationId?: number | null
  taskTransportationStartLocation: string
  taskTransportationEndLocationId?: number | null
  taskTransportationEndLocation: string
  taskTransportationRemarks?: string
}

/** PUT /Task/UpdateTaskTransportation/{taskId} payload */
export interface UpdateTransportPayload {
  taskId: number
  taskTransportationAutoId: number
  taskTransportationVehicleId: number
  /** Local cache label used by the delivery page after add/edit; not required by the API. */
  vehicleName?: string
  taskTransportationCost: number
  taskTransportationStartLat: number
  taskTransportationStartLong: number
  taskTransportationEndLat: number | null
  taskTransportationEndLong: number | null
  /** Local cache ids used by the delivery page after add/edit; not required by the API. */
  taskTransportationStartLocationId?: number | null
  taskTransportationStartLocation: string
  taskTransportationEndLocationId?: number | null
  taskTransportationEndLocation: string
  taskTransportationRemarks?: string
}

/** POST /Task/AddTransportationEndLocation/{taskId} payload */
export interface TransportEndLocationPayload {
  taskId: number
  taskTransportationAutoId: number
  taskTransportationEndLat: number
  taskTransportationEndLong: number
  taskTransportationEndLocation: string
}
