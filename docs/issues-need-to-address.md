# Issues Need to Address

Date: 2026-04-27

## Scope

This note captures a static review of V2 pages for intermittent blank-table symptoms and stale-data risks in parameterized edit and create flows.

The review focused on:

- shared list components reused across multiple sibling routes
- local search or filter state that can survive route changes
- parameterized edit or create pages that can keep local state when `:id` changes
- forms that should reset after async detail data arrives
- hooks that convert missing backend payloads into empty arrays

## List Page Findings

### 1. Stock-In Shared List Page

Component:

- `src/pages/stock-in/StockInListPage.tsx`

Routes using the same component:

- `/stock-in`
- `/stock-in/confirm-qty`
- `/stock-in/price-update`
- `/stock-in/admin/approved`

Why this is a likely real issue:

- the same component instance is reused across multiple stock-in routes with different `mode` props
- the page stores local search state with `const [search, setSearch] = useState('')`
- the rendered table uses a filtered client-side list
- the empty state is shown when `filtered.length === 0`
- there is no reset effect when `mode` or location changes

Likely symptom:

- a search term entered on one stock-in list route can remain active after navigating to another stock-in list route
- the next route can therefore render `No orders found.` even though the fetched query data contains rows
- a full reload remounts the page and clears the stale local state, so data appears again

### 2. Sales-Order Shared List Page

Component:

- `src/pages/sales-orders/SalesOrderListPage.tsx`

Routes using the same component:

- `/sales-orders`
- `/sales-orders/escalations`
- `/sales-orders/packages`
- `/sales-orders/packages/done`
- `/sales-orders/admin/general`
- `/sales-orders/admin/pending-price`
- `/sales-orders/admin/limited-edit`

Status:

- this component already contains a `useEffect` that resets route-local state when `mode` changes
- the comment in the file explicitly describes React Router sibling-route reuse as the reason for that reset

Conclusion:

- this page had the same class of bug before
- based on static review, it looks intentionally fixed now

### 3. Quotation Shared List Page

Component:

- `src/pages/quotations/QuotationListPage.tsx`

Routes using the same component:

- `/quotations`
- `/quotations/unapproved`
- `/quotations/approved`

Risk level for the same bug:

- lower

Reason:

- the component is reused across routes with different `mode` props
- but it does not keep local search or date filter state that would obviously blank the table after route changes
- from static review, this is not the same issue as stock-in

## Edit And Create Page Findings

### 4. Safe Pattern Found In Most Standard CRUD Edit Pages

The main CRUD edit pages reviewed load detail first and then reset form state from the fetched payload.

Examples reviewed:

- `src/pages/customers/EditCustomerPage.tsx` + `src/pages/customers/CustomerForm.tsx`
- `src/pages/cheques/EditChequePage.tsx` + `src/pages/cheques/ChequeForm.tsx`
- `src/pages/stock-in/EditStockInPage.tsx` + `src/pages/stock-in/StockInForm.tsx`
- `src/pages/sales-orders/EditSalesOrderPage.tsx` + `src/pages/sales-orders/SalesOrderForm.tsx`
- `src/pages/prices/EditSellingPricePage.tsx`
- `src/pages/prices/EditPurchasePricePage.tsx`

Why these look safer:

- the page waits for detail loading before rendering the live edit surface
- the form is repopulated from async detail data through `reset(...)` or a full derived-defaults pass
- this reduces the chance of showing stale record data when the current record changes

Static conclusion:

- these pages are not the main stale-detail concern right now

### 5. Edit Task Page Has A Real Route-Param Stale-State Risk

Component:

- `src/pages/sales-orders/EditTaskPage.tsx`

Routes using the same component:

- `/sales-orders/tasks/:id/edit`
- `/task/:id/edit`

Why this is risky:

- task detail fields are populated incrementally with `setValue(...)` instead of a full form reset
- the page stores local state in `checklistItems`, `checklistPreFilled`, `selectedChecklistKey`, `isTransportOptional`, `employeeLabel`, and `serverError`
- checklist prefill is intentionally one-time and guarded by `if (checklistPreFilled) return`
- that one-time guard is never reset when `taskId` changes

Likely symptom:

- if the user moves from one task edit route to another without a hard remount, the next task can inherit previous checklist state, employee label state, or server error state
- the next task can also skip applying its own checklist prefill because `checklistPreFilled` is already `true`

### 6. Edit Pending Checklist Page Has The Same One-Time Prefill Risk

Component:

- `src/pages/sales-orders/EditPendingChecklistPage.tsx`

Routes using the same component:

- `/sales-orders/pending-checklist/:id/edit`
- `/task/:id/editpendingchecklist`

Why this is risky:

- the page keeps `checklistItems`, `checklistPreFilled`, `selectedChecklistKey`, and `serverError` in local state
- pending checklist prefill is also guarded by `if (checklistPreFilled) return`
- that flag is not reset when `taskId` changes

Likely symptom:

- navigating from one pending-checklist edit page to another can retain the previous task's pending checklist state
- the later task may not load its own checklist rows because the prefill path is already disabled

### 7. Assign Task Page Has A Create-Flow Stale-State Risk

Component:

- `src/pages/sales-orders/AssignTaskPage.tsx`

Route:

- `/sales-orders/:id/assign-task`

Why this is risky:

- this is a create page, but it is parameterized by sales-order ID and therefore can be reused when `:id` changes
- the page pre-fills task name and destination from async sources, but it does not reset local state such as `checklistItems`, `selectedChecklistKey`, `isTransportOptional`, `employeeLabel`, or `serverError` when `soSystemId` changes

Likely symptom:

- moving directly from one assign-task route to another can carry checklist selections, transport-related employee state, or error banners from the previous order into the new order

### 8. Single-Route Create Pages Look Lower Risk From Static Review

Examples reviewed:

- `src/pages/sales-orders/CreateSalesOrderPage.tsx`
- `src/pages/stock-in/AddStockInPage.tsx`
- `src/pages/prices/AddSellingPricePage.tsx`
- `src/pages/prices/AddPurchasePricePage.tsx`
- `src/pages/sales-orders/AddTaskPage.tsx`

Static conclusion:

- these pages are lower risk for route-reuse stale-data problems because they are not keyed by changing route params in the same way
- no strong stale-detail-loading issue stood out in this pass

### 9. Parameterized Workflow Pages Look Lower Risk Than The Task Pages

Examples reviewed:

- `src/pages/sales-orders/EscalateOrderPage.tsx`
- `src/pages/sales-orders/PackageSalesOrderPage.tsx`

Static conclusion:

- these pages load-gate before rendering the working surface
- row state is rebuilt from the fetched detail data when the detail changes
- they still keep some transient local state like `serverError`, but they do not currently look like the strongest stale-detail issue compared with the task pages

## Broader Empty-State Masking Risk

There is a second, more general risk pattern across many V2 list hooks.

Pattern:

- many hooks use `.then((response) => response.dataObj ?? [])`
- if the backend returns HTTP 200 with `dataObj: null`, or returns a soft failure in the body without using a failing HTTP status, the UI can render an empty table instead of a visible error state

This does not prove a bug on every page, but it means some blank lists may be backend-response issues that are being masked as empty data.

High-traffic hooks using this pattern include:

- `src/hooks/useStockOut.ts` — uses `response.dataObj ?? []` (verified line 183, 197, 323, 335)
- `src/hooks/useStockIn.ts` — uses `response.dataObj ?? []` (verified line 188, 229, 349)
- `src/hooks/useQuotation.ts` — uses `r.dataObj ?? []` (verified line 32)
- `src/hooks/usePayments.ts`
- `src/hooks/useProducts.ts`
- `src/hooks/useSuppliers.ts`
- `src/hooks/useLocations.ts`

Note on `src/hooks/useCustomers.ts`:

- this hook uses `r.dataObj` **without** a `?? []` fallback (verified lines 32, 41, 82, 92)
- if the backend returns `dataObj: null`, the consumer receives `undefined` or `null` instead of an empty array
- the risk is slightly different: it can cause a crash or unexpected rendering rather than a silent empty table
- this is worth reviewing separately from the `?? []` soft-masking pattern

## V2 List Inventory

The following list pages were found from `src/router/AppRouter.tsx`.

| Component | Route(s) | Shared Across Multiple Routes | Notes |
| --- | --- | --- | --- |
| `CustomerListPage` | `/customers` | No | Has local search state |
| `EmployeeListPage` | `/employees` | No | Has local search state |
| `ChequeListPage` | `/cheques` | No | Has local search state |
| `PaymentListPage` | `/payments` | No | Has local search state |
| `SupplierListPage` | `/suppliers` | No | Has local search state |
| `SalesOrderListPage` | `/sales-orders`, `/sales-orders/escalations`, `/sales-orders/packages`, `/sales-orders/packages/done`, `/sales-orders/admin/general`, `/sales-orders/admin/pending-price`, `/sales-orders/admin/limited-edit` | Yes | Same route-reuse issue class, but reset logic already exists |
| `TaskAssignListPage` | `/sales-orders/task-assign` | No | Has local search state and tab filter |
| `AssignedTaskListPage` | `/sales-orders/task-assigned` | No | Has local search state |
| `IncompleteTaskListPage` | `/sales-orders/task-incomplete` | No | Has local search state |
| `PendingChecklistListPage` | `/sales-orders/pending-checklist` | No | Has local search state |
| `StockInListPage` | `/stock-in`, `/stock-in/confirm-qty`, `/stock-in/price-update`, `/stock-in/admin/approved` | Yes | Confirmed likely stale-state blank-list risk |
| `StockInInvoiceListPage` | `/stock-in/invoices` | No | Invoice list surface |
| `LocationListPage` | `/locations` | No | Has local search state |
| `ProductListPage` | `/products` | No | Has local search state |
| `ProductFunctionListPage` | `/products/functions` | No | Has local search state |
| `SellingPriceListPage` | `/selling-prices` | No | Has local search state |
| `PurchasePriceListPage` | `/purchase-prices` | No | Has local search state |
| `QuotationListPage` | `/quotations`, `/quotations/unapproved`, `/quotations/approved` | Yes | Shared component, but lower risk for this specific stale-search issue |
| `PiListPage` | `/lc/pi` | No | Has local search state |
| `LcDocumentListPage` | `/lc/documents` | No | Has local search state |
| `LcEditListPage` | `/lc/edit-list` | No | List surface |
| `LcPaymentEditListPage` | `/lc/payment/edit-list` | No | List surface |
| `StickerOrderListPage` | `/sticker-packing/orders` | No | List surface |
| `BatchListPage` | `/batches` | No | Has local search state and date filters |
| `TaxDutyListPage` | `/tax-duty` | No | Empty-state branch uses fetched rows directly |

## Current Static Conclusion

From code review alone:

- `StockInListPage` is still the clearest open list-page candidate for the blank-list issue
- `EditTaskPage` and `EditPendingChecklistPage` are the clearest edit-page stale-detail risks found in this pass
- `AssignTaskPage` is the clearest create-page stale-state risk found in this pass
- standard CRUD edit forms mostly follow a safer load-and-reset pattern
- many single-route list pages can still display false empty states if the backend returns a soft-empty payload and the hook normalizes it to `[]`

## When An Exact Route Or Repro Still Helps

Sharing the exact route is still useful when:

- the issue happens on a page outside the stock-in list and task-related pages noted above
- the issue only happens for specific filters, roles, or menu permissions
- the backend may be returning HTTP 200 with an empty or partial body for one specific endpoint
- the issue appears only after a specific navigation sequence between two records or two workflow pages

For those cases, the exact route and steps to reproduce would help distinguish a UI state bug from a backend payload problem.

## File Verification (2026-04-27)

All file paths and claims in this document were cross-checked against the actual source files. Results:

| Claim | File | Verified |
| --- | --- | --- |
| `StockInListPage` has stale `search` state with no mode reset | `src/pages/stock-in/StockInListPage.tsx` line 79 | ✓ |
| `SalesOrderListPage` reset `useEffect` at line 292 with sibling-route comment | `src/pages/sales-orders/SalesOrderListPage.tsx` line 292 | ✓ |
| `StockInListPage` used on 4 routes | `src/router/AppRouter.tsx` lines 248, 251, 253, 255 | ✓ |
| `SalesOrderListPage` used on 7 routes | `src/router/AppRouter.tsx` lines 216–228 | ✓ |
| `EditTaskPage` on two routes: `sales-orders/tasks/:id/edit` and `task/:id/edit` | `src/router/AppRouter.tsx` lines 240, 432 | ✓ |
| `EditPendingChecklistPage` on two routes: `sales-orders/pending-checklist/:id/edit` and `task/:id/editpendingchecklist` | `src/router/AppRouter.tsx` lines 244, 436 | ✓ |
| `AssignTaskPage` on route `sales-orders/:id/assign-task` | `src/router/AppRouter.tsx` line 238 | ✓ |
| `EditTaskPage` has `checklistPreFilled` boolean guard + `setValue` prefill | `src/pages/sales-orders/EditTaskPage.tsx` line 32 | ✓ |
| `EditPendingChecklistPage` has same `checklistPreFilled` pattern | `src/pages/sales-orders/EditPendingChecklistPage.tsx` line 38 | ✓ |
| `AssignTaskPage` has `checklistItems`, `employeeLabel`, etc. without reset on `soSystemId` change | `src/pages/sales-orders/AssignTaskPage.tsx` lines 44–48 | ✓ |
| `useStockIn.ts` and `useStockOut.ts` use `dataObj ?? []` | `src/hooks/useStockIn.ts` line 188; `src/hooks/useStockOut.ts` line 183 | ✓ |
| `useCustomers.ts` uses `r.dataObj` without `?? []` fallback | `src/hooks/useCustomers.ts` lines 32, 41, 82, 92 | ✓ (noted above) |