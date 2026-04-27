# Pricing, Quotation & LC Tracking — V2 Migration Plan

> **Purpose:** This document is the single source of truth for migrating the legacy Pricing (Selling & Purchase), Price Quotation, and Letter of Credit (LC Tracking) modules into the v2-octopi app. It is written for an AI developer agent that will implement each module autonomously.

---

## Table of Contents

1. [V2 Project Context & Conventions](#1-v2-project-context--conventions)
2. [Module A — Selling Price](#2-module-a--selling-price)
3. [Module B — Purchase Price](#3-module-b--purchase-price)
4. [Module C — Price Quotation](#4-module-c--price-quotation)
5. [Module D — LC Tracking (PI → LC → Document → Payment)](#5-module-d--lc-tracking-pi--lc--document--payment)
6. [Route Map & Legacy Redirects](#6-route-map--legacy-redirects)
7. [Menu Mapper & Access Control](#7-menu-mapper--access-control)
8. [Execution Phases](#8-execution-phases)
9. [File Checklist](#9-file-checklist)

---

## 1. V2 Project Context & Conventions

Before implementing any module, you **MUST** read and follow:

- **`v2-octopi/AI_DEVELOPER_GUIDE.md`** — the canonical reference for all architecture, patterns, styling, and conventions.
- **`v2-octopi/V2_IMPLEMENTATION_GUIDE.md`** — step-by-step checklists for adding CRUD modules and reports.

### Key Rules Summary

| Concern | Convention |
|---|---|
| **Language** | TypeScript strict, `erasableSyntaxOnly: true` — NO `enum` keyword, use `as const` objects |
| **Framework** | React 19, Vite 7, React Router DOM v7 |
| **State** | TanStack Query v5 (server state), Zustand 5 (UI state only) |
| **Forms** | React Hook Form v7 + `@hookform/resolvers` + Zod v4 |
| **Styling** | Tailwind CSS v4 — ONLY `gray-*` palette. Exceptions: `red-*`/`emerald-*`/`amber-*` for status badges. See AI_DEVELOPER_GUIDE for exact class strings. |
| **Dropdowns** | All dropdowns go through centralized `<DropdownSelect>` (load-all) or `<PaginatedCombobox>` (paginated). NEVER use raw `<select>`. See `types/dropdown.ts` registry. |
| **API Client** | Use `apiClient` from `@/lib/api.ts` — typed fetch wrapper with JWT auto-injection. |
| **API Responses** | Always wrapped in `{ dataObj: T, errMsg?, title? }` — always unwrap `.dataObj`. |
| **Exports** | Named exports only (no default exports except App.tsx). |
| **Imports** | Always use `@/` path alias (never relative `../../`). |
| **File Structure** | ONE type file per domain in `types/`, ONE hook file in `hooks/`, ONE schema file in `schemas/`. Pages in `pages/{domain}/`. |
| **Lazy Routes** | `lazy(() => import('@/pages/...').then(m => ({ default: m.NamedExport })))` |
| **Query Keys** | Factory pattern: `const priceKeys = { all: ['prices'], list: () => [...priceKeys.all, 'list'], detail: (id) => [...priceKeys.all, 'detail', id] }` |
| **Mutations** | Every mutation invalidates relevant query keys via `onSuccess`. |
| **Pagination** | Use `usePaginatedList` hook + `IntersectionObserver` sentinel for infinite scroll lists. |
| **Excel Export** | Use `lazyExportExcel.ts` wrapper for lazy-loaded export. |
| **Zod v4 gotcha** | Use `{ error: '...' }` not `{ required_error: '...' }` for custom required messages on `z.number()`. |
| **API typos** | Backend has typos (e.g., `productDicsountedPrice`, `purchasePriceAtuoId`) — match backend field names exactly. |

---

## 2. Module A — Selling Price

### 2.1 Legacy Routes & Components

| Legacy Route | Legacy Component | Purpose |
|---|---|---|
| `/price` | `pages/Price/Price.js` | List all selling prices (MUI DataGrid) |
| `/addsellprice` | `pages/Price/AddPrice.js` | Add new selling price |
| `/price/:id/edit` | `pages/Price/EditPrice.js` | Edit existing selling price |

### 2.2 V2 Routes

| V2 Route | Page Component | Description |
|---|---|---|
| `/selling-prices` | `SellingPriceListPage` | Paginated list with search, edit button, history view |
| `/selling-prices/add` | `AddSellingPricePage` | Add form with product dropdown + price input |
| `/selling-prices/:id/edit` | `EditSellingPricePage` | Edit form, pre-filled from API |

### 2.3 API Endpoints

| Endpoint | Method | Purpose | Used By |
|---|---|---|---|
| `/Price/GetAllSellingPrice` | GET | List all selling prices | List page |
| `/Price/GetProductPriceHistory/{productId}` | GET | Price history for a product | List page (history modal) |
| `/Price/AddProductPrice` | POST | Create selling price | Add page |
| `/Price/GetAllSellingPriceByProductId/{id}` | GET | Get selling price by product ID | Edit page (load details) |
| `/Price/UpdateProductSellingPrice` | PUT | Update selling price | Edit page |

### 2.4 Type Definition — `types/price.ts`

```typescript
// ── Selling Price Types ──

export interface SellingPrice {
  productId: number
  productName: string
  productPrice: number
  productDicsountedPrice: number         // NOTE: backend typo — keep exact spelling
  productPriceActiveFrom: string | null
  productPriceCode: string
  categoryId: number
  productPriceActiveStatus: number
}

export interface SellingPriceHistory {
  productId: number
  productName: string
  productPrice: number
  productDicsountedPrice: number
  productPriceActiveFrom: string | null
  productPriceActiveTo: string | null
  productPriceCode: string
}

export interface CreateSellingPricePayload {
  productId: number
  productPriceCode: string               // Default: "NoOffer"
  productPrice: number
  productProfitPercentage: number        // Default: 0
  productDicsountedPrice: number         // Same as productPrice
  productPriceActiveFrom: string | null  // null
  productPriceActiveTo: string | null    // null
}

export interface UpdateSellingPricePayload {
  productId: number
  productPrice: number
  productDicsountedPrice: number         // Same as productPrice
}

// ── Purchase Price Types ──

export interface PurchasePrice {
  productId: number
  productName: string
  purchasePrice: number
  purchasePriceActiveFrom: string | null
  purchasePriceActiveStatus: number
}

export interface PurchasePriceHistory {
  productId: number
  productName: string
  purchasePrice: number
  purchasePriceActiveFrom: string | null
  purchasePriceActiveTo: string | null
}

export interface CreatePurchasePricePayload {
  purchasePriceAtuoId: number            // NOTE: backend typo — send 0 for create
  productId: number
  purchasePrice: number
  purchasePriceActiveFrom: string | null // null
  purchasePriceActiveTo: string | null   // null
}

export interface UpdatePurchasePricePayload {
  productId: number
  productName: string
  purchasePrice: number
  purchasePriceActiveFrom: string | null
  purchasePriceActiveTo: string | null
  purchasePriceActiveStatus: number      // 1 for active
}
```

### 2.5 Schema — `schemas/priceSchema.ts`

```typescript
import { z } from 'zod'

export const sellingPriceSchema = z.object({
  productId: z.number({ error: 'Product is required' }).min(1, 'Product is required'),
  productPrice: z.number({ error: 'Price is required' }).min(0.01, 'Price must be greater than 0'),
})

export type SellingPriceFormValues = z.infer<typeof sellingPriceSchema>

export const purchasePriceSchema = z.object({
  productId: z.number({ error: 'Product is required' }).min(1, 'Product is required'),
  purchasePrice: z.number({ error: 'Price is required' }).min(0.01, 'Price must be greater than 0'),
})

export type PurchasePriceFormValues = z.infer<typeof purchasePriceSchema>
```

### 2.6 Hook — `hooks/usePrice.ts`

Implement the following queries and mutations:

```typescript
// Query key factory
const priceKeys = {
  all: ['prices'] as const,
  sellingList: () => [...priceKeys.all, 'selling-list'] as const,
  sellingHistory: (id: number) => [...priceKeys.all, 'selling-history', id] as const,
  sellingDetail: (id: number) => [...priceKeys.all, 'selling-detail', id] as const,
  purchaseList: () => [...priceKeys.all, 'purchase-list'] as const,
  purchaseHistory: (id: number) => [...priceKeys.all, 'purchase-history', id] as const,
  purchaseDetail: (id: number) => [...priceKeys.all, 'purchase-detail', id] as const,
}

// Queries
useSellingPrices()         → GET /Price/GetAllSellingPrice → unwrap .dataObj
useSellingPriceHistory(id) → GET /Price/GetProductPriceHistory/{id} → unwrap .dataObj
useSellingPriceDetail(id)  → GET /Price/GetAllSellingPriceByProductId/{id} → unwrap .dataObj

usePurchasePrices()         → GET /Price/GetAllPurcashePriceGrid → unwrap .dataObj
usePurchasePriceHistory(id) → GET /Price/GetPurchasePriceHistory/{id} → unwrap .dataObj
usePurchasePriceDetail(id)  → GET /Price/GetPurchasePriceById/{id} → unwrap .dataObj

// Mutations
useCreateSellingPrice()  → POST /Price/AddProductPrice → invalidate priceKeys.sellingList()
useUpdateSellingPrice()  → PUT  /Price/UpdateProductSellingPrice → invalidate sellingList + sellingDetail

useCreatePurchasePrice() → POST /Price/AddPurchasePrice → invalidate priceKeys.purchaseList()
useUpdatePurchasePrice() → PUT  /Price/UpdateProductPurchasePrice → invalidate purchaseList + purchaseDetail
```

### 2.7 Page Components

#### `SellingPriceListPage.tsx`
- Fetch all selling prices via `useSellingPrices()`
- Render in a table with columns: Product Name, Price, Discounted Price, Active From, Price Code, Status
- Action buttons: **Add New** (→ `/selling-prices/add`), **Edit** (→ `/selling-prices/{id}/edit`)
- **View History** button opens a modal showing price history via `useSellingPriceHistory(id)`
- Client-side search filter on product name
- Excel export button

#### `AddSellingPricePage.tsx` / `EditSellingPricePage.tsx`
- Share a `SellingPriceForm.tsx` component
- Product dropdown: use `<PaginatedCombobox type="product" />` (paginated product dropdown)
- Price field: numeric input with `setValueAs: Number`
- On create: POST payload sets `productPriceCode: "NoOffer"`, `productDicsountedPrice` = same as `productPrice`, `productProfitPercentage: 0`
- On edit: load existing data via `useSellingPriceDetail(id)`, pre-fill form
- "Stay on this page" checkbox for batch entry (add page only)
- Navigate to `/selling-prices` on success

### 2.8 Legacy Bugs to Fix in V2

- The legacy EditPrice.js shows "Purchase Price" as page title instead of "Selling Price" — fix this in V2
- The legacy EditPrice.js "Back" button navigates to `/purchaseprices` instead of `/price` — fix this in V2

---

## 3. Module B — Purchase Price

### 3.1 Legacy Routes & Components

| Legacy Route | Legacy Component | Purpose |
|---|---|---|
| `/purchaseprices` | `pages/PurchasePrice/PurchasePrice.js` | List all purchase prices |
| `/purchaseprice/add` | `pages/PurchasePrice/AddPurchasePrice.js` | Add new purchase price |
| `/purchaseprice/:id/edit` | `pages/PurchasePrice/EditPurchasePrice.js` | Edit existing purchase price |

### 3.2 V2 Routes

| V2 Route | Page Component | Description |
|---|---|---|
| `/purchase-prices` | `PurchasePriceListPage` | Paginated list with search, edit, history |
| `/purchase-prices/add` | `AddPurchasePricePage` | Add form |
| `/purchase-prices/:id/edit` | `EditPurchasePricePage` | Edit form |

### 3.3 API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/Price/GetAllPurcashePriceGrid` | GET | List all purchase prices (NOTE: `Purcashe` is a backend typo) |
| `/Price/GetPurchasePriceHistory/{id}` | GET | Price history for a product |
| `/Price/AddPurchasePrice` | POST | Create purchase price |
| `/Price/GetPurchasePriceById/{id}` | GET | Get purchase price by ID |
| `/Price/UpdateProductPurchasePrice` | PUT | Update purchase price |

### 3.4 Page Components

Identical pattern to Selling Price module:
- `PurchasePriceListPage.tsx` — table with history modal
- `AddPurchasePricePage.tsx` / `EditPurchasePricePage.tsx` — share `PurchasePriceForm.tsx`
- Product dropdown: `<PaginatedCombobox type="product" />`
- Price field: numeric input

**Types, schema, and hook are shared in the same files as Selling Price** (`types/price.ts`, `schemas/priceSchema.ts`, `hooks/usePrice.ts`).

---

## 4. Module C — Price Quotation

### 4.1 Legacy Routes & Components

| Legacy Route | Legacy Component | Purpose |
|---|---|---|
| `/quotation/list` | `pages/Quotations/Quotations.js` | List quotations (approved, multi-tab) |
| `/quotation/unapprovedlist` | `pages/Quotations/QuotationUnapproved.js` | List unapproved quotations |
| `/quotation/approvedlist` | `pages/Quotations/QuotationApprovedList.js` | List approved quotations |
| `/quotation/create` | `pages/Quotations/CreateQuotation.js` | Create quotation with line items |
| `/quotation/:id/edit` | `pages/Quotations/EditQuotation.js` | Edit quotation |
| `/quotation/:id/approve` | `pages/Quotations/ApproveQuotation.js` | Approve quotation (review + approve) |

### 4.2 V2 Routes

| V2 Route | Page Component | Description |
|---|---|---|
| `/quotations` | `QuotationListPage` | All quotations list with tab filter (All/Unapproved/Approved) |
| `/quotations/unapproved` | `QuotationListPage` (mode="unapproved") | Unapproved quotations |
| `/quotations/approved` | `QuotationListPage` (mode="approved") | Approved quotations |
| `/quotations/create` | `CreateQuotationPage` | Create quotation form |
| `/quotations/:id/edit` | `EditQuotationPage` | Edit quotation form |
| `/quotations/:id/approve` | `ApproveQuotationPage` | Review & approve quotation |

### 4.3 API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/Price/GetQuotationsGrid/-1/{order}` | GET | List quotations by status (`0`=unapproved, `1`=approved, `-1`=all) |
| `/Price/GetQuotationsDetails/{id}` | GET | Get quotation details (master + line items) |
| `/Price/CreatePriceQuotation` | POST | Create new quotation |
| `/Price/UpdatePriceQuotation` | PUT | Update existing quotation |
| `/Price/ApprovePriceQuotation` | PUT | Approve quotation |

### 4.4 Type Definition — `types/quotation.ts`

```typescript
export interface QuotationListItem {
  pqSystemId: number
  pqSystemNo: string
  pqOrderDate: string
  customerName: string
  customerAddress: string
}

export interface QuotationDetail {
  priceQuotationMasterData: QuotationMaster
  priceQuotationDetailList: QuotationLineItem[]
}

export interface QuotationMaster {
  pqSystemId: number
  pqSystemNo: string
  customerId: number
  customerName: string
  customerAddress: string
  pqOrderDate: string
  pqCurrencyName: string             // "BDT" | "USD"
}

export interface QuotationLineItem {
  pqdProductId: number
  productName: string
  pqdProductUnitPrice: number
  pqdAppliedVatPercantage: number    // NOTE: backend typo "Percantage"
  pqdAppliedAitPercantage: number
  pqdIncreasedType: string           // "F" (flat) or "P" (percentage)
  pqdIncreasedAmount: number
  pqdCalculatedPrice: number
  pqdAdustedAmount: number           // NOTE: backend typo "Adusted"
  pqdFinalPrice: number
}

export interface CreateQuotationPayload {
  pqSystemId: number                 // UserSystemId from JWT
  customerId: number
  pqCurrencyName: string             // "BDT" | "USD"
  priceQuotationProducts: QuotationProductPayload[]
}

export interface UpdateQuotationPayload {
  pqSystemId: number                 // Existing quotation ID
  customerId: number
  pqCurrencyName: string
  priceQuotationProducts: QuotationProductPayload[]
}

export interface QuotationProductPayload {
  pqdProductId: number
  pqdProductUnitPrice: number
  pqdAppliedVatPercantage: number
  pqdAppliedAitPercantage: number
  pqdIncreasedType: string
  pqdIncreasedAmount: number
  pqdCalculatedPrice: number
  pqdAdustedAmount: number
  pqdFinalPrice: number
}

export interface ApproveQuotationPayload {
  pqSystemId: number
  isApproved: boolean                // always true
}
```

### 4.5 Schema — `schemas/quotationSchema.ts`

```typescript
import { z } from 'zod'

export const quotationItemSchema = z.object({
  pqdProductId: z.number({ error: 'Product is required' }).min(1, 'Product is required'),
  pqdProductUnitPrice: z.number({ error: 'Unit price is required' }).min(0, 'Price must be >= 0'),
  quantity: z.number({ error: 'Quantity is required' }).min(1, 'Quantity must be >= 1'),
  pqdAppliedVatPercantage: z.number().default(0),
  pqdAppliedAitPercantage: z.number().default(0),
  pqdIncreasedType: z.string().default('F'),   // "F" = flat, "P" = percentage
  pqdIncreasedAmount: z.number().default(0),
  pqdAdustedAmount: z.number().default(0),
  adjustableType: z.string().default('plus'),   // "plus" | "minus"
  notes: z.string().optional(),
})

export const quotationSchema = z.object({
  customerId: z.number({ error: 'Customer is required' }).min(1, 'Customer is required'),
  pqCurrencyName: z.string().default('BDT'),
  items: z.array(quotationItemSchema).min(1, 'At least one product is required'),
})

export type QuotationFormValues = z.infer<typeof quotationSchema>
export type QuotationItemFormValues = z.infer<typeof quotationItemSchema>
```

### 4.6 Hook — `hooks/useQuotation.ts`

```typescript
const quotationKeys = {
  all: ['quotations'] as const,
  list: (order: string) => [...quotationKeys.all, 'list', order] as const,
  detail: (id: number) => [...quotationKeys.all, 'detail', id] as const,
}

// Queries
useQuotations(order)      → GET /Price/GetQuotationsGrid/-1/{order} → unwrap .dataObj
useQuotationDetail(id)    → GET /Price/GetQuotationsDetails/{id} → unwrap .dataObj

// Mutations
useCreateQuotation()      → POST /Price/CreatePriceQuotation → invalidate all quotation lists
useUpdateQuotation()      → PUT  /Price/UpdatePriceQuotation → invalidate all lists + detail
useApproveQuotation()     → PUT  /Price/ApprovePriceQuotation → invalidate all lists + detail
```

### 4.7 Business Logic — Line Item Calculation

This is critical and must be preserved exactly:

```typescript
/**
 * Quotation line-item price calculation.
 * AIT is applied first on base price, then VAT on AIT-inclusive price.
 *
 * calculatedPrice = unitPrice + (unitPrice × aitPercent / 100) + ((unitPrice + aitAmount) × vatPercent / 100)
 * finalPrice = calculatedPrice +/- adjustableAmount
 */
export function calculateQuotationLineItem(item: {
  unitPrice: number
  vatPercent: number
  aitPercent: number
  adjustableAmount: number
  adjustableType: 'plus' | 'minus'
}): { calculatedPrice: number; finalPrice: number } {
  const aitAmount = item.unitPrice * (item.aitPercent / 100)
  const priceWithAit = item.unitPrice + aitAmount
  const vatAmount = priceWithAit * (item.vatPercent / 100)
  const calculatedPrice = priceWithAit + vatAmount

  const finalPrice =
    item.adjustableType === 'plus'
      ? calculatedPrice + item.adjustableAmount
      : calculatedPrice - item.adjustableAmount

  return { calculatedPrice, finalPrice }
}
```

### 4.8 Page Components

#### `QuotationListPage.tsx`
- Accepts optional `mode` prop: `undefined` (all, order="-1"), `"unapproved"` (order="0"), `"approved"` (order="1")
- Fetch quotations via `useQuotations(order)`
- Table columns: Quotation No, Quotation Date, Customer Name, Customer Address
- Actions vary by mode:
  - **All/Unapproved**: Add New, Edit, View
  - **Unapproved**: Approve button → `/quotations/{id}/approve`
  - **Approved**: View/Print (opens quotation modal)
- View button opens a `QuotationViewModal` showing detail
- Client-side search, Excel export

#### `CreateQuotationPage.tsx` / `EditQuotationPage.tsx`
- Share a `QuotationForm.tsx` component
- **Customer dropdown**: `<PaginatedCombobox type="customer" />` — locked after first item added
- **Currency toggle**: BDT / USD
- **Line items table** with add/remove rows:
  - Product: `<PaginatedCombobox type="product" />` (filter out already-selected products)
  - Quantity: number input (default 1)
  - Unit Price: number input
  - VAT %: number input
  - AIT %: number input
  - Discount Amount: number input
  - Discount Type: toggle F (flat) / P (percentage)
  - Adjustable Amount: number input
  - Adjustable Type: radio (plus/minus)
  - Calculated Price: computed, read-only
  - Final Price: computed, read-only
  - Notes: text input
- Summary row at bottom showing totals
- "Continue Adding" checkbox (create page only)
- On edit: pre-fill from `useQuotationDetail(id)`

#### `ApproveQuotationPage.tsx`
- Load quotation detail via `useQuotationDetail(id)`
- Display read-only line items for review
- **Approve** button calls `useApproveQuotation()` with `{ pqSystemId: id, isApproved: true }`
- Navigate to `/quotations/unapproved` on success

---

## 5. Module D — LC Tracking (PI → LC → Document → Payment)

### 5.1 Overview

The LC Tracking module is a multi-stage workflow:
1. **PI (Proforma Invoice)** — Created, edited, escalated to LC stage
2. **LC Document** — Created from a PI, tracks document lifecycle through 3 progressive stages
3. **LC Payment** — Payment entries against an LC document
4. **LC Status Report** — Full lifecycle tracking view

### 5.2 Legacy Routes & Components

| Legacy Route | Legacy Component | Purpose |
|---|---|---|
| `/lctracking/pilists` | `PiLists.js` | List all PIs (CRUD + escalate) |
| `/lctracking/createpi` | `CreatePI.js` | Create PI with line items |
| `/lctracking/:id/updatepi` | `UpdatePI.js` | Edit existing PI |
| `/lctracking/listlcanddoc` | `LcDocAndPaymentList.js` | List PIs at status=1, "Create LC" |
| `/lctracking/createlcdoc` | `LcDocAndPaymentCreate.js` | Create LC document |
| `/lctracking/:id/updatelcdoc` | `LcDocAndPaymentUpdate.js` | Update LC doc (3-part timeline) |
| `/lctracking/documentactionlist` | `DocumentActionList.js` | List PIs at status=2 for doc action |
| `/lctracking/lcpaymentlist` | `LCPaymentList.js` | List PIs at status=3 for payment |
| `/lctracking/:id/lcpayment` | `LCPaymentEntry.js` | Record LC payment |
| `/lctracking/lctrackingreport` | `LCTrackingReport.js` | Full LC tracking status report |
| `/lc-payments/list` | `LcPaymentEditList.js` | Filterable list of LC payments |
| `/lc-payments/:id/edit` | `LcPaymentEdit.js` | Edit existing LC payment |
| `/lc/list` | `LCList.js` (in pages/LC/) | Search LCs by date/customer → edit |
| `/lctracking/:id/limitedupdate` | `LcLimitedUpdate.js` | Edit basic LC fields only |

### 5.3 V2 Routes

| V2 Route | Page Component | Description |
|---|---|---|
| `/lc/pi` | `PiListPage` | All PIs list with CRUD + escalate |
| `/lc/pi/create` | `CreatePiPage` | Create PI form |
| `/lc/pi/:id/edit` | `EditPiPage` | Edit PI form |
| `/lc/operations` | `LcOperationsPage` | PIs at status=1, create LC |
| `/lc/create` | `CreateLcPage` | Create LC document form |
| `/lc/:id/update` | `UpdateLcDocPage` | Update LC doc (3-part timeline) |
| `/lc/documents` | `LcDocumentListPage` | PIs at status=2, document action |
| `/lc/payments` | `LcPaymentOperationsPage` | PIs at status=3, payment entry |
| `/lc/:id/payment` | `LcPaymentEntryPage` | Record LC payment |
| `/lc/status` | `LcStatusReportPage` | Full LC tracking report |
| `/lc/payment-edit` | `LcPaymentEditListPage` | Filterable payment edit list |
| `/lc/payment-edit/:id` | `LcPaymentEditPage` | Edit LC payment |
| `/lc/edit-list` | `LcEditListPage` | Search LCs → limited edit |
| `/lc/:id/limited-update` | `LcLimitedUpdatePage` | Edit basic LC fields |

### 5.4 API Endpoints — Complete Reference

#### PI (Proforma Invoice) Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/LCTracking/GetAllProformaInvoices` | GET | List all PIs |
| `/LCTracking/GetProformaInvoiceById/{id}` | GET | Get PI detail |
| `/LCTracking/CreateProformaInvoice` | POST | Create PI |
| `/LCTracking/UpdateProformaInvoice` | PUT | Update PI |
| `/LCTracking/ProformaInvoices/{id}` | DELETE | Delete PI |
| `/LCTracking/EscalatePIActivityStatus/{piId}/{status}` | POST | Escalate PI status |
| `/LCTracking/GetPINumberList/{custId}/{status}` | GET | Get PI numbers for customer (for mapping) |
| `/LCTracking/GetPaymentTerms` | GET | Payment terms dropdown |
| `/LCTracking/UpdatePIConditions/{id}` | PUT | Update PI print conditions |

#### LC Document Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/LCTracking/GetListPIByStatus/{status}` | GET | List PIs by status (1=waiting LC, 2=doc action, 3=payment) |
| `/LCTracking/CratreLCDocAndPayments` | POST | Create LC document (NOTE: `Cratre` is a backend typo) |
| `/LCTracking/GetDocumentAndPaymentsById/{id}` | GET | Get LC document detail |
| `/LCTracking/UpdateLCDocAndPayments` | PUT | Update LC document |
| `/LCTracking/GetLCEidtList?customerId={}&fromDate={}&toDate={}` | GET | Search LCs for edit (NOTE: `Eidt` is a backend typo) |
| `/LCTracking/GetAllLCDocumentAndPayments` | GET | List all LC documents |
| `/LCTracking/DeleteDocumentAndPayments/{id}` | DELETE | Delete LC document |

#### LC Payment Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/LCTracking/GetLCPaymentSummary/{lcDocId}` | GET | Payment summary for an LC |
| `/CustomerPayment/GetLCPaymentHistory/{lcDocId}` | GET | Payment history for an LC |
| Payment create/update | Uses shared Payment endpoints from `paymentActions` | |

#### Price Fetch (used in PI creation)

| Endpoint | Method | Purpose |
|---|---|---|
| `/Price/GetPriceByCustomerAndQty/{productId}/{customerId}/{quantity}` | GET | Auto-fetch price for PI line item |

### 5.5 Type Definition — `types/lcTracking.ts`

```typescript
// ── PI Types ──

export interface ProformaInvoice {
  piSystemId: number
  piNumber: string
  piRef: string
  piDate: string
  customerName: string
  piAmount: number
  piCurrency: string                    // "USD" | "BDT"
  piStatus: number
  piCustmomerId: number
  piBenificaryBankId: number
  piBranchBankLocationId: number
  lcPaymentTermsId: number
  piNote: string
  piNumberMapped: string | null
  piProductDetailsInfo: PiProductDetail[]
  piConditions: PiConditions
}

export interface PiProductDetail {
  piProductId: number
  productName: string
  piProductQuantity: number
  piProductPrice: number
  piProductPriceConvertionRate: number
  piLineTotalAmount: number
}

export interface PiConditions {
  productCategoryName?: boolean
  functionName?: boolean
  groupName?: boolean
  hsCode?: boolean
  brandName?: boolean
  countryOfOrigin?: boolean
  productLevel?: boolean
  productShelfLife?: boolean
  productPackSize?: boolean
  rmgIndustries?: boolean
  washingIndustries?: boolean
  incoTerm?: boolean
  POL?: boolean
  POD?: boolean
  partialShipment?: boolean
  vatAitCheck?: boolean
  offerValidity?: boolean
}

export interface CreatePiPayload {
  piCustmomerId: number
  piDate: string
  piNumber: string
  piRef: string
  piCurrency: string
  piAmount: number
  piBenificaryBankId: number
  piBranchBankLocationId: number
  lcPaymentTermsId: number
  piNote: string
  piNumberMapped: string | null
  piProductDetailsInfo: {
    piProductId: number
    piProductQuantity: number
    piProductPrice: number
    piProductPriceConvertionRate: number
    piLineTotalAmount: number
  }[]
  piConditions: PiConditions
}

export interface UpdatePiPayload extends CreatePiPayload {
  piSystemId: number
}

// ── LC Document Types ──

export interface LcDocument {
  lcDocId: number
  lcNumber: string
  lcAmount: number
  lcDate: string
  chequeBankId: number                  // Issuer bank ID
  chequeBankName: string
  locationId: number                    // Branch location ID
  locationName: string
  piSystemId: number
  piNumber: string
  piDate: string
  customerName: string
  piAmount: number
  // Document timeline fields (3 progressive parts)
  docPrepDate: string | null
  docSumbitDate: string | null
  docCustomerAcceptedDate: string | null
  docBenificerySubmissionDate: string | null
  ibcNumber: string | null
  bankAcceptanceDate: string | null
  maturityDate: string | null
  revisedMaturityDate: string | null
  // Payment info
  paymentInfoList: LcPaymentInfo[]
}

export interface LcPaymentInfo {
  paymentDate: string
  paymentAmount: number
  lcAmountTransferAtBank: number
  lcAdjustmentAmount: number
  lcCollectionConversionRate: number
  paymentNote: string
  isPaymentComplete: boolean
}

export interface CreateLcPayload {
  piSystemId: number
  lcNumber: string
  lcAmount: number
  lcDate: string
  chequeBankId: number                  // Issuer bank
  locationId: number                    // Branch location
}

export interface UpdateLcDocPayload {
  lcDocId: number
  // Part 1
  docPrepDate: string | null
  docSumbitDate: string | null
  // Part 2
  docCustomerAcceptedDate: string | null
  docBenificerySubmissionDate: string | null
  // Part 3
  ibcNumber: string | null
  bankAcceptanceDate: string | null
  maturityDate: string | null
  revisedMaturityDate: string | null
}

export interface LcLimitedUpdatePayload {
  lcDocId: number
  lcNumber: string
  lcAmount: number
  lcDate: string
  chequeBankId: number
  locationId: number
}

// ── LC Payment Types ──

export interface LcPaymentEntryPayload {
  paymentMethodId: number              // Constant: 12 (LC_PAYMENT_METHOD_ID)
  employeeId: number                   // Collected by
  customerId: number
  paymentDate: string
  paymentAmount: number                // Receive amount
  lcAmountTransferAtBank: number
  lcAdjustmentAmount: number
  lcCollectionConversionRate: number
  paymentNote: string
  isPaymentComplete: boolean
  lcDocId: number
}

export interface LcPaymentSummary {
  totalPaid: number
  remainingAmount: number
  lcAmount: number
  paymentCount: number
}

export interface PiByStatus {
  piSystemId: number
  piNumber: string
  piRef: string
  piDate: string
  customerName: string
  customerAddress: string
  piAmount: number
  piCurrency: string
  lcDocId?: number
  lcNumber?: string
  lcAmount?: number
  lcDate?: string
}

export interface LcEditListItem {
  lcDocId: number
  lcNumber: string
  lcAmount: number
  chequeBankName: string
  locationName: string
  lcDate: string
  piNumber: string
  piDate: string
  customerName: string
}

// Payment terms dropdown item
export interface PaymentTerm {
  lcPaymentTermsId: number
  lcPaymentTermsName: string
}

// LC lifecycle status constants
export const LC_STATUSES = {
  PI_CREATED: 0,
  WAITING_FOR_LC: 1,
  LC_CREATED: 2,
  WAITING_FOR_DOC: 3,
  // ... additional statuses as returned by API
} as const

export const LC_PAYMENT_METHOD_ID = 12
```

### 5.6 Schema — `schemas/lcTrackingSchema.ts`

```typescript
import { z } from 'zod'

// PI form schema
export const piItemSchema = z.object({
  piProductId: z.number({ error: 'Product is required' }).min(1, 'Product is required'),
  piProductQuantity: z.number({ error: 'Quantity is required' }).min(1, 'Qty must be >= 1'),
  piProductPrice: z.number({ error: 'Price is required' }).min(0, 'Price must be >= 0'),
  piProductPriceConvertionRate: z.number().default(1),
  piLineTotalAmount: z.number().default(0),
})

export const piSchema = z.object({
  piCustmomerId: z.number({ error: 'Customer is required' }).min(1, 'Customer is required'),
  piDate: z.string().min(1, 'PI date is required'),
  piRef: z.string().optional().default(''),
  piCurrency: z.string().default('USD'),
  piConversionRate: z.number().default(1),
  piBenificaryBankId: z.number({ error: 'Bank is required' }).min(1, 'Bank is required'),
  piBranchBankLocationId: z.number({ error: 'Location is required' }).min(1, 'Location is required'),
  lcPaymentTermsId: z.number({ error: 'Payment terms required' }).min(1, 'Payment terms required'),
  piNote: z.string().optional().default(''),
  piNumberMapped: z.string().nullable().default(null),
  items: z.array(piItemSchema).min(1, 'At least one product is required'),
})

export type PiFormValues = z.infer<typeof piSchema>

// LC Document create schema
export const lcCreateSchema = z.object({
  lcNumber: z.string().min(1, 'LC number is required'),
  lcAmount: z.number({ error: 'LC amount is required' }).min(0.01, 'Amount must be > 0'),
  lcDate: z.string().min(1, 'LC date is required'),
  chequeBankId: z.number({ error: 'Issuer bank is required' }).min(1, 'Issuer bank is required'),
  locationId: z.number({ error: 'Branch location required' }).min(1, 'Branch location required'),
})

export type LcCreateFormValues = z.infer<typeof lcCreateSchema>

// LC Document update schema (3-part timeline)
export const lcDocUpdateSchema = z.object({
  // Part 1
  docPrepDate: z.string().nullable().default(null),
  docSumbitDate: z.string().nullable().default(null),
  // Part 2
  docCustomerAcceptedDate: z.string().nullable().default(null),
  docBenificerySubmissionDate: z.string().nullable().default(null),
  // Part 3
  ibcNumber: z.string().nullable().default(null),
  bankAcceptanceDate: z.string().nullable().default(null),
  maturityDate: z.string().nullable().default(null),
  revisedMaturityDate: z.string().nullable().default(null),
})

export type LcDocUpdateFormValues = z.infer<typeof lcDocUpdateSchema>

// LC Limited Update schema
export const lcLimitedUpdateSchema = z.object({
  lcNumber: z.string().min(1, 'LC number is required'),
  lcAmount: z.number({ error: 'LC amount is required' }).min(0.01, 'Amount must be > 0'),
  lcDate: z.string().min(1, 'LC date is required'),
  chequeBankId: z.number({ error: 'Issuer bank is required' }).min(1, 'Issuer bank is required'),
  locationId: z.number({ error: 'Branch location required' }).min(1, 'Branch location required'),
})

export type LcLimitedUpdateFormValues = z.infer<typeof lcLimitedUpdateSchema>

// LC Payment schema
export const lcPaymentSchema = z.object({
  employeeId: z.number({ error: 'Employee is required' }).min(1, 'Employee is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentAmount: z.number({ error: 'Amount is required' }).min(0.01, 'Amount must be > 0'),
  lcAmountTransferAtBank: z.number().default(0),
  lcAdjustmentAmount: z.number().default(0),
  lcCollectionConversionRate: z.number().default(0),
  paymentNote: z.string().optional().default(''),
  isPaymentComplete: z.boolean().default(false),
})

export type LcPaymentFormValues = z.infer<typeof lcPaymentSchema>
```

### 5.7 Hook — `hooks/useLcTracking.ts`

```typescript
const lcKeys = {
  all: ['lc-tracking'] as const,
  // PI
  piList: () => [...lcKeys.all, 'pi-list'] as const,
  piDetail: (id: number) => [...lcKeys.all, 'pi-detail', id] as const,
  piNumbers: (custId: number, status: number) => [...lcKeys.all, 'pi-numbers', custId, status] as const,
  paymentTerms: () => [...lcKeys.all, 'payment-terms'] as const,
  // LC
  piByStatus: (status: number) => [...lcKeys.all, 'pi-by-status', status] as const,
  lcDetail: (id: number) => [...lcKeys.all, 'lc-detail', id] as const,
  lcEditList: (filters: object) => [...lcKeys.all, 'lc-edit-list', filters] as const,
  // Payment
  paymentSummary: (lcDocId: number) => [...lcKeys.all, 'payment-summary', lcDocId] as const,
  paymentHistory: (lcDocId: number) => [...lcKeys.all, 'payment-history', lcDocId] as const,
  paymentEditList: (filters: object) => [...lcKeys.all, 'payment-edit-list', filters] as const,
  // Report
  report: () => [...lcKeys.all, 'report'] as const,
}

// ── PI Queries ──
usePiList()                              → GET /LCTracking/GetAllProformaInvoices
usePiDetail(id)                          → GET /LCTracking/GetProformaInvoiceById/{id}
usePiNumbers(custId, status)             → GET /LCTracking/GetPINumberList/{custId}/{status}
usePaymentTerms()                        → GET /LCTracking/GetPaymentTerms
useFetchPriceForPi(productId, custId, qty) → GET /Price/GetPriceByCustomerAndQty/{p}/{c}/{q}

// ── PI Mutations ──
useCreatePi()     → POST   /LCTracking/CreateProformaInvoice → invalidate piList
useUpdatePi()     → PUT    /LCTracking/UpdateProformaInvoice → invalidate piList + piDetail
useDeletePi()     → DELETE /LCTracking/ProformaInvoices/{id} → invalidate piList
useEscalatePi()   → POST   /LCTracking/EscalatePIActivityStatus/{piId}/{status} → invalidate piList + piByStatus

// ── LC Document Queries ──
usePiByStatus(status)    → GET /LCTracking/GetListPIByStatus/{status}
useLcDetail(id)          → GET /LCTracking/GetDocumentAndPaymentsById/{id}
useLcEditList(filters)   → GET /LCTracking/GetLCEidtList?customerId=&fromDate=&toDate=

// ── LC Document Mutations ──
useCreateLc()            → POST /LCTracking/CratreLCDocAndPayments → invalidate piByStatus(1) + lcDetail
useUpdateLcDoc()         → PUT  /LCTracking/UpdateLCDocAndPayments → invalidate lcDetail + piByStatus
useLcLimitedUpdate()     → PUT  (RTK-based in legacy — migrate to TanStack) → invalidate lcEditList
useUpdatePiConditions()  → PUT  /LCTracking/UpdatePIConditions/{id}

// ── LC Payment Queries ──
useLcPaymentSummary(lcDocId) → GET /LCTracking/GetLCPaymentSummary/{lcDocId}
useLcPaymentHistory(lcDocId) → GET /CustomerPayment/GetLCPaymentHistory/{lcDocId}

// ── LC Payment Mutations ──
useCreateLcPayment()     → POST (via shared payment API) → invalidate paymentSummary + paymentHistory
useUpdateLcPayment()     → PUT  (via shared payment API) → invalidate paymentSummary + paymentHistory

// ── Report ──
useLcTrackingReport()    → GET /LCTracking/GetAllProformaInvoices (same data, rendered differently)
```

### 5.8 Page Components — Detailed Specifications

#### `PiListPage.tsx` — PI Operations
- Fetch all PIs via `usePiList()`
- Table columns: PI Number, PI Ref, PI Date, Customer, Amount, Currency, Status
- Actions: **Create** (→ `/lc/pi/create`), **Edit** (→ `/lc/pi/{id}/edit`), **Escalate** (calls `useEscalatePi()`), **View** (opens PI detail modal), **Print** (opens PI print modal), **Delete** (with confirmation)
- Client-side search + Excel export

#### `CreatePiPage.tsx` / `EditPiPage.tsx`
- Share `PiForm.tsx`
- **Customer**: `<PaginatedCombobox type="customer" />`
- **Map with Existing PI**: checkbox → if checked, shows PI number dropdown (from `usePiNumbers()`)
- **PI Date**: date input (default today)
- **PI Ref**: textarea
- **Payment Terms**: `<DropdownSelect type="lcPaymentTerms" />` — **NOTE: `lcPaymentTerms` is already in the dropdown registry** in `types/dropdown.ts`
- **Bank**: `<DropdownSelect type="bank" />`
- **Bank Location**: `<PaginatedCombobox type="location" />`
- **Currency toggle**: USD / BDT
- **Conversion Rate**: number input
- **PI Note**: textarea
- **Line items table**:
  - Product: `<PaginatedCombobox type="product" />`
  - Quantity: number (default 1)
  - Unit Price (BDT): number — auto-fetched via `useFetchPriceForPi(productId, customerId, qty)`
  - Converted Price: computed = `unitPrice / conversionRate`
  - Total Amount: computed = `convertedPrice × quantity`
- Summary row showing total amount
- PI print conditions checkboxes (17 boolean fields)
- On edit: pre-fill from `usePiDetail(id)`

#### `LcOperationsPage.tsx` — LC Operations (Status=1)
- Fetch PIs at status=1 via `usePiByStatus(1)`
- Table: PI Number, PI Ref, PI Date, Customer, Address
- **Create LC** button → navigates to `/lc/create` with PI data in router state

#### `CreateLcPage.tsx`
- Read PI info from router state (read-only display)
- Form fields: LC Number (text), LC Amount (number), LC Date (date), Issuer Bank (`<DropdownSelect type="bank" />`), Branch Location (`<PaginatedCombobox type="location" />`)
- On submit: `useCreateLc()` with `piSystemId` from state

#### `UpdateLcDocPage.tsx` — 3-Part Document Timeline
- Load LC detail via `useLcDetail(id)`
- **Progressive disclosure** — 3 form sections revealed sequentially:
  - **Part 1**: Document Preparation Date, Document Submission Date
  - **Part 2** (visible when Part 1 dates filled): Customer Document Receive Date, Beneficiary Submission Date
  - **Part 3** (visible when Part 2 dates filled): IBC Number, Bank Acceptance Date, Maturity Date, Revised Maturity Date
- On submit: `useUpdateLcDoc()` with all fields

#### `LcDocumentListPage.tsx` — Document Action List (Status=2)
- Fetch PIs at status=2 via `usePiByStatus(2)`
- **Document** action → `/lc/{lcDocId}/update` with customer name in state

#### `LcPaymentOperationsPage.tsx` — LC Payment List (Status=3)
- Fetch PIs at status=3 via `usePiByStatus(3)`
- **Payment** action → `/lc/{lcDocId}/payment` with full LC data in state

#### `LcPaymentEntryPage.tsx`
- Display LC info from router state (read-only)
- Load payment summary via `useLcPaymentSummary(lcDocId)`
- Load payment history via `useLcPaymentHistory(lcDocId)`
- Form fields:
  - Employee: `<PaginatedCombobox type="employee" />`
  - Payment Date: date (default today)
  - Receive Amount: number
  - LC Amount Transfer at Bank: number (optional)
  - LC Adjustment Amount: number (optional, can be negative)
  - LC Collection Conversion Rate: number (optional)
  - Payment Note: text
  - Is Payment Complete: checkbox
- Payment method ID is constant: **12** (`LC_PAYMENT_METHOD_ID`)
- Show payment history table below form

#### `LcStatusReportPage.tsx` — Full LC Tracking Report
- Fetch all PIs via `useLcTrackingReport()`
- Rich table showing lifecycle status columns
- Clickable cells open PI detail modal or LC document detail modal
- Lifecycle statuses: PI Created, Waiting for LC, LC Created, Waiting for Doc Submission, Document Submitted, Doc Accepted by Customer, Doc Submitted to Beneficiary Bank, Doc Transmitted to Issuer Bank, Doc Accepted by Issuer Bank, Payment Received, AIT Received, Waiting for Payment
- Client-side search/sort + Excel export

#### `LcPaymentEditListPage.tsx`
- Filter form: Start Date, End Date, Customer (`<PaginatedCombobox type="customer" />`)
- Fetch payments via shared payment hook with `paymentMethodId: 12` filter
- Table: Payment ID, Date, Customer, Amount, PI Number, LC Number, LC Amount, LC Date, Method
- **Edit** action → `/lc/payment-edit/{id}`

#### `LcPaymentEditPage.tsx`
- Load payment detail + payment summary
- Same form as `LcPaymentEntryPage` but pre-filled for edit

#### `LcEditListPage.tsx`
- Search form: From Date, To Date, Customer (`<PaginatedCombobox type="customer" />`)
- Fetch LCs via `useLcEditList(filters)` → `GET /LCTracking/GetLCEidtList?...`
- Table: LC Number, LC Amount, Bank, Location, LC Date, PI Number, PI Date, Customer
- **Edit LC** action → `/lc/{lcDocId}/limited-update`

#### `LcLimitedUpdatePage.tsx`
- Load LC detail via `useLcDetail(id)`
- Form fields: LC Number, LC Amount, Issuer Bank (`<DropdownSelect type="bank" />`), Branch Location (`<PaginatedCombobox type="location" />`), LC Date
- On submit: `useLcLimitedUpdate()`

---

## 6. Route Map & Legacy Redirects

### New V2 Routes to Add to `AppRouter.tsx`

```tsx
// ── Selling Price ──
<Route path="selling-prices" element={protect(<SellingPriceListPage />, sellingPricePaths)} />
<Route path="selling-prices/add" element={protect(<AddSellingPricePage />, sellingPricePaths)} />
<Route path="selling-prices/:id/edit" element={protect(<EditSellingPricePage />, sellingPricePaths)} />

// ── Purchase Price ──
<Route path="purchase-prices" element={protect(<PurchasePriceListPage />, purchasePricePaths)} />
<Route path="purchase-prices/add" element={protect(<AddPurchasePricePage />, purchasePricePaths)} />
<Route path="purchase-prices/:id/edit" element={protect(<EditPurchasePricePage />, purchasePricePaths)} />

// ── Quotation ──
<Route path="quotations" element={protect(<QuotationListPage />, quotationPaths)} />
<Route path="quotations/unapproved" element={protect(<QuotationListPage mode="unapproved" />, quotationPaths)} />
<Route path="quotations/approved" element={protect(<QuotationListPage mode="approved" />, quotationPaths)} />
<Route path="quotations/create" element={protect(<CreateQuotationPage />, quotationPaths)} />
<Route path="quotations/:id/edit" element={protect(<EditQuotationPage />, quotationPaths)} />
<Route path="quotations/:id/approve" element={protect(<ApproveQuotationPage />, quotationPaths)} />

// ── LC Tracking ──
<Route path="lc/pi" element={protect(<PiListPage />, lcPiPaths)} />
<Route path="lc/pi/create" element={protect(<CreatePiPage />, lcPiPaths)} />
<Route path="lc/pi/:id/edit" element={protect(<EditPiPage />, lcPiPaths)} />
<Route path="lc/operations" element={protect(<LcOperationsPage />, lcOperationsPaths)} />
<Route path="lc/create" element={protect(<CreateLcPage />, lcOperationsPaths)} />
<Route path="lc/:id/update" element={protect(<UpdateLcDocPage />, lcDocPaths)} />
<Route path="lc/documents" element={protect(<LcDocumentListPage />, lcDocPaths)} />
<Route path="lc/payments" element={protect(<LcPaymentOperationsPage />, lcPaymentPaths)} />
<Route path="lc/:id/payment" element={protect(<LcPaymentEntryPage />, lcPaymentPaths)} />
<Route path="lc/status" element={protect(<LcStatusReportPage />, lcStatusPaths)} />
<Route path="lc/payment-edit" element={protect(<LcPaymentEditListPage />, lcPaymentEditPaths)} />
<Route path="lc/payment-edit/:id" element={protect(<LcPaymentEditPage />, lcPaymentEditPaths)} />
<Route path="lc/edit-list" element={protect(<LcEditListPage />, lcEditPaths)} />
<Route path="lc/:id/limited-update" element={protect(<LcLimitedUpdatePage />, lcEditPaths)} />
```

### Legacy Redirect Routes to Add

```tsx
// ── Selling Price Legacy ──
<Route path="price" element={<Navigate to="/selling-prices" replace />} />
<Route path="addsellprice" element={<Navigate to="/selling-prices/add" replace />} />
<Route path="price/:id/edit" element={<EditSellingPricePage />} />

// ── Purchase Price Legacy ──
<Route path="purchaseprices" element={<Navigate to="/purchase-prices" replace />} />
<Route path="purchaseprice/add" element={<Navigate to="/purchase-prices/add" replace />} />
<Route path="purchaseprice/:id/edit" element={<EditPurchasePricePage />} />

// ── Quotation Legacy ──
<Route path="quotation/list" element={<Navigate to="/quotations" replace />} />
<Route path="quotation/unapprovedlist" element={<Navigate to="/quotations/unapproved" replace />} />
<Route path="quotation/approvedlist" element={<Navigate to="/quotations/approved" replace />} />
<Route path="quotation/create" element={<Navigate to="/quotations/create" replace />} />
<Route path="quotation/:id/edit" element={<EditQuotationPage />} />
<Route path="quotation/:id/approve" element={<ApproveQuotationPage />} />

// ── LC Tracking Legacy ──
<Route path="lctracking/pilists" element={<Navigate to="/lc/pi" replace />} />
<Route path="lctracking/createpi" element={<Navigate to="/lc/pi/create" replace />} />
<Route path="lctracking/:id/updatepi" element={<EditPiPage />} />
<Route path="lctracking/listlcanddoc" element={<Navigate to="/lc/operations" replace />} />
<Route path="lctracking/createlcdoc" element={<Navigate to="/lc/create" replace />} />
<Route path="lctracking/:id/updatelcdoc" element={<UpdateLcDocPage />} />
<Route path="lctracking/documentactionlist" element={<Navigate to="/lc/documents" replace />} />
<Route path="lctracking/lcpaymentlist" element={<Navigate to="/lc/payments" replace />} />
<Route path="lctracking/:id/lcpayment" element={<LcPaymentEntryPage />} />
<Route path="lctracking/lctrackingreport" element={<Navigate to="/lc/status" replace />} />
<Route path="lctracking/:id/limitedupdate" element={<LcLimitedUpdatePage />} />
<Route path="lc-payments/list" element={<Navigate to="/lc/payment-edit" replace />} />
<Route path="lc-payments/:id/edit" element={<LcPaymentEditPage />} />
<Route path="lc/list" element={<Navigate to="/lc/edit-list" replace />} />
```

---

## 7. Menu Mapper & Access Control

### Add to `auth/menuMapper.ts` — `legacyToV2` map

```typescript
// Selling Price
'/price': '/selling-prices',
'/addsellprice': '/selling-prices/add',

// Purchase Price
'/purchaseprices': '/purchase-prices',
'/purchaseprice/add': '/purchase-prices/add',

// Quotation
'/quotation/list': '/quotations',
'/quotation/unapprovedlist': '/quotations/unapproved',
'/quotation/approvedlist': '/quotations/approved',
'/quotation/create': '/quotations/create',

// LC Tracking - PI
'/lctracking/pilists': '/lc/pi',
'/lctracking/createpi': '/lc/pi/create',

// LC Tracking - LC Operations
'/lctracking/listlcanddoc': '/lc/operations',
'/lctracking/createlcdoc': '/lc/create',

// LC Tracking - Document
'/lctracking/documentactionlist': '/lc/documents',

// LC Tracking - Payment
'/lctracking/lcpaymentlist': '/lc/payments',
'/lctracking/lctrackingreport': '/lc/status',
'/lc-payments/list': '/lc/payment-edit',
'/lc/list': '/lc/edit-list',
```

### Access Control Path Groups

```typescript
const sellingPricePaths = ['/selling-prices', '/price', '/addsellprice']
const purchasePricePaths = ['/purchase-prices', '/purchaseprices', '/purchaseprice/add']
const quotationPaths = ['/quotations', '/quotation/list', '/quotation/unapprovedlist', '/quotation/approvedlist', '/quotation/create']
const lcPiPaths = ['/lc/pi', '/lctracking/pilists', '/lctracking/createpi']
const lcOperationsPaths = ['/lc/operations', '/lc/create', '/lctracking/listlcanddoc', '/lctracking/createlcdoc']
const lcDocPaths = ['/lc/documents', '/lctracking/documentactionlist']
const lcPaymentPaths = ['/lc/payments', '/lctracking/lcpaymentlist']
const lcStatusPaths = ['/lc/status', '/lctracking/lctrackingreport']
const lcPaymentEditPaths = ['/lc/payment-edit', '/lc-payments/list']
const lcEditPaths = ['/lc/edit-list', '/lc/list']
```

---

## 8. Execution Phases

### Phase 1 — Foundation (Types + Schemas + Hooks)

**Files to create:**
1. `src/types/price.ts` — Selling + Purchase price types
2. `src/types/quotation.ts` — Quotation types
3. `src/types/lcTracking.ts` — LC tracking types (PI + LC + Payment)
4. `src/schemas/priceSchema.ts` — Selling + Purchase price validation
5. `src/schemas/quotationSchema.ts` — Quotation validation
6. `src/schemas/lcTrackingSchema.ts` — All LC tracking form validation
7. `src/hooks/usePrice.ts` — All price queries + mutations
8. `src/hooks/useQuotation.ts` — All quotation queries + mutations
9. `src/hooks/useLcTracking.ts` — All LC tracking queries + mutations

**Verification:** `npm run build` must pass with no type errors.

### Phase 2 — Selling Price Pages

**Files to create:**
1. `src/pages/prices/SellingPriceListPage.tsx`
2. `src/pages/prices/SellingPriceForm.tsx`
3. `src/pages/prices/AddSellingPricePage.tsx`
4. `src/pages/prices/EditSellingPricePage.tsx`
5. `src/pages/prices/PriceHistoryModal.tsx` (selling price history modal)

**Wire routes** in `AppRouter.tsx` (V2 routes + legacy redirects).
**Wire menu mapper** entries.
**Verification:** Navigate to `/selling-prices`, add/edit prices, view history.

### Phase 3 — Purchase Price Pages

**Files to create:**
1. `src/pages/prices/PurchasePriceListPage.tsx`
2. `src/pages/prices/PurchasePriceForm.tsx`
3. `src/pages/prices/AddPurchasePricePage.tsx`
4. `src/pages/prices/EditPurchasePricePage.tsx`
5. `src/pages/prices/PurchasePriceHistoryModal.tsx`

**Wire routes + legacy redirects.**
**Verification:** Navigate to `/purchase-prices`, full CRUD + history.

### Phase 4 — Quotation Pages

**Files to create:**
1. `src/pages/quotations/QuotationListPage.tsx`
2. `src/pages/quotations/QuotationForm.tsx`
3. `src/pages/quotations/CreateQuotationPage.tsx`
4. `src/pages/quotations/EditQuotationPage.tsx`
5. `src/pages/quotations/ApproveQuotationPage.tsx`
6. `src/pages/quotations/QuotationViewModal.tsx`
7. `src/features/quotation/calculations.ts` (line item calculation logic)

**Wire routes + legacy redirects.**
**Verification:** Create quotation with line items, verify calculation, edit, approve.

### Phase 5 — LC Tracking: PI

**Files to create:**
1. `src/pages/lc/PiListPage.tsx`
2. `src/pages/lc/PiForm.tsx`
3. `src/pages/lc/CreatePiPage.tsx`
4. `src/pages/lc/EditPiPage.tsx`
5. `src/pages/lc/PiDetailModal.tsx`
6. `src/pages/lc/PiPrintModal.tsx`

**Wire routes + legacy redirects.**
**Verification:** Create PI, edit, escalate, view/print.

### Phase 6 — LC Tracking: LC Document CRUD

**Files to create:**
1. `src/pages/lc/LcOperationsPage.tsx`
2. `src/pages/lc/CreateLcPage.tsx`
3. `src/pages/lc/UpdateLcDocPage.tsx`
4. `src/pages/lc/LcDocumentListPage.tsx`
5. `src/pages/lc/LcDocumentDetailModal.tsx`
6. `src/pages/lc/LcEditListPage.tsx`
7. `src/pages/lc/LcLimitedUpdatePage.tsx`

**Wire routes + legacy redirects.**
**Verification:** Full LC document lifecycle: create from PI, update timeline, limited edit.

### Phase 7 — LC Tracking: Payment

**Files to create:**
1. `src/pages/lc/LcPaymentOperationsPage.tsx`
2. `src/pages/lc/LcPaymentEntryPage.tsx`
3. `src/pages/lc/LcPaymentForm.tsx`
4. `src/pages/lc/LcPaymentEditListPage.tsx`
5. `src/pages/lc/LcPaymentEditPage.tsx`

**Wire routes + legacy redirects.**
**Verification:** Record payment, edit payment, view summary/history.

### Phase 8 — LC Status Report + Polish

**Files to create:**
1. `src/pages/lc/LcStatusReportPage.tsx`

**Final tasks:**
- Verify all legacy redirect routes work
- Verify menu mapper entries
- `npm run build` — no errors, no new warnings
- Cross-check all 25 legacy routes map correctly

---

## 9. File Checklist

### Types (3 files)
- [ ] `src/types/price.ts`
- [ ] `src/types/quotation.ts`
- [ ] `src/types/lcTracking.ts`

### Schemas (3 files)
- [ ] `src/schemas/priceSchema.ts`
- [ ] `src/schemas/quotationSchema.ts`
- [ ] `src/schemas/lcTrackingSchema.ts`

### Hooks (3 files)
- [ ] `src/hooks/usePrice.ts`
- [ ] `src/hooks/useQuotation.ts`
- [ ] `src/hooks/useLcTracking.ts`

### Features (1 file)
- [ ] `src/features/quotation/calculations.ts`

### Pages — Prices (10 files)
- [ ] `src/pages/prices/SellingPriceListPage.tsx`
- [ ] `src/pages/prices/SellingPriceForm.tsx`
- [ ] `src/pages/prices/AddSellingPricePage.tsx`
- [ ] `src/pages/prices/EditSellingPricePage.tsx`
- [ ] `src/pages/prices/PriceHistoryModal.tsx`
- [ ] `src/pages/prices/PurchasePriceListPage.tsx`
- [ ] `src/pages/prices/PurchasePriceForm.tsx`
- [ ] `src/pages/prices/AddPurchasePricePage.tsx`
- [ ] `src/pages/prices/EditPurchasePricePage.tsx`
- [ ] `src/pages/prices/PurchasePriceHistoryModal.tsx`

### Pages — Quotations (7 files)
- [ ] `src/pages/quotations/QuotationListPage.tsx`
- [ ] `src/pages/quotations/QuotationForm.tsx`
- [ ] `src/pages/quotations/CreateQuotationPage.tsx`
- [ ] `src/pages/quotations/EditQuotationPage.tsx`
- [ ] `src/pages/quotations/ApproveQuotationPage.tsx`
- [ ] `src/pages/quotations/QuotationViewModal.tsx`

### Pages — LC Tracking (17 files)
- [ ] `src/pages/lc/PiListPage.tsx`
- [ ] `src/pages/lc/PiForm.tsx`
- [ ] `src/pages/lc/CreatePiPage.tsx`
- [ ] `src/pages/lc/EditPiPage.tsx`
- [ ] `src/pages/lc/PiDetailModal.tsx`
- [ ] `src/pages/lc/PiPrintModal.tsx`
- [ ] `src/pages/lc/LcOperationsPage.tsx`
- [ ] `src/pages/lc/CreateLcPage.tsx`
- [ ] `src/pages/lc/UpdateLcDocPage.tsx`
- [ ] `src/pages/lc/LcDocumentListPage.tsx`
- [ ] `src/pages/lc/LcDocumentDetailModal.tsx`
- [ ] `src/pages/lc/LcEditListPage.tsx`
- [ ] `src/pages/lc/LcLimitedUpdatePage.tsx`
- [ ] `src/pages/lc/LcPaymentOperationsPage.tsx`
- [ ] `src/pages/lc/LcPaymentEntryPage.tsx`
- [ ] `src/pages/lc/LcPaymentForm.tsx`
- [ ] `src/pages/lc/LcPaymentEditListPage.tsx`
- [ ] `src/pages/lc/LcPaymentEditPage.tsx`
- [ ] `src/pages/lc/LcStatusReportPage.tsx`

### Router & Auth Updates
- [ ] `src/router/AppRouter.tsx` — add all routes + lazy imports + legacy redirects
- [ ] `src/auth/menuMapper.ts` — add legacy→V2 path mappings

### **Total: ~44 new files + 2 file updates**

---

## Appendix A — Dropdown Components Reference

| Dropdown Need | Component | Type Key | Notes |
|---|---|---|---|
| Product | `<PaginatedCombobox type="product" />` | `product` | Paginated, 50/page |
| Customer | `<PaginatedCombobox type="customer" />` | `customer` | Paginated, 50/page |
| Employee | `<PaginatedCombobox type="employee" />` | `employee` | Paginated, 50/page |
| Location | `<PaginatedCombobox type="location" />` | `location` | Paginated, 50/page |
| Bank | `<DropdownSelect type="bank" />` | `bank` | Load-all |
| LC Payment Terms | `<DropdownSelect type="lcPaymentTerms" />` | `lcPaymentTerms` | Load-all, **already registered** |
| Product Category | `<DropdownSelect type="productCategory" />` | `productCategory` | Load-all |

## Appendix B — Backend Typos to Match Exactly

| Field / Endpoint | Typo | Correct Spelling |
|---|---|---|
| `productDicsountedPrice` | `Dicsounted` | Discounted |
| `purchasePriceAtuoId` | `Atuo` | Auto |
| `GetAllPurcashePriceGrid` | `Purcashe` | Purchase |
| `CratreLCDocAndPayments` | `Cratre` | Create |
| `GetLCEidtList` | `Eidt` | Edit |
| `pqdAppliedVatPercantage` | `Percantage` | Percentage |
| `pqdAppliedAitPercantage` | `Percantage` | Percentage |
| `pqdAdustedAmount` | `Adusted` | Adjusted |
| `docBenificerySubmissionDate` | `Benificery` | Beneficiary |
| `piCustmomerId` | `Custmomer` | Customer |

> **CRITICAL:** You must use the **typo versions** in payloads and type definitions because the backend expects them.

## Appendix C — Existing V2 Infrastructure Already Available

These are already implemented and ready to use — do NOT re-implement:

| Feature | Location | Notes |
|---|---|---|
| `apiClient` | `@/lib/api.ts` | Typed fetch with JWT auto-inject |
| `DropdownSelect` | `@/components/dropdowns/DropdownSelect` | Load-all dropdowns |
| `PaginatedCombobox` | `@/components/dropdowns/PaginatedCombobox` | Paginated dropdowns with infinite scroll |
| `ErrorBoundary` | `@/components/ErrorBoundary` | Catches render errors |
| `AppToast` | `@/components/AppToast` | Toast notifications |
| `toastStore` | `@/stores/toastStore` | `showToast()` for success/error messages |
| `ProtectedRoute` | `@/auth/ProtectedRoute` | Route guard with menu access control |
| `exportExcel` | `@/utils/lazyExportExcel` | Lazy-loaded Excel export |
| `formatDate`, `formatCurrency`, `formatNumber` | `@/lib/utils` | Formatting utilities |
| `cn()` | `@/lib/utils` | Tailwind class merge utility |
| `usePaginatedList` | `@/hooks/usePaginatedList` | Infinite scroll list hook |
| `useDebounce` | `@/hooks/useDebounce` | Debounce hook for search |
| Payment hooks | `@/hooks/usePayments` | Shared payment CRUD (used by LC payment) |
