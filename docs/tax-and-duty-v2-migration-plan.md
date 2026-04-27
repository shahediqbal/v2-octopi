# Tax & Duty (Customer Tax Duty) — V2 Migration Plan

> **Purpose:** Complete technical reference for migrating the legacy Customer Tax & Duty module into v2-octopi ERP.
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
7. [V2 Architecture & File Organization](#7-v2-architecture--file-organization)
8. [V2 Route Mapping (Legacy → V2)](#8-v2-route-mapping-legacy--v2)
9. [Hook Design](#9-hook-design)
10. [Form Schema Design (Zod)](#10-form-schema-design-zod)
11. [Page Breakdowns](#11-page-breakdowns)
12. [Execution Phases](#12-execution-phases)
13. [Implementation Checklist](#13-implementation-checklist)
14. [Gotchas & Notes](#14-gotchas--notes)

---

## 1. Module Scope & Route Inventory

This module manages **customer-specific tax and duty rates** (AIT and VAT percentages) with effective dates. It is a full CRUD module with list, add, edit, and delete.

| # | Legacy Route | Purpose | Legacy Component |
|---|---|---|---|
| 1 | `/customers/taxndutylist` | List all tax & duty records | `TaxAndDutyList.js` |
| 2 | `/taxandduty/add` | Add new tax & duty record | `AddTaxAndDuty.js` |
| 3 | `/taxandduty/:id/edit` | Edit existing tax & duty record | `EditTaxAndDuty.js` |
| 4 | *(delete from list page)* | Delete a tax & duty record | Inline delete in `TaxAndDutyList.js` |

---

## 2. Legacy File Inventory

### 2.1 Page Components

| File | Path | Purpose |
|---|---|---|
| `TaxAndDutyList.js` | `src/pages/Customers/TaxAndDuty/TaxAndDutyList.js` | MUI DataGrid list; Edit button navigates to edit page; Delete uses `ConfirmDialog` |
| `AddTaxAndDuty.js` | `src/pages/Customers/TaxAndDuty/AddTaxAndDuty.js` | Formik form; fields: customer autocomplete, AIT %, VAT %, effective date |
| `EditTaxAndDuty.js` | `src/pages/Customers/TaxAndDuty/EditTaxAndDuty.js` | Formik form pre-populated; same fields as Add; `enableReinitialize: true` |

### 2.2 Redux Actions

| Action | Source File | Purpose |
|---|---|---|
| `getCustomerTaxDuties` | `customerTaxDutyActions.js` | GET all tax duties |
| `getCustomerTaxDutyById` | `customerTaxDutyActions.js` | GET single by ID |
| `addCustomerTaxDuty` | `customerTaxDutyActions.js` | POST create |
| `updateCustomerTaxDuty` | `customerTaxDutyActions.js` | PUT update (includes ID in body) |
| `deleteCustomerTaxDuty` | `customerTaxDutyActions.js` | DELETE by ID |
| `fetchCustomerAutocomplete` | `customerActions.js` | GET customer name/id pairs for autocomplete |

---

## 3. Complete API Endpoint Inventory

All endpoints are under base URL: `https://api-v2.algologix.com.bd/api`

| # | Endpoint | Method | Purpose | Request Body / Params |
|---|---|---|---|---|
| 1 | `/Customer/GetAllCustomerTaxDuty` | GET | Fetch all tax duty records | None |
| 2 | `/Customer/ByIdCustomerTaxDuty/{id}` | GET | Fetch single record by `customerTaxDutyId` | Path param |
| 3 | `/Customer/AddCustomerTaxDuty` | POST | Create new tax duty | JSON body (see §4) |
| 4 | `/Customer/UpdateCustomerTaxDuty` | PUT | Update existing (ID in body) | JSON body (see §4) |
| 5 | `/Customer/DeleteCustomerTaxDuty/{id}` | DELETE | Delete by `customerTaxDutyId` | Path param |
| 6 | `/KeyValue/GetCustomerName` | GET | Customer dropdown options (used for autocomplete) | None |

---

## 4. Data Models & TypeScript Interfaces

Create `v2-octopi/src/types/taxAndDuty.ts`:

```typescript
// ─── Tax Duty List Row ───
export interface TaxDutyRow {
  customerTaxDutyId: number
  customerId: number
  customerName: string
  customerAddress: string
  customerAitPercentage: number    // 0–100
  customerVatPercentage: number    // 0–100
  effectiveDate: string            // ISO date string "YYYY-MM-DDTHH:mm:ss"
}

// ─── Single Detail (from ByIdCustomerTaxDuty) ───
export interface TaxDutyDetail {
  customerTaxDutyId: number
  customerId: number
  customerName: string
  customerAitPercentage: number
  customerVatPercentage: number
  effectiveDate: string
}

// ─── Create Payload ───
export interface CreateTaxDutyPayload {
  customerId: number
  customerAitPercentage: number
  customerVatPercentage: number
  effectiveDate: string            // "YYYY-MM-DD"
}

// ─── Update Payload (includes ID in body) ───
export interface UpdateTaxDutyPayload {
  customerTaxDutyId: number
  customerId: number
  customerAitPercentage: number
  customerVatPercentage: number
  effectiveDate: string
}

export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}
```

---

## 5. Business Workflow

1. User visits `/tax-duty` — sees a list of all customer tax & duty records.
2. Click "+ Add" → navigate to `/tax-duty/add`.
   - Select customer (dropdown from `/KeyValue/GetCustomerName`)
   - Enter AIT % (0–100)
   - Enter VAT % (0–100)
   - Enter effective date (must not be in the future — legacy uses Yup `max(new Date())`)
   - Submit → POST → redirect to list
3. Click Edit icon on a row → navigate to `/tax-duty/:id/edit`.
   - Form pre-populated from `ByIdCustomerTaxDuty/{id}`
   - Update → PUT with `customerTaxDutyId` in body → redirect to list
4. Click Delete on a row → confirm dialog → DELETE → refresh list.

---

## 6. Legacy Redux State Management

| Redux Slice | Key | Purpose |
|---|---|---|
| `customerTaxDutyList` | `taxDuties`, `loading`, `error` | List state |
| `customerTaxDutyDetails` | `taxDuty`, `loading` | Single detail for edit form |
| `customerTaxDutyCreate` | `success`, `loading`, `error` | Create mutation state |
| `customerTaxDutyUpdate` | `success`, `loading` | Update mutation state |
| `customerTaxDutyDelete` | `success` | Delete mutation state (triggers list refresh) |
| `customerAutocompleteState` | `linkCustomer` | Customer dropdown options |

In V2: replace all Redux slices with TanStack Query.

---

## 7. V2 Architecture & File Organization

Before implementing, read:
- `v2-octopi/AI_DEVELOPER_GUIDE.md` — canonical patterns
- `v2-octopi/V2_IMPLEMENTATION_GUIDE.md` — CRUD checklist

### Files to Create

```
v2-octopi/src/
  types/
    taxAndDuty.ts                      ← all interfaces (§4)
  schemas/
    taxAndDutySchema.ts                ← Zod form validation
  hooks/
    useTaxAndDuty.ts                   ← all TanStack Query hooks
  pages/
    tax-duty/
      TaxDutyListPage.tsx              ← route /tax-duty
      AddTaxDutyPage.tsx               ← route /tax-duty/add
      EditTaxDutyPage.tsx              ← route /tax-duty/:id/edit
```

---

## 8. V2 Route Mapping (Legacy → V2)

| Legacy Route | V2 Route | Notes |
|---|---|---|
| `/customers/taxndutylist` | `/tax-duty` | List page |
| `/taxandduty/add` | `/tax-duty/add` | Add page |
| `/taxandduty/:id/edit` | `/tax-duty/:id/edit` | Edit page |

Add legacy redirects in `AppRouter.tsx`:
```typescript
{ path: '/customers/taxndutylist', element: <Navigate to="/tax-duty" replace /> },
{ path: '/taxandduty/add', element: <Navigate to="/tax-duty/add" replace /> },
{ path: '/taxandduty/:id/edit', element: <Navigate to={`/tax-duty/${id}/edit`} replace /> },
```

---

## 9. Hook Design

Create `v2-octopi/src/hooks/useTaxAndDuty.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  TaxDutyRow, TaxDutyDetail,
  CreateTaxDutyPayload, UpdateTaxDutyPayload,
  ApiResponse
} from '@/types/taxAndDuty'

export const taxDutyKeys = {
  all: ['taxDuty'] as const,
  list: () => [...taxDutyKeys.all, 'list'] as const,
  detail: (id: number) => [...taxDutyKeys.all, 'detail', id] as const,
}

export function useTaxDutyList() {
  return useQuery({
    queryKey: taxDutyKeys.list(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TaxDutyRow[]>>(
        '/Customer/GetAllCustomerTaxDuty'
      )
      return res.dataObj ?? []
    },
    staleTime: 30_000,
  })
}

export function useTaxDutyDetail(id: number) {
  return useQuery({
    queryKey: taxDutyKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TaxDutyDetail>>(
        `/Customer/ByIdCustomerTaxDuty/${id}`
      )
      return res.dataObj
    },
    enabled: !!id,
  })
}

export function useCreateTaxDuty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaxDutyPayload) =>
      apiClient.post('/Customer/AddCustomerTaxDuty', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxDutyKeys.list() })
    },
  })
}

export function useUpdateTaxDuty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateTaxDutyPayload) =>
      apiClient.put('/Customer/UpdateCustomerTaxDuty', payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taxDutyKeys.list() })
      queryClient.invalidateQueries({ queryKey: taxDutyKeys.detail(variables.customerTaxDutyId) })
    },
  })
}

export function useDeleteTaxDuty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/Customer/DeleteCustomerTaxDuty/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxDutyKeys.list() })
    },
  })
}
```

---

## 10. Form Schema Design (Zod)

Create `v2-octopi/src/schemas/taxAndDutySchema.ts`:

```typescript
import { z } from 'zod'

export const taxDutyFormSchema = z.object({
  customerId: z.number({ error: 'Customer is required' }).positive('Customer is required'),
  customerAitPercentage: z
    .number({ error: 'AIT percentage is required' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  customerVatPercentage: z
    .number({ error: 'VAT percentage is required' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  effectiveDate: z
    .string()
    .min(1, 'Effective date is required')
    .refine(
      (d) => new Date(d) <= new Date(),
      'Effective date cannot be in the future'
    ),
})

export type TaxDutyFormValues = z.infer<typeof taxDutyFormSchema>
```

> **Zod v4 gotcha:** Use `{ error: '...' }` not `{ required_error: '...' }` for `z.number()` required messages.

---

## 11. Page Breakdowns

### 11.1 `TaxDutyListPage.tsx` (`/tax-duty`)

- Fetch: `useTaxDutyList()`
- Delete: `useDeleteTaxDuty()` — show a confirm dialog before calling
- UI:
  - Toolbar with "+ Add Tax & Duty" button → navigate to `/tax-duty/add`
  - Table columns: ID, Customer Name, Address, AIT (%), VAT (%), Effective Date, Actions
  - Actions per row: Edit icon → `/tax-duty/:customerTaxDutyId/edit`; Delete icon → confirm dialog → delete mutation
  - Format effective date: `new Date(row.effectiveDate).toLocaleDateString()` — guard against invalid dates with `'N/A'`
  - Loading skeleton while fetching

### 11.2 `AddTaxDutyPage.tsx` (`/tax-duty/add`)

- Uses `DropdownSelect` type `customer` for customer picker (reads `customerId`)
- RHF + Zod schema `taxDutyFormSchema`
- Fields:
  - Customer — `DropdownSelect` (`onChange` sets `customerId` in form)
  - AIT Percentage — `<input type="number" min="0" max="100" step="0.01">`
  - VAT Percentage — `<input type="number" min="0" max="100" step="0.01">`
  - Effective Date — `<input type="date">` with `max={today}`
- On submit: `useCreateTaxDuty()` mutation → on success navigate to `/tax-duty`
- Reset button clears form

### 11.3 `EditTaxDutyPage.tsx` (`/tax-duty/:id/edit`)

- Reads `:id` from `useParams()`, parses as `Number(id)`
- Fetch: `useTaxDutyDetail(Number(id))` — pre-populates form
- Same fields as Add page
- `effectiveDate` — parse from ISO string: `taxDuty.effectiveDate.split('T')[0]` for the date input
- On submit: `useUpdateTaxDuty()` with `customerTaxDutyId` included in payload → on success navigate to `/tax-duty`
- Back button → navigate to `/tax-duty`

---

## 12. Execution Phases

### Phase 1 — Types, Schema, Hooks
1. Create `types/taxAndDuty.ts`
2. Create `schemas/taxAndDutySchema.ts`
3. Create `hooks/useTaxAndDuty.ts`

### Phase 2 — List Page
4. Create `TaxDutyListPage.tsx` with confirm-delete dialog

### Phase 3 — Add & Edit Pages
5. Create `AddTaxDutyPage.tsx`
6. Create `EditTaxDutyPage.tsx`

### Phase 4 — Routing
7. Register routes + legacy redirects in `AppRouter.tsx`

---

## 13. Implementation Checklist

- [ ] `types/taxAndDuty.ts` — `TaxDutyRow`, `TaxDutyDetail`, `CreateTaxDutyPayload`, `UpdateTaxDutyPayload`
- [ ] `schemas/taxAndDutySchema.ts` — `taxDutyFormSchema` with 4 fields + date future validation
- [ ] `hooks/useTaxAndDuty.ts` — 5 hooks: list, detail, create, update, delete
- [ ] `TaxDutyListPage.tsx` — table, edit/delete actions, confirm dialog
- [ ] `AddTaxDutyPage.tsx` — customer dropdown, AIT%, VAT%, effectiveDate, create mutation
- [ ] `EditTaxDutyPage.tsx` — pre-populated, update mutation with `customerTaxDutyId` in body
- [ ] Routes registered: `/tax-duty`, `/tax-duty/add`, `/tax-duty/:id/edit`
- [ ] Legacy redirects: `/customers/taxndutylist`, `/taxandduty/add`, `/taxandduty/:id/edit`
- [ ] Named exports only
- [ ] `@/` alias throughout
- [ ] No MUI — Tailwind only
- [ ] `DropdownSelect` used for customer (not raw `<select>`)
- [ ] `effectiveDate` rendered with `split('T')[0]` in edit form

---

## 14. Gotchas & Notes

1. **`customerTaxDutyId` in UPDATE body** — the legacy `updateCustomerTaxDuty` action sends `{ ...payload, customerTaxDutyId: id }` in the PUT body (not as a path param). Match this exactly in V2: include `customerTaxDutyId` in the `UpdateTaxDutyPayload` and send it in the request body.

2. **`getRowId` for MUI DataGrid (legacy)** — the legacy list uses a compound row ID: `` `${customerTaxDutyId}-${customerName}` ``. In V2, use a simple `<table>` with `row.customerTaxDutyId` as the key. No DataGrid in V2.

3. **Edit route typo in legacy** — the legacy `handleEvent` navigates to `` `/taxandduty/${params.row.customerTaxDutyId}edit/` `` (missing slash before `edit`). This appears to be a bug in legacy. In V2, use the correct path `/tax-duty/:id/edit`.

4. **`effectiveDate` format** — the API returns ISO datetime (`"2024-01-15T00:00:00"`). The date input needs `"YYYY-MM-DD"` format. Use `.split('T')[0]` to extract the date part for the form initial value.

5. **`max={today}` on date input** — the effective date must not be in the future. Set `max` attribute on the date input to today's date:
   ```tsx
   <input type="date" max={new Date().toISOString().split('T')[0]} ... />
   ```

6. **Customer dropdown** — use `DropdownSelect` with registered type `customer`. The dropdown value should bind to `customerId` (integer). In Add page, use `setValueAs: v => v === '' ? 0 : Number(v)` or use `DropdownSelect`'s `onChange` to set the value in RHF.

7. **`formatDate` helper** — always guard against invalid dates:
   ```typescript
   const formatDate = (d: string | null) => {
     if (!d) return 'N/A'
     const date = new Date(d)
     return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString()
   }
   ```

8. **Zod v4 `number` required** — use `z.number({ error: 'Field is required' })` not `z.number().min(...)` alone, as `z.number()` without an error message gives a generic error. For percentages, chain `.min(0).max(100)` after.
