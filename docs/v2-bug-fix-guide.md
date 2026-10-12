# V2 Bug-Fix Guide — AI Agent Reference

> **Audience**: AI coding agents and senior developers working on `v2-octopi/`.  
> **Purpose**: Root-cause analysis, affected files, legacy cross-references, and verification checklists for every confirmed bug.

---

## Quick-Reference Table

| # | Bug | Status | Primary v2 File | Fix Type |
|---|-----|--------|-----------------|----------|
| 1 | Delete transport — silent failure | ✅ Fixed | `pages/sales-orders/DeliveryPage.tsx` | `mutateAsync` + try/catch + toast |
| 2 | Marketing name missing in print | ✅ Fixed | `types/stockOut.ts`, `SalesOrderView.tsx`, `SalesOrderChalaanModal.tsx` | Type + render |
| 3 | Lot number missing in challan | ✅ Fixed | `types/stockOut.ts`, `SalesOrderChalaanModal.tsx` | Type + render |
| 4 | Edit transport — dropdown pre-fill | ⚠️ Inspect API | `pages/sales-orders/DeliveryPage.tsx` | Verify API response |
| 5a | Pending table — no column sort | ✅ Fixed | `pages/sales-orders/PendingStatusPage.tsx` | Sort state + sortable `<th>` |
| 5b | Resume button — backend 400 + no feedback | ✅ Fixed | `pages/sales-orders/StockOutStatusPage.tsx` | Non-empty remarks + toast |
| 6 | Lot number (same as Bug 3) | ✅ Fixed | Same as Bug 3 | — |
| 7 | Invoice edit — stale packing print | ✅ Fixed | `hooks/useStockOut.ts` | Invalidate `packaging` query |
| 8 | Date edit — stale list | ⚠️ Monitor | `hooks/useStockOut.ts` | Verify invalidation scope |
| 9A | Current Stock — no Refresh button | ✅ Fixed | `pages/reports/CurrentStockReportPage.tsx` | Add Refresh alongside Excel |
| 9C | Current Stock — silent Excel error | ✅ Fixed | `pages/reports/CurrentStockReportPage.tsx` | try/catch around export |

---

## Bug 1 — Delete Transport: Silent Failure

### Symptom
Clicking the Trash icon on a transport record appears to do nothing when the API fails. No error message is shown to the user.

### Root Cause
`deleteTransport.mutate(...)` was used (fire-and-forget). There was no `onError` handler on the mutation, nor any try/catch at the call site. Errors were silently swallowed.

### Legacy Reference
`src/pages/delivery/AddDelivery.js` — calls `/Task/DeleteTaskTransportation` and shows an alert on failure via `.catch`.

### Fix Applied
**File**: `v2-octopi/src/pages/sales-orders/DeliveryPage.tsx`

1. Added `import { useToastStore } from '@/stores/toastStore'`
2. Called `const showToast = useToastStore((s) => s.showToast)` inside `DeliveryPage`
3. Changed `handleDeleteTransport` to `async`, switched to `mutateAsync`, wrapped in `try/catch`
4. Updated the `onClick` to use `void handleDeleteTransport(...)`

```tsx
const handleDeleteTransport = async (transportationId: number) => {
  if (!activeTaskId) return
  if (!window.confirm('Delete this transport record?')) return
  try {
    await deleteTransport.mutateAsync({ transportationId, taskId: activeTaskId })
  } catch {
    showToast({ message: 'Failed to delete transport record', type: 'error' })
  }
}
```

### Verification
- Trigger a delete when the network is offline (DevTools → Offline). An error toast must appear.
- On success, the transport row disappears from the list.

---

## Bug 2 — Marketing Name Missing in Print Documents

### Symptom
The "Ref" / marketing name line visible in legacy Invoice and Challan prints is absent from the v2 counterparts (`SalesOrderView` and `SalesOrderChalaanModal`).

### Root Cause
1. `marketingName` was not present in the `StockOutGeneralData` TypeScript interface, so the field was invisible to the compiler.
2. Neither `SalesOrderView.tsx` nor `SalesOrderChalaanModal.tsx` rendered it.

### Legacy Reference
- `src/core/InvoiceForm.js` — renders `Ref: {info.marketingName}` in the right-side info block.
- `src/core/KarjadeshView.js` — same field in the challan body.

### Fix Applied
**File 1**: `v2-octopi/src/types/stockOut.ts`

Added to `StockOutGeneralData`:
```ts
marketingName?: string | null
```

**File 2**: `v2-octopi/src/pages/sales-orders/SalesOrderView.tsx`

Added after the "Date Of Issue" line in `inv-info-right`:
```tsx
{general.marketingName && <div>Ref : {general.marketingName}</div>}
```

**File 3**: `v2-octopi/src/pages/sales-orders/SalesOrderChalaanModal.tsx`

Added after the "Date Of Issue" line in `ch-info-right`:
```tsx
{general?.marketingName && (
  <div>Ref&nbsp;: {general.marketingName}</div>
)}
```

### Verification
- Open an invoice print that has a marketing name assigned. "Ref : [name]" should appear under the date.
- Open the same order's challan. The Ref line should appear there too.

---

## Bug 3 / 6 — Lot Number Missing in Challan

### Symptom
Lot numbers tracked per packing item do not appear in the challan print. Legacy showed them as sub-text under the product name.

### Root Cause
`lotNo` was not in the `StockOutPackagingInfoItem` interface, and the challan's product cell did not render it.

### Legacy Reference
`src/core/KarjadeshView.js` — renders `item.lotNo` as subscript text for each product row, regardless of `customerFlag`.

### Fix Applied
**File 1**: `v2-octopi/src/types/stockOut.ts`

Added to `StockOutPackagingInfoItem`:
```ts
lotNo?: string | null
```

**File 2**: `v2-octopi/src/pages/sales-orders/SalesOrderChalaanModal.tsx`

Product name cell now renders `lotNo` unconditionally (batch gating by `customerFlag` is kept as-is for batch numbers, which matches legacy behaviour):
```tsx
{item.lotNo != null && item.lotNo !== '' && (
  <sub> [Lot: {item.lotNo}]</sub>
)}
```

### Verification
- Open a challan for an order that has lot numbers assigned. Each relevant product row should show `[Lot: XXX]` as subscript.

---

## Bug 4 — Edit Transport: Dropdown Pre-fill (Inspect Required)

### Symptom
When editing an existing transport record, the Vehicle, From, and To fields may not be pre-populated.

### Root Cause (Likely)
The API may return `taskTransportationStartLocationId` / `taskTransportationEndLocationId` as `null` even when the string label is present, because older records may not have stored the location FK. If the ID is null, `PaginatedCombobox value={null}` will show no pre-selected item even if `selectedLabel` is passed.

For the vehicle `<select>`, the initial value comes from `existing?.taskTransportationVehicleId`. If the vehicles list loads asynchronously after mount, the select may flash to "Select vehicle…" briefly but should recover once the list arrives (React-controlled value).

### Code Location
`v2-octopi/src/pages/sales-orders/DeliveryPage.tsx` → `TransportModal` function component.

Form initialization:
```ts
vehicleId: existing?.taskTransportationVehicleId ?? null,
fromLocationId: existing?.taskTransportationStartLocationId ?? null,
fromLocationLabel: existing?.taskTransportationStartLocation ?? '',
```

### Investigation Steps
1. Add a `console.log(existing)` inside `TransportModal` (dev only) and inspect the API-returned object.
2. Verify `taskTransportationVehicleId` is a non-null number.
3. Verify `taskTransportationStartLocationId` and `taskTransportationEndLocationId` are non-null numbers.
4. If IDs are null → the backend does not return location IDs. Workaround: accept label-only mode in `PaginatedCombobox` (validate by `fromLocationLabel` instead of `fromLocationId`).

### Current Mitigation
`selectedLabel` is always passed, so the combobox will display the label even when `value` is null. Form validation already checks `fromLocationLabel.trim()` before submit.

---

## Bug 5a — Pending Table: No Column Sorting

### Symptom
Clicking column headers in the Pending Status table has no effect. Users cannot sort by Invoice Date, Customer, or any other field.

### Fix Applied
**File**: `v2-octopi/src/pages/sales-orders/PendingStatusPage.tsx`

1. Added `sortCol: string | null` and `sortDir: 'asc' | 'desc'` state.
2. Added `handleSort(col)` toggling direction when the same column is clicked again.
3. Extended the `filteredRows` `useMemo` to sort after filtering.
4. Made `<th>` elements for sortable columns clickable with `cursor-pointer` and ▲/▼ indicators.

**Sortable columns**: Invoice No, Invoice Date, Customer, Address, Invoice Value, Sales Type, Work Pending, Decision Pending.

### Verification
- Click "Invoice Date" header → rows sort ascending by date (▲ appears).
- Click again → rows sort descending (▼ appears).
- Click a different header → that column is now sorted, previous resets.

---

## Bug 5b — Resume Button: Backend 400 + No User Feedback

### Symptom
Clicking "Resume" on a Decision Pending row shows no feedback. The backend returns HTTP 400 when remarks is empty, and the error was swallowed because the call was wrapped in `void`.

### Root Cause
```ts
// Before fix:
await updateStatusMutation.mutateAsync({
  soSystemId: row.soSystemId,
  associateCurrenStatus: 20,
  remarks: '',   // ← backend rejects empty string → 400
})
```
The API endpoint encodes remarks in the URL:
```
PUT /StockOut/UpdateStockOutAssociateCurrentStatus/{id}/{status}?soAssociateStatusRemarks=
```
An empty value causes a 400 on the backend. The error was never surfaced to the user.

### Legacy Reference
`src/pages/StockOutStatusManagement.js` — passes `"Resumed"` as the remarks string for the resume action.

### Fix Applied
**File**: `v2-octopi/src/pages/sales-orders/StockOutStatusPage.tsx`

```ts
const handleResume = async (row: StockOutListRow) => {
  try {
    await updateStatusMutation.mutateAsync({
      soSystemId: row.soSystemId,
      associateCurrenStatus: 20,
      remarks: 'Resumed',  // ← non-empty; matches legacy
    })
    showToast({ message: 'Order resumed successfully', type: 'success' })
    void refetch()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to resume order'
    showToast({ message, type: 'error' })
  }
}
```

### Verification
- Click Resume on a Decision Pending row. A green success toast must appear and the row must update.
- Simulate a network error (DevTools offline). A red error toast must appear.

---

## Bug 7 — Invoice Edit: Stale Packing Print Page

### Symptom
After editing an invoice via the Admin Update flow, opening the packing/challan print modal still shows the old data (e.g., old customer or product details).

### Root Cause
`useAdminUpdateStockOut` `onSuccess` only invalidated `lists()` and `detail(id)` query keys. It did not invalidate `packaging(id)`, which is the key used by `useStockOutPackaging` — the hook powering the challan print modal.

### Fix Applied
**File**: `v2-octopi/src/hooks/useStockOut.ts`

```ts
onSuccess: (_response, variables) => {
  queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
  queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(variables.stockOutGeneralData.soSystemId) })
  queryClient.invalidateQueries({ queryKey: stockOutKeys.packaging(variables.stockOutGeneralData.soSystemId) })  // ← added
},
```

### Verification
1. Open an order in Admin edit mode.
2. Change a customer or product detail and save.
3. Immediately open the Challan print modal for that order. It must show the updated data, not a cached version.

---

## Bug 8 — Date Edit: Stale List After Date Update

### Symptom
After editing an invoice date, the list page still shows the old date until a manual refresh.

### Investigation
Check whether `useUpdateInvoiceDate` (or equivalent date-edit mutation) calls `queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })` in `onSuccess`.

If the list uses date-range filters, changing the invoice date may cause the order to leave the visible range — that is expected behaviour, not a bug.

**Known issue**: JavaScript `Date` in the browser uses local time. If the API returns UTC dates, the displayed date may be off by one day in UTC+ timezones. Fix: parse as UTC and format locally, or standardise on ISO 8601 strings (`YYYY-MM-DD`).

### File to Check
`v2-octopi/src/hooks/useStockOut.ts` — find the mutation that updates invoice date and confirm `onSuccess` invalidation.

---

## Bug 9A — Current Stock: No Refresh Button After Load

### Symptom
Once data is loaded, the Load Data button is replaced by the Excel button. There is no way to refresh the data without changing the filters.

### Root Cause
The button block used a ternary: `noData ? <Load> : <Excel>`. No refresh path existed.

### Fix Applied
**File**: `v2-octopi/src/pages/reports/CurrentStockReportPage.tsx`

1. Added `RefreshCw` to lucide-react imports.
2. Destructured `refetch` from `useCurrentStock`.
3. When data is loaded (`!noData`), show both a Refresh button and the Excel button side-by-side.

```tsx
) : (
  <>
    <button onClick={() => void refetch()} disabled={isLoading} ...>
      <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />Refresh
    </button>
    <button onClick={handleExport} disabled={filteredData.length === 0} ...>
      <FileSpreadsheet size={14} />Excel
    </button>
  </>
)}
```

---

## Bug 9C — Current Stock: Silent Excel Export Failure

### Symptom
If the Excel export fails (e.g., `exceljs` fails to load or an out-of-memory error occurs), nothing happens. No error feedback.

### Fix Applied
**File**: `v2-octopi/src/pages/reports/CurrentStockReportPage.tsx`

Wrapped `exportExcelOnDemand` call in try/catch:
```ts
try {
  await exportExcelOnDemand({ ... })
} catch {
  alert('Failed to export Excel file. Please try again.')
}
```

---

## Architecture Notes for AI Agents

### Toast Pattern
Use `useToastStore` from `@/stores/toastStore`:
```ts
const showToast = useToastStore((s) => s.showToast)
showToast({ message: 'Done', type: 'success' })  // or 'error'
```

### Query Invalidation
`stockOutKeys` in `hooks/useStockOut.ts` defines all query key factories. Always invalidate the most specific applicable keys. For admin updates, consider invalidating:
- `stockOutKeys.lists()` — for any list page
- `stockOutKeys.detail(id)` — for detail/edit modals
- `stockOutKeys.packaging(id)` — for challan/packing print

### Async Mutations
Prefer `mutateAsync` + try/catch over `mutate` + `onError` callback when the caller needs to react to success/failure inline. Always mark the call site with `void` if the returned promise is not awaited:
```tsx
onClick={() => void handleSomeAsyncAction(row)}
```

### PaginatedCombobox Pre-fill (Edit Mode)
When editing a record, pass both `value` (the ID) **and** `selectedLabel` (the display string). The combobox uses `selectedLabel` as the fallback when `value` is null or when options haven't loaded yet:
```tsx
<PaginatedCombobox
  type="location"
  value={form.fromLocationId}           // number | null
  selectedLabel={form.fromLocationLabel || null}  // shown immediately
  onValueChange={...}
  onLabelChange={...}
/>
```

### API Response Shape (StockOut)
```ts
interface StockOutApiResponse<T> {
  dataObj: T
  errMsg?: string
  message?: string
  statusCode?: number
}
```
Most hooks unwrap `.dataObj` internally. Check individual hooks before adding extra unwrapping.
