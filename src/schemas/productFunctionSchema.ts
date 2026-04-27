import { z } from 'zod'

export const productFunctionSchema = z.object({
  functionName: z.string().trim().min(1, 'Function name is required'),
})

export type ProductFunctionFormData = z.infer<typeof productFunctionSchema>