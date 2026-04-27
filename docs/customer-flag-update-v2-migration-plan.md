# Customer Flag Update — V2 Migration Plan

> **Purpose:** Complete technical reference for migrating the legacy Customer Flag Update module into v2-octopi ERP.
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
10. [Page Breakdown](#10-page-breakdown)
11. [Execution Phases](#11-execution-phases)
12. [Implementation Checklist](#12-implementation-checklist)
13. [Gotchas & Notes](#13-gotchas--notes)

---

## 1. Module Scope & Route Inventory

This is a **simple admin utility page** that lists all customers and allows toggling their active/inactive status via a checkbox (the `customerFlag` field). It supports inline updates — no separate edit form.

| # | Legacy Route | Purpose | Legacy Component |
|---|---|---|---|
| 1 | `/customers/flagupdate` | List all customers with active flag checkbox, search, inline toggle | `CustomerFlagUpdate.js` |

**Single-page module** — no CRUD forms, only inline toggle mutation.

---

## 2. Legacy File Inventory

### 2.1 Page Components

| File | Path | Purpose |
|---|---|---|
| `CustomerFlagUpdate.js` | `src/pages/Customers/CustomerFlagUpdate.js` | Full page: search input, MUI DataGrid with `customerId`, `customerName`, `customerFlag` (checkbox) columns |

### 2.2 Redux Actions Used

| Action | Source File | Purpose |
|---|---|---|
| `listCustomers` | `customerActions.js` | GET all customers |
| `updateCustomerFlag` | `customerActions.js` | PUT toggle active flag for one customer |

---

## 3. Complete API Endpoint Inventory

All endpoints are under base URL: `https://api-v2.algologix.com.bd/api`

| # | Endpoint | Method | Purpose | Request Body |
|---|---|---|---|---|
| 1 | `/Customer/GetAllCustomers` (or existing customer list endpoint) | GET | Fetch all customers with `customerId`, `customerName`, `customerFlag` | None |
| 2 | `/Customer/UpdateCustomerFlag` | PUT | Toggle active flag for a specific customer | `{ customerId: number, customerFlag: 0 | 1 }` |

> **Note:** The legacy `listCustomers` action calls the general customer list endpoint. Confirm the exact endpoint path from the existing `customerActions.js`. In V2, reuse the same customer list endpoint already used by the customers module if it includes `customerFlag` in the response.

---

## 4. Data Models & TypeScript Interfaces

The `customerFlag` field type is already defined in the customer type in V2. Verify `v2-octopi/src/types/customer.ts` includes `customerFlag`. If not, add it.

```typescript
// In existing types/customer.ts — add if missing:
export interface CustomerFlagRow {
  customerId: number
  customerName: string
  customerAddress?: string
  customerFlag: 0 | 1   // 1 = active, 0 = inactive
}

// Mutation payload
export interface UpdateCustomerFlagPayload {
  customerId: number
  customerFlag: 0 | 1
}
```

---

## 5. Business Workflow

1. User navigates to `/customers/flag-update`.
2. All customers load with `customerFlag` values.
3. User can search/filter by name or ID (client-side filter).
4. Each row has a checkbox for `customerFlag`. When toggled:
   - **Optimistic update**: immediately update local state so the UI reflects the change instantly.
   - **API call**: PUT `/Customer/UpdateCustomerFlag` with `{ customerId, customerFlag }`.
   - If API call fails, revert the optimistic update.
5. No confirmation dialog required (inline toggle).

---

## 6. Legacy Redux State Management

| Redux Slice | Key | Purpose |
|---|---|---|
| `customerList` | `customers` | All customers array |
| `customerFlagUpdate` | `loading` | Flag update mutation state |

In V2: replace with TanStack Query `useQuery` for list + `useMutation` for flag update.

---

## 7. V2 Architecture & File Organization

Before implementing, read:
- `v2-octopi/AI_DEVELOPER_GUIDE.md` — canonical patterns
- `v2-octopi/V2_IMPLEMENTATION_GUIDE.md` — step-by-step checklists

### Files to Create/Modify

```
v2-octopi/src/
  types/
    customer.ts              ← ADD CustomerFlagRow, UpdateCustomerFlagPayload (if not already present)
  hooks/
    useCustomerFlags.ts      ← query + mutation hooks
  pages/
    customers/
      CustomerFlagUpdatePage.tsx   ← route /customers/flag-update
```

> Check if `hooks/useCustomers.ts` already exists. If so, add the flag update mutation there instead of creating a new hooks file.

---

## 8. V2 Route Mapping (Legacy → V2)

| Legacy Route | V2 Route |
|---|---|
| `/customers/flagupdate` | `/customers/flag-update` |

Add redirect in `AppRouter.tsx`:
```typescript
{ path: '/customers/flagupdate', element: <Navigate to="/customers/flag-update" replace /> }
```

---

## 9. Hook Design

Create or add to `v2-octopi/src/hooks/useCustomerFlags.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { CustomerFlagRow, UpdateCustomerFlagPayload, ApiResponse } from '@/types/customer'

export const customerFlagKeys = {
  all: ['customerFlags'] as const,
  list: () => [...customerFlagKeys.all, 'list'] as const,
}

export function useCustomerFlagList() {
  return useQuery({
    queryKey: customerFlagKeys.list(),
    queryFn: async () => {
      // Reuse the existing customer list endpoint — adjust path if different
      const res = await apiClient.get<ApiResponse<CustomerFlagRow[]>>('/Customer/GetAllCustomers')
      return res.dataObj ?? []
    },
    staleTime: 30_000,
  })
}

export function useUpdateCustomerFlag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCustomerFlagPayload) =>
      apiClient.put('/Customer/UpdateCustomerFlag', payload),
    onMutate: async (payload) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: customerFlagKeys.list() })
      const previous = queryClient.getQueryData<CustomerFlagRow[]>(customerFlagKeys.list())
      queryClient.setQueryData<CustomerFlagRow[]>(customerFlagKeys.list(), (old = []) =>
        old.map(c =>
          c.customerId === payload.customerId
            ? { ...c, customerFlag: payload.customerFlag }
            : c
        )
      )
      return { previous }
    },
    onError: (_err, _payload, context) => {
      // Revert optimistic update on failure
      if (context?.previous) {
        queryClient.setQueryData(customerFlagKeys.list(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customerFlagKeys.list() })
    },
  })
}
```

---

## 10. Page Breakdown

### `CustomerFlagUpdatePage.tsx` (`/customers/flag-update`)

**State:**
```typescript
const [searchText, setSearchText] = useState('')
```

**Hooks:**
```typescript
const { data: customers = [], isLoading } = useCustomerFlagList()
const updateFlag = useUpdateCustomerFlag()
```

**Client-side filter:**
```typescript
const filtered = customers.filter(c =>
  c.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
  String(c.customerId).includes(searchText)
)
```

**Layout:**
1. Page header: "Customer Flag Management" / subtitle: "Toggle customer active status"
2. Search input (`<input type="text">`) — client-side filter
3. Table with columns:
   - **ID** — `customerId`
   - **Customer Name** — `customerName`
   - **Active** — toggle checkbox: `<input type="checkbox" checked={c.customerFlag === 1} onChange={...} />`
4. Loading skeleton while `isLoading`
5. Empty state if `filtered.length === 0`

**Toggle handler:**
```typescript
const handleToggle = (customerId: number, currentFlag: 0 | 1) => {
  updateFlag.mutate({ customerId, customerFlag: currentFlag === 1 ? 0 : 1 })
}
```

**Table styling (Tailwind):**
```
<table class="w-full text-sm text-gray-700">
  <thead class="bg-gray-100 text-xs text-gray-500 uppercase">
  <tbody>
    <tr class="border-b border-gray-100 hover:bg-gray-50">
      <!-- checkbox cell -->
      <td class="px-4 py-2">
        <input type="checkbox" checked={row.customerFlag === 1} ... class="h-4 w-4 rounded border-gray-300" />
      </td>
```

---

## 11. Execution Phases

### Phase 1 — Types & Hook
1. Add `CustomerFlagRow`, `UpdateCustomerFlagPayload` to `types/customer.ts`
2. Create `hooks/useCustomerFlags.ts` with `useCustomerFlagList` + `useUpdateCustomerFlag`

### Phase 2 — Page
3. Create `pages/customers/CustomerFlagUpdatePage.tsx`
4. Add route + legacy redirect in `AppRouter.tsx`

---

## 12. Implementation Checklist

- [ ] `CustomerFlagRow` interface added to `types/customer.ts`
- [ ] `UpdateCustomerFlagPayload` interface added to `types/customer.ts`
- [ ] `useCustomerFlagList` hook — fetches customer list with `customerFlag`
- [ ] `useUpdateCustomerFlag` hook — PUT mutation with optimistic update + rollback
- [ ] `CustomerFlagUpdatePage.tsx` — search input, table, checkbox toggle
- [ ] Optimistic update correctly reverts on API error
- [ ] Route `/customers/flag-update` registered in `AppRouter.tsx`
- [ ] Legacy redirect `/customers/flagupdate` → `/customers/flag-update`
- [ ] Named exports only
- [ ] `@/` alias throughout
- [ ] No MUI — Tailwind `gray-*` only

---

## 13. Gotchas & Notes

1. **`customerFlag` is `0 | 1` (integer), not boolean** — the PUT payload sends `{ customerId, customerFlag: 0 | 1 }`. Do NOT convert to `true/false`.

2. **Optimistic update pattern** — use TanStack Query's `onMutate` / `onError` rollback pattern (shown in §9). This is the same pattern used in other V2 list pages.

3. **Existing customer list endpoint** — verify the exact path. The legacy action calls `listCustomers()` which hits the general customer list endpoint. If that endpoint already exists and is used in the customers module (`/customers`), reuse the same endpoint path in `useCustomerFlagList`. Do NOT call a new endpoint if one already works.

4. **`customerFlag` in customer type** — check `v2-octopi/src/types/customer.ts` for existing `Customer` interface. If `customerFlag` is already there, do not add a duplicate — just extend the existing type.

5. **No pagination needed** — this module lists all customers without server-side pagination. Use a simple `useQuery` (not `usePaginatedList`). The legacy code uses a DataGrid with client-side pagination.

6. **Checkbox disabled state** — while `updateFlag.isPending`, disable the checkbox to prevent double-toggles:
   ```tsx
   <input type="checkbox" disabled={updateFlag.isPending} ... />
   ```

7. **Error toast** — show an error notification (use your V2 toast/notification system) if the mutation fails, so the user knows the optimistic update was reverted.
