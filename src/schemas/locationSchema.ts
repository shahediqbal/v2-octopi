import { z } from 'zod'

export const locationSchema = z.object({
  locationName: z.string().trim().min(1, 'Please enter location name'),
})

export type LocationFormData = z.infer<typeof locationSchema>