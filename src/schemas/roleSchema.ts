import { z } from 'zod'

export const roleSchema = z.object({
  rolename: z.string().min(1, 'Role name is required').max(100, 'Role name too long'),
})

export type RoleFormData = z.infer<typeof roleSchema>
