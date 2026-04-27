import { z } from 'zod'

export const dropdownOptionSchema = z.object({
  key: z.number(),
  value: z.string(),
})

export const paginatedDropdownSchema = z.object({
  data: z.array(dropdownOptionSchema),
  totalRecords: z.number(),
  pageNumber: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

/** Use in form schemas for required dropdown fields */
export const requiredDropdownId = z
  .number({ error: 'Please select an option' })
  .min(1, 'Please select an option')

/** Use in form schemas for optional/nullable dropdown fields */
export const optionalDropdownId = z.number().nullable()
