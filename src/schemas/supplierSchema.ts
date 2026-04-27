import { z } from 'zod'

const bangladeshiPhonePattern = /^(01){1}[3456789]{1}\d{8}$/

export const supplierSchema = z.object({
  supplierName: z.string().trim().min(1, "Please enter company's name"),
  supplierAddress: z.string().trim().min(1, "Please enter company's present address"),
  supplierContactPerson: z.string().trim().min(1, "Please enter contact person's name"),
  supplierContactNumber: z
    .string()
    .trim()
    .regex(bangladeshiPhonePattern, 'Must be a valid bangladeshi mobile number'),
})

export type SupplierFormData = z.infer<typeof supplierSchema>