export interface UserRole {
  roleId: number
  roleName: string
}

export interface UserWithRole {
  userSystemId: number
  userUniqueCode: string
  userFirstName: string
  userLastName: string
  userRoleId: number
  roleName: string
  userAddress: string
  userContactNo: string
  userMail?: string
}

export interface SignupPayload {
  userSystemId: 0
  userUniqueCode: string
  userFirstName: string
  userLastName: string
  userAddress: string
  userContactNo: string
  userMail: string
  userCategoryId: 0
  userActiveStatus: 1
  clientId: number
  userName: string
  userPassword: string
  userRoleId: number
}

export interface UpdateUserRolePayload {
  userSystemId: number
  userRoleId: number
}

export interface CreateRolePayload {
  roleName: string
  roleDescription?: string
  roleStatus: 1
}
