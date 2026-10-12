import { z } from 'zod'

export const employeeSchema = z.object({
  empFirstName: z.string().trim().min(1, "Please enter employee's first name"),
  empLastName: z.string().trim().min(1, "Please enter employee's last name"),
  designationId: z.number().min(1, 'Please select a designation'),
  bloodGroup: z.string().trim().min(1, "Please select employee's blood group"),
  empPresentAddress: z.string().trim().min(1, 'Please enter present address'),
  empParmanentAddress: z.string().trim().min(1, 'Please enter permanent address'),
  dateOfJoining: z.string().trim().min(1, 'Please enter date of joining'),
  departmentId: z.number().min(1, 'Please select a department'),
  channelId: z.number().min(1, 'Please select a location'),
  empTypeId: z.number().min(1, "Please select employee's type"),
  empContactNo: z.string().trim().min(1, 'Please enter contact number'),
  guardianContactNo: z.string().optional().default(''),
})

export type EmployeeFormData = z.infer<typeof employeeSchema>

export const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const
