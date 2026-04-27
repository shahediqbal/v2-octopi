import { z } from 'zod'

const requiredDropdownId = (message: string) =>
  z.number().nullable().refine((value) => value != null && value > 0, message)

export const chequeFormSchema = z.object({
  chequeCollectedBy: requiredDropdownId('Please select Cheque Collector'),
  chequeCollectionDate: z.string().min(1, 'Please select Cheque Collection Date'),
  chequeTypeId: requiredDropdownId('Please select Cheque Type'),
  customerId: requiredDropdownId('Please select Customer'),
  chequeDate: z.string().min(1, 'Please select Cheque Date'),
  chequePlacementDate: z.string().min(1, 'Please select Cheque Placement Date'),
  chequeExpireDate: z.string().min(1, 'Please select Cheque Expire Date'),
  chequeActionDate: z.string().min(1, 'Please select Cheque Action Date'),
  chequeNumber: z.string().trim().min(1, 'Please enter Cheque Number'),
  chequeAmount: z.number().positive('Please enter Amount'),
  issuerBankId: requiredDropdownId('Please select Issuer bank'),
  beneficiaryBankId: z.number().nullable(),
  chequeStatusId: requiredDropdownId('Please select Cheque Status'),
  chequeStatusRemarks: z.string().trim().optional().or(z.literal('')),
})

export const chequeStatusSchema = z.object({
  chequeStatusId: requiredDropdownId('Please select Cheque Status'),
  chequeActionDate: z.string().min(1, 'Please select Cheque Action Date'),
  chequeStatusRemarks: z.string().trim().optional().or(z.literal('')),
})

export type ChequeFormData = z.infer<typeof chequeFormSchema>
export type ChequeStatusFormData = z.infer<typeof chequeStatusSchema>