# Cheque Module — V2 Migration: Understanding & Execution Plan

> **Purpose**: Complete technical reference for migrating (and verifying) the legacy Cheque module in V2-Octopi ERP.
> **Audience**: AI agents and developers implementing or reviewing this migration.
> **Last Updated**: 2026-04-18

---

## Table of Contents

1. [Module Scope & Route Inventory](#1-module-scope--route-inventory)
2. [Legacy File Inventory](#2-legacy-file-inventory)
3. [Complete API Endpoint Inventory](#3-complete-api-endpoint-inventory)
4. [Data Models & TypeScript Interfaces](#4-data-models--typescript-interfaces)
5. [Zod Validation Schemas](#5-zod-validation-schemas)
6. [Business Rules & Validation](#6-business-rules--validation)
7. [Legacy Redux State — What It Did](#7-legacy-redux-state--what-it-did)
8. [V2 Architecture & File Organization](#8-v2-architecture--file-organization)
9. [V2 Route Mapping (Legacy → V2)](#9-v2-route-mapping-legacy--v2)
10. [TanStack Query Hook Design](#10-tanstack-query-hook-design)
11. [Pagination Strategy (Critical)](#11-pagination-strategy-critical)
12. [Page-by-Page Breakdown](#12-page-by-page-breakdown)
13. [Status Update Popup / Modal](#13-status-update-popup--modal)
14. [Dropdown Integration](#14-dropdown-integration)
15. [Payload Builder Utility](#15-payload-builder-utility)
16. [Component Breakdown](#16-component-breakdown)
17. [Execution Plan (Phases)](#17-execution-plan-phases)
18. [Implementation Checklist](#18-implementation-checklist)
19. [Key Gotchas & Lessons Learned](#19-key-gotchas--lessons-learned)

---

## 1. Module Scope & Route Inventory

The Cheque module handles **customer cheque recording and status tracking** — collecting cheques from customers, tracking their status through lifecycle (Pending → Deposited → Cleared/Bounced), and managing cheque details.

### 1.1 Core Routes (4 routes / pages)

| # | Legacy Route | V2 Route | Purpose | Legacy Component | Legacy File |
|---|---|---|---|---|---|
| 1 | `/cheque/list` | `/cheques` | List all cheques (paginated with infinite scroll + search) | `Cheques` | `src/pages/Cheque/Cheques.js` |
| 2 | `/cheque/create` | `/cheques/add` | Create a new cheque record | `AddCheque` | `src/pages/Cheque/AddCheque.js` |
| 3 | `/cheque/:id/edit` | `/cheques/:id/edit` | Full edit of an existing cheque | `EditCheque` | `src/pages/Cheque/EditCheque.js` |
| 4 | Popup in list (`EditChequeStatus`) | `/cheques/:id/status` + `ChequeStatusModal` | Status-only update (popup in list, standalone page) | `EditChequeStatus` | `src/pages/Cheque/EditChequeStatus.js` |

**Total for this module: 4 pages/routes**

---

## 2. Legacy File Inventory

### 2.1 Page Components

| File | Path | Purpose |
|---|---|---|
| `Cheques.js` | `src/pages/Cheque/Cheques.js` | Cheque list page — MUI DataGrid, no pagination (loads ALL records) |
| `AddCheque.js` | `src/pages/Cheque/AddCheque.js` | Create cheque form — Formik-based, multiple dropdown lookups |
| `EditCheque.js` | `src/pages/Cheque/EditCheque.js` | Edit cheque form — same structure as AddCheque, prefilled from API |
| `EditChequeStatus.js` | `src/pages/Cheque/EditChequeStatus.js` | Status-only update — opens as a popup from the list page |

### 2.2 Redux Files

| File | Path | Purpose |
|---|---|---|
| `chequeActions.js` | `src/redux/actions/chequeActions.js` | All cheque Axios calls (list, create, update, delete, details, lookups) |
| `chequeConstants.js` | `src/redux/constants/chequeConstants.js` | Action type string constants |
| `chequeReducers.js` | `src/redux/reducers/chequeReducers.js` | Redux reducers for cheque state |

---

## 3. Complete API Endpoint Inventory

### 3.1 Grid / List Endpoint

| Endpoint | Method | Purpose | Notes |
|---|---|---|---|
| `GET /CustomerPayment/GetChequeInfoGrid` | GET | **LEGACY** — loads ALL cheques without pagination | ⚠️ DO NOT USE in V2 |
| `GET /CustomerPayment/GetChequeInfoGridPagination` | GET | **V2 paginated grid** — server-side pagination + search + optional status filter | ✅ USE THIS in V2 |

> **Critical Note**: The legacy endpoint `GetChequeInfoGrid` returns the full dataset with no paging.
> V2 **must** use `GetChequeInfoGridPagination` (maps to backend C# method `GetChequeInfoGridPaginationAsync`).
> The paginated endpoint accepts query params: `pageNumber`, `pageSize`, `searchTerm`, `chequeStatusId` (optional).

#### Status Filter — `chequeStatusId` Lookup Table

The `chequeStatusId` query param filters the grid to a single status. Pass nothing (omit the param) for all statuses.

| `payment_cheque_status_id` | `payment_cheque_status_name` | `payment_cheque_cycle` | Meaning |
|---|---|---|---|
| 1 | Pending | 0 | Outstanding — cheque received, not yet deposited |
| 2 | Cleared | 1 | Settled — cheque cleared by bank |
| 3 | Bounced | 0 | Outstanding — cheque bounced, action needed |
| 4 | Swap | 0 | Outstanding — cheque swapped with a replacement |
| 5 | Expired | 1 | Settled — cheque expired |
| 6 | Returned | 1 | Settled — cheque returned to customer |
| 7 | On Hold | 0 | Outstanding — cheque placed on hold |

> `payment_cheque_cycle = 0` → open/outstanding; `payment_cheque_cycle = 1` → settled/closed.
> This cycle value is for reporting and analytics — it is not currently used for UI filtering.

### 3.2 CRUD Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `POST /CustomerPayment/AddChequeInfo` | POST | Create a new cheque |
| `PUT /CustomerPayment/UpdateChequeInfo` | PUT | Update an existing cheque (full payload — also used for status-only update) |
| `GET /CustomerPayment/GetChequeInfoById/{id}` | GET | Fetch single cheque detail |
| `DELETE /Customer/DeleteCustomer?id={id}` | DELETE | Delete a cheque (legacy, not exposed in V2 UI) |

### 3.3 Lookup / Dropdown Endpoints

| Endpoint | Method | Purpose | Mapped To |
|---|---|---|---|
| `GET /KeyValue/GetChequeStatusKeyValue` | GET | Cheque status options | `useChequeStatuses()` |
| `GET /KeyValue/GetBankListKeyValue/0` | GET | Issuer bank list (type=0) | `useIssuerBanks()` |
| `GET /KeyValue/GetBankListKeyValue/1` | GET | Beneficiary bank list (type=1) | `useBeneficiaryBanks()` |
| `GET /KeyValue/GetPaymentMethodKeyValue/1` | GET | Cheque type / payment method (type=1) | `useChequeTypes()` |

All lookup endpoints return `{ dataObj: Array<{ key: number, value: string }>, errMsg?: string }`.

### 3.4 Paginated Dropdown Endpoints (for PaginatedCombobox)

| Endpoint | Used For |
|---|---|
| `GET /KeyValue/GetDropdown?type=customer&searchTerm=...&pageNumber=...&pageSize=50` | Customer selection in form |
| `GET /Employee/GetEmployeeListPagination?searchTerm=...&pageNumber=...&pageSize=50` | Cheque collector (employee) selection |

---

## 4. Data Models & TypeScript Interfaces

> File: `v2-octopi/src/types/cheque.ts`

### 4.1 API Response Wrapper

```typescript
export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}
```

### 4.2 Lookup Option

```typescript
export interface ChequeLookupOption {
  id: number
  label: string
}
```

### 4.3 Grid Row (`ChequeInfo`)

Returned by `GetChequeInfoGridPagination` — each row in the list:

```typescript
export interface ChequeInfo {
  chequeInfoId: number
  customerName: string | null
  chequeAmount: number | null
  chequeNumber: string | null
  paymentMethodName: string | null     // cheque type name
  customerAddress: string | null
  empFirstName: string | null
  empLastName: string | null
  employeeCode: string | null
  paymentChequeStatusName: string | null
  chequeStatusId: number | null
  chequeDate: string | null
  chequePlacementDate: string | null
  chequeExpireDate: string | null
  chequeCollectionDate: string | null
  chequeActionDate: string | null
  chequeBankName?: string | null       // issuer bank name
  beneficiaryBank?: string | null
}
```

### 4.4 Detail Row (`ChequeDetail`)

Returned by `GetChequeInfoById/{id}` — extends `ChequeInfo` with FK IDs for form pre-population:

```typescript
export interface ChequeDetail extends ChequeInfo {
  chequeCustomerId: number | null
  chequeMethodInfoId: number | null        // maps to chequeTypeId in form
  chequeIssuerBankId: number | null
  chequeBeneficiaryBankId: number | null
  employeeId: number | null               // maps to chequeCollectedBy in form
  chequeStatusRemarks: string | null
}
```

> **Note**: `GetChequeInfoById/{id}` may return a single object OR a single-element array. The hook
> normalizes this: `normalizeChequeDetail(dataObj)` → always returns `ChequeDetail | null`.

### 4.5 Create/Update Payload (`ChequePayload`)

Sent to `AddChequeInfo` (POST) and `UpdateChequeInfo` (PUT):

```typescript
export interface ChequePayload {
  chequeInfoId: number              // 0 for create, actual ID for update
  chequeCollectionDate: string | null
  chequeCustomerId: number | null
  chequeDate: string | null
  chequeExpireDate: string | null
  chequeNumber: string
  chequeAmount: number
  chequeIssuerBankId: number | null
  chequeMethodInfoId: number | null
  chequePlacementDate: string | null
  chequeBeneficiaryBankId: number | null
  chequeCollectedBy: number | null
  chequeStatusId: number | null
  chequeActionDate: string | null
  chequeStatusRemarks: string | null
  createdBy: number | string | null      // JWT UserSystemId
  createdDate: string                    // today ISO date string
  modifiedBy: number | string | null     // JWT UserSystemId
  modifiedDate: string                   // today ISO date string
}
```

---

## 5. Zod Validation Schemas

> File: `v2-octopi/src/schemas/chequeSchema.ts`

### 5.1 Full Cheque Form (`chequeFormSchema`)

Used by `ChequeForm.tsx` for Add and Edit pages:

```typescript
export const chequeFormSchema = z.object({
  chequeCollectedBy:    requiredDropdownId('Please select Cheque Collector'),  // number > 0
  chequeCollectionDate: z.string().min(1, 'Please select Cheque Collection Date'),
  chequeTypeId:         requiredDropdownId('Please select Cheque Type'),
  customerId:           requiredDropdownId('Please select Customer'),
  chequeDate:           z.string().min(1, 'Please select Cheque Date'),
  chequePlacementDate:  z.string().min(1, 'Please select Cheque Placement Date'),
  chequeExpireDate:     z.string().min(1, 'Please select Cheque Expire Date'),
  chequeActionDate:     z.string().min(1, 'Please select Cheque Action Date'),
  chequeNumber:         z.string().trim().min(1, 'Please enter Cheque Number'),
  chequeAmount:         z.number().positive('Please enter Amount'),
  issuerBankId:         requiredDropdownId('Please select Issuer bank'),
  beneficiaryBankId:    z.number().nullable(),           // optional field
  chequeStatusId:       requiredDropdownId('Please select Cheque Status'),
  chequeStatusRemarks:  z.string().trim().optional().or(z.literal('')),
})
```

### 5.2 Status-Only Form (`chequeStatusSchema`)

Used by `ChequeStatusForm.tsx` for the status popup and status edit page:

```typescript
export const chequeStatusSchema = z.object({
  chequeStatusId:      requiredDropdownId('Please select Cheque Status'),
  chequeActionDate:    z.string().min(1, 'Please select Cheque Action Date'),
  chequeStatusRemarks: z.string().trim().optional().or(z.literal('')),
})
```

> **Key detail**: `requiredDropdownId(message)` is `z.number().nullable().refine((v) => v != null && v > 0, message)`.
> Zod v4 uses `{ error: '...' }` not `{ required_error: '...' }` for custom messages on `z.number()`.

---

## 6. Business Rules & Validation

| Rule | Implementation |
|---|---|
| Cheque Collector is required | `chequeCollectedBy` — must be non-null, positive number |
| Customer is required | `customerId` — must be non-null, positive number |
| Cheque Type is required | `chequeTypeId` — must be non-null, positive number |
| Issuer Bank is required | `issuerBankId` — must be non-null, positive number |
| Beneficiary Bank is optional | `beneficiaryBankId` — `z.number().nullable()`, no validation |
| Cheque Status is required | `chequeStatusId` — must be non-null, positive number |
| All date fields are required | `z.string().min(1, ...)` — HTML `type="date"` always returns a string |
| Cheque Amount must be > 0 | `z.number().positive(...)` |
| Status-only update reuses full PUT endpoint | `UpdateChequeInfo` is called with all existing fields + new status/remarks |
| Create sets `chequeInfoId: 0` | Backend generates the real ID |
| `createdBy` / `modifiedBy` come from JWT | `getUserSystemId()` decodes `UserSystemId` from JWT |
| Initial status on create = 1 (Pending) | `chequeStatusId` defaults to `1` in `AddChequePage` |
| Status form shows read-only cheque summary | `ChequeStatusForm` renders summary panel (customer, cheque no, amount, dates) |

---

## 7. Legacy Redux State — What It Did

The legacy app used Redux + Axios. Key state slices:

| Redux Slice | State Shape | Populated By |
|---|---|---|
| `chequeList` | `{ loading, error, cheques: ChequeInfo[] }` | `listCheque()` → `GET /CustomerPayment/GetChequeInfoGrid` |
| `chequeDetails` | `{ loading, error, chequeSingle: ChequeDetail }` | `listChequeDetails(id)` → `GET /CustomerPayment/GetChequeInfoById/{id}` |
| `chequeCreate` | `{ loading, error, success, cheque }` | `createCheque(data)` → `POST /CustomerPayment/AddChequeInfo` |
| `chequeUpdate` | `{ loading, error, success }` | `updateCheque(data)` → `PUT /CustomerPayment/UpdateChequeInfo` |
| `chequeTypeList` | `{ loading, error, chequeTypes: [{id, label}] }` | `listChequeType()` → `GET /KeyValue/GetPaymentMethodKeyValue/1` |
| `bankList` | `{ loading, error, banks: [{id, label}] }` | `listBank()` → `GET /KeyValue/GetBankListKeyValue/1` |
| `issuerBankList` | `{ loading, error, issuerbanks: [{id, label}] }` | `listIssuerBank()` → `GET /KeyValue/GetBankListKeyValue/0` |
| `chequeStatusList` | `{ loading, error, chequestatuss: [{id, label}] }` | `listChequeStatus()` → `GET /KeyValue/GetChequeStatusKeyValue` |

**Legacy Status Popup flow**:
1. User clicks "Status Edit" icon in grid row
2. `listChequeDetails(row.chequeInfoId)` dispatched → populates `chequeDetails`
3. `Popup` component opens with `EditChequeStatus` rendered inside
4. `EditChequeStatus` reads `chequeDetails` from Redux and calls `updateCheque(fullPayload)`
5. On success: popup closes, list refetches

**V2 equivalent**: `ChequeStatusModal` opens → `ChequeStatusContent` calls `useChequeDetail(id)` (TanStack Query) → renders `ChequeStatusForm` → on submit: `useUpdateCheque()` mutation with `buildChequePayload(...)`.

---

## 8. V2 Architecture & File Organization

All V2 cheque files follow the project conventions in `AI_DEVELOPER_GUIDE.md`.

### 8.1 V2 File Map

```
v2-octopi/src/
├── types/
│   └── cheque.ts                   # ChequeInfo, ChequeDetail, ChequePayload, ApiResponse, ChequeLookupOption
├── schemas/
│   └── chequeSchema.ts             # chequeFormSchema, chequeStatusSchema, ChequeFormData, ChequeStatusFormData
├── hooks/
│   └── useCheques.ts               # chequeKeys, usePaginatedCheques, useChequeDetail, lookup hooks, mutations
├── config/
│   └── pagination.ts               # chequeInfo endpoint registered here
└── pages/
    └── cheques/
        ├── AddChequePage.tsx        # /cheques/add
        ├── EditChequePage.tsx       # /cheques/:id/edit
        ├── ChequeListPage.tsx       # /cheques (list + status popup trigger)
        ├── ChequeForm.tsx           # Shared form component (add + edit)
        ├── ChequeStatusModal.tsx    # Popup overlay wrapping ChequeStatusContent
        ├── ChequeStatusContent.tsx  # Data-fetching shell for status update
        ├── ChequeStatusForm.tsx     # Status-only form (status, action date, remarks)
        ├── EditChequeStatusPage.tsx # /cheques/:id/status (standalone status update page)
        └── chequePageUtils.ts       # todayStr(), getUserSystemId(), buildChequePayload(), extractApiErrorMessage()
```

### 8.2 Import Rules

```typescript
// Always use @/ alias — NEVER relative paths
import { apiClient } from '@/lib/api'
import type { ChequeInfo, ChequeDetail } from '@/types/cheque'
import { usePaginatedCheques } from '@/hooks/useCheques'
```

### 8.3 Export Rules

```typescript
// Named exports only — no default exports except App.tsx
export function ChequeListPage() { ... }
export function usePaginatedCheques(...) { ... }
```

---

## 9. V2 Route Mapping (Legacy → V2)

### 9.1 V2 Primary Routes

```
/cheques                    → ChequeListPage          (list with infinite scroll, status popup)
/cheques/add                → AddChequePage            (create form)
/cheques/:id/edit           → EditChequePage           (edit form)
/cheques/:id/status         → EditChequeStatusPage     (standalone status update page)
```

### 9.2 Legacy Redirect Routes (in AppRouter.tsx)

```tsx
<Route path="cheque/list"    element={<Navigate to="/cheques" replace />} />
<Route path="cheque/create"  element={<Navigate to="/cheques/add" replace />} />
<Route path="cheque/:id/edit" element={<EditChequePage />} />   {/* direct render, no redirect */}
```

> **Note**: `/cheque/:id/edit` renders `EditChequePage` directly rather than redirecting to `/cheques/:id/edit`.
> This preserves the legacy URL shape for any bookmarked links.

---

## 10. TanStack Query Hook Design

> File: `v2-octopi/src/hooks/useCheques.ts`

### 10.1 Query Key Factory

```typescript
export const chequeKeys = {
  all:      ['cheques'] as const,
  paginated: (searchTerm: string, pageSize: number, statusId: number | null) =>
    [...chequeKeys.all, 'paginated', searchTerm, pageSize, statusId] as const,
  detail:   (id: number) => [...chequeKeys.all, 'detail', id] as const,
  lookups:  ['cheques', 'lookups'] as const,
  lookup:   (name: string) => [...chequeKeys.lookups, name] as const,
}
```

### 10.2 Exported Hooks

| Hook | Type | Endpoint | Notes |
|---|---|---|---|
| `usePaginatedCheques(searchTerm, pageSize, statusId)` | `useInfiniteQuery` | `GetChequeInfoGridPagination` | Via `usePaginatedList` helper; `statusId` adds `chequeStatusId` query param |
| `useChequeDetail(id)` | `useQuery` | `GetChequeInfoById/{id}` | Enabled only when `id` is truthy |
| `useChequeStatuses()` | `useQuery` | `GetChequeStatusKeyValue` | staleTime 5 min |
| `useChequeTypes()` | `useQuery` | `GetPaymentMethodKeyValue/1` | staleTime 5 min |
| `useIssuerBanks()` | `useQuery` | `GetBankListKeyValue/0` | staleTime 5 min |
| `useBeneficiaryBanks()` | `useQuery` | `GetBankListKeyValue/1` | staleTime 5 min |
| `useCreateCheque()` | `useMutation` | `POST /AddChequeInfo` | Invalidates `chequeKeys.all` on success |
| `useUpdateCheque()` | `useMutation` | `PUT /UpdateChequeInfo` | Invalidates `chequeKeys.all` + specific `detail` |

### 10.3 Lookup Response Normalization

All lookup endpoints return `{ dataObj: Array<{ key: number, value: string }> }`.
The internal helper `toLookupOptions()` maps them to `ChequeLookupOption[]` sorted alphabetically:

```typescript
function toLookupOptions(items: DropdownOption[] | null | undefined): ChequeLookupOption[] {
  return [...(items ?? [])]
    .map((item) => ({ id: item.key, label: item.value }))
    .sort((left, right) => left.label.localeCompare(right.label))
}
```

### 10.4 Detail Response Normalization

`GetChequeInfoById/{id}` returns either a single object or a single-element array:

```typescript
function normalizeChequeDetail(dataObj: ChequeDetail | ChequeDetail[] | null | undefined) {
  if (Array.isArray(dataObj)) return dataObj[0]
  return dataObj ?? null
}
```

---

## 11. Pagination Strategy (Critical)

### 11.1 Why Not the Legacy Endpoint

The legacy list page used `GET /CustomerPayment/GetChequeInfoGrid` which:
- Returns ALL cheques in a single response
- Has no `pageNumber`, `pageSize`, or `searchTerm` parameters
- Causes slow page load and high memory usage at scale

### 11.2 V2 Paginated Endpoint

```
GET /CustomerPayment/GetChequeInfoGridPagination
  ?pageNumber=1
  &pageSize=50
  &searchTerm=<search text>
  &chequeStatusId=<status id>      ← optional, omit for all
```

Backend C# method: `GetChequeInfoGridPaginationAsync(...)`

Response shape matches the standard V2 paginated response:
```typescript
interface PaginatedPage<T> {
  data: T[]
  totalRecords: number
  pageNumber: number
  pageSize: number
}
```

### 11.3 Pagination Config Registration

```typescript
// v2-octopi/src/config/pagination.ts
export const PAGINATED_LIST_ENDPOINTS = {
  chequeInfo: {
    endpoint: '/CustomerPayment/GetChequeInfoGridPagination',
    pageSize: 50,
    searchParam: 'searchTerm',
  },
  // ...
}
```

### 11.4 Infinite Scroll Pattern

`ChequeListPage` uses TanStack Query's `useInfiniteQuery` through the `usePaginatedList` helper:
- Initial load: page 1, 50 records
- Scroll sentinel (IntersectionObserver) on the last row → triggers `fetchNextPage()`
- Summary badge shows `totalRecords` from page 1 metadata
- Amount badge sums `chequeAmount` across all loaded rows

---

## 12. Page-by-Page Breakdown

### 12.1 `ChequeListPage` (`/cheques`)

**Purpose**: Infinite-scroll paginated table with search and status filter tabs, showing all cheques.

**Key features**:
- `useDebounce(search, 300)` → debounced search input before querying API
- `usePaginatedCheques(debouncedSearch, 50, statusId)` → infinite query; `statusId` adds `chequeStatusId` query param
- Status filter pill tabs: **All** + 7 status buttons (Pending, Cleared, Bounced, Swap, Expired, Returned, On Hold). Selecting a tab sets `statusId` state; TanStack Query detects the key change and automatically resets to page 1
- `CHEQUE_STATUSES` constant defined in `ChequeListPage.tsx` (not fetched from API — it is a stable reference table):
- Loaded Amount badge: sums all `chequeAmount` across loaded pages
- Total Records badge: from `data?.pages[0]?.totalRecords`
- IntersectionObserver sentinel on last row → `fetchNextPage()`
- Each row has two action buttons:
  - **Edit** → navigates to `/cheques/:id/edit`
  - **Status** → opens `ChequeStatusModal` (popup) with that cheque's ID
- Columns: ID, Actions, Customer (with address), Cheque No, Amount, Method, Collector, Status badge, Cheque Date, Placement, Expiry, Collection, Action Date

```typescript
const CHEQUE_STATUSES = [
  { id: 1, label: 'Pending' },
  { id: 2, label: 'Cleared' },
  { id: 3, label: 'Bounced' },
  { id: 4, label: 'Swap' },
  { id: 5, label: 'Expired' },
  { id: 6, label: 'Returned' },
  { id: 7, label: 'On Hold' },
] as const
```

**State**: `search` (string), `statusId` (number | null — active status filter), `statusChequeId` (number | null for popup control)

### 12.2 `AddChequePage` (`/cheques/add`)

**Purpose**: Create a new cheque record.

**Key features**:
- Uses `ChequeForm` with `showStatusFields={false}` (hides status section during creation)
- Default `chequeStatusId: 1` (Pending)
- All date fields default to today via `todayStr()`
- On success: navigates to `/cheques`
- On API error: shows `serverError` from `response.errMsg` or caught error

### 12.3 `EditChequePage` (`/cheques/:id/edit`)

**Purpose**: Full edit of all cheque fields including status.

**Key features**:
- Reads `:id` from route params via `useParams`
- `useChequeDetail(chequeId)` fetches full detail with FK IDs
- `formDefaults` built from `ChequeDetail` fields (maps FK IDs to form field names)
- `collectorLabel` and `customerLabel` passed to `ChequeForm` for `PaginatedCombobox` preloaded labels
- `showStatusFields={false}` — status section hidden in full edit (use popup or status page for status updates)
- On success: navigates to `/cheques`

### 12.4 `EditChequeStatusPage` (`/cheques/:id/status`)

**Purpose**: Standalone page for status-only update (alternative to the popup).

**Key features**:
- Reads `:id` from route params
- Renders `ChequeStatusContent` inside a white card
- On success: navigates to `/cheques`
- This page was added as a dedicated route for deep linking; the primary UX flow uses the modal

---

## 13. Status Update Popup / Modal

The status update popup is the **primary V2 UX pattern** for updating cheque status — matching legacy behavior.

### 13.1 Component Hierarchy

```
ChequeListPage
  └── ChequeStatusModal         (overlay, open/close control)
        └── ChequeStatusContent (data fetching + mutation wiring)
              └── ChequeStatusForm (form UI: status dropdown, action date, remarks)
```

### 13.2 Component Responsibilities

| Component | File | Responsibility |
|---|---|---|
| `ChequeStatusModal` | `ChequeStatusModal.tsx` | Modal overlay (fixed inset, backdrop). Controls open/close via `onClose` prop. Shows Cheque # in heading. |
| `ChequeStatusContent` | `ChequeStatusContent.tsx` | Fetches `useChequeDetail(chequeId)`. Handles loading/error states. Builds full payload merging existing + status data. Calls `useUpdateCheque()`. |
| `ChequeStatusForm` | `ChequeStatusForm.tsx` | Renders read-only cheque summary panel + editable status section. Validates with `chequeStatusSchema`. |

### 13.3 Status Update Flow

1. User clicks **Status** button on a row in `ChequeListPage`
2. `setStatusChequeId(item.chequeInfoId)` → `ChequeStatusModal` renders
3. `ChequeStatusContent` calls `useChequeDetail(chequeId)` → fetches from `GetChequeInfoById/{id}`
4. Read-only summary shows: customer, cheque number, amount, collector, type, issuer bank, dates
5. User selects new status, sets action date, optionally adds remarks
6. On submit: `buildChequePayload(statusFormData, { chequeInfoId, existing: cheque })` constructs full payload
7. `useUpdateCheque()` mutation calls `PUT /CustomerPayment/UpdateChequeInfo`
8. On success: `onClose()` closes the modal; `chequeKeys.all` is invalidated → list auto-refreshes
9. On API error: `response.errMsg` shown inline; on network error: `extractApiErrorMessage(error)` shown

### 13.4 Why Full PUT Instead of Dedicated Status Endpoint

The backend exposes only `UpdateChequeInfo` (full update). There is no dedicated `/UpdateChequeStatus` endpoint. To update only status, `ChequeStatusContent` reconstructs the full payload from the existing detail + new status fields:

```typescript
buildChequePayload(
  {
    chequeCollectedBy: cheque.employeeId,        // preserved from existing
    chequeCollectionDate: cheque.chequeCollectionDate,
    // ...all other existing fields preserved...
    chequeStatusId: data.chequeStatusId,          // new value from form
    chequeActionDate: data.chequeActionDate,       // new value from form
    chequeStatusRemarks: data.chequeStatusRemarks, // new value from form
  },
  { chequeInfoId: chequeId, existing: cheque },
)
```

---

## 14. Dropdown Integration

### 14.1 Static Lookup Dropdowns (DropdownSelect pattern)

These use native `<select>` elements, loaded once with `staleTime: 5 min`:

| Field | Hook | Endpoint |
|---|---|---|
| Cheque Type | `useChequeTypes()` | `/KeyValue/GetPaymentMethodKeyValue/1` |
| Issuer Bank | `useIssuerBanks()` | `/KeyValue/GetBankListKeyValue/0` |
| Beneficiary Bank | `useBeneficiaryBanks()` | `/KeyValue/GetBankListKeyValue/1` |
| Cheque Status | `useChequeStatuses()` | `/KeyValue/GetChequeStatusKeyValue` |

All return `ChequeLookupOption[]` (`{ id: number, label: string }`).

Implementation pattern:
```tsx
<select {...register('chequeTypeId', numericNullable)} disabled={loadingChequeTypes}>
  <option value="">Select cheque type</option>
  {chequeTypes?.map((option) => (
    <option key={option.id} value={option.id}>{option.label}</option>
  ))}
</select>
```

### 14.2 Paginated Combobox (Large Datasets)

Customer and Employee use `PaginatedCombobox` — searchable infinite-scroll combobox:

```tsx
<PaginatedCombobox
  type="customer"
  value={field.value}          // number | null (the ID)
  onValueChange={field.onChange}
  selectedLabel={customerLabel} // pre-loaded name string for Edit page
  placeholder="Search customer"
  hasError={!!fieldState.error}
/>
```

```tsx
<PaginatedCombobox
  type="employee"
  value={field.value}
  onValueChange={field.onChange}
  selectedLabel={collectorLabel}  // pre-loaded "FirstName LastName Code"
  placeholder="Search employee"
  hasError={!!fieldState.error}
/>
```

The `selectedLabel` prop is required on Edit pages so the combobox shows the current name before the user starts typing.

---

## 15. Payload Builder Utility

> File: `v2-octopi/src/pages/cheques/chequePageUtils.ts`

### 15.1 `buildChequePayload(values, options?)`

Central function that maps form data → `ChequePayload`:
- Reads `UserSystemId` from JWT for `createdBy`/`modifiedBy`
- Uses `todayStr()` for `createdDate`/`modifiedDate`
- `chequeInfoId: options?.chequeInfoId ?? 0` — 0 for create
- Empty string dates → `null`
- `chequeStatusRemarks` trimmed, empty string → `null`

### 15.2 `getUserSystemId()`

Decodes JWT claim `UserSystemId` from `localStorage.userInfo.token` via `jwtDecode`.

### 15.3 `todayStr()`

Returns today as `YYYY-MM-DD` string (for date input defaults and payload dates).

### 15.4 `extractApiErrorMessage(error)`

Extracts human-readable error from:
1. `error.body.errMsg` (API error object)
2. `error.body.message`
3. `(error as Error).message`
4. Fallback: `'Something went wrong'`

---

## 16. Component Breakdown

### 16.1 `ChequeForm` — Shared Add/Edit Form

**Props**:
```typescript
interface ChequeFormProps {
  defaultValues?: Partial<ChequeFormData>  // pre-populate for edit
  customerLabel?: string | null            // shown in PaginatedCombobox on edit
  collectorLabel?: string | null           // shown in PaginatedCombobox on edit
  showStatusFields?: boolean               // true = show Status fieldset (default true)
  onSubmit: (data: ChequeFormData) => void
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
}
```

**Fieldsets**:
1. **Collection** — Cheque Collected By (PaginatedCombobox employee), Collection Date, Customer (PaginatedCombobox customer), Cheque Type (`<select>`)
2. **Instrument Details** — Cheque Date, Placement Date, Expire Date, Cheque Number, Cheque Amount, Issuer Bank (`<select>`), Beneficiary Bank (`<select>`, optional)
3. **Status** (hidden when `showStatusFields={false}`) — Action Date, Status (`<select>`), Remarks textarea

**`numericRequired`** transform for Amount: empty string → `NaN` (fails `positive()` validation).
**`numericNullable`** transform for dropdowns: empty string → `null`.

**useEffect reset**: When `defaultValues` changes (edit page data loads), calls `reset(...)` to repopulate form.

### 16.2 `ChequeStatusForm` — Status-Only Form

**Props**: Takes `cheque: ChequeDetail` for the read-only summary panel, plus standard form props.

**Fields**: Status (`<select>`), Action Date (`<input type="date">`), Remarks (textarea).

**Read-only summary panel**: Customer, Cheque Number, Amount (BDT formatted), Collector, Cheque Type, Issuer Bank, Cheque Date, Placement Date, Expire Date.

---

## 17. Execution Plan (Phases)

The V2 cheque module is **fully implemented**. This section documents what was built and in what order for reference.

### Phase 1 — Type System & Schema
- [x] Create `types/cheque.ts` with `ChequeInfo`, `ChequeDetail`, `ChequePayload`, `ApiResponse`
- [x] Create `schemas/chequeSchema.ts` with `chequeFormSchema`, `chequeStatusSchema`

### Phase 2 — Query Hook
- [x] Register `chequeInfo` endpoint in `config/pagination.ts` pointing to `GetChequeInfoGridPagination`
- [x] Create `hooks/useCheques.ts` with `chequeKeys`, all query hooks, and mutation hooks
- [x] Internal helpers: `toLookupOptions()`, `normalizeChequeDetail()`

### Phase 3 — Utility
- [x] Create `pages/cheques/chequePageUtils.ts` with `todayStr()`, `getUserSystemId()`, `buildChequePayload()`, `extractApiErrorMessage()`

### Phase 4 — Form Component
- [x] Create `ChequeForm.tsx` — shared form for Add + Edit with all fieldsets

### Phase 5 — List Page
- [x] Create `ChequeListPage.tsx` — infinite scroll, search, status popup trigger, Edit link
- [x] Create `ChequeStatusModal.tsx` — overlay wrapper
- [x] Create `ChequeStatusContent.tsx` — data fetch + mutation wiring
- [x] Create `ChequeStatusForm.tsx` — status-only form UI

### Phase 6 — Add / Edit Pages
- [x] Create `AddChequePage.tsx`
- [x] Create `EditChequePage.tsx`

### Phase 7 — Standalone Status Page
- [x] Create `EditChequeStatusPage.tsx`

### Phase 8 — Router Registration
- [x] Add lazy imports for all 4 cheque pages in `AppRouter.tsx`
- [x] Register V2 routes: `/cheques`, `/cheques/add`, `/cheques/:id/edit`, `/cheques/:id/status`
- [x] Register legacy redirects: `/cheque/list`, `/cheque/create`
- [x] Register legacy direct route: `/cheque/:id/edit` → renders `EditChequePage`

---

## 18. Implementation Checklist

Use this checklist when implementing or verifying the cheque module from scratch:

### Types & Schema
- [ ] `types/cheque.ts` exports `ApiResponse`, `ChequeLookupOption`, `ChequeInfo`, `ChequeDetail`, `ChequePayload`
- [ ] `schemas/chequeSchema.ts` exports `chequeFormSchema`, `chequeStatusSchema`, `ChequeFormData`, `ChequeStatusFormData`
- [ ] `requiredDropdownId` uses `.nullable().refine(v => v != null && v > 0, message)` pattern

### Hook
- [ ] `config/pagination.ts` has `chequeInfo: { endpoint: '/CustomerPayment/GetChequeInfoGridPagination', pageSize: 50, searchParam: 'searchTerm' }`
- [ ] `usePaginatedCheques(searchTerm, pageSize, statusId)` uses `usePaginatedList` helper; passes `{ chequeStatusId: statusId }` as `extraParams` when `statusId != null`
- [ ] `useChequeDetail(id)` is `enabled: !!id` — does NOT fire when id is 0 or undefined
- [ ] `useChequeDetail` normalizes array-or-object response via `normalizeChequeDetail`
- [ ] Lookup hooks all have `staleTime: 5 * 60_000` and `refetchOnWindowFocus: false`
- [ ] `useCreateCheque` invalidates `chequeKeys.all` on success
- [ ] `useUpdateCheque` invalidates `chequeKeys.all` AND `chequeKeys.detail(variables.chequeInfoId)` on success

### Pages
- [ ] `CHEQUE_STATUSES` constant (7 statuses) defined in `ChequeListPage.tsx` — NOT fetched from API
- [ ] `ChequeListPage` has status filter pill tabs: All + 7 statuses; active tab = dark pill, inactive = light bordered pill
- [ ] Selecting a status tab sets `statusId` state; TanStack Query resets to page 1 automatically (new query key)
- [ ] `ChequeListPage` debounces search with 300ms delay
- [ ] `ChequeListPage` reads `totalRecords` from `data?.pages[0]?.totalRecords`
- [ ] `ChequeListPage` has IntersectionObserver sentinel on last row for infinite scroll
- [ ] `AddChequePage` passes `showStatusFields={false}` and `chequeStatusId: 1` default
- [ ] `EditChequePage` passes `collectorLabel` and `customerLabel` from detail response
- [ ] `EditChequePage` maps `cheque.employeeId` → `chequeCollectedBy`, `cheque.chequeMethodInfoId` → `chequeTypeId`
- [ ] Status update calls `buildChequePayload` with **all existing fields preserved** + new status fields
- [ ] Status popup re-fetches cheque detail on open (TanStack Query cache hit or network fetch)
- [ ] All pages show loading spinner (Loader2 + animate-spin) and error panel (AlertCircle + red border)

### Router
- [ ] Legacy `/cheque/list` redirects to `/cheques`
- [ ] Legacy `/cheque/create` redirects to `/cheques/add`
- [ ] Legacy `/cheque/:id/edit` renders `EditChequePage` directly

### Styling Conventions
- [ ] Color palette: `gray-*` only — NO slate, blue, indigo
- [ ] Cards: `rounded-xl border border-gray-200 bg-white shadow-sm`
- [ ] Primary button: `bg-gray-800 text-white hover:bg-gray-700`
- [ ] Status badge: `rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700`
- [ ] Input fields: `border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200`

---

## 19. Key Gotchas & Lessons Learned

| Issue | Detail |
|---|---|
| **`GetChequeInfoById` returns array or object** | Backend returns `dataObj` as either `ChequeDetail` or `ChequeDetail[]`. Always normalize with `normalizeChequeDetail(dataObj)` before use. |
| **`chequeInfoId: 0` for create** | The create payload must send `chequeInfoId: 0`. The backend generates the real ID. |
| **Status update must send full payload** | No dedicated status endpoint exists. `UpdateChequeInfo` (PUT) always requires the complete `ChequePayload`. Re-merge all existing fields from `useChequeDetail`. |
| **`numericNullable` for `<select>` dropdowns** | Without this transform, RHF stores empty string instead of `null` when nothing selected, breaking Zod validation. Apply `{ setValueAs: v => v === '' ? null : Number(v) }` to all numeric selects. |
| **`PaginatedCombobox` needs `selectedLabel`** | On Edit pages, the combobox does not auto-populate the name from the ID alone. Pass `customerLabel` / `collectorLabel` from the `ChequeDetail` response so the field shows the name immediately. |
| **`showStatusFields={false}` on Add/Edit pages** | The status section should be hidden in the full form during Add and Edit. Status changes should go through the dedicated Status modal/page. |
| **Search triggers re-fetch, not filter** | The search box in `ChequeListPage` calls the API with a new `searchTerm` param — it does NOT client-side filter. Debounce prevents excessive API calls. |
| **Status filter uses `chequeStatusId` query param** | When a status tab is selected, `chequeStatusId=<id>` is appended to the paginated endpoint URL via `extraParams`. When "All" is selected (`statusId = null`), the param is omitted entirely. |
| **Status tabs are a constant, not a live API call** | `CHEQUE_STATUSES` is a hardcoded constant in `ChequeListPage.tsx` matching the `payment_cheque_status` reference table. Do NOT call `useChequeStatuses()` to populate the tabs — those are for the form select fields. |
| **Changing the status tab resets to page 1** | Because `statusId` is part of the TanStack Query key (`chequeKeys.paginated(search, 50, statusId)`), a tab change creates a new cache entry and `useInfiniteQuery` starts from page 1 automatically. |
| **`useChequeDetail` enabled guard** | Must be `enabled: !!id` — passing `0` or `undefined` must not fire the query. The cheque detail endpoint with `id=0` returns null or errors. |
| **Zod v4 custom messages on `z.number()`** | Use `z.number().nullable().refine(...)` with the `error: '...'` shorthand. The `required_error` option from Zod v3 does not exist in Zod v4. |
| **Legacy bankList type=0 vs type=1** | `/GetBankListKeyValue/0` = issuer banks, `/GetBankListKeyValue/1` = beneficiary banks. Swapping them shows wrong options. |
| **`createdDate` / `modifiedDate` in ISO format** | Backend expects date as string in `YYYY-MM-DD` format, not a full ISO timestamp. `todayStr()` returns the correct format. |
| **Pagination endpoint param naming** | The paginated endpoint uses `searchTerm` (camelCase) as the query parameter. The `config/pagination.ts` entry must set `searchParam: 'searchTerm'`. |
