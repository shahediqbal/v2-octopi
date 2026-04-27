# V2 Octopi — Implementation Reference Guide

> **Purpose:** This document describes the architecture, conventions, completed modules, and step-by-step patterns used in the `v2-octopi` project. Any agent or developer continuing this migration should follow these patterns exactly for consistency.

---

## 1. Project Overview

| Item | Value |
|---|---|
| Location | `v2-octopi/` (inside the monorepo root `octopi-master/`) |
| Legacy project | `src/` in the same monorepo root |
| Framework | React 19 + TypeScript (strict) |
| Build tool | Vite 7 (`npm run dev` → port 3001) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Colour palette | **gray-\*** only (no `slate`, `blue`, `indigo` — those have blue tints) |
| Server state | TanStack Query v5 (`@tanstack/react-query`) |
| Client/UI state | Zustand (`zustand`) |
| Forms | React Hook Form v7 + Zod v4 (`@hookform/resolvers/zod`) |
| Routing | React Router DOM v7 |
| Icons | Lucide React |
| Excel export | ExcelJS (reusable util at `utils/exportExcel.ts`) |
| API base URL | `https://api-v2.algologix.com.bd/api` (configurable via `VITE_API_BASE_URL`) |
| Auth | JWT from legacy `localStorage.userInfo`; bridge in `auth/authBridge.ts` |
| Path alias | `@/` → `./src/` (configured in `tsconfig.json` + `vite.config.ts`) |

---

## 2. Folder Structure

```
v2-octopi/src/
├── auth/                   # Authentication bridge & route protection
│   ├── authBridge.ts       # Read legacy JWT from localStorage
│   ├── menuMapper.ts       # Map legacy menu URLs → v2 routes
│   └── ProtectedRoute.tsx  # Redirect to /signin if not authenticated
├── components/             # Shared reusable UI components
│   ├── ErrorBoundary.tsx
│   └── dropdowns/          # Centralized dropdown system (all 22 types)
│       ├── index.ts             # Barrel export
│       ├── DropdownSelect.tsx   # <select> for Load All types (≤100 records)
│       └── PaginatedCombobox.tsx # Searchable combobox with infinite scroll
├── config/
│   └── env.ts              # Environment variables (API URL, mode)
├── hooks/                  # TanStack Query hooks (one file per domain)
│   ├── useCustomers.ts
│   ├── useDebounce.ts          # Generic debounce hook (used by PaginatedCombobox)
│   ├── useDropdown.ts          # Load All dropdown hook (19 types)
│   ├── useMappingReport.ts
│   ├── usePaginatedDropdown.ts # Infinite scroll dropdown hook (3 types)
│   └── useRoleAndMenu.ts
├── layout/                 # App shell: sidebar, header, main layout
│   ├── AppShell.tsx        # <Header> + <Sidebar> + <Outlet>
│   ├── Header.tsx
│   └── Sidebar.tsx         # Static nav + dynamic API menus
├── lib/                    # Core libraries
│   ├── api.ts              # Typed fetch wrapper (apiClient.get/post/put/delete)
│   ├── queryClient.ts      # TanStack QueryClient config
│   └── utils.ts            # cn() helper (clsx + tailwind-merge)
├── pages/                  # Page components (one folder per domain)
│   ├── DashboardPage.tsx
│   ├── SigninPage.tsx
│   ├── customers/
│   │   ├── CustomerListPage.tsx
│   │   ├── AddCustomerPage.tsx
│   │   ├── EditCustomerPage.tsx
│   │   └── CustomerForm.tsx      # Shared form (Add + Edit)
│   └── reports/
│       ├── SalesReportPage.tsx       # Stub (Coming Soon)
│       ├── DeliveryReportPage.tsx    # Stub (Coming Soon)
│       └── MappingReportPage.tsx     # Fully implemented
├── router/
│   └── AppRouter.tsx       # All route definitions + legacy redirects
├── schemas/                # Zod validation schemas
│   ├── customerSchema.ts
│   ├── dropdown.ts             # requiredDropdownId, optionalDropdownId
│   └── roleSchema.ts
├── stores/                 # Zustand stores
│   └── uiStore.ts          # Sidebar collapsed state
├── types/                  # TypeScript interfaces
│   ├── auth.ts
│   ├── customer.ts
│   ├── dropdown.ts             # DROPDOWN_TYPES, DROPDOWN_REGISTRY, DropdownOption, PaginatedResponse
│   ├── mappingReport.ts
│   └── roleAndMenu.ts
├── utils/                  # Utility functions
│   └── exportExcel.ts      # Global reusable Excel export
├── App.tsx                 # Renders <AppRouter />
├── main.tsx                # Entry: React root + QueryClientProvider
└── index.css               # Tailwind imports + global gray theme overrides
```

---

## 3. Architecture Patterns

### 3.1 API Client (`lib/api.ts`)

A typed fetch wrapper that auto-injects the JWT Bearer token:

```ts
import { apiClient } from '@/lib/api'

// Usage:
const data = await apiClient.get<ApiResponse<Customer[]>>('/Customer/GetCustomerDetails')
const result = await apiClient.post<ApiResponse<Customer>>('/Customer/AddCustomer', payload)
```

- All endpoints are **relative** to `env.apiBaseUrl` (e.g. `/Customer/GetCustomerDetails`)
- Throws `ApiError` with `.status`, `.statusText`, `.body` on non-2xx responses

### 3.2 TanStack Query Hooks (`hooks/`)

Every domain gets **one hook file**. Pattern:

```ts
// hooks/useSomething.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ... } from '@/types/something'

// 1. Hierarchical query keys
export const somethingKeys = {
  all: ['something'] as const,
  list: (filters?) => [...somethingKeys.all, 'list', filters] as const,
  detail: (id: number) => [...somethingKeys.all, 'detail', id] as const,
}

// 2. Query hooks
export function useSomethingList() {
  return useQuery({
    queryKey: somethingKeys.list(),
    queryFn: () => apiClient.get<ApiResponse<Something[]>>('/Endpoint').then(r => r.dataObj),
  })
}

// 3. Mutation hooks (invalidate list on success)
export function useCreateSomething() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Payload) => apiClient.post<ApiResponse<Something>>('/Endpoint', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: somethingKeys.list() }) },
  })
}
```

### 3.3 Types (`types/`)

One file per domain. Key pattern:

```ts
// types/something.ts
export interface Something { ... }           // Entity shape from GET
export interface CreateSomethingPayload { ... }  // POST body
export interface UpdateSomethingPayload extends CreateSomethingPayload { id: number }  // PUT body

// Shared API wrapper (used across all endpoints)
export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}
```

### 3.4 Zod Schemas (`schemas/`)

For form validation. **Important:** Input and output types must match. Do NOT use `.optional().default()` or `z.coerce` — these create input/output type mismatches with `zodResolver`. Instead:

```ts
// ✅ CORRECT — input and output types are the same
customerName: z.string().min(1, 'Required')
designationId: z.number().nullable()
contactPersonName: z.string()

// ❌ WRONG — causes zodResolver type error
contactPersonName: z.string().optional().default('')
designationId: z.coerce.number().nullable().default(null)
```

For HTML `<select>` / `<input type="number">` fields that return strings, use `setValueAs` in the `register()` call:

```tsx
const numericNullable = {
  setValueAs: (v: string | number | null | undefined) =>
    v === '' || v === undefined || v === null ? null : Number(v),
}

<select {...register('channelId', numericNullable)} />
```

### 3.5 Page Components (`pages/`)

Each domain gets a **folder** under `pages/`:

```
pages/customers/
  CustomerListPage.tsx    # List with search/table
  AddCustomerPage.tsx     # Create form
  EditCustomerPage.tsx    # Edit form (loads data by ID)
  CustomerForm.tsx        # Shared form component (used by Add + Edit)
```

**List page pattern:**
- Uses `useXxxList()` hook
- Client-side search filter with `useMemo`
- Gray/white table with hover states
- Links to add/edit pages

**Add page pattern:**
- Uses `useCreateXxx()` mutation
- Renders shared `<XxxForm>` component
- Handles `serverError` from API (e.g. duplicate name)
- Navigates to list on success

**Edit page pattern:**
- Gets `:id` from URL params
- Uses `useXxxDetail(id)` query
- Uses `useUpdateXxx()` mutation
- Maps API data → form defaults via `useMemo`
- Renders same shared `<XxxForm>` with `defaultValues`

### 3.6 Routes & Sidebar

**Adding a new v2 route:**

1. **AppRouter.tsx** — Add `<Route path="..." element={<Page />} />`
2. **Sidebar.tsx** — Add entry to `staticNav` array: `{ id, label, path, icon }`
3. **menuMapper.ts** — Add legacy→v2 mapping in `legacyToV2` record
4. **AppRouter.tsx** — Add legacy redirect: `<Route path="legacy/path" element={<Navigate to="/v2/path" replace />} />`

### 3.7 Excel Export (`utils/exportExcel.ts`)

A global reusable function. Any report calls it:

```ts
import { exportExcel } from '@/utils/exportExcel'

exportExcel({
  fileName: 'Report_Name_2026-03-01',
  title: 'Report Title',
  subtitle: '01/03/2026 to 02/03/2026',
  sheetName: 'Sheet Tab Name',
  columns: [
    { key: 'fieldKey', header: 'Display Header' },
    { key: 'qty', header: 'Quantity', format: 'number' },
    { key: 'date', header: 'Date', format: 'date' },
  ],
  data: filteredData,  // Record<string, unknown>[]
  filters: [           // Goes to "Parameters" sheet
    ['Date Range', '01/03/2026 – 02/03/2026'],
    ['Customer', 'All'],
  ],
  summaryCards: [       // Summary row above the table
    ['Total Records', 100],
    ['Filtered', 85],
  ],
})
```

Features: title row, subtitle, auto-generated timestamp, summary cards row, styled header with frozen pane, auto-sized columns, zebra striping, thin borders, per-column number/date formatting, footer with record count, separate Parameters sheet.

### 3.8 Styling Conventions

- **Palette:** `gray-*` only. Primary buttons: `bg-gray-800 hover:bg-gray-700 text-white`
- **Cards:** `rounded-xl border border-gray-200 bg-white shadow-sm`
- **Inputs:** `rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:ring-2 focus:ring-gray-200`
- **Tables:** Plain `<table>` with Tailwind (no MUI). Header: `bg-gray-50 text-xs uppercase text-gray-500`. Rows: `hover:bg-gray-50 divide-y divide-gray-100`
- **Section labels:** `text-sm font-semibold text-gray-700 uppercase tracking-wider`
- **No blue/slate/indigo/violet anywhere**

### 3.9 Centralized Dropdown System (`components/dropdowns/`)

> **IMPORTANT:** All v2 dropdowns go through **one unified API endpoint** and **two reusable components**. Do NOT create custom `<select>` elements or dedicated dropdown hooks for individual types. Always use this system.

#### Backend Endpoint

```
GET /KeyValue/GetDropdown?type={typeKey}
GET /KeyValue/GetDropdown?type={typeKey}&pageNumber=1&pageSize=50&searchTerm=abc
```

All 22 dropdown types are served through this single endpoint. The `type` key routes internally to the correct data. Auth: `Authorization: Bearer <jwt>` header (auto-injected by `apiClient`).

#### Two Data Strategies

| Strategy | When | API Shape | Component | Hook |
|---|---|---|---|---|
| **Load All** | ≤100 records (19 types) | `dataObj: DropdownOption[]` | `<DropdownSelect>` | `useDropdown(type)` |
| **Paginated** | >100 records (3 types) | `dataObj: PaginatedResponse` | `<PaginatedCombobox>` | `usePaginatedDropdown(type, search)` |

#### All 22 Dropdown Types

**Paginated** (use `<PaginatedCombobox>`):

| Type Key | Records | Page Size |
|---|---|---|
| `customer` | ~855 | 50 |
| `product` | ~976 | 50 |
| `location` | ~1480 | 50 |

**Load All** (use `<DropdownSelect>`):

`taskMovementTransport`, `supplier`, `employee`, `productFunction`, `bank`, `jobType`, `designation`, `taskChecklist`, `productCategory`, `productGroup`, `paymentMode`, `department`, `vehicle`, `channel`, `chequeStatus`, `packType`, `employeeType`, `lcPaymentTerms`, `productCountry`

#### Files

| File | Purpose |
|---|---|
| `types/dropdown.ts` | **Single source of truth** — `DROPDOWN_TYPES` const, `DROPDOWN_REGISTRY` config, `DropdownType` union, `DropdownOption`, `PaginatedResponse`, `isPaginated()` helper |
| `hooks/useDropdown.ts` | `useDropdown(type)` — TanStack Query hook for Load All. Cache: 5 min stale, 30 min gc. Also exports `dropdownKeys` for all dropdown query keys. |
| `hooks/usePaginatedDropdown.ts` | `usePaginatedDropdown(type, searchTerm, pageSize)` — `useInfiniteQuery` with auto-pagination. Cache: 2 min stale, 10 min gc. |
| `hooks/useDebounce.ts` | `useDebounce(value, delay)` — generic debounce hook (300ms default for search). |
| `schemas/dropdown.ts` | `requiredDropdownId` — `z.number().min(1)` for required fields. `optionalDropdownId` — `z.number().nullable()` for optional fields. |
| `components/dropdowns/DropdownSelect.tsx` | Native `<select>` styled with gray palette. Props: `type`, `value`, `onValueChange`, `placeholder?`, `disabled?`, `hasError?`, `className?` |
| `components/dropdowns/PaginatedCombobox.tsx` | Custom combobox with search input + infinite scroll. Same props as DropdownSelect. |
| `components/dropdowns/index.ts` | Barrel: `export { DropdownSelect, PaginatedCombobox }` |

#### Usage — Standalone

```tsx
import { DropdownSelect, PaginatedCombobox } from '@/components/dropdowns'

// Load All type (≤100 records) — renders a styled <select>
<DropdownSelect type="department" value={deptId} onValueChange={setDeptId} />
<DropdownSelect type="supplier" value={supplierId} onValueChange={setSupplierId} />
<DropdownSelect type="channel" value={channelId} onValueChange={setChannelId} />

// Paginated type (>100 records) — renders searchable combobox with infinite scroll
<PaginatedCombobox type="customer" value={customerId} onValueChange={setCustomerId} />
<PaginatedCombobox type="product" value={productId} onValueChange={setProductId} />
<PaginatedCombobox type="location" value={locationId} onValueChange={setLocationId} />
```

#### Usage — React Hook Form + Zod

```tsx
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { requiredDropdownId, optionalDropdownId } from '@/schemas/dropdown'
import { DropdownSelect, PaginatedCombobox } from '@/components/dropdowns'

// 1. Schema
const schema = z.object({
  customerId: requiredDropdownId,       // z.number().min(1, 'Please select an option')
  departmentId: optionalDropdownId,     // z.number().nullable()
})
type FormData = z.infer<typeof schema>

// 2. Form
function MyForm() {
  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Paginated — large dataset */}
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

      {/* Load All — small dataset */}
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
    </form>
  )
}
```

#### Usage — Report Filters (no form library)

```tsx
// State: null = "All" (no filter applied), number = selected option
const [customerId, setCustomerId] = useState<number | null>(null)
const [productId, setProductId] = useState<number | null>(null)

<PaginatedCombobox type="customer" value={customerId} onValueChange={setCustomerId} placeholder="All Customers" />
<PaginatedCombobox type="product" value={productId} onValueChange={setProductId} placeholder="All Products" />
```

#### Decision Rule

To decide which component to use for a dropdown type:

```ts
import { DROPDOWN_REGISTRY } from '@/types/dropdown'

const config = DROPDOWN_REGISTRY[type]
if (config.strategy === 'paginated') {
  // Use <PaginatedCombobox type={type} ... />
} else {
  // Use <DropdownSelect type={type} ... />
}
```

#### Adding a New Dropdown Type

If the backend team adds a new type to the `GetDropdown` endpoint:

1. **`types/dropdown.ts`** — Add the key to `DROPDOWN_TYPES` and a config entry to `DROPDOWN_REGISTRY`
2. If paginated, also add it to the `PAGINATED_TYPES` set
3. That's it — the hooks and components will work automatically

#### DO NOT

- ❌ Create custom `<select>` elements for dropdown data — use `<DropdownSelect>` or `<PaginatedCombobox>`
- ❌ Create dedicated hooks like `useCustomerNames()` or `useProductNames()` — use `useDropdown(type)` or `usePaginatedDropdown(type, search)`
- ❌ Call old legacy endpoints (`/KeyValue/GetCustomerName`, `/KeyValue/GetProductList`, etc.) — use the unified `/KeyValue/GetDropdown?type=xxx`
- ❌ Store dropdown data in Zustand — TanStack Query handles caching

---

## 4. Completed Modules

### 4.1 Customer Module ✅

**Legacy files studied:**
- `src/pages/CustomerList/index.js`
- `src/pages/AddCustomer/index.js`  
- `src/pages/EditCustomer/index.js`
- `src/redux/actions/customerActions.js`
- `src/redux/constants/customerConstants.js`

**V2 files created:**

| File | Purpose |
|---|---|
| `types/customer.ts` | Customer, CreateCustomerPayload, UpdateCustomerPayload, ApiResponse, Channel, Designation, EmployeeByChannel |
| `schemas/customerSchema.ts` | Zod schema + dropdown option arrays (paymentIntervals, paymentCycleTypes, paymentModes, currentStatusOptions) |
| `hooks/useCustomers.ts` | useCustomers, useCustomerDetail, useCreateCustomer, useUpdateCustomer, useChannels, useDesignations, useEmployeesByChannel |
| `pages/customers/CustomerForm.tsx` | Shared form: 4 fieldsets (Basic Info, Organisation, Payment, Status & Notes), dropdown loading from API |
| `pages/customers/CustomerListPage.tsx` | List + search + status badges + edit links |
| `pages/customers/AddCustomerPage.tsx` | Create form with server error handling |
| `pages/customers/EditCustomerPage.tsx` | Edit with data pre-loading |

**API endpoints:**
- `GET /Customer/GetCustomerDetails` — list all customers
- `GET /Customer/GetCustomerById/{id}` — single customer
- `POST /Customer/AddCustomer` — create
- `PUT /Customer/CustomerUpdate` — update
- `GET /Channel/GetChannels` — channel dropdown
- `GET /Designation/GetDesignations` — designation dropdown
- `GET /Employee/GetEmployeeByChannelId/{channelId}` — employee dropdown (depends on channel)

**Routes:** `/customers`, `/customers/add`, `/customers/:id/edit`

---

### 4.2 Mapping Report ✅

**Legacy file studied:** `src/pages/Reports/MappingReport/index.js`

**V2 files created:**

| File | Purpose |
|---|---|
| `types/mappingReport.ts` | MappingReportItem, MappingReportFilters, ApiResponse |
| `hooks/useMappingReport.ts` | useMappingReport (on-demand query, enabled by "Load Data" button) |
| `pages/reports/MappingReportPage.tsx` | Full page: date pickers, customer/product dropdowns, search, Load Data button, summary stats, data table, Excel export |

**API endpoints:**
- `GET /Report/GetMappedItemReport?startDate=&endDate=&productId=&partnerId=` — report data

**Dropdowns:** Customer and Product filters use the centralized `<PaginatedCombobox>` component (see Section 3.9). They call the unified `/KeyValue/GetDropdown?type=customer|product` endpoint automatically — no dedicated dropdown hooks needed.

**Route:** `/reports/mapping` (legacy redirect from `/report/mapped`)

---

### 4.3 Manage Role & Menu ✅

**Legacy files studied:** `src/pages/ManageRoleAndMenu.js`, `src/user/AddRole.js`, `src/redux/actions/RoleAndMenuActions.js`

**V2 files created:**

| File | Purpose |
|---|---|
| `types/roleAndMenu.ts` | Role, MenuItem, RoleDetails, CreateRolePayload, UpdateRoleDetailsPayload, ApiResponse |
| `schemas/roleSchema.ts` | Zod schema for the Add Role modal form |
| `hooks/useRoleAndMenu.ts` | useRoles, useRoleDetails, useCreateRole, useUpdateRoleDetails |
| `pages/admin/ManageRoleAndMenuPage.tsx` | 3-panel layout: Roles list · Unassigned menus · Assigned menus. Inline modal for Add Role. Toast feedback. |

**API endpoints:**
- `GET /Role/GetRoles/1` — list all roles
- `GET /Role/GetRoleDetails/{id}` — role detail + unassigned + assigned menu lists
- `POST /Role/AddRole` — create role (body: `{ rolename }`)
- `PUT /Role/UpdateRoleDetails` — persist assignment (body: `{ roleId, roleName, roleActiveStatus, rolePermissionIdList }`)

**Route:** `/admin/roles` (legacy redirect from `/manageroleandmenu`)

**Professional improvements over legacy:**
- Local state (useState) manages assign/remove without API calls until "Save Changes" is clicked — replaces Redux state manipulation
- Native Tailwind checkbox table replaces MUI DataGrid
- React Hook Form + Zod replaces Formik + Yup
- Inline Tailwind modal replaces MUI Popup/FormPopup
- Auto-dismiss toast replaces MUI Snackbar
- Select-all checkbox per panel, dirty-state tracking, disabled Save unless changes exist

---

### 4.4 Stubs (Not Yet Implemented)

| Page | Route | Status |
|---|---|---|
| Sales Report | `/reports/sales` | "Coming Soon" placeholder |
| Delivery Report | `/reports/delivery` | "Coming Soon" placeholder |

---

## 5. Legacy → V2 Route Mapping

When migrating a new module, you must update **two files**:

### `auth/menuMapper.ts` — `legacyToV2` record:
```ts
const legacyToV2: Record<string, string> = {
  '/dashboard': '/dashboard',
  '/customers': '/customers',
  '/addcustomer': '/customers/add',
  '/report/sales': '/reports/sales',
  '/report/delivery-conveyance': '/reports/delivery',
  '/report/mapped': '/reports/mapping',
  // ADD NEW MAPPINGS HERE
}
```

### `router/AppRouter.tsx` — Legacy redirect routes:
```tsx
<Route path="report/mapped" element={<Navigate to="/reports/mapping" replace />} />
// ADD NEW REDIRECTS HERE
```

---

## 6. Step-by-Step: Adding a New Module

Follow this checklist for every new module migration:

### Step 1: Study the legacy code
- Find the legacy page in `src/pages/`
- Find the Redux actions in `src/redux/actions/`
- Identify API endpoints (look for `API_URL` + axios calls)
- Note the data shape returned by each endpoint

### Step 2: Create types (`types/moduleName.ts`)
- Define the entity interface matching the API response shape
- Define Create/Update payload interfaces
- Reuse `ApiResponse<T>` if already defined, or add it

### Step 3: Create hooks (`hooks/useModuleName.ts`)
- Define hierarchical query keys
- Create `useQuery` hooks for each GET endpoint
- Create `useMutation` hooks for POST/PUT/DELETE
- Invalidate related queries on mutation success

### Step 4: Create Zod schema (if form-based) (`schemas/moduleSchema.ts`)
- Match input/output types (no `.optional().default()`)
- Export `type FormData = z.infer<typeof schema>`
- Export dropdown option arrays as `as const`

### Step 5: Create page components (`pages/moduleName/`)
- List page → search + table + TanStack Query hook
- Add page → form + create mutation
- Edit page → load by ID + form + update mutation
- Shared form → React Hook Form + zodResolver

### Step 6: Wire up routing
- `router/AppRouter.tsx` — Add routes
- `layout/Sidebar.tsx` — Add to `staticNav` array
- `auth/menuMapper.ts` — Add legacy→v2 path mapping
- `router/AppRouter.tsx` — Add legacy redirect `<Route>`

### Step 7: Verify
- `npx tsc --noEmit` — must produce 0 errors
- Check in browser that the page renders
- Verify the sidebar link navigates correctly

---

## 7. Key Gotchas & Lessons Learned

| Issue | Solution |
|---|---|
| Tailwind `slate-*` has a blue tint | Use `gray-*` exclusively |
| `zodResolver` type error with `.optional().default()` | Keep Zod schema input = output types; use `setValueAs` on register for type conversion |
| Dynamic menus from API use legacy paths | Must add mapping in `menuMapper.ts` AND redirect routes in `AppRouter.tsx` |
| `z.coerce.number()` makes input type `unknown` | Use `z.number().nullable()` + `setValueAs` in register |
| Logo rendered as circle | Use `h-X w-auto` without `rounded-full` or `object-cover` |
| `npm run dev` from wrong directory | Must run from `v2-octopi/` directory |
| Auth not shared between ports | Legacy app and v2 app on different ports have separate localStorage; must sign in on each |

---

## 8. Dependencies (package.json)

```
@hookform/resolvers  ^5.2.2   — Zod resolver for React Hook Form
@tailwindcss/vite    ^4.2.1   — Tailwind CSS v4 Vite plugin
@tanstack/react-query ^5.90   — Server state management
axios                ^1.13.5  — (available but apiClient uses fetch)
clsx                 ^2.1.1   — Class name utility
exceljs              ^4.4.0   — Excel file generation
jwt-decode           ^4.0.0   — Decode JWT tokens
lucide-react         ^0.575   — Icon library
react                ^19.2.0  — UI framework
react-hook-form      ^7.71    — Form management
react-router-dom     ^7.13    — Client-side routing
tailwind-merge       ^3.5.0   — Merge Tailwind classes
tailwindcss          ^4.2.1   — CSS framework
zod                  ^4.3.6   — Schema validation
zustand              ^5.0.11  — Lightweight state management
```

---

## 9. Remaining Modules to Migrate

From the legacy `src/routes.js`, these modules are NOT yet implemented:

- **Products** — `/products`, `/addproduct`, `/product/:id/edit`
- **Employees** — `/inhouseemployees`, `/addemployee`, `/employee/:id/edit`
- **Suppliers** — `/suppliers`, `/suppliers/add`, `/supplier/:id/edit`
- **Sales Order** — `/salesorderinternal`, `/salesorderinternal/create`, etc.
- **Stock In** — `/stockin/create`, `/stockin/list`
- **Pricing** — `/addsellprice`, `/price`, `/price/:id/edit`
- **Marketing** — `/marketingactivities`, `/addmarketingactivity`
- **Reports** — Sales Report, Delivery Report, Current Stock, Payment, Marketing Visit
- **Admin** — ✅ Manage Role & Menu (`/admin/roles`) DONE · Assign User Role · User Signup
- **LC Management** — `/lc/list`
- **Geolocation** — `/geolocation`, `/customers/map`

Follow the same patterns in Section 6 for each new module.
