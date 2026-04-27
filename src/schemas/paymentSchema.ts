import { z } from 'zod'

export const PAYMENT_TYPE_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7'] as const

export const paymentFormSchema = z.object({
  paymentReference: z.enum(PAYMENT_TYPE_VALUES, { error: 'Please select a payment type' }),
  customerId: z
    .number({ error: 'Please select a customer' })
    .min(1, 'Please select a customer'),
  employeeId: z
    .number({ error: 'Please select an employee' })
    .min(1, 'Please select an employee'),
  paymentDate: z.string().min(1, 'Please select a payment date'),
  paymentModeId: z.number().nullable(),
  invoiceChequeId: z.number().nullable(),
  receiveAmount: z.number().nullable(),
  adjustedAmount: z.number().nullable(),
  moneyReceiptNo: z.string(),
  bankId: z.number().nullable(),
  chequeStatusId: z.number().nullable(),
  chequeActionDate: z.string(),
  paymentNote: z.string(),
})

export type PaymentFormData = z.infer<typeof paymentFormSchema>
