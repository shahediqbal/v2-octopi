import { z } from 'zod'

export const customerSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerAddress: z.string().min(1, 'Address is required'),
  contactPersonName: z.string(),
  contactNumber: z
    .string()
    .refine(
      (v) => !v || /^(01)[3-9]\d{8}$/.test(v),
      'Must be a valid Bangladeshi mobile number',
    ),
  designationId: z.number().nullable(),
  channelId: z.number().nullable(),
  employeeId: z.number().nullable(),
  paymentInterval: z.string(),
  paymentCycleType: z.string(),
  paymentCycleValue: z.number().nullable(),
  paymentMode: z.string(),
  currentStatus: z.string(),
  linkCustomerId: z.number().nullable(),
  specialNote: z.string(),
})

export type CustomerFormData = z.infer<typeof customerSchema>

/* ─── dropdown option sets (same as legacy) ─── */

export const paymentIntervals = [
  { id: '1', title: 'By Bill' },
  { id: '2', title: 'By Month' },
  { id: '3', title: 'Partial Payment' },
] as const

export const paymentCycleTypes = [
  { id: '1', title: 'On Duration' },
  { id: '2', title: 'On Value' },
] as const

export const paymentModes = [
  { id: '1', title: 'Cheque Payment' },
  { id: '2', title: 'Cash Payment' },
  { id: '3', title: 'Cheque or Cash Payment' },
  { id: '4', title: 'LC' },
  { id: '5', title: 'Online Transfer' },
  { id: '6', title: 'Loan Support' },
] as const

export const currentStatusOptions = [
  { id: '1', title: 'Factory Closed' },
  { id: '2', title: 'Regular' },
  { id: '3', title: 'Parked' },
  { id: '4', title: 'Supplementary Duty Issues' },
  { id: '5', title: 'Will Not Pay Anymore' },
  { id: '6', title: 'Adjustment Issues' },
  { id: '7', title: 'Untrace' },
  { id: '8', title: 'Follow-Up' },
  { id: '9', title: 'Inactive' },
  { id: '10', title: 'Currently No Transection' },
] as const
