# Users & Signup — V2 Migration Plan

> **Purpose:** Complete technical reference for migrating the legacy User Registration (Signup) and User Role Management modules into v2-octopi ERP.
> **Audience:** AI agents, developers performing the migration.
> **Last Updated:** 2026-04-13

---

## Table of Contents

1. [Module Scope & Route Inventory](#1-module-scope--route-inventory)
2. [Legacy File Inventory](#2-legacy-file-inventory)
3. [Complete API Endpoint Inventory](#3-complete-api-endpoint-inventory)
4. [Data Models & TypeScript Interfaces](#4-data-models--typescript-interfaces)
5. [Business Workflow](#5-business-workflow)
6. [Legacy Redux State Management](#6-legacy-redux-state-management)
7. [Child Components & Popups](#7-child-components--popups)
8. [V2 Architecture & File Organization](#8-v2-architecture--file-organization)
9. [V2 Route Mapping (Legacy → V2)](#9-v2-route-mapping-legacy--v2)
10. [Hook Design](#10-hook-design)
11. [Form Schema Design (Zod)](#11-form-schema-design-zod)
12. [Page Breakdowns](#12-page-breakdowns)
13. [Execution Phases](#13-execution-phases)
14. [Implementation Checklist](#14-implementation-checklist)
15. [Gotchas & Notes](#15-gotchas--notes)

---

## 1. Module Scope & Route Inventory

This covers two distinct but related sub-modules:

### Sub-module A: User Registration (`/signup`)
Create a new system user (maps to an employee or customer), assign a role, set login credentials.

### Sub-module B: User Role Management (`/roles/users`)
List all users with their current roles; open a modal to change a user's role.

| # | Legacy Route | Purpose | Legacy Component |
|---|---|---|---|
| 1 | `/signup` | Register a new user (employee/customer-linked) with role | `Signup.jsx` (in `src/user/`) |
| 2 | `/roles/users` | List users with roles; inline edit role via popup | `UserRoles.js` (in `src/pages/Registrations/`) |

---

## 2. Legacy File Inventory

### 2.1 Page Components

| File | Path | Purpose |
|---|---|---|
| `Signup.jsx` | `src/user/Signup.jsx` | Full signup form: customer/employee selector, personal info, role, username, password |
| `UserRoles.js` | `src/pages/Registrations/UserRoles.js` | DataGrid list of all users+roles; search by name; opens `UpdateRole` popup for role edit |

### 2.2 Child Components / Popups

| File | Path | Purpose |
|---|---|---|
| `UpdateRole.js` | `src/user/UpdateRole.js` | Modal/popup form to change a user's role — single `<Select>` for role choice |
| `AddRole.js` | `src/user/AddRole.js` | Inline form inside a popup to create a new role (used within Signup page) |

### 2.3 Redux Actions Used

| Action | Source File | Purpose |
|---|---|---|
| `signup` | `src/auth/index.js` | POST create new user (called directly, not via Redux dispatch) |
| `listCustomersForSignup` | `userActions.js` | GET customers for autocomplete in signup form |
| `listEmployees` | `employeeActions.js` | GET employees for autocomplete in signup form |
| `listRoles` / `listRolesUserPage` | `userActions.js` | GET roles list for dropdown |
| `listEmployeeDetails` | `userActions.js` | GET employee detail (auto-fills name, phone) when employee selected |
| `listUsersWithRoles` | `userActions.js` | GET all users with current role info |
| `updateRoleForSpecificUser` | `RoleAndMenuActions.js` | PUT update role for a user |
| `createRole` | `RoleAndMenuActions.js` | POST create new role (from AddRole popup in Signup page) |

---

## 3. Complete API Endpoint Inventory

All endpoints are under base URL: `https://api-v2.algologix.com.bd/api`

| # | Endpoint | Method | Purpose | Request Body / Params |
|---|---|---|---|---|
| 1 | `/User/Signup` | POST | Create new user account | JSON body (see §4) |
| 2 | `/Role/GetRoles/1` | GET | Get all roles (status=1 active) | None |
| 3 | `/Role/GetUserRoleList` | GET | Get all users with their roles | None |
| 4 | `/Role/UpdateUserRole` | PUT | Update a user's role | `{ userSystemId, userRoleId }` |
| 5 | `/Role/AddRole` | POST | Create a new role | `{ roleName, roleDescription, roleStatus }` |
| 6 | `/Employee/GetAllEmployees` | GET | Fetch employees for signup autocomplete | None |
| 7 | `/KeyValue/GetCustomerName` | GET | Fetch customer name/ID pairs for signup autocomplete | None |
| 8 | `/Employee/GetEmployeeById/{id}` | GET | Auto-fill employee details when selected | Path param |

---

## 4. Data Models & TypeScript Interfaces

Create `v2-octopi/src/types/userManagement.ts`:

```typescript
// ─── Role ───
export interface Role {
  id: number
  label: string   // roleName
}

// ─── User With Role (list row) ───
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

// ─── Signup Payload ───
export interface SignupPayload {
  userSystemId: 0                  // always 0 for new user
  userUniqueCode: string           // employee code OR customer ID as string
  userFirstName: string
  userLastName: string
  userAddress: string              // not required — pass "string" as placeholder
  userContactNo: string
  userMail: string
  userCategoryId: 0
  userActiveStatus: 1
  clientId: number                 // customer ID (0 if employee-linked)
  userName: string                 // email OR phone depending on toggle
  userPassword: string
  userRoleId: number
}

// ─── Update Role Payload ───
export interface UpdateUserRolePayload {
  userSystemId: number
  userRoleId: number
}

// ─── Create Role Payload ───
export interface CreateRolePayload {
  roleName: string
  roleDescription?: string
  roleStatus: 1
}

export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}
```

---

## 5. Business Workflow

### A. Signup Workflow

1. User navigates to `/users/signup`.
2. Page loads: customer list, employee list, roles list.
3. User selects either **Customer** or **Employee** from autocomplete (determines `userUniqueCode`).
   - If employee selected: auto-populate `userFirstName`, `userLastName`, `userContactNo` from `GetEmployeeById`.
4. Fill personal info (first name, last name, phone, email).
5. Select a role from dropdown.
6. Toggle username type: **Email** or **Mobile number** (determines what becomes `userName`).
7. Enter password + confirm password.
8. Submit → POST `/User/Signup` → on success show notification, reset form.
9. Optionally create a new role by opening "Add Role" popup within the page.

### B. User Role Management Workflow

1. User navigates to `/users/roles`.
2. List of all users with current roles loads.
3. User searches by name (client-side filter).
4. Clicks the "Edit Role" icon on a row → `UpdateRoleModal` opens.
5. Select new role from dropdown → Submit → PUT `/Role/UpdateUserRole` → close modal, refresh list.

---

## 6. Legacy Redux State Management

### Signup page

| Redux Slice | Key | Purpose |
|---|---|---|
| `customerList` | `customers` | Customer options for autocomplete |
| `employeeList` | `employees` | Employee options for autocomplete |
| `roleList` | `roles` | Role options for dropdown |
| `employeeDetails` | `employee` | Auto-fill data when employee selected |
| `createdRole` | `success` | Role create notification trigger |

### UserRoles page

| Redux Slice | Key | Purpose |
|---|---|---|
| `userWithRole` | `usersWithRoles`, `loading` | Users + roles list |
| `updateUserRole` | `success`, `loading` | Role update mutation state |
| `roleList` | `roles` | Roles for UpdateRole dropdown |

In V2: replace all Redux slices with TanStack Query.

---

## 7. Child Components & Popups

### `UpdateRoleModal` (from `UpdateRole.js`)

A popup/drawer containing a single `<select>` for choosing a new role for the selected user.

Props in V2:
```typescript
interface UpdateRoleModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithRole
}
```

- Loads roles via `useRoles()` hook
- Pre-selects current `user.userRoleId`
- On submit: calls `useUpdateUserRole()` mutation → `onSuccess` closes modal

### `AddRolePopup` (from `AddRole.js`)

A popup within the Signup page to create a brand-new role on the fly.

Props in V2:
```typescript
interface AddRolePopupProps {
  isOpen: boolean
  onClose: () => void
  onRoleCreated: (role: Role) => void
}
```

- Simple `<input>` for role name
- On submit: calls `useCreateRole()` mutation → `onSuccess` closes popup, notifies parent to refresh roles dropdown

---

## 8. V2 Architecture & File Organization

Before implementing, read:
- `v2-octopi/AI_DEVELOPER_GUIDE.md` — canonical patterns
- `v2-octopi/V2_IMPLEMENTATION_GUIDE.md` — step-by-step checklists

### Files to Create

```
v2-octopi/src/
  types/
    userManagement.ts                  ← all interfaces (§4)
  schemas/
    userManagementSchema.ts            ← Zod schemas for signup + role forms
  hooks/
    useUserManagement.ts               ← all TanStack Query hooks
  pages/
    users/
      SignupPage.tsx                   ← route /users/signup
      UserRolesPage.tsx                ← route /users/roles
  components/
    users/
      UpdateRoleModal.tsx              ← role edit popup
      AddRolePopup.tsx                 ← add new role popup (used in SignupPage)
```

---

## 9. V2 Route Mapping (Legacy → V2)

| Legacy Route | V2 Route | Notes |
|---|---|---|
| `/signup` | `/users/signup` | User registration |
| `/roles/users` | `/users/roles` | User role management list |

Add legacy redirects in `AppRouter.tsx`:
```typescript
{ path: '/signup', element: <Navigate to="/users/signup" replace /> },
{ path: '/roles/users', element: <Navigate to="/users/roles" replace /> },
```

---

## 10. Hook Design

Create `v2-octopi/src/hooks/useUserManagement.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  Role, UserWithRole, SignupPayload,
  UpdateUserRolePayload, CreateRolePayload, ApiResponse
} from '@/types/userManagement'

export const userMgmtKeys = {
  all: ['userMgmt'] as const,
  roles: () => [...userMgmtKeys.all, 'roles'] as const,
  users: () => [...userMgmtKeys.all, 'users'] as const,
}

// ─── Roles list ───
export function useRoles() {
  return useQuery({
    queryKey: userMgmtKeys.roles(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Array<{ roleId: number; roleName: string }>>>(
        '/Role/GetRoles/1'
      )
      return (res.dataObj ?? [])
        .map(r => ({ id: r.roleId, label: r.roleName }))
        .filter(r => r.label !== 'Customer')  // legacy filtered out "Customer" role
    },
    staleTime: 5 * 60_000,
  })
}

// ─── Users with roles list ───
export function useUsersWithRoles() {
  return useQuery({
    queryKey: userMgmtKeys.users(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UserWithRole[]>>('/Role/GetUserRoleList')
      return res.dataObj ?? []
    },
    staleTime: 30_000,
  })
}

// ─── Create user (signup) ───
export function useSignup() {
  return useMutation({
    mutationFn: (payload: SignupPayload) =>
      apiClient.post('/User/Signup', payload),
    // No cache invalidation needed — signup creates a new user (admin action)
  })
}

// ─── Update user role ───
export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateUserRolePayload) =>
      apiClient.put('/Role/UpdateUserRole', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMgmtKeys.users() })
    },
  })
}

// ─── Create role ───
export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) =>
      apiClient.post('/Role/AddRole', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMgmtKeys.roles() })
    },
  })
}
```

---

## 11. Form Schema Design (Zod)

Create `v2-octopi/src/schemas/userManagementSchema.ts`:

```typescript
import { z } from 'zod'

// ─── Signup schema ───
export const signupSchema = z.object({
  // Either customer or employee — at least one must be selected
  customerId: z.number().nullable(),
  employeeId: z.number().nullable(),
  userFirstName: z.string().min(1, 'First name is required'),
  userLastName: z.string().min(1, 'Last name is required'),
  userContactNo: z.string().min(1, 'Contact number is required'),
  userMail: z.string().email('Valid email required'),
  roleId: z.number({ error: 'Role is required' }).positive('Role is required'),
  userPassword: z.string().min(6, 'Password must be at least 6 characters'),
  userConfirmPassword: z.string().min(1, 'Please confirm your password'),
  usernameType: z.enum(['email', 'mobile']),
}).refine(
  (d) => d.userPassword === d.userConfirmPassword,
  { message: 'Passwords do not match', path: ['userConfirmPassword'] }
).refine(
  (d) => d.customerId != null || d.employeeId != null,
  { message: 'Select a customer or employee', path: ['customerId'] }
)

export type SignupFormValues = z.infer<typeof signupSchema>

// ─── Update role schema ───
export const updateRoleSchema = z.object({
  roleId: z.number({ error: 'Role is required' }).positive('Role is required'),
})

export type UpdateRoleFormValues = z.infer<typeof updateRoleSchema>

// ─── Create role schema ───
export const createRoleSchema = z.object({
  roleName: z.string().min(1, 'Role name is required'),
  roleDescription: z.string().optional(),
})

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>
```

---

## 12. Page Breakdowns

### 12.1 `SignupPage.tsx` (`/users/signup`)

**Hooks:**
- `useRoles()` — for role dropdown
- `DropdownSelect` type `employee` — for employee autocomplete
- `DropdownSelect` type `customer` — for customer autocomplete
- `useSignup()` — create mutation
- `useCreateRole()` — create role mutation (passed to `AddRolePopup`)

**State:**
```typescript
const [usernameType, setUsernameType] = useState<'email' | 'mobile'>('email')
const [addRoleOpen, setAddRoleOpen] = useState(false)
```

**Auto-fill logic:**
When employee ID changes (from `DropdownSelect` `onChange`), call `/Employee/GetEmployeeById/{id}` to get name + phone and `setValue` in RHF.

> Since `DropdownSelect` loads all employees, listen to the selected employee ID change and trigger a secondary query with `useQuery({ queryKey: ['employee', id], enabled: !!id, ... })` to auto-fill the personal info fields.

**Payload builder:**
```typescript
const buildSignupPayload = (values: SignupFormValues): SignupPayload => ({
  userSystemId: 0,
  userUniqueCode: values.employeeId
    ? String(employeeCode)       // fetch from employee detail
    : String(values.customerId),
  userFirstName: values.userFirstName,
  userLastName: values.userLastName,
  userAddress: 'string',         // not required — pass placeholder
  userContactNo: values.userContactNo,
  userMail: values.userMail,
  userCategoryId: 0,
  userActiveStatus: 1,
  clientId: values.customerId ?? 0,
  userName: values.usernameType === 'email' ? values.userMail : values.userContactNo,
  userPassword: values.userPassword,
  userRoleId: values.roleId,
})
```

**Layout:**
1. Page header: "User Registration"
2. Form card (two-column grid on desktop):
   - Left column: Customer autocomplete, Employee autocomplete, Role dropdown, "+ Create New Role" button
   - Right column: First name, Last name, Contact no, Email
   - Full-width row: Username type toggle (Email / Mobile), Password, Confirm Password
   - Submit button + Reset button
3. On success: show toast "New Account Created", reset form

### 12.2 `UserRolesPage.tsx` (`/users/roles`)

**Hooks:**
- `useUsersWithRoles()` — list query
- `useRoles()` — for `UpdateRoleModal` dropdown
- `useUpdateUserRole()` — passed to `UpdateRoleModal`

**State:**
```typescript
const [searchQuery, setSearchQuery] = useState('')
const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
```

**Client-side filter:**
```typescript
const filtered = (users ?? []).filter(u =>
  `${u.userFirstName} ${u.userLastName}`.toLowerCase().includes(searchQuery.toLowerCase())
)
```

**Layout:**
1. Page header: "User Roles"
2. Toolbar: search input (filter by full name)
3. Table columns:
   - Edit Role — icon button opens `UpdateRoleModal`
   - ID (`userSystemId`)
   - Unique Code (`userUniqueCode`)
   - Full Name (`userFirstName + ' ' + userLastName`)
   - Role (`roleName`)
   - Address (`userAddress`)
   - Phone (`userContactNo`)
4. `UpdateRoleModal` — shown when `selectedUser !== null`

### 12.3 `UpdateRoleModal.tsx`

Props: `{ isOpen, onClose, user: UserWithRole }`

- Load roles via `useRoles()`
- Form with one field: Role `<select>` pre-set to `user.userRoleId`
- Submit: `useUpdateUserRole({ userSystemId: user.userSystemId, userRoleId })` → `onSuccess` → `onClose()`

### 12.4 `AddRolePopup.tsx`

Props: `{ isOpen, onClose, onRoleCreated }`

- Single input: Role Name
- Submit: `useCreateRole({ roleName, roleStatus: 1 })` → `onSuccess` → `onRoleCreated(newRole)`, `onClose()`

---

## 13. Execution Phases

### Phase 1 — Types, Schema, Hooks
1. Create `types/userManagement.ts`
2. Create `schemas/userManagementSchema.ts`
3. Create `hooks/useUserManagement.ts`

### Phase 2 — User Roles Page (simpler, no complex form)
4. Create `UpdateRoleModal.tsx`
5. Create `UserRolesPage.tsx`
6. Add route `/users/roles` to `AppRouter.tsx`

### Phase 3 — Signup Page
7. Create `AddRolePopup.tsx`
8. Create `SignupPage.tsx`
9. Add route `/users/signup` to `AppRouter.tsx`

### Phase 4 — Legacy Redirects
10. Add redirects `/signup` → `/users/signup` and `/roles/users` → `/users/roles`

---

## 14. Implementation Checklist

- [ ] `types/userManagement.ts` — 6 interfaces defined
- [ ] `schemas/userManagementSchema.ts` — `signupSchema`, `updateRoleSchema`, `createRoleSchema`
- [ ] `hooks/useUserManagement.ts` — 5 hooks: roles, usersWithRoles, signup, updateUserRole, createRole
- [ ] `UpdateRoleModal.tsx` — role select pre-populated, update mutation, close on success
- [ ] `AddRolePopup.tsx` — role name input, create mutation, callback to parent
- [ ] `UserRolesPage.tsx` — search, table with 7 columns, edit icon opens modal
- [ ] `SignupPage.tsx` — customer/employee autocomplete, auto-fill from employee, role dropdown, password + confirm, username type toggle, submit
- [ ] Signup payload builder correctly handles `userUniqueCode` (employee code vs customer ID)
- [ ] Routes registered: `/users/signup`, `/users/roles`
- [ ] Legacy redirects: `/signup`, `/roles/users`
- [ ] Named exports only
- [ ] `@/` alias throughout
- [ ] No MUI — Tailwind only
- [ ] `DropdownSelect` used for customer, employee, role
- [ ] Password confirmation validation in Zod `.refine()`

---

## 15. Gotchas & Notes

1. **`userAddress` is required in payload but not user-facing** — the legacy code hardcodes `userAddress: "string"` as a placeholder. Do the same in V2.

2. **`userUniqueCode`** — if employee is selected: use `employee.employeeCode.toString()`. If customer is selected: use `String(customerId)`. The Signup page must either store the employee code from the detail query or pass it from the employee autocomplete option.

3. **Username = email OR mobile toggle** — the legacy page has radio-style checkboxes (`checkedEmail`, `checkedMobile`). In V2, use a simple toggle or radio inputs. The `userName` field in the payload is set to `userMail` or `userContactNo` depending on the toggle.

4. **`listCustomersForSignup`** — the legacy calls a different endpoint than the general customer list. It calls `/KeyValue/GetCustomerName` which returns `{ id, label }` pairs. Use `DropdownSelect` with registered type `customer` if available, or use the `PaginatedCombobox` for large customer datasets.

5. **`listRolesUserPage` vs `listRoles`** — `listRolesUserPage` filters out role with `id === 10` (the "Customer" role). `listRoles` filters out role with `label === "Customer"`. In V2, apply both filters: exclude any role where `id === 10` OR `label === 'Customer'`.

6. **`Role/UpdateUserRole` returns no meaningful response** — the legacy action dispatches `SUCCESS` even before the response resolves. In V2, the `onSuccess` callback from the mutation is sufficient.

7. **Auto-fill employee details** — when employee changes, trigger a `useQuery` for the employee detail. Store `employeeCode` from the detail response, as it is needed for `userUniqueCode` in the signup payload.

8. **Signup uses `src/auth/index.js`'s `signup()` function directly** — this function calls `/User/Signup` without an auth header (public endpoint). In V2, call via `apiClient.post('/User/Signup', payload)` **without** auth injection, OR verify whether the endpoint requires a token (admin-only signup requires auth). Check the backend — if it requires auth, use `apiClient` normally.

9. **`ROLES_CREATE_RESET` constant** — after creating a new role in the popup, reset the mutation state. In V2 with TanStack Query, the mutation `isSuccess` resets automatically after `mutationFn` resolves. No manual reset needed.

10. **Row ID compound key in UserRoles** — the legacy grid builds row IDs as `"${userSystemId}-${generateRandom()}"` to force unique keys. In V2, use `userSystemId` directly as the row key (it is already unique). Avoid the random suffix.
