import { z } from 'zod'
import { optionalDropdownId } from '@/schemas/dropdown'

export const productLevelOptions = [
  { id: 'Level 1', title: 'Level 1' },
  { id: 'Level 2', title: 'Level 2' },
  { id: 'Level 3', title: 'Level 3' },
] as const

export const productSchema = z.object({
  productName: z.string().trim().min(1, "Please enter product's name"),
  categoryId: optionalDropdownId.refine((value) => value !== null && value >= 1, {
    message: 'Please select an option',
  }),
  functionId: optionalDropdownId,
  hsCode: z.string().trim(),
  cooId: optionalDropdownId,
  brandId: optionalDropdownId,
  groupId: optionalDropdownId,
  productLevel: z.string().trim(),
  productShelfLife: z
    .number({ error: 'Please write Product Shelf Life!' })
    .int("Can't be decimal")
    .min(12, 'The number must be greater than 11!'),
  productPackSize: z.string().trim(),
})

export type ProductFormData = z.infer<typeof productSchema>