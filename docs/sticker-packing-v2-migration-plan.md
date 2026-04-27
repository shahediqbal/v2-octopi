# Stock Out Package Sticker & Packing Print Panel — V2 Migration Plan

> **Purpose:** Complete technical reference for migrating the legacy Stock Out Package Sticker and Packing Print Panel modules into v2-octopi ERP.
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
13. [Component Breakdown](#13-component-breakdown)
14. [Execution Phases](#14-execution-phases)
15. [Implementation Checklist](#15-implementation-checklist)
16. [Gotchas & Notes](#16-gotchas--notes)

---

## 1. Module Scope & Route Inventory

This module manages the **packaging and sticker printing workflow** for stock-out sales orders. It handles defining packing parameters per order, editing existing packing records, and a print panel for bulk sticker printing.

### 1.1 Routes

| # | Legacy Route | Purpose | Legacy Component |
|---|---|---|---|
| 1 | `/stockoutpackagesticker/orderlist` | List of sales orders eligible for sticker packing | `SalesOrderPackageStickerList.js` |
| 2 | `/stockoutpackagesticker/:id/definepacking` | Define packing parameters for a new sticker order | `StockOutDefinePackingForSticker.js` |
| 3 | `/stockoutpackagesticker/:id/editdefinepacking` | Edit existing packing/sticker record | `EditStockOutDefinePackingForSticker.js` |
| 4 | `/packing/printpanel` | Print panel — filter orders by type/date, view sticker modal, print | `PrintInfoPanel.js` |
| 5 | `/sampleSticker/print` | Sample sticker print panel | `SampleStickerPanel.js` |

**V2 will cover routes 1–4 initially. Route 5 (sample sticker) is lower priority.**

---

## 2. Legacy File Inventory

### 2.1 Page Components

| File | Path | Purpose |
|---|---|---|
| `SalesOrderPackageStickerList.js` | `src/pages/Sticker/RepackingSticker/SalesOrderPackageStickerList.js` | Grid list of orders — filter by order type, navigate to define/edit packing |
| `StockOutDefinePackingForSticker.js` | `src/pages/Sticker/RepackingSticker/StockOutDefinePackingForSticker.js` | Create packing record — one row per product in the sales order |
| `EditStockOutDefinePackingForSticker.js` | `src/pages/Sticker/RepackingSticker/EditStockOutDefinePackingForSticker.js` | Edit existing packing record — pre-populated from API |
| `PrintInfoPanel.js` | `src/pages/Sticker/PrintInfoPanel.js` | Print panel — filter by order type dropdown + date range, shows grid, opens sticker modal |
| `SampleStickerPanel.js` | `src/pages/Sticker/SampleStickerPanel.js` | Minimal sticker print for samples |

### 2.2 Core/Shared Components

| File | Path | Purpose |
|---|---|---|
| `PackagingItemSticker.js` | `src/core/PackagingItemSticker.js` | Class component — renders one packing row (packSize, packNo, packType typeahead, packedBy employee dropdown) |
| `SalesOrderStickerModal.js` | `src/core/SalesOrderStickerModal.js` | Modal to view and print sticker label for a sales order |
| `KarjadeshView.js` | `src/core/KarjadeshView.js` | Order task/delivery view modal used within PrintInfoPanel |
| `SalesOrderView.js` | `src/core/SalesOrderView.js` | Order detail view modal used within PrintInfoPanel |

### 2.3 Redux Actions (relevant)

| Action | File | Description |
|---|---|---|
| `listSalesOrderListForPackingAndEditAction` | `invoiceActions.js` | GET list of orders by order type (status number) |
| `listDetailsEditPackingStickerAction` | `invoiceActions.js` | GET existing packing details by sales order ID |
| `createPackingStickerAction` | `invoiceActions.js` | POST create packing sticker record |
| `updatePackingStickerAction` | `invoiceActions.js` | PUT update packing sticker record |
| `listSalesOrderInternalDetails` | `invoiceActions.js` | GET single sales order details (used for "define" page initial data) |

---

## 3. Complete API Endpoint Inventory

All endpoints are under base URL: `https://api-v2.algologix.com.bd/api`

| # | Endpoint | Method | Purpose | Request Payload |
|---|---|---|---|---|
| 1 | `/StockOut/StickerStockOutOrderGridData/{orderType}` | GET | Fetch orders list filtered by order type (integer status: 2=active, 4=packaged, 5=packed, etc.) | Path param |
| 2 | `/StockOut/GetStickerPackagingDetailsForEdit/{salesOrderId}` | GET | Fetch existing packing details for edit | Path param |
| 3 | `/StockOut/CreateStickerPackaging` | POST | Create new packing sticker record | JSON body (see §4) |
| 4 | `/StockOut/UpdateStickerPackaging` | PUT | Update existing packing sticker record | JSON body (see §4) |
| 5 | `/SalesOrderInternal/GetSalesOrderInternalDetails/{id}` | GET | Fetch sales order details (products, quantities) for define-packing page | Path param |
| 6 | `/Product/GetPackType` | GET | Fetch all pack types (`packId`, `packTypeName`) | None |

---

## 4. Data Models & TypeScript Interfaces

Create file: `v2-octopi/src/types/stickerPacking.ts`

```typescript
// ─── Sticker Order List Row ───
export interface StickerOrderRow {
  soSystemId: number
  soSystemNo: string
  invoiceDate: string          // ISO date string
  customerName: string
  customerAddress: string
  jobType: string              // order type label
  soCustomerId: number
  soJobTypeId: number
}

// ─── Pack Type ───
export interface PackType {
  packId: number
  packTypeName: string
}

// ─── Packing Item (one row per product in the order) ───
export interface PackingItem {
  index: string               // "{productId}-{rowIndex}" — unique row key
  productId: number
  productName: string
  packSize: number | string   // number of units per pack
  packNo: number | string     // number of packs
  packQuantity: number | string  // computed: packSize * packNo
  quantity: number            // original confirmed qty from sales order
  packTypeList: PackType[]    // available pack types for typeahead
  sopPackId: number | null    // selected pack type ID
  packedBy: string | number   // employee ID
  packInfo?: { id: number | string; label: string }  // selected pack type display
}

// ─── Create Packing Payload ───
export interface CreateStickerPackagingPayload {
  soSystemId: number
  stockOutPackagingItems: StickerPackagingItemPayload[]
}

// ─── Update Packing Payload ───
export interface UpdateStickerPackagingPayload {
  soSystemId: number
  stockOutPackagingItems: StickerPackagingItemPayload[]
}

// ─── Sticker Packaging Item Payload ───
export interface StickerPackagingItemPayload {
  sopProductId: number
  sopPackSize: number
  sopNoPack: number
  sopProductQty: number
  sopPackId: number | null
  packedBy: string | number
}

// ─── Edit/Detail Response (from GetStickerPackagingDetailsForEdit) ───
export interface StickerPackagingDetail {
  soSystemId: number
  soSystemNo: string
  invoiceDate: string
  customerName: string
  jobType: string
  stockOutPackagingItems: StickerPackagingDetailItem[]
}

export interface StickerPackagingDetailItem {
  sopProductId: number
  productName: string
  sopPackSize: number
  sopNoPack: number
  sopProductQty: number
  sopPackId: number | null
  packTypeName: string | null
  packedBy: number | null
  sodConfirmedQty: number
}

export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}
```

---

## 5. Business Workflow

1. **Order List Page** — user arrives at `/sticker-packing/orders`. Sees a DataGrid of sales orders. The list is filtered by an "order type" selector (represented as numeric status codes, typically `5` for packaged orders).
2. **Define Packing** — user clicks "Define Packing" on an order → navigates to `/sticker-packing/:id/define`. The page loads the sales order details to determine which products are in it. For each product line, a packing row is rendered: user enters pack size, number of packs, selects pack type, selects packed-by employee. `packQuantity = packSize × packNo`. If `packQuantity` exceeds original `quantity`, a remaining-quantity row is auto-appended.
3. **Save** — POST to `CreateStickerPackaging` with all rows bundled.
4. **Edit Packing** — user clicks "Edit" on an order with existing packing → navigates to `/sticker-packing/:id/edit`. Pre-populated from `GetStickerPackagingDetailsForEdit`.
5. **Print Panel** — `/sticker-packing/print-panel`. User selects order type from dropdown (0, 4, 5 are common), gets a DataGrid. On row selection, opens `SalesOrderStickerModal` to display/print the sticker label.
6. **Sticker Print** — `SalesOrderStickerModal` renders a printable sticker label with customer name, invoice number, product details, pack info.

### Order Type Codes (used for filter)

| Code | Meaning |
|---|---|
| 0 | Pending/All |
| 2 | Active/Processing |
| 4 | Packaged — editing packing |
| 5 | Packed — ready for sticker print |

---

## 6. Legacy Redux State Management

| Redux Slice | Key | Purpose |
|---|---|---|
| `listOrderForPackingAndEditState` | `orderList` | Holds fetched orders grid data |
| `packingDetailsState` | `salesorderinternalpackagingdonesingle` | Holds edit-page packing detail response |
| `salesOrderInternalDetails` | `salesorderinternalsingle` | Holds full sales order detail (products list) for define-packing page |
| `packingStickerCreateState` | `success` / `loading` | Create mutation state |
| `packingStickerUpdateState` | `success` / `loading` | Update mutation state |

In V2, replace all Redux slices with **TanStack Query** hooks.

---

## 7. Child Components & Popups

### `PackagingItemSticker.js` (class component → convert to functional)

This is the most complex child. It renders **one packing row** for each product line. Fields:
- `packSize` — numeric input (units per pack)
- Pack Type — `Typeahead` (search/select from `packTypeList`)
- `packNo` — numeric input (number of packs)
- `packQuantity` — auto-computed display (read-only)
- `packedBy` — `Typeahead` for employees

In V2, convert this to a functional TSX component. Replace `Typeahead` with `DropdownSelect` or native `<select>`.

### `SalesOrderStickerModal.js` (used in PrintInfoPanel and List page)

A popup/modal that renders a printable sticker. It receives:
- `salesorderinternalsingle` — the full order detail
- `salesorderinternalpackagingdonesingle` — packing details

In V2, this becomes a `StickerPrintModal.tsx` component that accepts typed props and uses `window.print()` or a print-specific Tailwind layout.

### `KarjadeshView.js` / `SalesOrderView.js`

Order detail viewer modals used in PrintInfoPanel for "view order" action. In V2 these can be simple drawer/modal components showing order details.

---

## 8. V2 Architecture & File Organization

Before implementing, read:
- `v2-octopi/AI_DEVELOPER_GUIDE.md` — canonical patterns
- `v2-octopi/V2_IMPLEMENTATION_GUIDE.md` — CRUD checklist

### Files to Create

```
v2-octopi/src/
  types/
    stickerPacking.ts            ← all interfaces (§4)
  schemas/
    stickerPackingSchema.ts      ← Zod validation schemas
  hooks/
    useStickerPacking.ts         ← all TanStack Query hooks
  pages/
    sticker-packing/
      StickerOrderListPage.tsx   ← route /sticker-packing/orders
      DefinePackingPage.tsx      ← route /sticker-packing/:id/define
      EditPackingPage.tsx        ← route /sticker-packing/:id/edit
      PrintPanelPage.tsx         ← route /sticker-packing/print-panel
  components/
    sticker-packing/
      PackingItemRow.tsx         ← one row in the define/edit form
      StickerPrintModal.tsx      ← printable sticker label modal
```

---

## 9. V2 Route Mapping (Legacy → V2)

| Legacy Route | V2 Route | Notes |
|---|---|---|
| `/stockoutpackagesticker/orderlist` | `/sticker-packing/orders` | List page |
| `/stockoutpackagesticker/:id/definepacking` | `/sticker-packing/:id/define` | Create packing |
| `/stockoutpackagesticker/:id/editdefinepacking` | `/sticker-packing/:id/edit` | Edit packing |
| `/packing/printpanel` | `/sticker-packing/print-panel` | Print panel |

Add legacy redirects in `AppRouter.tsx`:
```typescript
{ path: '/stockoutpackagesticker/orderlist', element: <Navigate to="/sticker-packing/orders" replace /> },
{ path: '/stockoutpackagesticker/:id/definepacking', element: <Navigate to={`/sticker-packing/${id}/define`} replace /> },
{ path: '/stockoutpackagesticker/:id/editdefinepacking', element: <Navigate to={`/sticker-packing/${id}/edit`} replace /> },
{ path: '/packing/printpanel', element: <Navigate to="/sticker-packing/print-panel" replace /> },
```

Add to `menuMapper` in `auth/authBridge.ts` if needed.

---

## 10. Hook Design

Create `v2-octopi/src/hooks/useStickerPacking.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  StickerOrderRow, StickerPackagingDetail,
  CreateStickerPackagingPayload, UpdateStickerPackagingPayload,
  PackType, ApiResponse
} from '@/types/stickerPacking'

export const stickerPackingKeys = {
  all: ['stickerPacking'] as const,
  orders: (orderType: number) => [...stickerPackingKeys.all, 'orders', orderType] as const,
  detail: (soSystemId: number) => [...stickerPackingKeys.all, 'detail', soSystemId] as const,
  packTypes: () => [...stickerPackingKeys.all, 'packTypes'] as const,
}

export function useStickerOrders(orderType: number) {
  return useQuery({
    queryKey: stickerPackingKeys.orders(orderType),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<StickerOrderRow[]>>(
        `/StockOut/StickerStockOutOrderGridData/${orderType}`
      )
      return res.dataObj
    },
    staleTime: 30_000,
  })
}

export function useStickerPackingDetail(soSystemId: number) {
  return useQuery({
    queryKey: stickerPackingKeys.detail(soSystemId),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<StickerPackagingDetail>>(
        `/StockOut/GetStickerPackagingDetailsForEdit/${soSystemId}`
      )
      return res.dataObj
    },
    enabled: !!soSystemId,
  })
}

export function usePackTypes() {
  return useQuery({
    queryKey: stickerPackingKeys.packTypes(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PackType[]>>('/Product/GetPackType')
      return res.dataObj
    },
    staleTime: 5 * 60_000,
  })
}

export function useCreateStickerPacking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateStickerPackagingPayload) =>
      apiClient.post('/StockOut/CreateStickerPackaging', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stickerPackingKeys.all })
    },
  })
}

export function useUpdateStickerPacking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateStickerPackagingPayload) =>
      apiClient.put('/StockOut/UpdateStickerPackaging', payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: stickerPackingKeys.detail(variables.soSystemId) })
      queryClient.invalidateQueries({ queryKey: stickerPackingKeys.all })
    },
  })
}
```

---

## 11. Form Schema Design (Zod)

Create `v2-octopi/src/schemas/stickerPackingSchema.ts`:

```typescript
import { z } from 'zod'

export const packingItemSchema = z.object({
  productId: z.number().positive(),
  productName: z.string(),
  packSize: z.number({ error: 'Pack size is required' }).positive('Pack size must be > 0'),
  packNo: z.number({ error: 'No. of packs is required' }).positive('No. of packs must be > 0'),
  packQuantity: z.number().nonnegative(),
  quantity: z.number(),
  sopPackId: z.number().nullable(),
  packedBy: z.union([z.string(), z.number()]).nullable(),
})

export const definePackingSchema = z.object({
  items: z.array(packingItemSchema).min(1, 'At least one packing item is required'),
})

export type DefinePackingFormValues = z.infer<typeof definePackingSchema>
```

---

## 12. Page Breakdowns

### 12.1 `StickerOrderListPage.tsx` (`/sticker-packing/orders`)

- State: `orderType` (number, default `5`)
- Fetch: `useStickerOrders(orderType)`
- UI:
  - Order type selector (pill tabs or `<select>`) — values 0, 2, 4, 5
  - TanStack Table or simple `<table>` with columns: Invoice No, Date, Customer, Address, Job Type, Actions
  - Action buttons per row: "Define Packing" → navigate to `/sticker-packing/:soSystemId/define`; "Edit Packing" → `/sticker-packing/:soSystemId/edit`
- Error/loading states using standard V2 patterns

### 12.2 `DefinePackingPage.tsx` (`/sticker-packing/:id/define`)

- Reads `:id` from `useParams()` (sales order ID)
- Fetches full sales order detail via existing `useSalesOrderDetail(id)` hook OR a dedicated hook calling `/SalesOrderInternal/GetSalesOrderInternalDetails/{id}`
- Fetches `usePackTypes()` for each row's typeahead
- Fetches employees via `DropdownSelect` type `employee`
- Builds initial `items` array from `salesorderinternalsingle.stockOutItemsData`
- Each item row: `PackingItemRow.tsx` component (see §13)
- On submit: call `useCreateStickerPacking()` mutation, navigate back on success
- Validation: `packQuantity` must not exceed original `quantity`

### 12.3 `EditPackingPage.tsx` (`/sticker-packing/:id/edit`)

- Reads `:id` from `useParams()`
- Fetches existing packing via `useStickerPackingDetail(id)`
- Pre-populates `items` from `salesorderinternalpackagingdonesingle.stockOutPackagingItems`
- Same form structure as Define page
- On submit: call `useUpdateStickerPacking()` mutation

### 12.4 `PrintPanelPage.tsx` (`/sticker-packing/print-panel`)

- State: `orderType` (number, default `5`), `selectedOrderId` (number | null)
- Fetch: `useStickerOrders(orderType)` — re-fetches when `orderType` changes
- Date range filter was present in legacy but the actual API call in legacy only filters by order type — include date range inputs in UI but pass to API if supported
- UI:
  - Order type selector (tabs/dropdown)
  - DataGrid/table of orders
  - On row click: set `selectedOrderId`; show `StickerPrintModal` or open in-page panel
  - "Print" button triggers `window.print()` — use `@media print` CSS class

---

## 13. Component Breakdown

### `PackingItemRow.tsx`

Props:
```typescript
interface PackingItemRowProps {
  item: PackingItem
  employees: Array<{ id: number; label: string }>
  onChange: (index: string, field: keyof PackingItem, value: unknown) => void
  onDelete: (index: string) => void
}
```

Fields rendered:
- `productName` — read-only label
- `quantity` — original qty — read-only
- `packSize` — `<input type="number">` 
- Pack Type — `<select>` from `item.packTypeList`
- `packNo` — `<input type="number">`
- `packQuantity` — computed display: `packSize * packNo` — read-only
- `packedBy` — `<select>` from employees prop
- Delete button (removes row)

Auto-append logic: when `packQuantity < quantity`, add a new "remainder" row for the remaining quantity.

### `StickerPrintModal.tsx`

Props:
```typescript
interface StickerPrintModalProps {
  isOpen: boolean
  onClose: () => void
  soSystemId: number
}
```

- Fetches packing detail via `useStickerPackingDetail(soSystemId)`
- Renders a print-friendly layout: customer info, invoice number, product rows with pack info
- `window.print()` button
- Use `@media print` to hide modal chrome in print output

---

## 14. Execution Phases

### Phase 1 — Types, Schema, Hooks (no UI)
1. Create `types/stickerPacking.ts`
2. Create `schemas/stickerPackingSchema.ts`
3. Create `hooks/useStickerPacking.ts`
4. Register no new pagination endpoints (all sticker endpoints return full lists)

### Phase 2 — Order List Page
5. Create `StickerOrderListPage.tsx`
6. Add routes in `AppRouter.tsx`

### Phase 3 — Define & Edit Packing Pages
7. Create `PackingItemRow.tsx`
8. Create `DefinePackingPage.tsx`
9. Create `EditPackingPage.tsx`

### Phase 4 — Print Panel
10. Create `StickerPrintModal.tsx`
11. Create `PrintPanelPage.tsx`

### Phase 5 — Legacy Redirects
12. Add legacy redirects in `AppRouter.tsx`
13. Add menu entries to `menuMapper` in `auth/authBridge.ts`

---

## 15. Implementation Checklist

- [ ] `types/stickerPacking.ts` — all 8 interfaces defined
- [ ] `schemas/stickerPackingSchema.ts` — `packingItemSchema`, `definePackingSchema`
- [ ] `hooks/useStickerPacking.ts` — 5 hooks: `useStickerOrders`, `useStickerPackingDetail`, `usePackTypes`, `useCreateStickerPacking`, `useUpdateStickerPacking`
- [ ] `StickerOrderListPage.tsx` — order type selector, table, Define/Edit action buttons
- [ ] `DefinePackingPage.tsx` — loads sales order products, renders `PackingItemRow` per item, create mutation
- [ ] `EditPackingPage.tsx` — loads existing packing, renders pre-populated `PackingItemRow` per item, update mutation
- [ ] `PackingItemRow.tsx` — all 6 fields, auto-append remainder row logic
- [ ] `StickerPrintModal.tsx` — packing detail, print button
- [ ] `PrintPanelPage.tsx` — order type filter, table, opens print modal
- [ ] Routes registered in `AppRouter.tsx` (V2 routes + legacy redirects)
- [ ] Named exports only on all new files
- [ ] `@/` alias used for all imports
- [ ] No MUI imports — only Tailwind `gray-*` styling
- [ ] All `<select>` elements replaced with `DropdownSelect` or typed native selects

---

## 16. Gotchas & Notes

1. **`packQuantity` validation** — the legacy code warns and prevents saving if `packSize * packNo > quantity`. Implement this client-side in `PackingItemRow` and as a Zod refine on the schema.

2. **Auto-append row** — when user fills a row and `packSize * packNo < quantity`, a new row should appear for the remaining `quantity - (packSize * packNo)`. This was done via `handleCalculateTotalFromEditable` in legacy. Re-implement in V2 as an `onChange` effect in the form state.

3. **`PackType` fetched per row in legacy** — the legacy code fetches `/Product/GetPackType` once per item row inside a `Promise.all`. In V2, fetch it **once** with `usePackTypes()` and pass the result down as a prop to each `PackingItemRow`.

4. **Order type integer** — the filter dropdown uses integers (`"0"`, `"2"`, `"4"`, `"5"`). These are passed as path params to `StickerStockOutOrderGridData/{orderType}`. Default to `5` (packed orders) for both the order list page and the print panel.

5. **API Response shape** — all endpoints wrap in `{ dataObj: T }`. Always unwrap `.dataObj`.

6. **`listSalesOrderInternalDetails` reuse** — the Define Packing page loads a sales order's product list using the same endpoint as the main stock-out module. Consider reusing any existing `useSalesOrderDetail` hook if already present in V2 from the stock-out module.

7. **`PrintInfoPanel` uses `selectedOrder` state defaulting to `"5"`** — in V2, store this as `number` not `string`.

8. **Legacy `SalesOrderStickerModal`** — the existing `v2-octopi/src/pages/sales-orders/SalesOrderStickerModal.tsx` may already be a partial V2 implementation. Check that file before creating a new one.

9. **Print CSS** — the sticker label should use `@media print { .no-print { display: none } }` to hide navigation and modal chrome when printing.

10. **Employee `packedBy` field** — stored as `employeeId` (integer). In `PackingItemRow`, use a dropdown/select bound to employee ID. Match on `emp.employeeId` when pre-populating in edit page.
