# Stock-Out V2 — Understanding And Execution Plan

> **Audience:** AI agent or developer implementing the stock-out module in `v2-octopi`.
> **Must read first:** `v2-octopi/AI_DEVELOPER_GUIDE.md` — all V2 conventions, patterns, and tech stack are defined there.

---

## 1. Purpose

This document captures the verified understanding of the legacy stock-out workflow (Invoices + AdminEdit folders) and defines the execution plan for migrating it into `v2-octopi`.

Task assignment (`/task/assign`) is intentionally **excluded from this plan** and will be covered in a separate document.

---

## 2. Scope

### In scope — stock-out core (9 active routes)

| Legacy Route | Legacy File | Type |
|---|---|---|
| `/salesorderinternal` | `Invoices/SalesOrderInternal.js` | List (DataGrid) |
| `/salesorderinternal/create` | `Invoices/CreateSalesOrderInternal.js` | Create form |
| `/salesorderinternal/:id/edit` | `Invoices/EditSalesOrderInternal.js` | Edit form |
| `/salesorderinternal/:id/action` | `Invoices/EscalateSalesOrderInternal.js` | Status change action (confirm dialog) |
| `/salesorderinternal/escalationlist` | `Invoices/EscalatedSalesOrderInternals.js` | List (DataGrid) |
| `/salesorderinternal/:id/package` | `Invoices/PackagingSalesOrderInternal.js` | Packaging form |
| `/salesorderinternal/packagelist` | `Invoices/PackagedSalesOrderInternal.js` | List (DataGrid) |
| `/salesorderinternal/packagelist/done` | `Invoices/PackageDoneSalesOrderInternal.js` | List (DataGrid) |
| `/packagelist/done/:id/edit` | `Invoices/EditPackagedSalesOrderInternal.js` | Edit pack form |

### In scope — admin stock-out overlays (7 active routes)

| Legacy Route | Legacy File | Type |
|---|---|---|
| `/salesorderinternal/general` | `AdminEdit/SalesOrderInternalGeneralEdit.js` | Admin list (DataGrid) |
| `/salesorderinternal/pendingprice` | `AdminEdit/SalesPendingPriceAdminGrid/SalesPendingPrice.js` | Admin list (DataGrid) |
| `/salesorder/limitededit` | `AdminEdit/SalesOrderLimitedEditGrid.js` | Admin list (DataGrid) |
| `/salesorder/:id/invoicelimitededit` | `AdminEdit/SalesInvoiceAdminEdit/LimitedItemsEidtAtInvoice.js` | Admin edit form |
| `/salesorderinternal/:id/action/price` | `AdminEdit/SalesInvoiceAdminEdit/EscalateSalesOrderInternalWithPriceEdit.js` | Admin edit form |
| `/salesorderinternal/admin/:id/edit` | `AdminEdit/SalesOrderAdminEdit/EditSalesOrderInternalAdmin.js` | Admin edit form |
| `/packagelist/done/admin/:id/edit` | `AdminEdit/SalesPackingEdit/EditSalesOrderPacking.js` | Admin edit form |

### In scope — operational support (4 active routes)

| Legacy Route | Legacy File | Type |
|---|---|---|
| `/stockout/status` | `Invoices/StockoutStatus.js` | Status monitoring (DataGrid, CSV upload, bulk ops) |
| `/stockout/update` | `Invoices/DefinePending.js` | Pending status management (DataGrid) |
| `/salesoperation/stockoutstockrevert` | `Invoices/DeliveryReturnInventoryRestoration.js` | Inventory revert form |
| `/packingessential/packingrelatedprint` | `Invoices/MiniInvoiceLabelSticker.js` | Label/sticker print list |

### In scope — child/utility components (not routed)

| Legacy File | Used By | Type |
|---|---|---|
| `Invoices/DefinePendingStatusModal.js` | DefinePending, StockoutStatus | Modal |
| `Invoices/PaymentInfo.js` | CreateSalesOrderInternal | Sidebar widget |
| `Invoices/ErrorBoundary.js` | Wraps forms | Utility |

### Out of scope — this plan

| Area | Reason |
|---|---|
| Task assignment (`/task/assign`, `AddTask`, `EditTask`, etc.) | Separate plan |
| Sticker packaging (`src/pages/Sticker/RepackingSticker/*`) | Confirm scope first |
| Escalation cockpit (`src/pages/escalation/*`) | Confirm scope first |

### Orphaned / dead files in Invoices (safe to skip)

| File | Evidence | Status |
|---|---|---|
| `Invoices/CreateIdea.js` | Imported in `routes.js` line 13, but **no route path assigned**. 26-line prototype rendering `<Menu />` + `<InvoiceForm />`. | ORPHANED |
| `Invoices/CreateInvoice.js` | Imported in `routes.js` line 14, but **no route path assigned**. Static HTML mockup with hardcoded data. | ORPHANED |
| `Invoices/EditDemo.js` | Imported in `routes.js` line 41, but **no route path assigned**. Near-duplicate of `EditSalesOrderInternal.js`. | ORPHANED |
| `Invoices/UpdateStockoutStatus.js` | Route is **commented out** at `routes.js` line 524–527. Replaced by `DefinePending.js` at same path. | DEAD CODE |

These four files should **not** be migrated. They are dead code in the legacy project.

---

## 3. Legacy Flow Understanding

### Primary workflow pipeline

```text
Created / Draft
  → Edit (EditSalesOrderInternal)
  → Escalate [status change only — confirm dialog, calls SubmitForPackaging]
  → Escalation Queue (EscalatedSalesOrderInternals)
  → Package (PackagingSalesOrderInternal)
  → Package List (PackagedSalesOrderInternal)
  → Package Done (PackageDoneSalesOrderInternal)
  → Edit Pack (EditPackagedSalesOrderInternal)
```

### Admin overlay paths (branch off the same order)

```text
General Admin List → Sales Edit | Invoice Edit | Package Edit
Pending Price List → Escalate | Price Edit
Limited Edit List  → Invoice Limited Edit
```

The three admin list pages (`SalesOrderInternalGeneralEdit`, `SalesPendingPrice`, `SalesOrderLimitedEditGrid`) consume the same data through slightly different API calls and offer different action buttons per status tab. The four admin edit forms load the same order detail and render overlapping form fields.

### Operational support paths (independent entry points)

```text
StockoutStatus    → Status monitoring, CSV upload, bulk operations
DefinePending     → Set pending status on orders (with modal)
DeliveryReturn    → Revert inventory from returned deliveries
MiniInvoiceLabel  → Print labels/stickers from packaged orders
```

---

## 4. Complete Legacy File Inventory

### 4A. `src/pages/Invoices/` — 20 files

| # | File | Route | Purpose | Migrating? |
|---|------|-------|---------|------------|
| 1 | `SalesOrderInternal.js` | `/salesorderinternal` | Main SO list with DataGrid, date/customer filters, status tabs, action buttons (edit/escalate/package/view/print) | YES |
| 2 | `CreateSalesOrderInternal.js` | `/salesorderinternal/create` | Create SO form with product line items, financial calculations, customer/supplier selection, `PaymentInfo` sidebar | YES |
| 3 | `EditSalesOrderInternal.js` | `/salesorderinternal/:id/edit` | Edit SO pre-escalation: product rows, batch/map selection, inline financial math | YES |
| 4 | `EscalateSalesOrderInternal.js` | `/salesorderinternal/:id/action` | **Status change only.** Displays existing order as read-only (customer, address, date, notes all disabled). On Save calls `PUT /StockOut/SubmitForPackaging` to move order into the escalation queue. Not a real edit form — no data entry required from the user. V2 replaces this whole page with a confirm dialog row action on the list. | YES |
| 5 | `EscalatedSalesOrderInternals.js` | `/salesorderinternal/escalationlist` | Escalation queue DataGrid, status tabs, action buttons | YES |
| 6 | `PackagingSalesOrderInternal.js` | `/salesorderinternal/:id/package` | Packaging form: pack type dropdown, pack size, pack count, auto-fill, quantity validation | YES |
| 7 | `PackagedSalesOrderInternal.js` | `/salesorderinternal/packagelist` | Packaging list DataGrid (in-progress + ready) | YES |
| 8 | `PackageDoneSalesOrderInternal.js` | `/salesorderinternal/packagelist/done` | Package-done list DataGrid | YES |
| 9 | `EditPackagedSalesOrderInternal.js` | `/packagelist/done/:id/edit` | Edit packaging after done: pack size/count/type editing | YES |
| 10 | `StockoutStatus.js` | `/stockout/status` | Advanced status monitoring DataGrid, CSV upload, bulk operations, uses `DefinePendingStatusModal` | YES |
| 11 | `DefinePending.js` | `/stockout/update` | Pending status management DataGrid, uses `DefinePendingStatusModal` | YES |
| 12 | `DefinePendingStatusModal.js` | (child) | Status update modal, used by `DefinePending` and `StockoutStatus` | YES |
| 13 | `DeliveryReturnInventoryRestoration.js` | `/salesoperation/stockoutstockrevert` | Form to revert/restore inventory from delivery returns | YES |
| 14 | `MiniInvoiceLabelSticker.js` | `/packingessential/packingrelatedprint` | Label/sticker print list from packaged orders | YES |
| 15 | `PaymentInfo.js` | (child) | Sidebar widget showing current stock, customer credit, last payment. Used inside `CreateSalesOrderInternal` | YES |
| 16 | `ErrorBoundary.js` | (utility) | React error boundary wrapper. 42 lines | YES (replace with V2 `ErrorBoundary.tsx`) |
| 17 | `CreateIdea.js` | None | Orphaned prototype. 26 lines | NO — dead code |
| 18 | `CreateInvoice.js` | None | Orphaned HTML mockup. ~85 lines | NO — dead code |
| 19 | `EditDemo.js` | None | Orphaned duplicate of EditSalesOrderInternal | NO — dead code |
| 20 | `UpdateStockoutStatus.js` | Commented out | Replaced by DefinePending | NO — dead code |

### 4B. `src/pages/AdminEdit/` — 7 files

| # | File | Route | Purpose | Overlap with Invoices/ |
|---|------|-------|---------|----------------------|
| 1 | `SalesOrderInternalGeneralEdit.js` | `/salesorderinternal/general` | Admin list: DataGrid with status tabs (Created/Escalated/InProgress/Done), date/customer filters. "Done" row actions: SALES→admin edit, INVOICE→price edit, PACKAGE→pack edit | List grid overlap with `SalesOrderInternal.js`. Uses `listSalesOrderAdminEdit` API |
| 2 | `SalesPendingPriceAdminGrid/SalesPendingPrice.js` | `/salesorderinternal/pendingprice` | Admin list: DataGrid filtered for pending-price orders. Same grid pattern as #1 with different filter and action set | List grid overlap with `SalesOrderInternal.js`. Uses `listSalesOrderInternalPendingPrice` API |
| 3 | `SalesOrderLimitedEditGrid.js` | `/salesorder/limitededit` | Admin list: Nearly identical to #1 but INVOICE button goes to `/salesorder/:id/invoicelimitededit` and SALES column is commented out | ~95% duplicate of #1 |
| 4 | `SalesInvoiceAdminEdit/LimitedItemsEidtAtInvoice.js` | `/salesorder/:id/invoicelimitededit` | Admin edit form: quantity-only editing using `InvoiceItemBodyLimited`, submits via `packageSalesOrderAdminInvoiceUpdate` (`AdminSubmitForPackaging`) | Inline calc; quantity-only variant of escalation |
| 5 | `SalesInvoiceAdminEdit/EscalateSalesOrderInternalWithPriceEdit.js` | `/salesorderinternal/:id/action/price` | Admin edit form: Full price editing at invoice level with `SalesOrderItemWithPriceEdit` component. Uses `updateSalesOrderAdminEdit` | ~70% overlap with `EditSalesOrderInternal.js`. Inline calc |
| 6 | `SalesOrderAdminEdit/EditSalesOrderInternalAdmin.js` | `/salesorderinternal/admin/:id/edit` | Admin edit form: **Most refactored** — uses `financialCalculations` service (not inline math). Supports Purchase_Return type, supplier selection, currency conversion, LC ID, date validation. Uses `SalesOrderItemAdminEdit` component | Full admin edit. Only file using `financialCalculations` service properly |
| 7 | `SalesPackingEdit/EditSalesOrderPacking.js` | `/packagelist/done/admin/:id/edit` | Admin edit form: Edit pack size/count/type after packaging done. Validates pack quantities match confirmed quantities. Uses `PackagingItem` component | Overlap with `EditPackagedSalesOrderInternal.js`. Uses `packageDoneEditSalesOrderInternal` API |

### 4C. Shared business logic and state (legacy)

| File | Purpose |
|---|---|
| `src/redux/actions/invoiceActions.js` | 34 exported functions covering all stock-out CRUD, escalation, packaging, admin edit, and lookup operations |
| `src/redux/reducers/invoiceReducers.js` | Redux state shape for all stock-out data |
| `src/services/financialCalculations.js` | 14 exported functions: `calculateProductLineTotal`, `calculateCompleteBill`, `calculateSubtotal`, `calculateFinalTotal`, `recalculateItemOnEdit`, `validateSellingPrice`, `validateFinancialInputs`, etc. |
| `src/services/calculationHelpers.js` | 10 exports: `parseNumeric`, `toFixed`, `calculatePercentage`, `DISCOUNT_TYPE_FIXED`, `DISCOUNT_TYPE_PERCENTAGE`, etc. |

### 4D. Core UI components used by stock-out (legacy `src/core/`)

| Component | Used By | V2 Treatment |
|---|---|---|
| `SalesOrderItem` (class) | Standard create/edit — quantity columns, batch/map icon | Rewrite as functional component |
| `SalesOrderItemWithPriceEdit` (class) | Admin escalation-with-price-edit | Merge into shared item table with mode |
| `SalesOrderItemAdminEdit` (class) | Admin full edit — product swap, price columns | Merge into shared item table with mode |
| `InvoiceItemBodyLimited` (class, misleading name `InvoiceItemBody`) | Admin limited edit — quantity-only editing | Merge into shared item table with mode |
| `PackagingItem` (functional, memo) | Packaging step — pack type/size/no, auto-fill | Separate packaging item component |
| `SalesOrderInternalModal` (class) | Print/PDF | Rewrite as functional |
| `InvoiceItem` (class) | Generic item editor (used by orphaned CreateInvoice) | Skip — not part of active stock-out flow |
| `SalesOrderView` | Detail view in modals | Rewrite as functional |
| `KarjadeshView` | Print view | Rewrite as functional |
| `SalesOrderChalaanModal` | Chalaan print | Rewrite as functional |
| `SalesOrderStickerModal` | Sticker print | Rewrite as functional |
| `CustomTypeaheadSelect` | Product selection typeahead | Replace with V2 `PaginatedCombobox` |
| `EditableProductField`, `EditableProductFieldPi` | Inline field editing | Replace with React Hook Form controlled fields |
| `DPWItem`, `ELItem`, `SampleItem` | Specialized row types | Evaluate need |

---

## 5. Complete API Endpoint Inventory

### Stock-out CRUD

| Action Function | Method | Endpoint | Used By |
|---|---|---|---|
| `createSalesOrderInternal` | POST | `/StockOut/CreateStockOutOrder` | Create page |
| `listSalesOrderInternal` | GET | `/StockOut/StockOutOrderGridData/{order}` | Main list |
| `listSalesOrderInternalDetails` | GET | `/StockOut/GetStockOutOrderDetails/{id}` | Edit/escalate/admin forms |
| `updateSalesOrderInternal` | PUT | `/StockOut/UpdateStockOutOrder` | Standard edit |
| `updateSalesOrderAdminEdit` | PUT | `/StockOut/AdminUpdateStockOutOrder` | Admin edit (Escalate+Price, FullAdmin) |
| `listSalesOrderFilterInternal` | GET | `/StockOut/StockOutPrintReportGridData?currentStatus=&startDate=&endDate=&customerId=` | Filtered list |
| `listSalesOrderInternalWithCurrentStatus` | GET | `/StockOut/SoStatusDataGrid?currentStatus={statusId}` | Status monitoring |
| `listSalesOrderPendingInternal` | GET | `/StockOut/SoAllPendingGrid?startDate=&endDate=&customerId=` | Pending list |
| `updateStockout` | PUT | `/StockOut/UpdateStockOutAssociateCurrentStatus/{soSystemId}/{associateCurrenStatus}` | Status update |
| `listGetJobSearchSingle` | GET | `/StockOut/GetJobBySearch/{searchQuery}` | Job search |

### Escalation

| Action Function | Method | Endpoint | Used By |
|---|---|---|---|
| `escalateSalesOrderInternal` | POST | `/StockOut/SubmitForMapItemAndBatch` | **Unused in active code** — action is defined but the escalation page calls `packageSalesOrderInternal` instead |
| `packageSalesOrderInternal` | PUT | `/StockOut/SubmitForPackaging` | **Escalation page** (`EscalateSalesOrderInternal`) + standard packaging |
| `listBatchAndMappedItemBasedOnProduct` | GET | `/StockOut/GetMappedItemsAndBatchesByProduct/{productId}` | Admin forms (not used by escalation page) |
| `listLatesBatchAndMapDetails` | GET | `/StockOut/GetLastMappAndBatchByCustomerAndProduct/{customerId}/{productId}` | Admin forms (not used by escalation page) |

### Packaging

| Action Function | Method | Endpoint | Used By |
|---|---|---|---|
| `packageSalesOrderInternal` | PUT | `/StockOut/SubmitForPackaging` | Standard packaging |
| `packageSalesOrderAdminInvoiceUpdate` | PUT | `/StockOut/AdminSubmitForPackaging` | Admin limited edit |
| `packageDoneSalesOrderInternal` | POST | `/StockOut/SubmitPackaging` | Package completion |
| `listPackagingDoneSalesOrderInternalDetails` | GET | `/StockOut/GetPackagingInfo/{id}` | Package-done detail |
| `packageDoneEditSalesOrderInternal` | PUT | `/StockOut/UpdatePackaging` | Edit completed packaging |

### Admin grid

| Action Function | Method | Endpoint | Used By |
|---|---|---|---|
| `listSalesOrderAdminEdit` | GET | `/StockOut/StockOutAdminEidtGridData?status=&startDate=&endDate=&customerId=` | GeneralEdit, LimitedEditGrid |
| `listSalesOrderInternalPendingPrice` | GET | `/StockOut/GetSoPendingPriceGrid` | SalesPendingPrice |

### Sticker packaging (deferred)

| Action Function | Method | Endpoint | Used By |
|---|---|---|---|
| `listSalesOrderListForPackingAndEditAction` | GET | `/StockOut/StickerStockOutOrderGridData/{order}` | Sticker flow |
| `listDetailsEditPackingStickerAction` | GET | `/StockOut/GetStickerPackagingDetailsForEdit/{id}` | Sticker edit |
| `createPackingStickerAction` | POST | `/StockOut/CreateStickerPackaging` | Sticker create |
| `updatePackingStickerAction` | PUT | `/StockOut/UpdateStickerPackaging` | Sticker update |

### Lookups (shared across multiple pages)

| Action Function | Method | Endpoint | Used By |
|---|---|---|---|
| `listProductsForInvoice` | GET | `/Product/GetProducts` | Product dropdown |
| `FilterProductsForInvoice` | — | (client-side filter) | Filter already-selected products |
| `listOrderTypeInvoice` | GET | `/KeyValue/GetJobTypeInKeyValue/Stock%20Out` | Order type dropdown |
| `listOrderFromInvoice` | GET | `/KeyValue/GetOrderFromInKeyValue` | Order-from dropdown |
| `listPendingInvoice` | GET | `/KeyValue/GetLifecyclesInKeyValue/stock_out/{status}` | Pending status options |
| `listPackTypesForInvoice` | GET | `/Product/GetPackType` | Pack type dropdown |
| `listPriceSummaryBasedOnProductAndCustomer` | GET | `/TallySales/GetPriceSummary?customerId=&prodcutId=` | Price summary (EditAdmin) |
| `listCategories` | — | `/Product/GetCategory` (from productActions) | Category dropdown |
| `listCustomersForSignup` | — | `/Customer/SignUp` (from userActions) | Customer dropdown |
| `listSuppliersForDropdown` | — | `/Supplier/Dropdown` (from supplierActions) | Supplier dropdown (EditAdmin) |

### Tally

| Action Function | Method | Endpoint | Used By |
|---|---|---|---|
| `createTallySales` | POST | `/TallySales/AddTallySales` | Tally integration |

---

## 6. Key Technical Findings

### Finding 1: Admin edit is a duplication layer, not a domain boundary

The AdminEdit folder contains 7 files that duplicate logic from the Invoices folder:

- **3 admin lists** (`SalesOrderInternalGeneralEdit`, `SalesPendingPrice`, `SalesOrderLimitedEditGrid`) are the same DataGrid with different API sources, status filters, and row action buttons. `SalesOrderLimitedEditGrid` is a ~95% clone of `SalesOrderInternalGeneralEdit` with only the INVOICE action URL changed.
- **4 admin edit forms** (`LimitedItemsEidtAtInvoice`, `EscalateSalesOrderInternalWithPriceEdit`, `EditSalesOrderInternalAdmin`, `EditSalesOrderPacking`) load the same order detail and render overlapping form fields. They differ primarily in: (a) which mutation endpoint is called on save, (b) which fields are editable vs read-only, (c) which item row component is used.

### Finding 2: Only `EditSalesOrderInternalAdmin` uses the extracted calculation service

Out of all admin edit forms, only `EditSalesOrderInternalAdmin.js` imports and uses the properly extracted `financialCalculations` service (`calculateProductLineTotal`, `calculateCompleteBill`, `recalculateItemOnEdit`, `calculateSubtotal`). The other two edit forms (`LimitedItemsEidtAtInvoice`, `EscalateSalesOrderInternalWithPriceEdit`) **still have inline calculation logic** — the same math, copy-pasted. V2 must centralize this.

### Finding 3: Four different item row components exist for the same conceptual table

Legacy uses four separate class components for rendering order item table rows:

| Component | Purpose | Price editing? | Product swap? |
|---|---|---|---|
| `SalesOrderItem` | Standard create/edit | No | No |
| `SalesOrderItemWithPriceEdit` | Admin price edit | Yes | No |
| `SalesOrderItemAdminEdit` | Admin full edit | Yes | Yes (dropdown) |
| `InvoiceItemBodyLimited` | Admin limited edit | No | No |

V2 should replace these with **one shared item table component** with column visibility and editability controlled by the edit mode.

### Finding 4: The `DefinePending` and `StockoutStatus` pages share a modal

Both `DefinePending.js` and `StockoutStatus.js` use `DefinePendingStatusModal.js` as a child modal for updating stock-out status. This is a well-factored shared component in legacy — V2 should preserve this pattern.

### Finding 5: Stale data is a structural issue

Mutation-to-refresh behavior is inconsistent across the workflow:

- Create and update do not consistently refresh downstream lists
- Escalation refresh behavior differs from create/edit
- Packaging completion does not reliably refresh the same way
- Admin edits update through separate entry points without unified cache invalidation
- Multiple pages use `window.location.reload()` or navigation-based refresh instead of state-driven updates

V2's React Query invalidation model directly solves this.

### Finding 6: Calculation logic is valuable and well-extracted (partially)

`financialCalculations.js` exports 14 well-structured pure functions:

- `calculateProductLineTotal({unitPrice, quantity, discount, discountType, vatRate, aitRate})` → returns `{baseAmount, discountAmount, vatAmount, aitAmount, lineTotal, vatAitTotal}`
- `calculateCompleteBill({items, discount, discountType, vatRate, aitRate, adjustmentAmount, conversionRate})` → full bill
- `calculateSubtotal(items[])` → sum of line totals
- `calculateFinalTotal({subtotal, discount, discountType, vatRate, aitRate, adjustmentAmount})` → grand total
- `recalculateItemOnEdit({item, fieldName, newValue})` → recalculate single item on field change
- `validateSellingPrice(sellingPrice, purchasePrice)` → validation
- `validateFinancialInputs(inputs)` → validation

`calculationHelpers.js` provides supporting utilities: `parseNumeric`, `toFixed`, `calculatePercentage`, discount type constants, validation helpers.

These functions should be ported to V2 as-is (with TypeScript types) into `features/stock-out/calculations.ts`.

### Finding 7: Server state and page state are mixed

In escalation and packaging stages, authoritative order data and temporary UI selections co-exist in the same component state. Admin edit pages load the same order detail into duplicate form implementations with slightly different field rules. V2 must separate server state (React Query) from form state (React Hook Form).

### Finding 8: "EscalateSalesOrderInternal" is a misnamed status-change page

Despite its name, `EscalateSalesOrderInternal.js` is **not an edit form**. Code inspection confirms:

- All header fields (customer name, address, order date, notes) are rendered with `disabled` — no data entry
- The submit handler calls `packageSalesOrderInternal` → `PUT /StockOut/SubmitForPackaging`, the same endpoint used by the packaging step
- The `escalateSalesOrderInternal` action (`POST /StockOut/SubmitForMapItemAndBatch`) is defined in `invoiceActions.js` but is **not called** by this page
- After success the page navigates to `/salesorderinternal/escalationlist`

**Conclusion:** Escalation is purely a status change. The legacy page exists only because a route was needed; the user clicks "Escalate" on the list, lands on a read-only order view, and clicks Save to confirm the status transition. V2 replaces this entire page with a **confirm dialog row action** on `SalesOrderListPage` — no separate route or form page required.

---

## 7. V2 Architecture — Following AI_DEVELOPER_GUIDE Conventions

### V2 tech stack (from AI_DEVELOPER_GUIDE)

| Concern | V2 Tool | Legacy Tool (replaced) |
|---|---|---|
| Framework | React 19 + TypeScript strict | React JS (no TS) |
| Server state | TanStack Query v5 | Redux actions/reducers |
| Client/UI state | Zustand 5 | Redux + component state |
| Forms | React Hook Form v7 + Zod v4 | Formik + inline validation |
| Routing | React Router DOM v7 | React Router (older) |
| API client | `apiClient` (fetch-based, `lib/api.ts`) | Axios |
| Styling | Tailwind CSS v4 (gray-only) | Bootstrap + MUI + styled-components |
| Icons | Lucide React | MUI icons + react-icons |
| Data grid | Native HTML table with infinite scroll | MUI X DataGrid |
| Dropdowns | V2 centralized dropdown system (22 types) | react-bootstrap-typeahead + custom |

### V2 naming conventions (from AI_DEVELOPER_GUIDE)

| Item | Pattern |
|---|---|
| Type file | `types/stockOut.ts` (ONE file per domain) |
| Hook file | `hooks/useStockOut.ts` (ONE file per domain) |
| Schema file | `schemas/stockOutSchema.ts` |
| List page | `pages/sales-orders/SalesOrderListPage.tsx` |
| Add page | `pages/sales-orders/CreateSalesOrderPage.tsx` |
| Edit page | `pages/sales-orders/EditSalesOrderPage.tsx` |
| Domain logic | `features/stock-out/calculations.ts` |

### V2 module layout

```text
v2-octopi/src/
├── types/
│   └── stockOut.ts                          # ALL stock-out types: order, items, bill, admin modes, lookups, payloads
│
├── schemas/
│   └── stockOutSchema.ts                    # Zod schemas for create/edit/escalate/package/admin-edit forms
│
├── hooks/
│   └── useStockOut.ts                       # ALL stock-out queries + mutations in one file
│                                            #   stockOutKeys factory
│                                            #   usePaginatedStockOutOrders(mode, filters)
│                                            #   useStockOutDetail(id)
│                                            #   useStockOutLookups()
│                                            #   useCreateStockOut()
│                                            #   useUpdateStockOut()
│                                            #   useSubmitForEscalation()        # calls SubmitForPackaging to change status
│                                            #   useSubmitPackaging()
│                                            #   useAdminUpdateStockOut(editMode)
│                                            #   useAdminListStockOut(listMode, filters)
│                                            #   usePackagingDoneDetail(id)
│                                            #   useUpdatePackaging()
│                                            #   useStockOutStatus()
│                                            #   useUpdateStockOutStatus()
│
├── features/
│   └── stock-out/
│       ├── calculations.ts                  # Port of financialCalculations.js + calculationHelpers.js (pure TS)
│       ├── modes.ts                         # listMode, editMode, permissionProfile type definitions + config
│       └── fieldRules.ts                    # Per-mode field editability rules (which fields are editable/readonly/hidden)
│
├── pages/
│   └── sales-orders/
│       ├── SalesOrderListPage.tsx           # Shared list page — mode-driven (standard, admin-general, admin-pending, admin-limited)
│       │                                    #   Includes EscalateConfirmDialog (inline) for status-change row action
│       ├── CreateSalesOrderPage.tsx          # Create form
│       ├── EditSalesOrderPage.tsx            # Shared edit page — mode-driven (standard, invoice-limited, price-edit, admin-full, packing-edit)
│       ├── PackageSalesOrderPage.tsx         # Packaging form with pack type/size/count
│       ├── StockOutStatusPage.tsx            # Status monitoring + CSV upload + bulk ops
│       ├── PendingStatusPage.tsx             # Pending status management
│       ├── DeliveryReturnPage.tsx            # Inventory revert form
│       ├── PackingPrintPage.tsx              # Label/sticker print list
│       ├── SalesOrderForm.tsx               # Shared form (create + edit + admin edit modes)
│       ├── SalesOrderItemTable.tsx           # Shared item row table — replaces 4 legacy class components
│       └── StatusUpdateModal.tsx             # Shared modal — replaces DefinePendingStatusModal
│
├── router/
│   └── AppRouter.tsx                        # Add sales-order routes + legacy redirects
│
└── auth/
    └── menuMapper.ts                        # Add legacy → v2 route mappings
```

### Key design decisions

1. **ONE type file** (`types/stockOut.ts`): Contains all interfaces — order header, line items, bill data, create/update/escalate/package payloads, admin mode types, lookup option types. No separate `stockOutAdmin.ts`.

2. **ONE hook file** (`hooks/useStockOut.ts`): Contains all queries and mutations. The `stockOutKeys` factory covers standard lists, admin lists, details, lookups, and packaging details. All mutations use `queryClient.invalidateQueries` to solve the stale-data problem.

3. **ONE schema file** (`schemas/stockOutSchema.ts`): Contains Zod schemas for all form variants. Mode-driven field presence uses `.optional()` or conditional refinements.

4. **Mode-driven pages instead of duplicate pages**: Instead of separate `StockOutAdminListPage`, `StockOutAdminEditPage`, etc., the shared `SalesOrderListPage` and `EditSalesOrderPage` accept a `mode` prop (passed from the route definition) that controls columns, filters, actions, form fields, and mutation endpoints.

5. **One shared `SalesOrderItemTable`**: Replaces the four legacy class components (`SalesOrderItem`, `SalesOrderItemWithPriceEdit`, `SalesOrderItemAdminEdit`, `InvoiceItemBodyLimited`) with a single functional component using column visibility/editability driven by the edit mode.

---

## 8. V2 Route Map

| V2 Route | Legacy Route | Mode | Page |
|---|---|---|---|
| `/sales-orders` | `/salesorderinternal` | `standard` | `SalesOrderListPage` |
| `/sales-orders/create` | `/salesorderinternal/create` | — | `CreateSalesOrderPage` |
| `/sales-orders/:id/edit` | `/salesorderinternal/:id/edit` | `standard` | `EditSalesOrderPage` |
| *(no route — confirm dialog)* | `/salesorderinternal/:id/action` | — | Inline `EscalateConfirmDialog` on `SalesOrderListPage` |
| `/sales-orders/escalations` | `/salesorderinternal/escalationlist` | `escalation` | `SalesOrderListPage` |
| `/sales-orders/:id/package` | `/salesorderinternal/:id/package` | — | `PackageSalesOrderPage` |
| `/sales-orders/packages` | `/salesorderinternal/packagelist` | `packaging` | `SalesOrderListPage` |
| `/sales-orders/packages/done` | `/salesorderinternal/packagelist/done` | `package-done` | `SalesOrderListPage` |
| `/sales-orders/packages/done/:id/edit` | `/packagelist/done/:id/edit` | `packing-edit` | `EditSalesOrderPage` |
| `/sales-orders/admin/general` | `/salesorderinternal/general` | `admin-general` | `SalesOrderListPage` |
| `/sales-orders/admin/pending-price` | `/salesorderinternal/pendingprice` | `admin-pending-price` | `SalesOrderListPage` |
| `/sales-orders/admin/limited-edit` | `/salesorder/limitededit` | `admin-limited-edit` | `SalesOrderListPage` |
| `/sales-orders/admin/:id/edit` | `/salesorderinternal/admin/:id/edit` | `admin-full` | `EditSalesOrderPage` |
| `/sales-orders/admin/:id/price-edit` | `/salesorderinternal/:id/action/price` | `admin-price-edit` | `EditSalesOrderPage` |
| `/sales-orders/admin/:id/invoice-edit` | `/salesorder/:id/invoicelimitededit` | `admin-invoice-limited` | `EditSalesOrderPage` |
| `/sales-orders/admin/:id/pack-edit` | `/packagelist/done/admin/:id/edit` | `admin-packing-edit` | `EditSalesOrderPage` |
| `/sales-orders/status` | `/stockout/status` | — | `StockOutStatusPage` |
| `/sales-orders/pending` | `/stockout/update` | — | `PendingStatusPage` |
| `/sales-orders/delivery-return` | `/salesoperation/stockoutstockrevert` | — | `DeliveryReturnPage` |
| `/sales-orders/packing-print` | `/packingessential/packingrelatedprint` | — | `PackingPrintPage` |

### Legacy redirects to add in router

```tsx
<Route path="salesorderinternal" element={<Navigate to="/sales-orders" replace />} />
<Route path="salesorderinternal/create" element={<Navigate to="/sales-orders/create" replace />} />
<Route path="salesorderinternal/escalationlist" element={<Navigate to="/sales-orders/escalations" replace />} />
<Route path="salesorderinternal/packagelist" element={<Navigate to="/sales-orders/packages" replace />} />
<Route path="salesorderinternal/general" element={<Navigate to="/sales-orders/admin/general" replace />} />
<Route path="salesorderinternal/pendingprice" element={<Navigate to="/sales-orders/admin/pending-price" replace />} />
<Route path="salesorder/limitededit" element={<Navigate to="/sales-orders/admin/limited-edit" replace />} />
<Route path="stockout/status" element={<Navigate to="/sales-orders/status" replace />} />
<Route path="stockout/update" element={<Navigate to="/sales-orders/pending" replace />} />
```

---

## 9. Query Strategy

### Query key factory

```typescript
export const stockOutKeys = {
  all: ['stockOut'] as const,
  lists: () => [...stockOutKeys.all, 'list'] as const,
  list: (mode: string, filters: object) => [...stockOutKeys.all, 'list', mode, filters] as const,
  details: () => [...stockOutKeys.all, 'detail'] as const,
  detail: (id: number) => [...stockOutKeys.all, 'detail', id] as const,
  packaging: (id: number) => [...stockOutKeys.all, 'packaging', id] as const,
  lookups: () => [...stockOutKeys.all, 'lookups'] as const,
  batches: (productId: number) => [...stockOutKeys.all, 'batches', productId] as const,
  status: (filters: object) => [...stockOutKeys.all, 'status', filters] as const,
}
```

### Mutation invalidation matrix

| Mutation | Invalidate |
|---|---|
| Create stock-out | `stockOutKeys.lists()` |
| Update stock-out | `stockOutKeys.lists()` + `stockOutKeys.detail(id)` |
| Escalate (status change) | `stockOutKeys.lists()` + `stockOutKeys.detail(id)` |
| Submit for packaging | `stockOutKeys.lists()` + `stockOutKeys.detail(id)` |
| Complete packaging | `stockOutKeys.lists()` + `stockOutKeys.detail(id)` + `stockOutKeys.packaging(id)` |
| Admin update | `stockOutKeys.lists()` + `stockOutKeys.detail(id)` |
| Admin submit packaging | `stockOutKeys.lists()` + `stockOutKeys.detail(id)` |
| Update packaging | `stockOutKeys.lists()` + `stockOutKeys.packaging(id)` |
| Update status | `stockOutKeys.lists()` + `stockOutKeys.detail(id)` |

The `lists()` key invalidates ALL list queries (standard + admin + escalation + packaging + status) at once. This is the architectural fix for the stale-data problem — every mutation refreshes every affected list view.

---

## 10. Mode System Design

### List modes

| Mode | API Source | Status Tabs | Row Actions |
|---|---|---|---|
| `standard` | `StockOutOrderGridData/{order}` | Per order type | Edit, **Escalate (confirm dialog)**, View, Print |
| `escalation` | (filtered standard) | Escalation stages | Package, View, Print |
| `packaging` | (filtered standard) | Packaging stages | Edit pack, View |
| `package-done` | (filtered standard) | Done | Edit pack, View, Print |
| `admin-general` | `StockOutAdminEidtGridData?status=...` | 0-3 (Created/Escalated/InProgress/Done) | Sales Edit, Invoice Edit, Package Edit |
| `admin-pending-price` | `GetSoPendingPriceGrid` | By status | Escalate, Price Edit |
| `admin-limited-edit` | `StockOutAdminEidtGridData?status=...` | 0-3 | Invoice Limited Edit |

### Edit modes

| Mode | API for Load | API for Save | Editable Fields | Item Component Mode |
|---|---|---|---|---|
| `standard` | `GetStockOutOrderDetails/{id}` | `UpdateStockOutOrder` | Customer, products, quantities, discount, notes | Standard (no price edit) |
| `admin-full` | `GetStockOutOrderDetails/{id}` | `AdminUpdateStockOutOrder` | All fields including customer swap, supplier, order type, date, prices, currency, LC ID | Full (price + product swap) |
| `admin-price-edit` | `GetStockOutOrderDetails/{id}` | `AdminUpdateStockOutOrder` | Prices, quantities, VAT/AIT, discount, batch, notes | Price edit |
| `admin-invoice-limited` | `GetStockOutOrderDetails/{id}` | `AdminSubmitForPackaging` | Quantities, reference no | Limited (quantity only) |
| `admin-packing-edit` | `GetPackagingInfo/{id}` | `UpdatePackaging` | Pack size, pack count, pack type | Packaging fields only |
| `packing-edit` | `GetPackagingInfo/{id}` | `UpdatePackaging` | Pack size, pack count, pack type | Packaging fields only |

### Permission profiles

| Profile | Accessible Modes |
|---|---|
| `standard` | standard list, standard edit, escalate, package |
| `pricing` | admin-pending-price list, admin-price-edit |
| `warehouse` | admin-packing-edit |
| `superadmin` | All modes |

---

## 11. Execution Plan

### Phase 1: Domain Foundation

**Objective:** Build the typed domain layer before any UI work.

**Actions:**

1. Create `types/stockOut.ts` — order header, line items, bill data, create/update/escalate/package payloads, admin payloads, lookup option types, list mode and edit mode union types
2. Create `schemas/stockOutSchema.ts` — Zod schemas for create form, edit form, escalation form, packaging form, admin edit form (with mode-driven optional fields)
3. Create `features/stock-out/calculations.ts` — port all 14 functions from `financialCalculations.js` + helpers from `calculationHelpers.js` as pure TypeScript with proper types
4. Create `features/stock-out/modes.ts` — `ListMode`, `EditMode`, `PermissionProfile` types and configuration objects
5. Create `features/stock-out/fieldRules.ts` — per-mode field editability map (editable / readonly / hidden per field per mode)
6. Create `hooks/useStockOut.ts` — `stockOutKeys` factory, all queries (list, detail, lookups, admin list, packaging detail, batches, status), all mutations with invalidation rules

**Outputs:** Complete domain layer ready for page consumption. No UI yet.

**Success criteria:**
- All types match the actual API response shapes from the endpoint inventory
- Calculations produce identical results to legacy `financialCalculations.js`
- Every query/mutation follows the V2 hook patterns from AI_DEVELOPER_GUIDE Section 8

### Phase 2: Core List And Create

**Objective:** Get the main stock-out list and create flow working end-to-end.

**Actions:**

1. Create `pages/sales-orders/SalesOrderListPage.tsx` — paginated list with debounced search, infinite scroll, date/customer filters, status tabs. Start with `standard` mode only
2. Create `pages/sales-orders/SalesOrderForm.tsx` — shared form component (React Hook Form + Zod) for all create/edit modes. Fieldset sections: Customer Info, Order Details, Product Line Items, Financial Summary, Notes
3. Create `pages/sales-orders/SalesOrderItemTable.tsx` — shared item row table component. Start with standard mode (quantity, batch/map, no price editing)
4. Create `pages/sales-orders/CreateSalesOrderPage.tsx` — thin wrapper around SalesOrderForm with create mutation
5. Add routes to `router/AppRouter.tsx` + legacy redirects
6. Update `auth/menuMapper.ts`

**Outputs:** Working list and create flow for standard stock-out orders.

**Success criteria:**
- Creating an order immediately appears in the list via query invalidation
- Financial totals match legacy calculations
- Follows all V2 conventions: gray-only Tailwind, named exports, `@/` imports, no default exports

### Phase 3: Standard Edit And Escalation

**Objective:** Complete the pre-packaging workflow.

**Actions:**

1. Create `pages/sales-orders/EditSalesOrderPage.tsx` — shared edit page shell. Loads detail via `useStockOutDetail(id)`, maps to form defaults, renders `SalesOrderForm` with mode-driven field rules. Start with `standard` mode
2. Add **escalate confirm dialog** to `SalesOrderListPage.tsx` — row action button opens a confirmation dialog; on confirm calls `useSubmitForEscalation()` (`PUT /StockOut/SubmitForPackaging`) to change status. No separate route or form page.
3. Add escalation list mode to `SalesOrderListPage.tsx`
4. Wire up all modes to routes

**Outputs:** Full create → edit → escalate → escalation list flow.

**Success criteria:**
- Edit updates reflect immediately in list
- Escalate confirm dialog submits existing order data unchanged to change status
- Escalation moves the order from main list to escalation list without a page navigation
- Detail and list stay in sync without page reload

### Phase 4: Packaging Flow

**Objective:** Complete the packaging lifecycle.

**Actions:**

1. Create `pages/sales-orders/PackageSalesOrderPage.tsx` — packaging form with pack type dropdown, pack size, pack count, auto-fill, quantity validation (sum of pack quantities must match confirmed quantity)
2. Add `packaging`, `package-done` list modes to `SalesOrderListPage.tsx`
3. Add `packing-edit` mode to `EditSalesOrderPage.tsx` (loads from `GetPackagingInfo/{id}`, saves to `UpdatePackaging`)

**Outputs:** Full escalation → package → package done → edit pack flow.

**Success criteria:**
- Packaging completion moves order between lists via query invalidation
- Pack quantity validation catches mismatches before submit
- Package-done edit preserves confirmed quantities

### Phase 5: Admin List And Edit Modes

**Objective:** Add all admin overlay modes to the existing shared pages.

**Actions:**

1. Add `admin-general`, `admin-pending-price`, `admin-limited-edit` list modes to `SalesOrderListPage.tsx` — each mode uses its own API endpoint, status tabs, and row action configuration from `modes.ts`
2. Add `admin-full`, `admin-price-edit`, `admin-invoice-limited`, `admin-packing-edit` edit modes to `EditSalesOrderPage.tsx` — each mode uses field rules from `fieldRules.ts` to control which fields are editable
3. Extend `SalesOrderItemTable.tsx` with price editing columns (conditionally visible based on edit mode) and product swap dropdown (admin-full mode only)
4. Wire all admin routes with correct mode props

**Outputs:** All 7 admin routes functioning through shared mode-driven components.

**Success criteria:**
- Admin list routes reuse the same `SalesOrderListPage` instead of duplicating grid logic
- Admin edit routes reuse the same `EditSalesOrderPage` and `SalesOrderForm` instead of duplicating form/calculation logic
- All admin mutations invalidate both standard and admin list caches
- Calculations are identical across all modes (one shared `calculations.ts`)

### Phase 6: Operational Support Pages

**Objective:** Build the status monitoring and operational support pages.

**Actions:**

1. Create `pages/sales-orders/StockOutStatusPage.tsx` — status monitoring DataGrid with CSV upload, bulk operations
2. Create `pages/sales-orders/PendingStatusPage.tsx` — pending status management with status grid
3. Create `pages/sales-orders/StatusUpdateModal.tsx` — shared modal (replaces `DefinePendingStatusModal`)
4. Create `pages/sales-orders/DeliveryReturnPage.tsx` — inventory revert form
5. Create `pages/sales-orders/PackingPrintPage.tsx` — label/sticker print list

**Outputs:** All 4 operational support routes functioning.

**Success criteria:**
- Status updates via modal update all affected list views
- CSV upload and bulk operations work correctly

### Phase 7: Print/Modal Components And Polish

**Objective:** Port print modals and complete the module.

**Actions:**

1. Port `SalesOrderInternalModal` (PDF/print) as functional component
2. Port `SalesOrderView` (detail view) as functional component
3. Port `KarjadeshView` (Karjadesh print), `SalesOrderChalaanModal` (Chalaan print), `SalesOrderStickerModal` (sticker print)
4. Validate role protections for all permission profiles
5. Add loading, empty, and error states to all pages
6. Add double-submit protection to all mutations
7. Verify route compatibility for both standard and admin links

**Outputs:** Complete, production-ready stock-out module.

**Success criteria:**
- No stale-data gaps remain in any flow
- All mutations update expected downstream views
- Module is operationally usable without browser refresh
- `npm run build` passes with zero errors

---

## 12. Testing Strategy

### Unit tests for calculations

Port and test every function from `financialCalculations.js`:

- `calculateProductLineTotal` — line total with all VAT/AIT/discount combinations
- `calculateCompleteBill` — full bill aggregation
- `calculateSubtotal` — sum of line totals
- `calculateFinalTotal` — grand total with invoice-level adjustments
- `recalculateItemOnEdit` — single field change recalculation
- `validateSellingPrice` — selling >= purchase price
- `validateFinancialInputs` — quantity > 0, prices >= 0
- Percentage vs fixed discount handling
- Currency conversion
- Edge cases: zero quantities, null values, NaN safety

### Unit tests for mode/permission system

- Field editability per mode
- Permission profile access control
- Mode-driven API endpoint selection

### Integration tests

- List + detail query synchronization
- Create → list invalidation
- Edit → list + detail invalidation
- Escalation → list cross-invalidation
- Packaging → list cross-invalidation
- Admin edit → all-list invalidation

### Manual operational test path

1. Create a stock-out order → confirm it appears in list
2. Edit that order → confirm list updates
3. Escalate it via confirm dialog (no page navigation) → confirm it moves to escalation list
4. Package it → confirm it moves to packaging list
5. Complete packaging → confirm it moves to package-done list
6. Open the same order through admin general list
7. Perform a full admin edit → confirm all lists update
8. Open through pending-price list → perform price edit
9. Open through limited-edit list → perform invoice-limited edit
10. Edit packaging through admin pack edit
11. Update status via status monitoring page
12. All views stay consistent without browser refresh

---

## 13. Deferred Areas

| Area | Status | Decision Needed |
|---|---|---|
| Task assignment (`/task/assign`, etc.) | **Separate plan** | Will be documented independently |
| Sticker packaging (`src/pages/Sticker/RepackingSticker/*`) | **Deferred** | Confirm if needed before first release |
| Escalation cockpit (`src/pages/escalation/*`) | **Deferred** | Confirm if needed before first release |
| Orphaned files (CreateIdea, CreateInvoice, EditDemo, UpdateStockoutStatus) | **Skip** | Dead code — do not migrate |

---

## 14. Summary

The stock-out module is the core of the ERP system. The legacy implementation spreads across **16 active routed pages** (9 standard + 7 admin) plus **4 operational support pages**, served by **34 API functions**, **14 calculation functions**, and **4 item table components**.

The V2 migration consolidates this into:

- **1** type file, **1** hook file, **1** schema file
- **1** shared list page (mode-driven, replaces 7 list pages; includes inline escalate confirm dialog)
- **1** shared edit page (mode-driven, replaces 6 edit pages)
- **1** shared item table (replaces 4 class components)
- **1** calculation module (replaces inline + service duplication)
- **3** dedicated pages (package, status, delivery return) — escalation no longer needs its own page
- **4** print/modal components

Total: ~11 page files instead of 23 legacy files, with zero logic duplication between standard and admin paths.