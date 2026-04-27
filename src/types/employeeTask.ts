/* ─── Employee Task Report types ─── */

export interface EmployeeTaskSummary {
  employeeId: number | null
  employeeCode: string | null
  employeeFullName: string | null
  totalTasksAssigned: number | null
  completedTasks: number | null
  pendingTasks: number | null
  completionRatePercentage: number | null
  eveningTaskCount: number | null
  eveningTaskPercentage: number | null
  avgAssignToStartMinutes: number | null
  avgTaskDurationMinutes: number | null
  distinctTransportCount: number | null
}

export interface EmployeeTaskDetailResponse {
  employeeId: number
  employeeCode: string
  employeeFullName: string
  tasks: EmployeeTask[]
}

export interface EmployeeTask {
  taskId: number | null
  taskDestination: string | null
  soSystemNo: string | null
  taskAssignTime: string | null
  taskStartTime: string | null
  taskEndTime: string | null
  movementTransportName: string | null
  taskAssignToStartMinutes: number | null
  taskDurationMinutes: number | null
  isCompleted: boolean | null
}

export interface EmployeeTaskDetailFlat extends EmployeeTask {
  employeeId: number
  employeeCode: string
  employeeFullName: string
}

export interface EmployeeTaskFilters {
  startDate: string
  endDate: string
  employeeId: number
}
