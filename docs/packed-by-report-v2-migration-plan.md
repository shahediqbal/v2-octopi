# Repacking Packed By Report — V2 Migration Plan

> **Purpose:** Complete technical reference for migrating the legacy Repacking Packed By Report module into v2-octopi ERP.
> **Audience:** AI agents, developers performing the migration.
> **Last Updated:** 2026-04-13

---

## Table of Contents

1. [Module Scope & Route Inventory](#1-module-scope--route-inventory)
2. [Legacy File Inventory](#2-legacy-file-inventory)
3. [Complete API Endpoint Inventory](#3-complete-api-endpoint-inventory)
4. [Data Models & TypeScript Interfaces](#4-data-models--typescript-interfaces)
5. [Business Workflow](#5-business-workflow)
6. [Filter Parameters](#6-filter-parameters)
7. [V2 Architecture & File Organization](#7-v2-architecture--file-organization)
8. [V2 Route Mapping (Legacy → V2)](#8-v2-route-mapping-legacy--v2)
9. [Hook Design](#9-hook-design)
10. [Page Breakdown](#10-page-breakdown)
11. [Excel Export](#11-excel-export)
12. [Execution Phases](#12-execution-phases)
13. [Implementation Checklist](#13-implementation-checklist)
14. [Gotchas & Notes](#14-gotchas--notes)

---

## 1. Module Scope & Route Inventory

This module is a **read-only filter report** for repacking operations. It shows which employees packed which products, for which customers, within a date range.

| # | Legacy Route | Purpose | Legacy Component |
|---|---|---|---|
| 1 | `/report/packedbyreport` | Filter form + results table + Excel export | `RepackingPackedByReport.js` |

**Single-page module** — no CRUD, no navigation to detail pages.

---

## 2. Legacy File Inventory

### 2.1 Page Components

| File | Path | Purpose |
|---|---|---|
| `RepackingPackedByReport.js` | `src/pages/Reports/PackingBy/RepackingPackedByReport.js` | Full page: filter form (date range, customer, employee, system ID, product) + results table + Excel export |

### 2.2 Shared Components Used

| Component | Source | Purpose |
|---|---|---|
| `CustomerAutocomplete` | `src/shared/components/autocomplete` | Customer search autocomplete |
| `EmployeeAutocomplete` | `src/shared/components/autocomplete` | Employee search autocomplete |
| `ProductAutocomplete` | `src/shared/components/autocomplete` | Product search autocomplete |
| `Datepicker` | `src/core/controls/Datepicker` | Date picker input |
| `exportToExcelExcelJs` | `src/utils/json-to-excel-export-exceljs` | Excel export utility |

In V2, replace with:
- `DropdownSelect` for customer, employee, product dropdowns
- Native `<input type="date">` with RHF
- `lazyExportExcel.ts` wrapper for Excel

---

## 3. Complete API Endpoint Inventory

All endpoints are under base URL: `https://api-v2.algologix.com.bd/api`

| # | Endpoint | Method | Purpose | Query Params |
|---|---|---|---|---|
| 1 | `/Report/GetRepackingPackedBy` | GET | Fetch report data with optional filters | See §6 |

---

## 4. Data Models & TypeScript Interfaces

Add to a shared types file or create `v2-octopi/src/types/packedByReport.ts`:

```typescript
// ─── Filter Parameters ───
export interface PackedByReportFilters {
  startDate?: string    // "YYYY-MM-DD" or empty
  endDate?: string      // "YYYY-MM-DD" or empty
  customerId?: number   // optional
  employeeId?: number   // optional
  soSystemId?: number   // optional (manual invoice/system ID input)
  productId?: number    // optional
}

// ─── Report Row ───
export interface PackedByReportRow {
  soSystemId: number
  soSystemNo: string         // Invoice number
  customerName: string
  productName: string
  sopProductQty: number      // Quantity packed
  packTypeName: string       // e.g. "Cartoon", "Poly Bag"
  sopPackSize: number        // Units per pack
  sopNoPack: number          // Number of packs
  empFirstName: string | null
  empLastName: string | null
  entryDate: string | null
}

export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}
```

---

## 5. Business Workflow

1. User visits `/reports/packed-by`.
2. Fills optional filter form: start date, end date, customer, employee, system ID, product.
3. Clicks "Generate Report" — GET `/Report/GetRepackingPackedBy?{params}`.
4. Results appear in a table below the filter form.
5. User can click "Export to Excel" to download the report as `.xlsx`.

All filters are **optional** — submitting with no filters returns all data.

---

## 6. Filter Parameters

The legacy code builds query params as:

```
/Report/GetRepackingPackedBy?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&customerId=N&employeeId=N&soSystemId=N&productId=N
```

Only non-empty values are appended. Empty string dates are not sent.

---

## 7. V2 Architecture & File Organization

Before implementing, read:
- `v2-octopi/AI_DEVELOPER_GUIDE.md` — canonical patterns
- `v2-octopi/V2_IMPLEMENTATION_GUIDE.md` — step-by-step checklists

### Files to Create

```
v2-octopi/src/
  types/
    packedByReport.ts              ← interfaces (§4)
  hooks/
    usePackedByReport.ts           ← query hook
  pages/
    reports/
      PackedByReportPage.tsx       ← route /reports/packed-by
```

No schema file needed (filter form has no strict validation — all fields optional).

---

## 8. V2 Route Mapping (Legacy → V2)

| Legacy Route | V2 Route |
|---|---|
| `/report/packedbyreport` | `/reports/packed-by` |

Add redirect in `AppRouter.tsx`:
```typescript
{ path: '/report/packedbyreport', element: <Navigate to="/reports/packed-by" replace /> }
```

---

## 9. Hook Design

Create `v2-octopi/src/hooks/usePackedByReport.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { PackedByReportRow, PackedByReportFilters, ApiResponse } from '@/types/packedByReport'

export const packedByReportKeys = {
  all: ['packedByReport'] as const,
  filtered: (filters: PackedByReportFilters) =>
    [...packedByReportKeys.all, filters] as const,
}

export function usePackedByReport(filters: PackedByReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: packedByReportKeys.filtered(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.customerId) params.append('customerId', String(filters.customerId))
      if (filters.employeeId) params.append('employeeId', String(filters.employeeId))
      if (filters.soSystemId) params.append('soSystemId', String(filters.soSystemId))
      if (filters.productId) params.append('productId', String(filters.productId))

      const res = await apiClient.get<ApiResponse<PackedByReportRow[]>>(
        `/Report/GetRepackingPackedBy?${params.toString()}`
      )
      return res.dataObj ?? []
    },
    enabled,
    staleTime: 0,   // Report data should always be fresh
  })
}
```

**Key design decision:** `enabled` is driven by the user clicking "Generate Report", not by automatic fetching. Use `useState<boolean>(false)` for `enabled` and set it to `true` on form submit. Reset to `false` after each new filter change so the table clears until the next submit.

Alternative simpler pattern: store submitted filters in state, only render the query when `submittedFilters !== null`.

---

## 10. Page Breakdown

### `PackedByReportPage.tsx` (`/reports/packed-by`)

**State:**
```typescript
const [submittedFilters, setSubmittedFilters] = useState<PackedByReportFilters | null>(null)
```

**Form (React Hook Form):**
```typescript
const { register, handleSubmit, control, reset } = useForm<PackedByReportFilters>({
  defaultValues: { startDate: '', endDate: '', soSystemId: undefined }
})

const onSubmit = (values: PackedByReportFilters) => {
  setSubmittedFilters(values)
}
```

**Query:**
```typescript
const { data: reportData = [], isLoading } = usePackedByReport(
  submittedFilters ?? {},
  submittedFilters !== null
)
```

**Layout:**
1. Page header: "Repacking Packed By Report"
2. Filter card (`rounded-xl border border-gray-200 bg-white shadow-sm p-6`):
   - Row 1: Start Date, End Date
   - Row 2: Customer dropdown (`DropdownSelect` type `customer`), Employee dropdown (`DropdownSelect` type `employee`)
   - Row 3: System ID text input, Product dropdown (`DropdownSelect` type `product`)
   - Row 4: "Generate Report" button + "Export to Excel" button (disabled when no data)
3. Results table (shown only when `submittedFilters !== null`):
   - Loading skeleton while `isLoading`
   - "No data found" empty state if `reportData.length === 0`
   - Table columns: System ID, Invoice No., Customer, Product, Quantity, Pack Type, Pack Size, No of Packs, Packed By (`${empFirstName} ${empLastName}`), Entry Date

**Table row styling:**
- Alternating row background: `even:bg-gray-50`
- Header row: `bg-gray-100 text-gray-700 text-xs font-semibold uppercase`

---

## 11. Excel Export

Use `lazyExportExcel.ts` from V2. Column mapping:

```typescript
const exportData = reportData.map(item => ({
  systemId: item.soSystemId,
  invoiceNo: item.soSystemNo,
  customer: item.customerName,
  product: item.productName,
  quantity: item.sopProductQty,
  packType: item.packTypeName,
  packSize: item.sopPackSize,
  numPacks: item.sopNoPack,
  packedBy: item.empFirstName ? `${item.empFirstName} ${item.empLastName}` : 'N/A',
  entryDate: item.entryDate ?? 'N/A',
}))

const headers = {
  systemId: 'System ID',
  invoiceNo: 'Invoice No',
  customer: 'Customer',
  product: 'Product',
  quantity: 'Quantity',
  packType: 'Pack Type',
  packSize: 'Pack Size',
  numPacks: 'No of Packs',
  packedBy: 'Packed By',
  entryDate: 'Entry Date',
}
```

Sheet name: `"Repacking Packed By Report"`
File name: `` `Repacking_Report_${new Date().toISOString().slice(0, 10)}` ``

---

## 12. Execution Phases

### Phase 1 — Types & Hook
1. Create `types/packedByReport.ts`
2. Create `hooks/usePackedByReport.ts`

### Phase 2 — Page
3. Create `pages/reports/PackedByReportPage.tsx`
4. Add route in `AppRouter.tsx`
5. Add legacy redirect

---

## 13. Implementation Checklist

- [ ] `types/packedByReport.ts` — `PackedByReportFilters`, `PackedByReportRow` interfaces
- [ ] `hooks/usePackedByReport.ts` — query with `enabled` param, all 6 filter params
- [ ] `PackedByReportPage.tsx` — filter form, generate button, results table, Excel export
- [ ] Export function uses `lazyExportExcel.ts` with all 10 columns
- [ ] Route `/reports/packed-by` registered in `AppRouter.tsx`
- [ ] Legacy redirect `/report/packedbyreport` → `/reports/packed-by`
- [ ] Named exports only
- [ ] `@/` alias used throughout
- [ ] No MUI — Tailwind `gray-*` only
- [ ] Table shows empty state when no data
- [ ] Excel button disabled when `reportData.length === 0`

---

## 14. Gotchas & Notes

1. **All filters are optional** — do not add Zod schema validation with required fields. The API accepts empty params.

2. **`enabled` vs auto-fetch** — this is a report page, NOT a live data page. The query must only execute when the user clicks "Generate Report". Use the `submittedFilters !== null` pattern to gate the query.

3. **`soSystemId` filter is a number input** — use `type="number"` with `setValueAs: v => v === '' ? undefined : Number(v)` in React Hook Form to avoid sending `NaN`.

4. **`packedBy` display** — the API returns `empFirstName` and `empLastName` as separate fields. Combine them: `item.empFirstName ? \`${item.empFirstName} ${item.empLastName}\` : 'N/A'`.

5. **API returns `null` dataObj when no results** — guard with `?? []` when destructuring: `return res.dataObj ?? []`.

6. **DropdownSelect types** — use registered types `customer`, `employee`, `product` from the dropdown registry in `types/dropdown.ts`. Do not call their APIs directly.

7. **Date format** — the API expects `"YYYY-MM-DD"`. The native `<input type="date">` returns this format by default — no transformation needed.
