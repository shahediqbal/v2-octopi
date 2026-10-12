// import { z } from 'zod'

// export const PAYMENT_TYPE_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7'] as const

// export const paymentFormSchema = z.object({
//   paymentReference: z.enum(PAYMENT_TYPE_VALUES, { error: 'Please select a payment type' }),
//   customerId: z
//     .number({ error: 'Please select a customer' })
//     .min(1, 'Please select a customer'),
//   employeeId: z
//     .number({ error: 'Please select an employee' })
//     .min(1, 'Please select an employee'),
//   paymentDate: z.string().min(1, 'Please select a payment date'),
//   paymentModeId: z.number().nullable(),
//   invoiceChequeId: z.number().nullable(),
//   receiveAmount: z.number().nullable(),
//   adjustedAmount: z.number().nullable(),
//   moneyReceiptNo: z.string(),
//   bankId: z.number().nullable(),
//   chequeStatusId: z.number().nullable(),
//   chequeActionDate: z.string(),
//   paymentNote: z.string(),
// })

// export type PaymentFormData = z.infer<typeof paymentFormSchema>
import { z } from 'zod'

export const PAYMENT_TYPE_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7'] as const

const isEmptyText = (value: string | null | undefined) => !value || value.trim().length === 0

export const paymentFormSchema = z
  .object({
    paymentReference: z.enum(PAYMENT_TYPE_VALUES, {
      error: 'Please select a payment type',
    }),

    customerId: z
      .number({ error: 'Please select a customer' })
      .min(1, 'Please select a customer'),

    employeeId: z
      .number({ error: 'Please select collected by' })
      .min(1, 'Please select collected by'),

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
  .superRefine((data, ctx) => {
    const paymentType = data.paymentReference

    const isInvoice = paymentType === '0'
    const isCheque = paymentType === '1'
    const isOpen = paymentType === '2'
    const isTransfer = paymentType === '3'
    const isAit = paymentType === '4'
    const isVat = paymentType === '5'
    const isCreditAdjustment = paymentType === '6'
    const isLcPayment = paymentType === '7'

    const requiresPaymentMode = isInvoice || isCheque || isOpen || isTransfer
    const requiresInvoiceOrCheque = isInvoice || isCheque
    const requiresReceiveAmount = isInvoice || isCheque || isOpen || isTransfer || isLcPayment
    const requiresMoneyReceipt = isInvoice || isOpen
    const requiresBank = isCheque || isTransfer
    const requiresAdjustedAmount = isInvoice || isAit || isVat || isCreditAdjustment

    if (requiresPaymentMode && (!data.paymentModeId || data.paymentModeId < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentModeId'],
        message: 'Please select payment mode',
      })
    }

    if (requiresInvoiceOrCheque && (!data.invoiceChequeId || data.invoiceChequeId < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['invoiceChequeId'],
        message: isInvoice ? 'Please select invoice no' : 'Please select cheque no',
      })
    }

    if (requiresReceiveAmount && (!data.receiveAmount || data.receiveAmount <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receiveAmount'],
        message: 'Receive amount must be greater than 0',
      })
    }

    if (requiresAdjustedAmount && data.adjustedAmount != null && data.adjustedAmount < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['adjustedAmount'],
        message: 'Adjusted amount cannot be negative',
      })
    }

    if (requiresMoneyReceipt && isEmptyText(data.moneyReceiptNo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['moneyReceiptNo'],
        message: 'Please enter money receipt no',
      })
    }

    if (requiresBank && (!data.bankId || data.bankId < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bankId'],
        message: 'Please select beneficiary bank',
      })
    }

    if (isCheque && (!data.chequeStatusId || data.chequeStatusId < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['chequeStatusId'],
        message: 'Please select cheque status',
      })
    }

    if (isCheque && isEmptyText(data.chequeActionDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['chequeActionDate'],
        message: 'Please select cheque action date',
      })
    }

    if (isEmptyText(data.paymentNote)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentNote'],
        message: 'Please enter payment note',
      })
    }
  })

export type PaymentFormData = z.infer<typeof paymentFormSchema>