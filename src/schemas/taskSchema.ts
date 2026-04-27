import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Task Assign Schema — used by AssignTaskPage form
// ─────────────────────────────────────────────────────────────────────────────

export const taskSchema = z.object({
  taskName: z.string().min(1, 'Task name is required'),
  taskDescription: z.string().optional(),
  destinationName: z.string().optional(),
  destinationAddress: z.string().optional(),
  employeeId: z.number({ error: 'Please select an employee' }).min(1, 'Please select an employee'),
  employeeLabel: z.string().optional(),
  movementTransportId: z.number().nullable().optional(),
  eveningTask: z.boolean().optional(),
})

export type TaskFormValues = z.infer<typeof taskSchema>

/** Names of assignees that are allowed to skip movement transport */
export const TRANSPORT_OPTIONAL_ASSIGNEES = new Set([
  'inbound sales',
  'gazipur mixing',
  'chittagong mixing',
  'chittagong warehouse',
])
