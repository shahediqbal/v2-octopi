// ---------------------------------------------------------------------------
// Role & Menu Management — shared types
// ---------------------------------------------------------------------------

/** A single role entry returned by GET /Role/GetRoles/1 */
export interface Role {
  roleId: number
  roleName: string
}

/** A single menu / action item inside a role */
export interface MenuItem {
  menuId: number
  /** The parent/group name, e.g. "Customer" */
  menuParentName: string
  /** The specific action name, e.g. "List Customers" */
  menuName: string
}

/** Full detail for a selected role — returned by GET /Role/GetRoleDetails/{id} */
export interface RoleDetails {
  roleId: number
  roleName: string
  roleActiveStatus: boolean
  /** Menus NOT yet assigned to this role */
  menuList: MenuItem[]
  /** Menus already assigned to this role */
  permittedMenuList: MenuItem[]
}

/** POST /Role/AddRole */
export interface CreateRolePayload {
  rolename: string
}

/** PUT /Role/UpdateRoleDetails */
export interface UpdateRoleDetailsPayload {
  roleId: number
  roleName: string
  roleActiveStatus: boolean
  rolePermissionIdList: number[]
}

export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}
