# V2-Octopi — AI Developer Guide

> **Purpose:** Single comprehensive reference for any AI agent or developer to continue building modules and reports in the `v2-octopi` project. Follow every pattern, convention, and structure exactly as documented here to produce error-free, consistent code.

---

## TABLE OF CONTENTS

1. [Project Overview & Tech Stack](#1-project-overview--tech-stack)
2. [Folder Structure](#2-folder-structure)
3. [Architecture Patterns](#3-architecture-patterns)
4. [API Client & Base URL](#4-api-client--base-url)
5. [Authentication System](#5-authentication-system)
6. [Type System — Complete Reference](#6-type-system--complete-reference)
7. [Centralized Dropdown System (22 Types)](#7-centralized-dropdown-system-22-types)
8. [TanStack Query Hooks — Patterns](#8-tanstack-query-hooks--patterns)
9. [Zod Schemas & Form Validation](#9-zod-schemas--form-validation)
10. [Page Patterns — CRUD Module](#10-page-patterns--crud-module)
11. [Page Patterns — Report Module](#11-page-patterns--report-module)
12. [Page Patterns — Admin Module](#12-page-patterns--admin-module)
13. [Excel Export Utility](#13-excel-export-utility)
14. [Router & Navigation](#14-router--navigation)
15. [Layout & Sidebar System](#15-layout--sidebar-system)
16. [Styling Conventions](#16-styling-conventions)
17. [State Management (Zustand)](#17-state-management-zustand)
18. [Completed Modules Reference](#18-completed-modules-reference)
19. [Step-by-Step Checklist: Adding a New CRUD Module](#19-step-by-step-checklist-adding-a-new-crud-module)
20. [Step-by-Step Checklist: Adding a New Report](#20-step-by-step-checklist-adding-a-new-report)
21. [Key Gotchas & Lessons Learned](#21-key-gotchas--lessons-learned)
22. [Legacy Route Mapping — Remaining Modules](#22-legacy-route-mapping--remaining-modules)
23. [Full Source Reference — Completed Files](#23-full-source-reference--completed-files)

---

## 1. Project Overview & Tech Stack

| Item | Value |
|---|---|
| Location | `v2-octopi/` inside monorepo root `octopi-master/` |
| Legacy project | `src/` in same monorepo root (React JS, no TypeScript) |
| Framework | **React 19** + **TypeScript** (strict mode) |
| Build tool | **Vite 7** (`npm run dev` → port 3001) |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite` plugin) |
| Color palette | **gray-\* only** — NO `slate`, `blue`, `indigo` (they have blue tints) |
| Server state | **TanStack Query v5** (`@tanstack/react-query`) |
| Client/UI state | **Zustand 5** |
| Forms | **React Hook Form v7** + **Zod v4** (`@hookform/resolvers/zod`) |
| Routing | **React Router DOM v7** |
| Icons | **Lucide React** |
| Excel export | **ExcelJS** (reusable util at `utils/exportExcel.ts`) |
| API base URL | `https://api-v2.algologix.com.bd/api` (via `VITE_API_BASE_URL`) |
| Auth | JWT from legacy `localStorage.userInfo`; bridge in `auth/authBridge.ts` |
| Path alias | `@/` → `./src/` (configured in tsconfig + vite.config) |
| Module system | `"type": "module"` in package.json, ESM throughout |
| TypeScript | Strict mode, `verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters` |

### Dependencies (exact versions in package.json)

```
@hookform/resolvers: ^5.2.2    @tanstack/react-query: ^5.90.21
axios: ^1.13.5 (unused—use apiClient instead)
class-variance-authority: ^0.7.1    clsx: ^2.1.1    tailwind-merge: ^3.5.0
exceljs: ^4.4.0    jwt-decode: ^4.0.0    lucide-react: ^0.575.0
react: ^19.2.0    react-dom: ^19.2.0    react-hook-form: ^7.71.2
react-router-dom: ^7.13.1    zod: ^4.3.6    zustand: ^5.0.11
```

---

## 2. Folder Structure

```
v2-octopi/src/
├── App.tsx                          # Root — renders <AppRouter />
├── main.tsx                         # Entry — QueryClientProvider + ReactQueryDevtools
├── index.css                        # Tailwind imports + gray color overrides
│
├── auth/                            # Authentication bridge & route protection
│   ├── authBridge.ts                # getLegacyUserInfo(), getAccessToken(), getUserMenus*()
│   ├── menuMapper.ts                # legacyToV2 route mapping, mapLegacyMenuToAppMenu()
│   └── ProtectedRoute.tsx           # Redirects to /signin if not authenticated
│
├── components/                      # Shared reusable UI components
│   ├── ErrorBoundary.tsx            # React error boundary with retry
│   └── dropdowns/                   # Centralized dropdown system (all 22 types)
│       ├── index.ts                 # Barrel export
│       ├── DropdownSelect.tsx       # Native <select> for Load All types (≤100 records)
│       └── PaginatedCombobox.tsx    # Searchable combobox with infinite scroll (large datasets)
│
├── config/
│   ├── env.ts                       # env.apiBaseUrl, env.mode
│   └── pagination.ts                # Central paginated endpoint registry (lists + dropdowns)
│
├── hooks/                           # TanStack Query hooks — ONE FILE PER DOMAIN
│   ├── useCustomers.ts              # Customer CRUD + paginated list + related dropdowns
│   ├── useDebounce.ts               # Generic debounce hook (300ms default)
│   ├── useDropdown.ts               # Load All dropdown hook (17 types) + employee by channel
│   ├── useCheques.ts                # Cheque paginated list hook
│   ├── useEmployees.ts              # Employee paginated list hook
│   ├── useSuppliers.ts              # Supplier CRUD + paginated list hook
│   ├── useMappingReport.ts          # Mapping report query
│   ├── usePaginatedDropdown.ts      # Infinite scroll dropdown hook (5 paginated types)
│   ├── usePaginatedList.ts          # Shared infinite-query pagination helper
│   ├── useProducts.ts               # Product CRUD + paginated list + lookup queries
│   ├── useRoleAndMenu.ts            # Role CRUD + detail + permission update
│   └── useSalesReport.ts            # Sales report query
│
├── layout/                          # App shell components
│   ├── AppShell.tsx                 # <Header> + <Sidebar> + <Outlet>
│   ├── Header.tsx                   # Top navbar with search, notifications, profile, logout
│   └── Sidebar.tsx                  # Collapsible sidebar with static + dynamic menu items
│
├── lib/                             # Core libraries
│   ├── api.ts                       # apiClient.get/post/put/delete with JWT auto-injection
│   ├── queryClient.ts               # QueryClient with default options
│   └── utils.ts                     # cn(), formatDate(), formatCurrency(), formatNumber()
│
├── pages/                           # Page-level components (grouped by domain)
│   ├── DashboardPage.tsx
│   ├── SigninPage.tsx
│   ├── customers/                   # ✅ COMPLETED MODULE
│   │   ├── CustomerListPage.tsx     # Paginated list + search + infinite scroll
│   │   ├── AddCustomerPage.tsx      # Create form with server error handling
│   │   ├── EditCustomerPage.tsx     # Edit form with pre-loaded data
│   │   └── CustomerForm.tsx         # Shared form (used by Add + Edit) with 4 fieldsets
│   ├── products/                    # ✅ COMPLETED MODULE
│   │   ├── ProductListPage.tsx      # Paginated list + search + infinite scroll
│   │   ├── AddProductPage.tsx       # Create form
│   │   ├── EditProductPage.tsx      # Edit form with pre-loaded data
│   │   └── ProductForm.tsx          # Shared form for add/edit product flows
│   ├── suppliers/                   # ✅ COMPLETED MODULE
│   │   ├── SupplierListPage.tsx     # Paginated list + search + infinite scroll
│   │   ├── AddSupplierPage.tsx      # Create form with server error handling
│   │   ├── EditSupplierPage.tsx     # Edit form with delete action
│   │   └── SupplierForm.tsx         # Shared supplier form for add/edit flows
│   ├── cheques/                     # ✅ COMPLETED MODULE
│   │   ├── AddChequePage.tsx        # Create cheque page
│   │   ├── ChequeForm.tsx           # Shared cheque form for add/edit flows
│   │   ├── ChequeListPage.tsx       # Paginated cheque list migrated from legacy /cheque/list
│   │   ├── ChequeStatusForm.tsx     # Status-only update form
│   │   ├── EditChequePage.tsx       # Full cheque edit page
│   │   ├── EditChequeStatusPage.tsx # Status update page
│   │   └── chequePageUtils.ts       # Audit/user payload helpers
│   ├── reports/                     # ✅ COMPLETED (Mapping + Sales)
│   │   ├── MappingReportPage.tsx    # Date/customer/product filters, search, Excel export
│   │   ├── SalesReportPage.tsx      # Date/customer filters, search, Excel export
│   │   └── DeliveryReportPage.tsx   # "Coming Soon" placeholder
│   └── admin/                       # ✅ COMPLETED
│       └── ManageRoleAndMenuPage.tsx # 3-panel role/menu manager with modals
│
├── router/
│   └── AppRouter.tsx                # BrowserRouter + routes + legacy redirects
│
├── schemas/                         # Zod validation schemas
│   ├── customerSchema.ts            # Customer form validation + dropdown option constants
│   ├── dropdown.ts                  # requiredDropdownId, optionalDropdownId validators
│   └── roleSchema.ts               # Role creation validation
│
├── stores/                          # Zustand state management
│   └── uiStore.ts                   # sidebarOpen, sidebarCollapsed, activeTab (persisted)
│
├── types/                           # TypeScript interfaces — ONE FILE PER DOMAIN
│   ├── auth.ts                      # LegacyUserInfo, LegacyMenuItem, AppMenuItem
│   ├── cheque.ts                    # Cheque list row shape for paginated cheque module
│   ├── customer.ts                  # Customer, CreateCustomerPayload, UpdateCustomerPayload
│   ├── dropdown.ts                  # DROPDOWN_TYPES, DROPDOWN_REGISTRY, isPaginated()
│   ├── employee.ts                  # Employee list row shape for paginated employee module
│   ├── mappingReport.ts             # MappingReportItem, MappingReportFilters
│   ├── product.ts                   # Product, payloads, lookup option types
│   ├── roleAndMenu.ts              # Role, MenuItem, RoleDetails, payloads
│   ├── supplier.ts                  # Supplier, create/update payloads
│   └── salesReport.ts              # SalesReportItem, SalesReportFilters
│
└── utils/
    └── exportExcel.ts               # Global reusable Excel export for ALL reports
```

---

## 3. Architecture Patterns

### Data Flow

```
API Response → apiClient (JWT injected) → TanStack Query Hook → Page Component → UI
```

### File Organization Rule
- **ONE file per domain** in `types/`, `hooks/`, `schemas/`
- Page files grouped under `pages/{domain}/`
- Every entity needs: `types/*.ts` → `hooks/use*.ts` → `pages/…/*.tsx`
- For CRUD modules also add: `schemas/*Schema.ts`

### Naming Conventions
| Item | Pattern | Example |
|---|---|---|
| Type file | `types/{entity}.ts` | `types/customer.ts` |
| Hook file | `hooks/use{Entity}.ts` | `hooks/useCustomers.ts` |
| Schema file | `schemas/{entity}Schema.ts` | `schemas/customerSchema.ts` |
| List page | `pages/{domain}/{Entity}ListPage.tsx` | `pages/customers/CustomerListPage.tsx` |
| Add page | `pages/{domain}/Add{Entity}Page.tsx` | `pages/customers/AddCustomerPage.tsx` |
| Edit page | `pages/{domain}/Edit{Entity}Page.tsx` | `pages/customers/EditCustomerPage.tsx` |
| Form component | `pages/{domain}/{Entity}Form.tsx` | `pages/customers/CustomerForm.tsx` |
| Report page | `pages/reports/{Name}ReportPage.tsx` | `pages/reports/SalesReportPage.tsx` |
| Admin page | `pages/admin/{Name}Page.tsx` | `pages/admin/ManageRoleAndMenuPage.tsx` |

### Import Style
```typescript
// Always use the @/ alias — NEVER relative paths like ../../
import { apiClient } from '@/lib/api'
import type { Customer } from '@/types/customer'
import { useCustomers } from '@/hooks/useCustomers'
```

### Export Style
```typescript
// Named exports only — NO default exports (except App.tsx)
export function CustomerListPage() { ... }
export function useCustomers() { ... }
export interface Customer { ... }
```

---

## 4. API Client & Base URL

### `lib/api.ts` — The ONLY way to make API calls

```typescript
import { getAccessToken } from '@/auth/authBridge'
import { env } from '@/config/env'

class ApiError extends Error {
  status: number
  statusText: string
  body: unknown
  constructor(status: number, statusText: string, body: unknown) {
    super(`API ${status}: ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.body = body
  }
}

function authHeaders(): HeadersInit {
  const token = getAccessToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, response.statusText, body)
  }
  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(url: string) =>
    fetch(`${env.apiBaseUrl}${url}`, { headers: authHeaders() }).then(handleResponse<T>),
  post: <T>(url: string, data: unknown) =>
    fetch(`${env.apiBaseUrl}${url}`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse<T>),
  put: <T>(url: string, data: unknown) =>
    fetch(`${env.apiBaseUrl}${url}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse<T>),
  delete: <T>(url: string) =>
    fetch(`${env.apiBaseUrl}${url}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse<T>),
}
```

### API Response Wrappers — Used by ALL endpoints

```typescript
// Standard wrapper returned by most API endpoints:
interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}

// In hooks, always unwrap: .then((r) => r.dataObj)
```

### `config/env.ts`

```typescript
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api-v2.algologix.com.bd/api',
  mode: import.meta.env.VITE_ENV || import.meta.env.MODE,
}
```

### Vite Proxy (dev only)

```typescript
// vite.config.ts — proxy /api to backend
server: {
  port: 3001,
  strictPort: true,
  proxy: {
    '/api': {
      target: 'https://api-v2.algologix.com.bd',
      changeOrigin: true,
      secure: true,
    },
  },
},
```

---

## 5. Authentication System

### How It Works
1. User logs in via the legacy v1 app (or `SigninPage.tsx`)
2. Legacy app stores `userInfo` JSON in `localStorage` with `{ token, menuToken, menuInPlainListToken }`
3. The `authBridge.ts` reads this and extracts the JWT
4. `apiClient` auto-attaches `Authorization: Bearer {token}` to every request
5. `ProtectedRoute` checks `isAuthenticated()` and redirects to `/signin` if not

### `auth/authBridge.ts`

```typescript
import { jwtDecode } from 'jwt-decode'
import type { LegacyMenuItem, LegacyUserInfo } from '@/types/auth'

const USER_INFO_KEY = 'userInfo'

export function getLegacyUserInfo(): LegacyUserInfo | null {
  const raw = localStorage.getItem(USER_INFO_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as LegacyUserInfo } catch { return null }
}

export function getAccessToken(): string | null {
  return getLegacyUserInfo()?.token ?? null
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken())
}

export function getUserMenusFromMenuToken(): LegacyMenuItem[] {
  const menuToken = getLegacyUserInfo()?.menuToken
  if (!menuToken) return []
  try {
    const decoded = jwtDecode<{ UserMenus?: string }>(menuToken)
    return decoded.UserMenus ? (JSON.parse(decoded.UserMenus) as LegacyMenuItem[]) : []
  } catch { return [] }
}

export function logoutFromBridge() {
  localStorage.removeItem(USER_INFO_KEY)
}
```

### Menu Mapper — `auth/menuMapper.ts`

When adding new modules, add their legacy→v2 route mapping here:

```typescript
const legacyToV2: Record<string, string> = {
  '/dashboard': '/dashboard',
  '/customers': '/customers',
  '/addcustomer': '/customers/add',
  '/report/sales': '/reports/sales',
  '/report/delivery-conveyance': '/reports/delivery',
  '/report/mapped': '/reports/mapping',
  '/manageroleandmenu': '/admin/roles',
  // ADD NEW MAPPINGS HERE when implementing modules ↓
}
```

---

## 6. Type System — Complete Reference

### Pattern: Every API entity gets its own type file

```
types/
├── auth.ts           # Auth types (shared by auth/ layer)
├── customer.ts       # Customer entity + payloads
├── dropdown.ts       # DROPDOWN_REGISTRY (shared by all modules)
├── mappingReport.ts  # Mapping report entity
├── roleAndMenu.ts    # Role & menu management entity
└── salesReport.ts    # Sales report entity
```

### Standard API Response Wrapper (reuse in every types file)

```typescript
export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}
```

### Creating a New Type File — Template

```typescript
/* ─── {Entity Name} types ─── */

/** Shape returned by GET /Entity/GetAll */
export interface EntityItem {
  entityId: number
  entityName: string
  // ... all fields from the API response
}

/** Payload for POST /Entity/Create */
export interface CreateEntityPayload {
  entityName: string
  // ... required fields only
}

/** Payload for PUT /Entity/Update */
export interface UpdateEntityPayload extends CreateEntityPayload {
  entityId: number
}

/** API wrapper */
export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}
```

### Example — Customer Types (COMPLETED)

```typescript
export interface Customer {
  customerId: number
  customerName: string
  customerAddress: string | null
  locationId: number | null
  contactPersonName: string | null
  contactNumber: string | null
  designationId: number | null
  designation: string | null
  channelId: number | null
  channelName: string | null
  employeeId: number | null
  empFirstName: string | null
  empLastName: string | null
  employeeCode: string | null
  customerLat: number | null
  customerLong: number | null
  paymentInterval: string | null
  paymentCycleType: string | null
  paymentCycleValue: number | null
  paymentMode: string | null
  currentStatus: string | null
  specialNote: string | null
  linkCustomerId: number | null
  linkCustomerName: string | null
}

export interface CreateCustomerPayload {
  customerName: string
  customerAddress: string
  locationId: number | null
  contactPersonName: string | null
  contactNumber: string | null
  designationId: number | null
  channelId: number | null
  employeeId: number | null
  customerLat: number | null
  customerLong: number | null
  paymentInterval: string
  paymentCycleType: string
  paymentCycleValue: number | null
  paymentMode: string
  currentStatus: string
  linkCustomerId: number | null
  specialNote: string
}

export interface UpdateCustomerPayload extends CreateCustomerPayload {
  customerId: number
}
```

### Example — Report Types (COMPLETED)

```typescript
// Sales Report
export interface SalesReportItem {
  soSystemId: number | null
  soSystemNo: string | null
  invoiceDate: string | null
  entityName: string | null
  entityAddress: string | null
  sobFinalBill: number | null
  jobType: string | null
  lifecycleName: string | null
  soOrderFrom: string | null
  orderStatus: string | null
  atEscalation: string | null
  atInvoicing: string | null
  atPacking: string | null
  atAssign: string | null
  atDelivery: string | null
  delivered: string | null
  deliveredBy: string | null
  actionTakenRemarks: string | null
  soCustomerReferance: string | null
}

export interface SalesReportFilters {
  startDate: string    // YYYY-MM-DD format
  endDate: string      // YYYY-MM-DD format
  partnerId: number    // 0 = all
}
```

---

## 7. Centralized Dropdown System (22 Types)

### Registry — `types/dropdown.ts` (Single Source of Truth)

All dropdowns in the entire app use this registry. There are exactly **22 types**:

| Strategy | Types | Record Count |
|---|---|---|
| **Paginated** (infinite scroll) | `customer`, `product`, `location`, `employee`, `supplier` | large or growing datasets |
| **Load All** (single fetch, cached) | `taskMovementTransport`, `employeebychannel`, `productFunction`, `bank`, `jobType`, `designation`, `taskChecklist`, `productCategory`, `productGroup`, `paymentMode`, `department`, `vehicle`, `channel`, `chequeStatus`, `packType`, `employeeType`, `lcPaymentTerms`, `productCountry` | ≤100 each |

### API Endpoint (same for all)

```
GET /KeyValue/GetDropdown?type={type}
GET /KeyValue/GetDropdown?type={type}&pageNumber={n}&pageSize={s}&searchTerm={q}  (paginated)
GET /KeyValue/GetDropdown?type=employeebychannel&channelId={id}  (special case)
```

### Central Pagination Registry

All paginated endpoints must be registered in `src/config/pagination.ts`.

- `PAGINATED_LIST_ENDPOINTS` is for full list pages and report grids
- `PAGINATED_DROPDOWN_ENDPOINTS` is for searchable dropdowns and comboboxes

Current list endpoint registry:

```typescript
customer:   /Customer/GetAllCustomerListPagination
employee:   /Employee/GetEmployeeListPagination
product:    /Product/GetProductListPagination
supplier:   /Supplier/GetSupplierListPagination
chequeInfo: /CustomerPayment/GetChequeInfoGridPagination
```

When a backend paginated endpoint changes, update the registry first instead of duplicating `useInfiniteQuery` logic in a new hook.

### Response Shape

```typescript
// Load All returns:
{ statusCode: 200, message: "...", dataObj: [{ key: 1, value: "Name" }, ...] }

// Paginated returns:
{ statusCode: 200, message: "...", dataObj: {
  data: [{ key: 1, value: "Name" }, ...],
  totalRecords: 855, pageNumber: 1, pageSize: 50, totalPages: 18
}}
```

### Using Dropdowns in Pages — Two Components

```tsx
// For Load All types (≤100 records) — native <select>
import { DropdownSelect } from '@/components/dropdowns'
<DropdownSelect type="department" value={deptId} onValueChange={setDeptId} />
<DropdownSelect type="channel" value={channelId} onValueChange={setChannelId} />

// For Paginated types (large datasets) — searchable combobox with infinite scroll
import { PaginatedCombobox } from '@/components/dropdowns'
<PaginatedCombobox type="customer" value={customerId} onValueChange={setCustomerId} />
<PaginatedCombobox type="product" value={productId} onValueChange={setProductId} />
<PaginatedCombobox type="location" value={locationId} onValueChange={setLocationId} />
<PaginatedCombobox type="employee" value={employeeId} onValueChange={setEmployeeId} />
<PaginatedCombobox type="supplier" value={supplierId} onValueChange={setSupplierId} />
```

### Using Dropdowns with React Hook Form

```tsx
import { Controller } from 'react-hook-form'
import { DropdownSelect, PaginatedCombobox } from '@/components/dropdowns'

// Load All + RHF
<Controller
  name="departmentId"
  control={form.control}
  render={({ field, fieldState }) => (
    <DropdownSelect
      type="department"
      value={field.value}
      onValueChange={field.onChange}
      hasError={!!fieldState.error}
    />
  )}
/>

// Paginated + RHF
<Controller
  name="customerId"
  control={form.control}
  render={({ field, fieldState }) => (
    <PaginatedCombobox
      type="customer"
      value={field.value}
      onValueChange={field.onChange}
      hasError={!!fieldState.error}
    />
  )}
/>
```

### Dropdown Hooks (used internally by components)

```typescript
// Load All — hooks/useDropdown.ts
const { data: options } = useDropdown('department')       // returns DropdownOption[]
const { data: employees } = useEmployeeByChannelDropdown(channelId)  // special parameterized

// Paginated — hooks/usePaginatedDropdown.ts
const { data, fetchNextPage, hasNextPage } = usePaginatedDropdown('customer', searchTerm, 50)
```

---

## 8. TanStack Query Hooks — Patterns

### Query Keys Convention

```typescript
export const entityKeys = {
  all: ['entity'] as const,
  list: () => [...entityKeys.all, 'list'] as const,
  detail: (id: number) => [...entityKeys.all, 'detail', id] as const,
}
```

### Hook Pattern — List Query

```typescript
export function useEntities() {
  return useQuery({
    queryKey: entityKeys.list(),
    queryFn: () =>
      apiClient.get<ApiResponse<Entity[]>>('/Entity/GetAll').then((r) => r.dataObj),
  })
}
```

### Hook Pattern — Detail Query (enabled only when ID exists)

```typescript
export function useEntityDetail(id: number | undefined) {
  return useQuery({
    queryKey: entityKeys.detail(id!),
    queryFn: () =>
      apiClient.get<ApiResponse<Entity>>(`/Entity/GetById/${id}`).then((r) => r.dataObj),
    enabled: !!id,
  })
}
```

### Hook Pattern — Create Mutation

```typescript
export function useCreateEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEntityPayload) =>
      apiClient.post<ApiResponse<Entity>>('/Entity/Create', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entityKeys.list() })
    },
  })
}
```

### Hook Pattern — Update Mutation

```typescript
export function useUpdateEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateEntityPayload) =>
      apiClient.put<ApiResponse<Entity>>('/Entity/Update', data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: entityKeys.list() })
      qc.invalidateQueries({ queryKey: entityKeys.detail(variables.entityId) })
    },
  })
}
```

### Hook Pattern — Paginated List with Infinite Scroll

```typescript
export function usePaginatedEntities(searchTerm = '', pageSize = 50) {
  return useInfiniteQuery({
    queryKey: [...entityKeys.all, 'paginated', searchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        pageNumber: String(pageParam),
        pageSize: String(pageSize),
      })
      if (searchTerm) params.set('searchTerm', searchTerm)
      const res = await apiClient.get<ApiResponse<PaginatedResponse<Entity>>>(
        `/Entity/GetAllPaginated?${params.toString()}`
      )
      const dataObj = res.dataObj
      if (Array.isArray(dataObj)) {
        return { data: dataObj, totalRecords: dataObj.length, pageNumber: 1, pageSize: dataObj.length, totalPages: 1 }
      }
      return { ...dataObj, data: Array.isArray(dataObj.data) ? dataObj.data : [] }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages ? lastPage.pageNumber + 1 : undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
```

### Hook Pattern — Report Query (on-demand, enabled by user action)

```typescript
export function useReportData(filters: ReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['reportName', 'list', filters],
    queryFn: () =>
      apiClient
        .get<ApiResponse<ReportItem[]>>(
          `/Report/GetReport?startDate=${filters.startDate}&endDate=${filters.endDate}&partnerId=${filters.partnerId}`
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
```

### QueryClient Default Options (`lib/queryClient.ts`)

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,          // 1 min before refetch
      gcTime: 10 * 60_000,        // 10 min garbage collection
      refetchOnWindowFocus: false, // don't refetch on tab focus
      retry: 1,                    // retry once on failure
    },
    mutations: { retry: false },
  },
})
```

---

## 9. Zod Schemas & Form Validation

### Pattern — Create a schema file per CRUD module

```typescript
// schemas/entitySchema.ts
import { z } from 'zod'

export const entitySchema = z.object({
  entityName: z.string().min(1, 'Name is required'),
  entityAddress: z.string().min(1, 'Address is required'),
  contactNumber: z.string().refine(
    (v) => !v || /^(01)[3-9]\d{8}$/.test(v),
    'Must be a valid Bangladeshi mobile number',
  ),
  categoryId: z.number().nullable(),       // optional dropdown
  status: z.string(),                       // string select
  numericValue: z.number().nullable(),      // optional numeric
})

export type EntityFormData = z.infer<typeof entitySchema>

// Static dropdown options (for <select> fields that don't come from API)
export const statusOptions = [
  { id: '1', title: 'Active' },
  { id: '2', title: 'Inactive' },
] as const
```

### Dropdown Validation Schemas (`schemas/dropdown.ts`)

```typescript
import { z } from 'zod'

export const requiredDropdownId = z
  .number({ required_error: 'Please select an option' })
  .min(1, 'Please select an option')

export const optionalDropdownId = z.number().nullable()
```

### Form Integration Pattern

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { entitySchema, type EntityFormData } from '@/schemas/entitySchema'

const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<EntityFormData>({
  resolver: zodResolver(entitySchema),
  defaultValues: { entityName: '', categoryId: null, status: '', ... },
})
```

### numericNullable Helper (for select/number inputs)

```typescript
// Use this with register() for fields that should be number | null
const numericNullable = {
  setValueAs: (v: string | number | null | undefined) =>
    v === '' || v === undefined || v === null ? null : Number(v),
}

// Usage:
<select {...register('channelId', numericNullable)} className={inputCls}>
<input type="number" {...register('paymentCycleValue', numericNullable)} />
```

---

## 10. Page Patterns — CRUD Module

### List Page Pattern (with paginated search + infinite scroll)

```tsx
import { useState, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Loader2, AlertCircle } from 'lucide-react'
import { usePaginatedEntities } from '@/hooks/useEntities'
import { useDebounce } from '@/hooks/useDebounce'
import type { Entity } from '@/types/entity'

export function EntityListPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePaginatedEntities(debouncedSearch)

  const entities = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data])
  const totalRecords = data?.pages[0]?.totalRecords ?? 0

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) fetchNextPage()
      })
      if (node) observerRef.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  )

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entities</h1>
          <p className="text-sm text-gray-500 mt-1">{totalRecords} total</p>
        </div>
        <Link to="/entities/add" className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors">
          <Plus size={16} /> Add Entity
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm" />
      </div>

      {/* Table with sentinel on last row for infinite scroll */}
      {/* Loading, Error, Empty states */}
      {/* ... see CustomerListPage.tsx for complete example */}
    </div>
  )
}
```

### Add Page Pattern

```tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCreateEntity } from '@/hooks/useEntities'
import { EntityForm } from './EntityForm'
import type { EntityFormData } from '@/schemas/entitySchema'

export function AddEntityPage() {
  const navigate = useNavigate()
  const createMutation = useCreateEntity()
  const [serverError, setServerError] = useState('')

  const handleSubmit = (data: EntityFormData) => {
    setServerError('')
    createMutation.mutate(
      { /* map form data to CreateEntityPayload */ },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else navigate('/entities')
        },
        onError: (err) => setServerError((err as Error).message || 'Something went wrong'),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/entities" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Entity</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create a new record</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <EntityForm onSubmit={handleSubmit} isSubmitting={createMutation.isPending} submitLabel="Create" serverError={serverError} />
      </div>
    </div>
  )
}
```

### Edit Page Pattern

```tsx
import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useEntityDetail, useUpdateEntity } from '@/hooks/useEntities'
import { EntityForm } from './EntityForm'
import type { EntityFormData } from '@/schemas/entitySchema'

export function EditEntityPage() {
  const { id } = useParams<{ id: string }>()
  const entityId = Number(id)
  const navigate = useNavigate()

  const { data: entity, isLoading, isError, error } = useEntityDetail(entityId || undefined)
  const updateMutation = useUpdateEntity()
  const [serverError, setServerError] = useState('')

  // Map API entity → form defaults
  const formDefaults = useMemo<Partial<EntityFormData> | undefined>(() => {
    if (!entity) return undefined
    return { /* map entity fields to form fields */ }
  }, [entity])

  const handleSubmit = (data: EntityFormData) => {
    setServerError('')
    updateMutation.mutate(
      { entityId, /* ... mapped fields */ },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else navigate('/entities')
        },
        onError: (err) => setServerError((err as Error).message || 'Something went wrong'),
      },
    )
  }

  if (isLoading) return /* Loader2 spinner */
  if (isError) return /* AlertCircle error */

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <EntityForm defaultValues={formDefaults} onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending} submitLabel="Update" serverError={serverError} />
      </div>
    </div>
  )
}
```

### Shared Form Component Pattern

```tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { entitySchema, type EntityFormData, /* option arrays */ } from '@/schemas/entitySchema'

interface EntityFormProps {
  defaultValues?: Partial<EntityFormData>
  onSubmit: (data: EntityFormData) => void
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
}

export function EntityForm({ defaultValues, onSubmit, isSubmitting, submitLabel, serverError }: EntityFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<EntityFormData>({
    resolver: zodResolver(entitySchema),
    defaultValues: { /* all defaults */ ...defaultValues },
  })

  // Re-sync when defaultValues change (edit page loads async)
  useEffect(() => {
    if (defaultValues) reset({ ...defaultValues })
  }, [defaultValues, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
      )}

      {/* Fieldsets with grid layout */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Section Name</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Name *" error={errors.name?.message}>
            <input {...register('name')} className={inputCls} placeholder="Enter name" />
          </Field>
          {/* ... more fields */}
        </div>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

// Shared helpers
const numericNullable = {
  setValueAs: (v: string | number | null | undefined) =>
    v === '' || v === undefined || v === null ? null : Number(v),
}

const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
```

---

## 11. Page Patterns — Report Module

Reports follow a three-phase pattern: **Filters → Load → Display/Export**

### Report Page Structure

```
┌─ Report Title ──────────────────────────────────────────────────┐
│  Description text                                                │
├─ Filters Card ──────────────────────────────────────────────────┤
│  [From Date] [To Date] [Customer▾] [Product▾] [Search…] [Load] │
├─ Summary Bar ───────────────────────────────────────────────────┤
│  Total: 100 │ Filtered: 85 │ Customers: 20 │ Products: 15      │
├─ Data Table ────────────────────────────────────────────────────┤
│  Headers (sticky)                                                │
│  Rows...                                                         │
├─ Footer ────────────────────────────────────────────────────────┤
│  Showing X of Y records · Date range                             │
└─────────────────────────────────────────────────────────────────┘
```

### Key Report Patterns

1. **On-demand loading:** Data is NOT fetched on mount. User clicks "Load Data" button (`enabled` flag)
2. **Date validation:** Validate from/to dates before allowing load
3. **PaginatedCombobox** for customer/product filters
4. **Client-side search** over loaded data (instant filtering)
5. **Summary stats** computed from filtered data
6. **Excel export** using `exportExcel()` utility
7. **Loading bar** animation during fetch
8. **Empty states** — before load and after load with no results

### Report Hook Template

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse, ReportItem, ReportFilters } from '@/types/reportEntity'

export const reportKeys = {
  all: ['reportName'] as const,
  list: (filters: ReportFilters) => [...reportKeys.all, 'list', filters] as const,
}

export function useReport(filters: ReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<ReportItem[]>>(
          `/Report/GetReport?startDate=${filters.startDate}&endDate=${filters.endDate}&partnerId=${filters.partnerId}`
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
```

### Report Excel Column Definitions

```typescript
const EXCEL_COLUMNS = [
  { key: 'soSystemNo', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'amount', header: 'Amount', format: 'number' as const },
  { key: 'quantity', header: 'Quantity', format: 'integer' as const },
  { key: 'createdAt', header: 'Created At', format: 'datetime' as const },
]
```

### Excel Export Call Pattern

```typescript
const handleExport = useCallback(() => {
  if (filteredData.length === 0) return
  exportExcel({
    fileName: `Report_Name_${fromDate}_to_${toDate}`,
    title: 'Report Name',
    subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
    sheetName: 'Report Name',
    columns: EXCEL_COLUMNS,
    data: filteredData as unknown as Record<string, unknown>[],
    filters: [
      ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
      ['Customer', selectedCustomerLabel || 'All'],
    ],
    summaryCards: [
      ['Total Records', reportData.length],
      ['Filtered Records', filteredData.length],
    ],
  })
}, [/* deps */])
```

### Date Helpers (shared by all reports)

```typescript
function todayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function firstDayOfMonth() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), '01'].join('-')
}

function fmtDate(v: string | null) {
  if (!v) return '-'
  const d = new Date(v)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateShort(v: string) {
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function fmtAmount(v: number | null) {
  if (v == null) return '-'
  return v.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
```

---

## 12. Page Patterns — Admin Module

Admin pages (like ManageRoleAndMenuPage) use a **multi-panel layout with modals**:

- Left panel: Entity list (e.g., roles)
- Center panel: Unassigned items
- Right panel: Assigned items  
- Drag/assign between panels
- Modal for creating new entities

---

## 13. Excel Export Utility

### `utils/exportExcel.ts` — Shared by ALL Reports

```typescript
import ExcelJS from 'exceljs'

export interface ExcelColumn {
  key: string                                          // object key in data row
  header: string                                       // display header
  width?: number                                       // override (auto-sized if omitted)
  format?: 'number' | 'integer' | 'date' | 'datetime' // column format
}

export interface ExportExcelOptions {
  fileName: string                          // without .xlsx
  title: string                             // bold title row 1
  subtitle?: string                         // italic subtitle row 2
  columns: ExcelColumn[]                    // column definitions
  data: Record<string, unknown>[]           // data rows
  filters?: [string, string | number][]     // "Parameters" sheet entries
  summaryCards?: [string, string | number][]// summary stats above table
  numericKeys?: string[]                    // shortcut for number format
  dateKeys?: string[]                       // shortcut for date format
  sheetName?: string                        // default: 'Report'
  creator?: string                          // default: 'Octopi ERP'
}

export async function exportExcel(opts: ExportExcelOptions): Promise<void> { ... }
```

### Features
- Title row (bold, gray-800)
- Subtitle row (italic, gray-500)
- Generated timestamp
- Summary cards row (gray-100 background)
- Header row (gray-200 background, bold, frozen panes)
- Data rows with zebra stripes (white / gray-50)
- Per-column formatting (number, integer, date, datetime)
- Auto-sized columns
- Thin gray-300 borders
- Footer with total record count
- Separate "Parameters" sheet with filter details
- Downloads as `.xlsx` via blob URL

---

## 14. Router & Navigation

### `router/AppRouter.tsx`

```typescript
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

export function AppRouter() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/signin" element={<SigninPage />} />

          <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Reports */}
            <Route path="reports/sales" element={<SalesReportPage />} />
            <Route path="reports/delivery" element={<DeliveryReportPage />} />
            <Route path="reports/mapping" element={<MappingReportPage />} />

            {/* Customers */}
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="customers/add" element={<AddCustomerPage />} />
            <Route path="customers/:id/edit" element={<EditCustomerPage />} />

            {/* Admin */}
            <Route path="admin/roles" element={<ManageRoleAndMenuPage />} />

            {/* Legacy redirects */}
            <Route path="report/mapped" element={<Navigate to="/reports/mapping" replace />} />
            <Route path="report/sales" element={<Navigate to="/reports/sales" replace />} />
            <Route path="addcustomer" element={<Navigate to="/customers/add" replace />} />
            <Route path="manageroleandmenu" element={<Navigate to="/admin/roles" replace />} />

            {/* ADD NEW MODULE ROUTES HERE */}
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
```

### When Adding a New Module

1. Import your pages at the top of `AppRouter.tsx`
2. Add `<Route>` entries inside the `ProtectedRoute` wrapper
3. Add legacy redirects if applicable
4. Update `menuMapper.ts` with legacy→v2 path mappings

### V2 URL Convention

| Module | List | Add | Edit |
|---|---|---|---|
| Customers | `/customers` | `/customers/add` | `/customers/:id/edit` |
| Employees | `/employees` | `/employees/add` | `/employees/:id/edit` |
| Products | `/products` | `/products/add` | `/products/:id/edit` |
| Suppliers | `/suppliers` | `/suppliers/add` | `/suppliers/:id/edit` |
| Reports | `/reports/{name}` | — | — |
| Admin | `/admin/{feature}` | — | — |

---

## 15. Layout & Sidebar System

### AppShell

```
┌─ Header (fixed top, full width) ──────────────────────────────┐
│  Logo · Search · Notifications · Profile · Logout               │
├────────────────────────────────────────────────────────────────┤
│ Sidebar │ <Outlet /> (page content, p-6)                        │
│  (left) │                                                        │
│  264px  │                                                        │
│ or 64px │                                                        │
│(collapsed│                                                       │
└─────────┴──────────────────────────────────────────────────────┘
```

### Sidebar — Static + Dynamic Menus

The sidebar has two sources of menu items:
1. **Static navigation** (hardcoded in Sidebar.tsx): Dashboard, Customers, Reports, Admin
2. **Dynamic menus** from API/JWT token: loaded in AppShell.tsx, mapped via menuMapper.ts

---

## 16. Styling Conventions

### Color Palette — GRAY ONLY

```
text-gray-900  → Primary text (headings, important content)
text-gray-800  → Bold/emphasis
text-gray-700  → Standard text
text-gray-600  → Secondary text
text-gray-500  → Muted text, labels
text-gray-400  → Placeholder text, icons
text-gray-300  → Borders (lighter)

bg-gray-50     → Zebra stripe, subtle backgrounds
bg-gray-100    → Summary cards, secondary backgrounds
bg-gray-200    → Table headers
bg-white       → Cards, form inputs
bg-gray-800    → Primary buttons
bg-gray-700    → Button hover

border-gray-100 → Dividers
border-gray-200 → Card borders, table borders
border-gray-300 → Input borders
```

### **NEVER use:** `slate-*`, `blue-*`, `indigo-*`, `purple-*` (they have blue tints)
### **Exception:** Status badges & error states may use `emerald-*`, `red-*`, `amber-*`

### Shared Input CSS Class

```typescript
const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'
```

### Button Styles

```tsx
// Primary button (gray-800)
className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

// Secondary/outline button
className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"

// Back link/button
className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
```

### Card Container

```tsx
<div className="rounded-xl border border-gray-200 bg-white shadow-sm">
  {/* content */}
</div>
```

### Table Styles

```tsx
// Table container
<div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">

// Table header
<thead>
  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
    <th className="px-5 py-3">Header</th>

// Table body
<tbody className="divide-y divide-gray-50">
  <tr className="hover:bg-gray-50/50 transition-colors">
    <td className="px-5 py-3 text-gray-700">Data</td>
```

### `cn()` Utility

```typescript
import { cn } from '@/lib/utils'
// Merges Tailwind classes intelligently
<div className={cn('base-classes', condition && 'conditional-classes', className)} />
```

---

## 17. State Management (Zustand)

### UI Store — `stores/uiStore.ts`

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  activeTab: string
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapse: () => void
  setActiveTab: (tab: string) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        sidebarCollapsed: false,
        activeTab: 'dashboard',
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleSidebarCollapse: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
        setActiveTab: (tab) => set({ activeTab: tab }),
      }),
      { name: 'ui-storage' },
    ),
  ),
)
```

### When to Use Zustand vs TanStack Query
- **TanStack Query** → ALL server/API data (queries, mutations, caching)
- **Zustand** → ONLY client-side UI state (sidebar, tabs, modal open/close)

---

## 18. Completed Modules Reference

### Module 1: Customer (CRUD) ✅

| File | Purpose |
|---|---|
| `types/customer.ts` | Customer, CreateCustomerPayload, UpdateCustomerPayload, Channel, Designation, EmployeeByChannel |
| `schemas/customerSchema.ts` | Zod schema + static options (paymentIntervals, paymentCycleTypes, paymentModes, currentStatusOptions) |
| `hooks/useCustomers.ts` | useCustomers, useCustomerDetail, useCreateCustomer, useUpdateCustomer, useChannels, useDesignations, useEmployeesByChannel, usePaginatedCustomers |
| `pages/customers/CustomerListPage.tsx` | Paginated list with search, infinite scroll, status badges |
| `pages/customers/AddCustomerPage.tsx` | Create form with server error handling |
| `pages/customers/EditCustomerPage.tsx` | Edit form with data pre-loading |
| `pages/customers/CustomerForm.tsx` | Shared form (4 fieldsets: Basic Info, Organisation, Payment, Status & Notes) |

**API Endpoints Used:**
- `GET /Customer/GetCustomerDetails` — full list
- `GET /Customer/GetCustomerById/{id}` — single customer
- `GET /Customer/GetAllCustomerListPagination?pageNumber=&pageSize=&searchTerm=` — paginated
- `POST /Customer/AddCustomer` — create
- `PUT /Customer/CustomerUpdate` — update
- `GET /Channel/GetChannels` — channels dropdown
- `GET /Designation/GetDesignation` — designations dropdown
- `GET /KeyValue/GetDropdown?type=employeebychannel&channelId={id}` — employees by channel

### Module 2: Product (CRUD) ✅

| File | Purpose |
|---|---|
| `types/product.ts` | Product, CreateProductPayload, UpdateProductPayload, ProductLookupOption |
| `hooks/useProducts.ts` | useProducts, usePaginatedProducts, detail, create/update/delete, lookup queries |
| `pages/products/ProductListPage.tsx` | Paginated list with debounced search and infinite scroll |
| `pages/products/AddProductPage.tsx` | Create form |
| `pages/products/EditProductPage.tsx` | Edit form with data pre-loading |
| `pages/products/ProductForm.tsx` | Shared product form |

**API Endpoints Used:**
- `GET /Product/GetProducts` — full list
- `GET /Product/GetProductListPagination?pageNumber=&pageSize=&searchTerm=` — paginated
- `GET /Product/GetProductById/{id}` — single product
- `POST /Product/AddProduct` — create
- `PUT /Product/ProductUpdate` — update
- `DELETE /Product/DeleteProduct?id={id}` — delete
- `GET /Product/GetCategory` — category dropdown
- `GET /Product/GetFunction` — function dropdown

### Module 3: Supplier (CRUD) ✅

| File | Purpose |
|---|---|
| `types/supplier.ts` | Supplier, CreateSupplierPayload, UpdateSupplierPayload |
| `schemas/supplierSchema.ts` | Zod schema for supplier form validation |
| `hooks/useSuppliers.ts` | useSuppliers, usePaginatedSuppliers, detail, create/update/delete |
| `pages/suppliers/SupplierListPage.tsx` | Paginated list with debounced search and infinite scroll |
| `pages/suppliers/AddSupplierPage.tsx` | Create form with backend error handling |
| `pages/suppliers/EditSupplierPage.tsx` | Edit form with data pre-loading and delete action |
| `pages/suppliers/SupplierForm.tsx` | Shared supplier form |

**API Endpoints Used:**
- `GET /Supplier/GetSuppliers` — full list
- `GET /Supplier/GetSupplierListPagination?pageNumber=&pageSize=&searchTerm=` — paginated
- `GET /Supplier/GetSupplierById/{id}` — single supplier
- `POST /Supplier/AddSupplier` — create
- `PUT /Supplier/SupplierUpdate` — update
- `DELETE /Supplier/DeleteSupplier?id={id}` — delete
- `GET /Product/GetCountryOrigin` — country dropdown
- `GET /Product/GetBrand` — brand dropdown
- `GET /Product/GetGroup` — group dropdown

### Module 4: Cheque (CRUD + Status) ✅

| File | Purpose |
|---|---|
| `types/cheque.ts` | ChequeInfo, ChequeDetail, ChequePayload, lookup option types |
| `schemas/chequeSchema.ts` | Full cheque form schema + status-only schema |
| `hooks/useCheques.ts` | usePaginatedCheques, detail, create/update, cheque lookups |
| `pages/cheques/ChequeListPage.tsx` | Paginated cheque list with debounced search and row actions |
| `pages/cheques/AddChequePage.tsx` | Create cheque page |
| `pages/cheques/EditChequePage.tsx` | Full cheque edit page |
| `pages/cheques/EditChequeStatusPage.tsx` | Status-only cheque update page |
| `pages/cheques/ChequeForm.tsx` | Shared cheque form |
| `pages/cheques/ChequeStatusForm.tsx` | Status update form with readonly summary |

**API Endpoints Used:**
- `GET /CustomerPayment/GetChequeInfoGridPagination?pageNumber=&pageSize=&searchTerm=` — paginated cheque list
- `GET /CustomerPayment/GetChequeInfoById/{id}` — single cheque detail
- `POST /CustomerPayment/AddChequeInfo` — create
- `PUT /CustomerPayment/UpdateChequeInfo` — update
- `GET /KeyValue/GetChequeStatusKeyValue` — cheque status options
- `GET /KeyValue/GetBankListKeyValue/0` — issuer bank options
- `GET /KeyValue/GetBankListKeyValue/1` — beneficiary bank options
- `GET /KeyValue/GetPaymentMethodKeyValue/1` — cheque type options

### Module 5: Mapping Report ✅

| File | Purpose |
|---|---|
| `types/mappingReport.ts` | MappingReportItem, MappingReportFilters |
| `hooks/useMappingReport.ts` | useMappingReport(filters, enabled) |
| `pages/reports/MappingReportPage.tsx` | Date/customer/product filters, PaginatedCombobox, search, Excel export |

**API Endpoint:** `GET /Report/GetMappedItemReport?startDate=&endDate=&productId=&partnerId=`

### Module 6: Sales Report ✅

| File | Purpose |
|---|---|
| `types/salesReport.ts` | SalesReportItem, SalesReportFilters |
| `hooks/useSalesReport.ts` | useSalesReport(filters, enabled) |
| `pages/reports/SalesReportPage.tsx` | Date/customer filters, PaginatedCombobox, search, Excel export |

**API Endpoint:** `GET /Report/GetSalesInfoReport?startDate=&endDate=&parterId=`
> Note: API parameter is `parterId` (typo in backend, NOT `partnerId`)

### Module 4: Manage Role & Menu ✅

| File | Purpose |
|---|---|
| `types/roleAndMenu.ts` | Role, MenuItem, RoleDetails, CreateRolePayload, UpdateRoleDetailsPayload |
| `schemas/roleSchema.ts` | roleSchema, RoleFormData |
| `hooks/useRoleAndMenu.ts` | useRoles, useRoleDetails, useCreateRole, useUpdateRoleDetails |
| `pages/admin/ManageRoleAndMenuPage.tsx` | 3-panel layout (Roles list · Unassigned menus · Assigned menus) |

**API Endpoints:**
- `GET /Role/GetRoles/1` — all roles
- `GET /Role/GetRoleDetails/{id}` — role detail with menu lists
- `POST /Role/AddRole` — create role
- `PUT /Role/UpdateRoleDetails` — update role permissions

---

## 19. Step-by-Step Checklist: Adding a New CRUD Module

### Example: Adding "Employee" module

- [ ] **1. Types** — Create `types/employee.ts`
  - Define `Employee` interface (match API response shape exactly)
  - Define `CreateEmployeePayload` interface
  - Define `UpdateEmployeePayload extends CreateEmployeePayload` with `employeeId`
  - Include `ApiResponse<T>` wrapper

- [ ] **2. Schema** — Create `schemas/employeeSchema.ts`
  - Define Zod schema with all form fields
  - Export `type EmployeeFormData = z.infer<typeof employeeSchema>`
  - Define any static option arrays (e.g., `employeeTypes`)

- [ ] **3. Hook** — Create `hooks/useEmployees.ts`
  - Define `employeeKeys` (all, list, detail)
  - `useEmployees()` — list query
  - `useEmployeeDetail(id)` — detail query (enabled: !!id)
  - `useCreateEmployee()` — mutation + invalidate list
  - `useUpdateEmployee()` — mutation + invalidate list + detail
  - `usePaginatedEmployees(searchTerm, pageSize)` — infinite query (if list page needs it)

- [ ] **4. Form** — Create `pages/employees/EmployeeForm.tsx`
  - Accept `defaultValues`, `onSubmit`, `isSubmitting`, `submitLabel`, `serverError`
  - Use `useForm<EmployeeFormData>({ resolver: zodResolver(employeeSchema) })`
  - `useEffect` to reset when defaultValues change
  - Organize into `<fieldset>` sections with `<legend>`
  - Use `DropdownSelect` or `PaginatedCombobox` for dropdown fields
  - Use `numericNullable` setValueAs for numeric/optional fields

- [ ] **5. List Page** — Create `pages/employees/EmployeeListPage.tsx`
  - Search with `useDebounce`
  - Infinite scroll with `usePaginatedEmployees` + `IntersectionObserver`
  - Table with `<Link to="/employees/:id/edit">` edit button
  - Loading, error, empty states

- [ ] **6. Add Page** — Create `pages/employees/AddEmployeePage.tsx`
  - `useCreateEmployee()` mutation
  - Map `EmployeeFormData` → `CreateEmployeePayload`
  - Navigate to `/employees` on success

- [ ] **7. Edit Page** — Create `pages/employees/EditEmployeePage.tsx`
  - `useParams()` to get ID
  - `useEmployeeDetail(id)` for data
  - `useUpdateEmployee()` mutation
  - Map entity → form defaults in `useMemo`
  - Map `EmployeeFormData` → `UpdateEmployeePayload`

- [ ] **8. Router** — Update `router/AppRouter.tsx`
  ```tsx
  import { EmployeeListPage } from '@/pages/employees/EmployeeListPage'
  import { AddEmployeePage } from '@/pages/employees/AddEmployeePage'
  import { EditEmployeePage } from '@/pages/employees/EditEmployeePage'

  <Route path="employees" element={<EmployeeListPage />} />
  <Route path="employees/add" element={<AddEmployeePage />} />
  <Route path="employees/:id/edit" element={<EditEmployeePage />} />

  {/* Legacy redirect */}
  <Route path="inhouseemployees" element={<Navigate to="/employees" replace />} />
  <Route path="addemployee" element={<Navigate to="/employees/add" replace />} />
  ```

- [ ] **9. Menu Mapper** — Update `auth/menuMapper.ts`
  ```typescript
  '/inhouseemployees': '/employees',
  '/addemployee': '/employees/add',
  ```

- [ ] **10. Verify** — `npm run build` must pass with zero errors

---

## 20. Step-by-Step Checklist: Adding a New Report

### Example: Adding "Payment Report"

- [ ] **1. Types** — Create `types/paymentReport.ts`
  - Define `PaymentReportItem` (match API field names exactly)
  - Define `PaymentReportFilters` (startDate, endDate, + any filter IDs)
  - Include `ApiResponse<T>` wrapper

- [ ] **2. Hook** — Create `hooks/usePaymentReport.ts`
  - Define query keys
  - `usePaymentReport(filters, enabled)` — enabled=false until user clicks Load
  - `.then((r) => r.dataObj ?? [])` — always return array

- [ ] **3. Page** — Create `pages/reports/PaymentReportPage.tsx`
  - Date filters with validation
  - Customer/product dropdowns (PaginatedCombobox)
  - Search input for client-side filtering
  - "Load Data" button → sets `loadRequested = true`
  - Summary stats bar
  - Data table with sticky headers
  - Excel export button using `exportExcel()`
  - Define `EXCEL_COLUMNS` array
  - All states: loading bar, error, empty (before/after load), data

- [ ] **4. Router** — Update AppRouter.tsx
  ```tsx
  import { PaymentReportPage } from '@/pages/reports/PaymentReportPage'
  <Route path="reports/payment" element={<PaymentReportPage />} />
  <Route path="report/payment" element={<Navigate to="/reports/payment" replace />} />
  ```

- [ ] **5. Menu Mapper** — Update menuMapper.ts
  ```typescript
  '/report/payment': '/reports/payment',
  ```

- [ ] **6. Verify** — `npm run build` passes

---

## 21. Key Gotchas & Lessons Learned

### CRITICAL — Must Follow

1. **API response wrapper:** ALWAYS unwrap with `.then((r) => r.dataObj)` — the raw response is `{ dataObj: T, errMsg?, title? }`, NOT `T` directly.

2. **Paginated API returns can be flat arrays:** Some endpoints return `DropdownOption[]` instead of `PaginatedResponse<DropdownOption>`. The `normalizeToPaginated()` function handles this. Always handle both cases.

3. **TypeScript strict mode:** No `any`, no unused vars, no unused params. If you don't use a param, prefix with `_` (e.g., `_res`).

4. **Zod v4 imports:** `import { z } from 'zod'` — NOT `zod/v4` or anything else.

5. **Tailwind v4:** No `tailwind.config.js` is needed for Tailwind v4 (it uses CSS-first configuration). Custom colors are in `index.css`.

6. **verbatimModuleSyntax:** When importing types, use `import type { ... }` syntax.

7. **File naming:** Pages use PascalCase (`CustomerListPage.tsx`). Types use camelCase (`customer.ts`). Hooks use camelCase with `use` prefix (`useCustomers.ts`).

8. **No default exports:** Always use named exports. The only exception is `App.tsx`.

9. **`erasableSyntaxOnly: true`:** No `enum` keyword allowed. Use `as const` objects instead.

10. **Gray-only palette:** Do NOT use blue, slate, indigo, or any blue-tinted colors. Only `gray-*` for the main UI. Use semantic colors (red, emerald, amber) only for status/errors.

11. **API parameter typos:** Some backend endpoints have typos (e.g., `parterId` instead of `partnerId`). Match the backend EXACTLY.

12. **Form → Payload mapping:** Form data shape often differs from API payload shape. Map explicitly in the mutate call, never pass form data directly to API.

13. **employeeId === 0 means null:** The API sometimes returns `0` instead of `null` for unset IDs. Handle this: `employeeId: entity.employeeId === 0 ? null : entity.employeeId`

14. **Dropdown option format:** API dropdowns return `{ key: number, value: string }`. Customer form dropdowns may use different shapes (`channelId/channelName`, `designationId/designation1`). Map accordingly.

15. **Report dates:** Use `YYYY-MM-DD` format for API. Display in `DD/Mon/YYYY` (en-GB) format.

---

## 22. Legacy Route Mapping — Remaining Modules

Below are the major remaining modules that need to be ported from v1 (`src/`) to v2 (`v2-octopi/src/`):

### High Priority CRUD Modules

| V1 Path | V2 Path (proposed) | Description |
|---|---|---|
| `/inhouseemployees` | `/employees` | Employee list |
| `/addemployee` | `/employees/add` | Add employee |
| `/employee/:id/edit` | `/employees/:id/edit` | Edit employee |
| `/products` | `/products` | Product list |
| `/addproduct` | `/products/add` | Add product |
| `/product/:id/edit` | `/products/:id/edit` | Edit product |
| `/suppliers` | `/suppliers` | Supplier list |
| `/suppliers/add` | `/suppliers/add` | Add supplier |
| `/supplier/:id/edit` | `/suppliers/:id/edit` | Edit supplier |
| `/price` | `/pricing/sell` | Sell prices |
| `/addsellprice` | `/pricing/sell/add` | Add sell price |
| `/price/:id/edit` | `/pricing/sell/:id/edit` | Edit sell price |
| `/purchaseprices` | `/pricing/purchase` | Purchase prices |

### Sales Orders & Operations

| V1 Path | V2 Path (proposed) | Description |
|---|---|---|
| `/salesorderinternal` | `/sales-orders` | Sales order list |
| `/salesorderinternal/create` | `/sales-orders/create` | Create sales order |
| `/salesorderinternal/:id/edit` | `/sales-orders/:id/edit` | Edit sales order |
| `/salesorderinternal/:id/action` | `/sales-orders/:id/escalate` | Escalate |
| `/salesorderinternal/escalationlist` | `/sales-orders/escalations` | Escalation list |
| `/salesorderinternal/:id/package` | `/sales-orders/:id/package` | Package |
| `/salesorderinternal/packagelist` | `/sales-orders/packages` | Package list |

### Stock Management

| V1 Path | V2 Path (proposed) |
|---|---|
| `/stockin/list` | `/stock-in` |
| `/stockin/create` | `/stock-in/create` |
| `/stockin/:id/edit` | `/stock-in/:id/edit` |

### Payments & Cheques

| V1 Path | V2 Path (proposed) |
|---|---|
| `/payment/list` | `/payments` |
| `/payment/create` | `/payments/create` |
| `/cheque/list` | `/cheques` |
| `/cheque/create` | `/cheques/create` |

### Reports (Remaining)

| V1 Path | V2 Path (proposed) | Description |
|---|---|---|
| `/report/delivery-conveyance` | `/reports/delivery` | Delivery report (stub exists) |
| `/report/payment` | `/reports/payment` | Payment report |
| `/report/currentstock` | `/reports/current-stock` | Current stock |
| `/report/employee-task` | `/reports/employee-task` | Employee task |
| `/report/productout` | `/reports/product-out` | Product stock out |
| `/report/productin` | `/reports/product-in` | Product stock in |
| `/report/pending-and-cancel-report` | `/reports/pending-cancel` | Pending/cancelled |
| `/report/daily-invoice-tracking` | `/reports/daily-tracking` | Daily tracking |
| `/report/customercreditreport` | `/reports/customer-credit` | Customer credit |
| `/report/salesnpayment` | `/reports/sales-payment` | Sales & payment |
| `/report/stockinbatchreport` | `/reports/stock-in-batch` | Stock in batches |
| `/report/stockoutbatchreport` | `/reports/stock-out-batch` | Stock out batches |
| `/report/purchasepricehistory` | `/reports/purchase-price-history` | Purchase price history |
| `/report/dashboardlive` | `/reports/live-dashboard` | Live dashboard |

### LC Management

| V1 Path | V2 Path (proposed) |
|---|---|
| `/lc/list` | `/lc` |
| `/lctracking/pilists` | `/lc/pi` |
| `/lctracking/createpi` | `/lc/pi/create` |

### Quotations

| V1 Path | V2 Path (proposed) |
|---|---|
| `/quotation/list` | `/quotations` |
| `/quotation/create` | `/quotations/create` |
| `/quotation/:id/edit` | `/quotations/:id/edit` |

---

## 23. Full Source Reference — Completed Files

### Utility Functions — `lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, locale = 'en-US'): string {
  return new Date(date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatCurrency(amount: number, currency = 'BDT'): string {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-BD').format(value)
}
```

### Debounce Hook — `hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}
```

### Entry Point — `main.tsx`

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.tsx'
import { queryClient } from '@/lib/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
```

### CSS — `index.css`

```css
@import "tailwindcss";

@layer base {
  :root {
    --color-primary: #4b5563;
    --color-primary-hover: #374151;
    --tw-ring-color: #9ca3af;
    accent-color: #6b7280;
  }
  *:focus-visible { outline: 2px solid #9ca3af; outline-offset: 2px; }
  a { color: inherit; text-decoration: none; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #f3f4f6; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
  ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
}

* { box-sizing: border-box; }
html, body, #root { width: 100%; min-height: 100vh; }
body {
  margin: 0;
  font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
  line-height: 1.5; font-weight: 400;
  font-synthesis: none; text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  background: #f3f4f6; color: #111827;
}
button, input, select, textarea { font: inherit; }
```

---

## Quick Summary for AI Agents

**When starting a new module:**
1. Read this guide first
2. Check which type the module is: CRUD, Report, or Admin
3. Follow the corresponding checklist (Section 19 or 20)
4. Match types exactly to API response shapes
5. Use the centralized dropdown system for all dropdowns
6. Use gray-only colors, the shared inputCls, and established button styles
7. Always handle loading, error, and empty states
8. Test build with `npm run build` before finishing
9. Update `AppRouter.tsx` and `menuMapper.ts`

**Files you'll touch for a CRUD module:** `types/`, `schemas/`, `hooks/`, `pages/domain/`, `router/AppRouter.tsx`, `auth/menuMapper.ts`

**Files you'll touch for a Report:** `types/`, `hooks/`, `pages/reports/`, `router/AppRouter.tsx`, `auth/menuMapper.ts`

**Never modify:** `lib/api.ts`, `lib/queryClient.ts`, `config/env.ts`, `auth/authBridge.ts`, `components/dropdowns/*`, `utils/exportExcel.ts`, `stores/uiStore.ts` — these are shared infrastructure.
