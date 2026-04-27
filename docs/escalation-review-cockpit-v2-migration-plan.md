# Escalation Review Cockpit — V2 Migration Plan

> **Purpose:** Complete AI-agent documentation for migrating the legacy **EscalationCockpitPage** into the v2-octopi `/sales-orders` workflow as a new **"Review"** button. Both the existing "Escalate" and the new "Review" escalation processes will coexist. The current "Escalate" will be deprecated later.

---

## TABLE OF CONTENTS

1. [Feature Overview](#1-feature-overview)
2. [Legacy Architecture Reference](#2-legacy-architecture-reference)
3. [V2 Architecture Target](#3-v2-architecture-target)
4. [File Inventory — What to Create](#4-file-inventory--what-to-create)
5. [Phase 1 — Review Button on SalesOrderListPage](#5-phase-1--review-button-on-salesorderlistpage)
6. [Phase 2 — ReviewCockpitPage (New Page)](#6-phase-2--reviewcockpitpage-new-page)
7. [Phase 3 — Cockpit Sections (Components)](#7-phase-3--cockpit-sections-components)
8. [Phase 4 — API Integration (Hooks & Services)](#8-phase-4--api-integration-hooks--services)
9. [Phase 5 — Escalation from Review Cockpit](#9-phase-5--escalation-from-review-cockpit)
10. [Phase 6 — Router & Sidebar](#10-phase-6--router--sidebar)
11. [API Endpoints Reference](#11-api-endpoints-reference)
12. [Type Definitions](#12-type-definitions)
13. [Legacy-to-V2 Component Mapping](#13-legacy-to-v2-component-mapping)
14. [Data Flow Diagram](#14-data-flow-diagram)
15. [Key Gotchas & Constraints](#15-key-gotchas--constraints)
16. [Step-by-Step Checklist](#16-step-by-step-checklist)

---

## 1. Feature Overview

### What Is the Escalation Review Cockpit?

A **customer financial dashboard** that a user opens before escalating a sales order. It shows 6 data sections about the customer's financial health:

1. **Customer Basic Info** — Name, address, marketing rep, payment mode, special notes
2. **Lifetime Summary** — 4 metric cards: lifetime sales, lifetime payments, sample quantity, top 3 products
3. **Credit Information (90 Days)** — Opening balance, sales, payments, adjustments, closing balance, current order value, projected new closing balance
4. **Product Loan Information** — Products loaned (given/received/balance) with expandable list
5. **Cheque Information** — Pending cheques summary + all cheques detail modal
6. **LC Information** — PI/LC documents summary table
7. **Tax & AIT Summary** — Current tax year VAT/AIT invoiced vs paid, with balances

After reviewing all sections, the user can **escalate the order** directly from this cockpit (same API as the existing Escalate button).

### Business Requirement

| Item | Detail |
|---|---|
| **New button name** | `Review` |
| **Button placement** | In `/sales-orders` list page, `standard` mode row actions — **before** the existing `Escalate` button |
| **Button order** | `Edit` → `Review` → `Escalate` → `View` |
| **New page route** | `/sales-orders/:id/review` |
| **Escalation capability** | The Review page includes an "Escalate Order" button that calls the same bulk escalation API |
| **Coexistence** | Both `Review` (new) and `Escalate` (existing) will work simultaneously |
| **Future deprecation** | The current `Escalate` button will be removed later — the `Review` cockpit will become the only escalation path |

---

## 2. Legacy Architecture Reference

### File Structure (Legacy — `src/`)

```
src/
├── pages/escalation/
│   └── EscalationCockpitPage.js          # Page wrapper — extracts orderId + locationState
│
├── components/escalation/
│   ├── EscalationCockpit/
│   │   ├── index.js                       # Barrel export
│   │   ├── EscalationCockpit.js           # Main layout — 6 sections in MUI Grid
│   │   └── components/
│   │       ├── CustomerBasicInfo.js        # Customer profile card (3-column Grid)
│   │       ├── LifetimeSummary.js          # 4 metric cards (sales, payments, sample, top products)
│   │       ├── CreditSection.js           # 90-day credit table + current order + new closing balance
│   │       ├── CreditDetailsModal.js       # 180-day transaction history modal (search, PDF, Excel export)
│   │       ├── ProductLoanSection.js       # Product loan summary table (expandable, 6-item preview)
│   │       ├── ProductLoanDetailsModal.js  # Full loan detail modal (PDF, Excel export)
│   │       ├── ChequeSection.js            # Pending cheques summary + list
│   │       ├── ChequeDetailsModal.js       # All cheques modal (filter by status, PDF, Excel)
│   │       ├── LCSection.js               # LC/PI summary table with lifecycle colors
│   │       ├── LCDetailsModal.js           # LC document detail modal
│   │       ├── TaxAitSection.js            # Tax year VAT/AIT summary (single row, 8 metrics)
│   │       └── TaxAitDetailsModal.js       # Tax detail modal (invoice-level transactions)
│   │
│   ├── shared/
│   │   └── CockpitActions.js              # Escalate Order button + confirmation dialog
│   │
│   └── utils/
│       └── creditCalculations.js           # ~700 lines — ALL API wrappers + formatters + calculators
│
├── services/
│   ├── escalationService.js               # Basic escalation service (13 lines)
│   ├── calculationHelpers.js              # Financial helper functions (140 lines)
│   └── financialCalculations.js           # Full financial calculations (300 lines)
│
└── redux/actions/
    └── invoiceActions.js                  # escalateSalesOrderInternal() action
```

### Legacy Tech Stack

| Item | Legacy | V2 Target |
|---|---|---|
| UI Library | Material UI (MUI) | Tailwind CSS (gray-* only) |
| State | Redux + useSelector | TanStack Query v5 |
| API calls | Raw `fetch()` in creditCalculations.js | `apiClient` (axios instance) in hooks |
| Forms | useState | React Hook Form + Zod |
| Routing | react-router-dom v5 (useHistory) | react-router-dom v7 (useNavigate) |
| Icons | MUI Icons (@mui/icons-material) | Lucide React |
| Exports | jsPDF + ExcelJS | ExcelJS (utils/exportExcel.ts) |
| Types | None (plain JS) | TypeScript strict mode |

### Legacy Data Flow

```
EscalationCockpitPage
  └── receives orderId from URL params, customerId from location.state
        └── EscalationCockpit (main component)
              ├── CockpitActions (orderId, customerId) → escalation button + dialog
              ├── CustomerBasicInfo (customerId) → Redux dispatch to fetch customer
              ├── LifetimeSummary (customerId) → 3 parallel API calls via creditCalculations.js
              ├── CreditSection (customerId, orderId) → 2 parallel API calls
              ├── ProductLoanSection (customerId) → 1 API call
              ├── ChequeSection (customerId) → 1 API call
              ├── LCSection (customerId) → 1 API call
              └── TaxAitSection (customerId) → 2 API calls (invoices + payments)
```

### Legacy Escalation Action

The `CockpitActions.js` component dispatches `escalateSalesOrderInternal([orderId])` which calls:
```
POST /StockOut/SubmitForMapItemAndBatch
Body: [orderId]   (array of order IDs)
```
This is the **same API** used by the v2 `useBulkEscalate()` hook.

---

## 3. V2 Architecture Target

### Target File Structure (V2 — `v2-octopi/src/`)

```
v2-octopi/src/
├── pages/sales-orders/
│   ├── SalesOrderListPage.tsx              # MODIFY — add "Review" button before "Escalate"
│   ├── ReviewCockpitPage.tsx               # NEW — main cockpit page
│   └── review-cockpit/                     # NEW — cockpit sub-components
│       ├── CustomerBasicInfo.tsx            # Customer profile section
│       ├── LifetimeSummary.tsx              # 4 metric cards
│       ├── CreditSection.tsx               # 90-day credit table
│       ├── CreditDetailsModal.tsx           # 180-day transaction modal
│       ├── ProductLoanSection.tsx           # Product loan summary
│       ├── ProductLoanDetailsModal.tsx      # Product loan detail modal
│       ├── ChequeSection.tsx               # Pending cheques summary
│       ├── ChequeDetailsModal.tsx           # All cheques detail modal
│       ├── LCSection.tsx                   # LC/PI summary
│       ├── LCDetailsModal.tsx              # LC detail modal
│       ├── TaxAitSection.tsx               # Tax/AIT summary
│       ├── TaxAitDetailsModal.tsx           # Tax detail modal
│       └── CockpitActions.tsx              # Escalation action bar
│
├── hooks/
│   └── useReviewCockpit.ts                 # NEW — TanStack Query hooks for all cockpit APIs
│
├── types/
│   └── reviewCockpit.ts                    # NEW — TypeScript types for cockpit data
│
└── router/
    └── AppRouter.tsx                       # MODIFY — add review cockpit route
```

### V2 Conventions to Follow

1. **Tailwind CSS only** — gray-* palette, no MUI components
2. **TanStack Query** — all API calls via custom hooks, NOT raw fetch
3. **apiClient** — use `import { apiClient } from '@/config/env'` for all HTTP requests
4. **TypeScript strict** — all props typed, no `any`
5. **Lucide React icons** — no MUI icons
6. **React Router v7** — `useNavigate()`, `useParams()`, `Link`
7. **No Redux** — use TanStack Query for server state, Zustand for UI state
8. **ExcelJS** — use `utils/exportExcel.ts` for Excel exports
9. **Path alias** — use `@/` prefix for all imports
10. **Color palette** — gray-50 through gray-900 only; green-700/600 for action buttons

---

## 4. File Inventory — What to Create

### New Files (15 total)

| # | File | Purpose | Estimated Lines |
|---|---|---|---|
| 1 | `pages/sales-orders/ReviewCockpitPage.tsx` | Main cockpit page wrapper | 60-80 |
| 2 | `pages/sales-orders/review-cockpit/CustomerBasicInfo.tsx` | Customer profile section | 120-150 |
| 3 | `pages/sales-orders/review-cockpit/LifetimeSummary.tsx` | 4 metric cards | 140-170 |
| 4 | `pages/sales-orders/review-cockpit/CreditSection.tsx` | 90-day credit table | 200-250 |
| 5 | `pages/sales-orders/review-cockpit/CreditDetailsModal.tsx` | 180-day transaction modal | 350-400 |
| 6 | `pages/sales-orders/review-cockpit/ProductLoanSection.tsx` | Product loan summary | 180-220 |
| 7 | `pages/sales-orders/review-cockpit/ProductLoanDetailsModal.tsx` | Product loan detail modal | 300-350 |
| 8 | `pages/sales-orders/review-cockpit/ChequeSection.tsx` | Pending cheques | 150-180 |
| 9 | `pages/sales-orders/review-cockpit/ChequeDetailsModal.tsx` | All cheques modal | 300-350 |
| 10 | `pages/sales-orders/review-cockpit/LCSection.tsx` | LC/PI summary | 180-220 |
| 11 | `pages/sales-orders/review-cockpit/LCDetailsModal.tsx` | LC detail modal | 280-320 |
| 12 | `pages/sales-orders/review-cockpit/TaxAitSection.tsx` | Tax/AIT summary | 160-200 |
| 13 | `pages/sales-orders/review-cockpit/TaxAitDetailsModal.tsx` | Tax detail modal | 300-350 |
| 14 | `pages/sales-orders/review-cockpit/CockpitActions.tsx` | Escalation action bar | 100-130 |
| 15 | `hooks/useReviewCockpit.ts` | TanStack Query hooks for all cockpit APIs | 350-450 |
| 16 | `types/reviewCockpit.ts` | TypeScript interfaces for cockpit data | 150-200 |

### Files to Modify (2)

| # | File | Change |
|---|---|---|
| 1 | `pages/sales-orders/SalesOrderListPage.tsx` | Add "Review" button in `renderRowActions` for `standard` mode |
| 2 | `router/AppRouter.tsx` | Add route: `/sales-orders/:id/review` → `ReviewCockpitPage` |

---

## 5. Phase 1 — Review Button on SalesOrderListPage

### Current Row Actions (standard mode)

```typescript
// File: pages/sales-orders/SalesOrderListPage.tsx — renderRowActions function
case 'standard':
  return (
    <>
      <Link to={`/sales-orders/${salesOrderId}/edit`} ...>Edit</Link>
      <button onClick={() => onEscalate?.(salesOrderId)} ...>Escalate</button>
      {viewButton}
    </>
  )
```

### Target Row Actions (after change)

```typescript
case 'standard':
  return (
    <>
      <Link to={`/sales-orders/${salesOrderId}/edit`} ...>Edit</Link>
      <Link
        to={`/sales-orders/${salesOrderId}/review`}
        state={{ customerId: /* from row data */ }}
        className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        Review
      </Link>
      <button onClick={() => onEscalate?.(salesOrderId)} ...>Escalate</button>
      {viewButton}
    </>
  )
```

### Important — Passing customerId

The Review cockpit needs the **customerId** associated with the sales order. Two approaches:

**Option A (Preferred — via location state):** Pass `customerId` from the list row data:
```typescript
// renderRowActions needs access to the row's customerId
function renderRowActions(
  mode: ListMode,
  salesOrderId: number,
  currentStatus: number | string | null | undefined,
  onView: (salesOrderId: number) => void,
  onEscalate?: (salesOrderId: number) => void,
  customerId?: number | null,          // ADD THIS PARAMETER
)
```
Then in the `Link`:
```typescript
<Link to={`/sales-orders/${salesOrderId}/review`} state={{ customerId }}>Review</Link>
```

**Option B (Fallback — fetch on page):** The ReviewCockpitPage fetches order detail via `useStockOutDetail(orderId)` and extracts `customerId` from it. This is more reliable but adds a loading step.

**Recommended:** Use Option B as the primary approach (always fetch) with Option A as an optimization (pre-populate if available). The legacy code uses Option A but has error handling for missing customerId.

### Signature Change for renderRowActions

The function signature must be extended to pass `customerId` through:

```typescript
function renderRowActions(
  mode: ListMode,
  row: StockOutListRow,                    // CHANGE: pass full row instead of just salesOrderId
  onView: (salesOrderId: number) => void,
  onEscalate?: (salesOrderId: number) => void,
)
```

Or simpler — keep existing signature, add customerId:

```typescript
function renderRowActions(
  mode: ListMode,
  salesOrderId: number,
  currentStatus: number | string | null | undefined,
  onView: (salesOrderId: number) => void,
  onEscalate?: (salesOrderId: number) => void,
  customerId?: number | null,
)
```

Update the call site in the table row:
```typescript
{renderRowActions(mode, row.soSystemId, row.soCurrentStatus ?? row.currentStatus, setViewOrderId, handleRowEscalate, row.soCustomerId)}
```

> **Check:** Verify `StockOutListRow` type includes `soCustomerId`. If not, it must be added to the type and confirmed from the API response.

---

## 6. Phase 2 — ReviewCockpitPage (New Page)

### Design Pattern

Follow the v2 page pattern: thin wrapper page that uses hooks for data.

```typescript
// File: pages/sales-orders/ReviewCockpitPage.tsx

import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useStockOutDetail } from '@/hooks/useStockOut'
import { CustomerBasicInfo } from './review-cockpit/CustomerBasicInfo'
import { LifetimeSummary } from './review-cockpit/LifetimeSummary'
import { CreditSection } from './review-cockpit/CreditSection'
import { ProductLoanSection } from './review-cockpit/ProductLoanSection'
import { ChequeSection } from './review-cockpit/ChequeSection'
import { LCSection } from './review-cockpit/LCSection'
import { TaxAitSection } from './review-cockpit/TaxAitSection'
import { CockpitActions } from './review-cockpit/CockpitActions'

export function ReviewCockpitPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const orderId = Number(id)

  // Get customerId from location state or fetch from order detail
  const locationCustomerId = (location.state as { customerId?: number } | null)?.customerId ?? null
  const { data: orderDetail, isLoading, isError, error } = useStockOutDetail(orderId)
  const customerId = locationCustomerId ?? orderDetail?.stockOutGeneralData?.soCustomerId ?? null

  if (isLoading && !locationCustomerId) {
    return /* loading skeleton */
  }

  if (!customerId) {
    return /* error: customer ID not found */
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/sales-orders" className="...">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Review Cockpit</h1>
            <p className="text-sm text-gray-500">Order #{orderId} — Customer #{customerId}</p>
          </div>
        </div>
      </div>

      {/* Escalation Actions Bar */}
      <CockpitActions orderId={orderId} customerId={customerId} />

      {/* Customer Basic Info */}
      <CustomerBasicInfo customerId={customerId} />

      {/* Lifetime Summary (4 cards) */}
      <LifetimeSummary customerId={customerId} />

      {/* Financial Sections — 2-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CreditSection customerId={customerId} orderId={orderId} />
        <ProductLoanSection customerId={customerId} />
        <ChequeSection customerId={customerId} />
        <LCSection customerId={customerId} />
      </div>

      {/* Tax & AIT — Full width */}
      <TaxAitSection customerId={customerId} />
    </div>
  )
}
```

---

## 7. Phase 3 — Cockpit Sections (Components)

### 7.1 CustomerBasicInfo

**Props:** `{ customerId: number }`
**Data source:** `useCustomerDetail(customerId)` — fetch from `/Customer/GetCustomerDetails/{customerId}`
**Layout:** 3-column grid showing:
- Column 1: Customer ID (chip), Name, Address
- Column 2: Created Date, Marketing Rep (chip), Status (chip)
- Column 3: Payment Mode (chip), Special Note (highlighted if exists)

**Legacy mapping:**
| Legacy (MUI) | V2 (Tailwind) |
|---|---|
| `<Card>` / `<CardContent>` | `<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">` |
| `<Chip label={...} color="primary">` | `<span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">` |
| `<Grid container spacing={2}>` | `<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">` |
| `<PersonIcon>` | `<User size={16} />` (lucide) |

### 7.2 LifetimeSummary

**Props:** `{ customerId: number }`
**Data source:** 3 parallel queries via `useReviewCockpit`:
1. `useLifetimeTotals(customerId)` → `/Report/GetCustomerCreditSaleSummery`
2. `useLifetimeSampleQty(customerId)` → `/Dashboard/SampleIssueQuantity`
3. `useTopConsumedProducts(customerId)` → `/Dashboard/TopProducts`

**Layout:** 4 equal metric cards in a row:
1. **Lifetime Sales** — blue left border, blue background tint
2. **Lifetime Payments** — green left border, green background tint
3. **Lifetime Sample** — orange left border, orange background tint (with tooltip)
4. **Top 3 Products** — purple left border, purple background tint (with tooltip for details)

**V2 Tailwind approach for colored cards:**
Since v2 uses gray-* only palette, use subtle gray variations:
```
Card 1: border-l-4 border-gray-700 bg-gray-50
Card 2: border-l-4 border-gray-500 bg-gray-50
Card 3: border-l-4 border-gray-400 bg-gray-50
Card 4: border-l-4 border-gray-300 bg-gray-50
```
OR use inline styles for the accent border colors only (since the legacy uses distinct colors for UX clarity — check with the team if gray-only is strictly required for these accent elements).

### 7.3 CreditSection

**Props:** `{ customerId: number; orderId: number }`
**Data source:** 2 parallel queries:
1. `use90DayCreditSummary(customerId)` → `/Report/GetCustomerCreditSaleSummery` (90-day window)
2. `useCurrentOrderValue(orderId)` → `/StockOut/GetStockOutOrderDetails/{orderId}`

**Layout:** Table with rows:
| Row | Value |
|---|---|
| Opening Balance | `creditData.openingBalance` |
| Total Sales | `creditData.totalSales` |
| Total Payment | `creditData.totalPayment` |
| Total Adjustment | `creditData.totalAdjustment` |
| Closing Balance | `creditData.closingBalance` |
| 📌 Current Order (highlighted, clickable invoice #) | `currentOrder.orderValue` |
| ✅ New Closing Balance (calculated) | `closingBalance + orderValue` |

**"View Details" button** → opens `CreditDetailsModal`

### 7.4 CreditDetailsModal

**Props:** `{ isOpen: boolean; onClose: () => void; customerId: number; customerName?: string }`
**Data source:** `useCreditHistory(customerId, startDate, endDate)` → `/Report/GetCustomerCreditHistory`
**Features:**
- Full-screen modal (90vh height)
- Search filter (by type or transaction #)
- Summary bar (opening, sales, payment, adjustment, closing)
- Transaction table with columns: Date, Type, Transaction #, Sales Value, Payment, Adjustment, Balance
- Clickable invoice numbers → opens SalesOrderInternalModal
- PDF export (jsPDF + jspdf-autotable)
- Excel export (ExcelJS via `utils/exportExcel.ts`)
- Table totals footer

### 7.5 ProductLoanSection

**Props:** `{ customerId: number }`
**Data source:** `useProductLoanSummary(customerId)` → `/Report/GetCustomerLoanSummery/{customerId}/0`
**Layout:**
- Table: Product Name | Received | Given | Balance
- Shows first 6 rows, expand/collapse for more
- Color-coded balance (negative = red, positive = orange)
- Totals footer: Total Issued, Total Received, Balance
- "View Details" button → opens `ProductLoanDetailsModal`

### 7.6 ChequeSection

**Props:** `{ customerId: number }`
**Data source:** `usePendingCheques(customerId)` → `/Report/GetCustomerChequeReport?partnerId={customerId}&chequeStatusId=1`
**Layout:**
- Summary: Total pending cheques count + total amount
- Table of pending cheques: Cheque #, Bank, Amount, Date, Status
- "View All" button → opens `ChequeDetailsModal`

### 7.7 ChequeDetailsModal

**Props:** `{ isOpen: boolean; onClose: () => void; customerId: number }`
**Data source:** `useAllCheques(customerId)` → `/Report/GetCustomerChequeReport?partnerId={customerId}` (no status filter)
**Features:**
- Status-wise summary (Pending, Cleared, Bounced, etc.)
- Filter by status
- Full cheques table
- PDF + Excel export

### 7.8 LCSection

**Props:** `{ customerId: number }`
**Data source:** `useLCSummary(customerId)` → `/LCTracking/GetPiLcDocPaymentInfoByFilters?customerId={customerId}`
**Layout:**
- Summary table: PI #, LC #, Amount, Lifecycle Status (color-coded)
- "View Details" button on each row → opens `LCDetailsModal`

### 7.9 TaxAitSection

**Props:** `{ customerId: number }`
**Data source:** 2 API calls (current tax year July-June):
1. `/Report/GetTaxAitDetails` → invoice-level VAT/AIT
2. `/CustomerPayment/GetPaymentSummary` → VAT/AIT payments
**Layout:** Single summary row with 8 metrics:
- Tax Year, Total Invoices, Taxable Base, VAT Invoiced, AIT Invoiced, VAT Paid, AIT Paid, VAT Balance, AIT Balance
- "View Details" button → opens `TaxAitDetailsModal`

### 7.10 CockpitActions

**Props:** `{ orderId: number; customerId: number }`
**Data source:** `useBulkEscalate()` from existing `useStockOut.ts`
**Layout:**
- "Escalate Order" button (green-700)
- "Back to List" button (gray border)
- Order/Customer info display
- Confirmation dialog on escalate click
- Success message + auto-redirect to `/sales-orders` after escalation

**IMPORTANT:** This uses the **same** `useBulkEscalate()` hook already in `useStockOut.ts`. No new mutation needed.

---

## 8. Phase 4 — API Integration (Hooks & Services)

### New Hook File: `hooks/useReviewCockpit.ts`

All cockpit data should use TanStack Query hooks with the v2 `apiClient`:

```typescript
// hooks/useReviewCockpit.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/config/env'

// ─── Query Keys ───
export const reviewCockpitKeys = {
  all: ['reviewCockpit'] as const,
  customer: (customerId: number) => [...reviewCockpitKeys.all, 'customer', customerId] as const,
  lifetimeTotals: (customerId: number) => [...reviewCockpitKeys.all, 'lifetime', customerId] as const,
  sampleQty: (customerId: number) => [...reviewCockpitKeys.all, 'sample', customerId] as const,
  topProducts: (customerId: number) => [...reviewCockpitKeys.all, 'topProducts', customerId] as const,
  creditSummary: (customerId: number) => [...reviewCockpitKeys.all, 'credit90', customerId] as const,
  creditHistory: (customerId: number, startDate: string, endDate: string) =>
    [...reviewCockpitKeys.all, 'creditHistory', customerId, startDate, endDate] as const,
  orderValue: (orderId: number) => [...reviewCockpitKeys.all, 'orderValue', orderId] as const,
  productLoan: (customerId: number) => [...reviewCockpitKeys.all, 'productLoan', customerId] as const,
  productLoanDetail: (customerId: number, productId: number) =>
    [...reviewCockpitKeys.all, 'productLoanDetail', customerId, productId] as const,
  pendingCheques: (customerId: number) => [...reviewCockpitKeys.all, 'pendingCheques', customerId] as const,
  allCheques: (customerId: number) => [...reviewCockpitKeys.all, 'allCheques', customerId] as const,
  lcSummary: (customerId: number) => [...reviewCockpitKeys.all, 'lc', customerId] as const,
  lcDetail: (piSystemId: number) => [...reviewCockpitKeys.all, 'lcDetail', piSystemId] as const,
  taxSummary: (customerId: number) => [...reviewCockpitKeys.all, 'tax', customerId] as const,
  taxDetail: (customerId: number, startDate: string, endDate: string) =>
    [...reviewCockpitKeys.all, 'taxDetail', customerId, startDate, endDate] as const,
}
```

### Hook Examples

```typescript
// ─── Lifetime Totals ───
export function useLifetimeTotals(customerId: number | null) {
  return useQuery({
    queryKey: reviewCockpitKeys.lifetimeTotals(customerId!),
    queryFn: async () => {
      const startDate = '2023-12-01'
      const endDate = new Date().toISOString().slice(0, 10)
      const { data } = await apiClient.get('/Report/GetCustomerCreditSaleSummery', {
        params: { customerId, startDate, endDate },
      })
      if (data?.statusCode === 200 && data?.dataObj?.length > 0) {
        const summary = data.dataObj[0]
        return {
          lifetimeSales: summary.totalSale ?? 0,
          lifetimePayments: summary.totalPaid ?? 0,
        }
      }
      return { lifetimeSales: 0, lifetimePayments: 0 }
    },
    enabled: customerId !== null && customerId > 0,
  })
}

// ─── 90-Day Credit Summary ───
export function use90DayCreditSummary(customerId: number | null) {
  return useQuery({
    queryKey: reviewCockpitKeys.creditSummary(customerId!),
    queryFn: async () => {
      const endDate = new Date().toISOString().slice(0, 10)
      const start = new Date()
      start.setDate(start.getDate() - 90)
      const startDate = start.toISOString().slice(0, 10)
      const { data } = await apiClient.get('/Report/GetCustomerCreditSaleSummery', {
        params: { customerId, startDate, endDate },
      })
      if (data?.statusCode === 200 && data?.dataObj?.length > 0) {
        const s = data.dataObj[0]
        return {
          openingBalance: s.openingCredit ?? 0,
          totalSales: s.totalSale ?? 0,
          totalPayment: s.totalPaid ?? 0,
          totalAdjustment: s.totalAdjustment ?? 0,
          closingBalance: s.totalDue ?? 0,
        }
      }
      return { openingBalance: 0, totalSales: 0, totalPayment: 0, totalAdjustment: 0, closingBalance: 0 }
    },
    enabled: customerId !== null && customerId > 0,
  })
}

// ─── Credit History (for modal) ───
export function useCreditHistory(customerId: number | null, startDate: string, endDate: string) {
  return useQuery({
    queryKey: reviewCockpitKeys.creditHistory(customerId!, startDate, endDate),
    queryFn: async () => {
      const { data } = await apiClient.get('/Report/GetCustomerCreditHistory', {
        params: { customerId, startDate, endDate },
      })
      if (data?.statusCode === 200 && data?.dataObj) {
        return {
          customerInfo: data.dataObj.customerInfo,
          transactions: data.dataObj.transctionInfo ?? [],
        }
      }
      return { customerInfo: null, transactions: [] }
    },
    enabled: customerId !== null && customerId > 0 && !!startDate && !!endDate,
  })
}

// ─── Pending Cheques ───
export function usePendingCheques(customerId: number | null) {
  return useQuery({
    queryKey: reviewCockpitKeys.pendingCheques(customerId!),
    queryFn: async () => {
      const { data } = await apiClient.get('/Report/GetCustomerChequeReport', {
        params: { partnerId: customerId, chequeStatusId: 1 },
      })
      if (data?.statusCode === 200 && data?.dataObj) {
        const cheques = Array.isArray(data.dataObj) ? data.dataObj : []
        const totalAmount = cheques.reduce((sum: number, c: any) => sum + (parseFloat(c.chequeAmount) || 0), 0)
        return { pendingCheques: cheques, totalAmount, count: cheques.length }
      }
      return { pendingCheques: [], totalAmount: 0, count: 0 }
    },
    enabled: customerId !== null && customerId > 0,
  })
}

// ─── LC Summary ───
export function useLCSummary(customerId: number | null) {
  return useQuery({
    queryKey: reviewCockpitKeys.lcSummary(customerId!),
    queryFn: async () => {
      const { data } = await apiClient.get('/LCTracking/GetPiLcDocPaymentInfoByFilters', {
        params: { customerId },
      })
      if (data?.statusCode === 200 && data?.dataObj) {
        const lcData = Array.isArray(data.dataObj) ? data.dataObj : []
        const totalAmount = lcData.reduce((sum: number, item: any) => sum + (parseFloat(item.piAmount) || 0), 0)
        return { lcData, totalLCs: lcData.length, totalAmount }
      }
      return { lcData: [], totalLCs: 0, totalAmount: 0 }
    },
    enabled: customerId !== null && customerId > 0,
  })
}

// ... similar pattern for all other hooks
```

### Reusing Existing Hooks

The following hooks from `useStockOut.ts` can be reused directly:
- `useStockOutDetail(orderId)` — to get order details + customerId
- `useBulkEscalate()` — for the escalation action

---

## 9. Phase 5 — Escalation from Review Cockpit

### CockpitActions Component

```typescript
// pages/sales-orders/review-cockpit/CockpitActions.tsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { useBulkEscalate } from '@/hooks/useStockOut'

interface CockpitActionsProps {
  orderId: number
  customerId: number
}

export function CockpitActions({ orderId, customerId }: CockpitActionsProps) {
  const navigate = useNavigate()
  const bulkEscalate = useBulkEscalate()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleEscalate = async () => {
    try {
      await bulkEscalate.mutateAsync([orderId])
      setShowConfirm(false)
      setShowSuccess(true)
      setTimeout(() => navigate('/sales-orders'), 2000)
    } catch {
      // Error handled by TanStack Query
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* ... action bar with Escalate button + Back button + confirm dialog */}
    </div>
  )
}
```

**Key point:** Uses the SAME `useBulkEscalate()` mutation (POST `/StockOut/SubmitForMapItemAndBatch`) as the list page. No new API call needed.

---

## 10. Phase 6 — Router & Sidebar

### Route Addition

In `router/AppRouter.tsx`, add inside the sales-orders route group:

```typescript
// After the existing edit route
<Route path="sales-orders/:id/review" element={protect(<ReviewCockpitPage />, standardStockOutPaths)} />
```

### Sidebar

No sidebar change needed — the Review page is accessed via the row action button, not a sidebar menu item.

---

## 11. API Endpoints Reference

### Complete API Map (17 Endpoints)

| # | Endpoint | Method | Used By | Purpose |
|---|---|---|---|---|
| 1 | `/Report/GetCustomerCreditSaleSummery?customerId={id}&startDate={d}&endDate={d}` | GET | LifetimeSummary, CreditSection | Credit sale summary (configurable date range) |
| 2 | `/Dashboard/SampleIssueQuantity?startDate={d}&endDate={d}&customerId={id}` | GET | LifetimeSummary | Sample product quantity |
| 3 | `/Dashboard/TopProducts?startDate={d}&endDate={d}&customerId={id}&topCount={n}` | GET | LifetimeSummary | Top consumed products |
| 4 | `/StockOut/GetStockOutOrderDetails/{orderId}` | GET | CreditSection | Current order value |
| 5 | `/Report/GetCustomerCreditHistory?customerId={id}&startDate={d}&endDate={d}` | GET | CreditDetailsModal | 180-day transaction list |
| 6 | `/Report/GetCustomerLoanSummery/{customerId}/0` | GET | ProductLoanSection | Product loan summary |
| 7 | `/Report/GetCustomerLoanDetails/{customerId}/{productId}` | GET | ProductLoanDetailsModal | Product loan transactions |
| 8 | `/Report/GetCustomerChequeReport?partnerId={id}&chequeStatusId=1` | GET | ChequeSection | Pending cheques only |
| 9 | `/Report/GetCustomerChequeReport?partnerId={id}` | GET | ChequeDetailsModal | All cheques (all statuses) |
| 10 | `/LCTracking/GetPiLcDocPaymentInfoByFilters?customerId={id}` | GET | LCSection | LC/PI summary |
| 11 | `/LCTracking/GetPiLcDocPaymentInfoByFilters?piSystemId={id}` | GET | LCDetailsModal | Single LC detail |
| 12 | `/Report/GetTaxAitDetails?startDate={d}&endDate={d}&customerId={id}` | GET | TaxAitSection | Invoice-level VAT/AIT |
| 13 | `/CustomerPayment/GetPaymentSummary?customerId={id}&startDate={d}&endDate={d}` | GET | TaxAitSection | VAT/AIT payment totals |
| 14 | `/Customer/GetCustomerDetails/{customerId}` | GET | CustomerBasicInfo | Customer profile |
| 15 | `/StockOut/SubmitForMapItemAndBatch` | POST | CockpitActions | Escalate order (same as existing) |

### API Response Patterns

All APIs follow this response envelope:
```json
{
  "statusCode": 200,
  "message": "Success",
  "dataObj": { /* actual data */ }
}
```

Check `statusCode === 200` before accessing `dataObj`.

---

## 12. Type Definitions

### New Types File: `types/reviewCockpit.ts`

```typescript
// types/reviewCockpit.ts

export interface LifetimeTotals {
  lifetimeSales: number
  lifetimePayments: number
}

export interface SampleQuantity {
  sampleQuantity: number
}

export interface TopProduct {
  productName: string
  totalQuantity: number
}

export interface CreditSummary {
  openingBalance: number
  totalSales: number
  totalPayment: number
  totalAdjustment: number
  closingBalance: number
}

export interface CurrentOrderValue {
  orderValue: number
  orderNumber: string
}

export interface CreditTransaction {
  serial_no?: number
  date: string
  job_type: string
  transaction_number: string
  payable_amount: number | string
  paid_amount: number | string
  returned_amount: number | string
  linq_calculated_due_amount: number | string
}

export interface CreditHistoryResult {
  customerInfo: {
    customerId: number
    customerName: string
    customerAddress: string
  } | null
  transactions: CreditTransaction[]
}

export interface ProductLoanItem {
  productName: string
  loanReceivedQty: number | string
  loanGivenQty: number | string
  balanceQty: number | string
}

export interface ProductLoanTotals {
  totalIssued: number
  totalReceived: number
  totalBalance: number
}

export interface ChequeItem {
  chequeId?: number
  chequeNo: string
  chequeDate: string
  chequeAmount: number | string
  bankName: string
  chequeStatusId: number
  paymentChequeStatusName: string
}

export interface LCItem {
  piSystemId: number
  piNumber: string
  lcNumber?: string
  piAmount: number | string
  lifecycleName?: string
  piDate?: string
}

export interface TaxAitSummary {
  taxYear: string
  period: string
  totalInvoices: number
  totalTaxableBase: number
  totalVAT: number
  totalAIT: number
  vatPaid: number
  aitPaid: number
  vatBalance: number
  aitBalance: number
}

export interface TaxAitTransaction {
  invoiceDate: string
  invoiceNumber: string
  taxableBase: number | string
  vatAmount: number | string
  aitAmount: number | string
}

export interface CustomerInfo {
  customerId: number
  customerName: string
  customerAddress: string
  createdDate?: string
  empFirstName?: string
  empLastName?: string
  currentStatus?: string
  paymentMode?: string
  specialNote?: string
}
```

---

## 13. Legacy-to-V2 Component Mapping

### UI Component Translations

| Legacy (MUI) | V2 (Tailwind) |
|---|---|
| `<Paper sx={{ p: 3 }}>` | `<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">` |
| `<Card>` | `<div className="rounded-xl border border-gray-200 bg-white shadow-sm">` |
| `<Grid container spacing={2}>` | `<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">` |
| `<Grid item xs={12} md={6}>` | `<div>` (grid child) |
| `<Typography variant="h6">` | `<h2 className="text-lg font-semibold text-gray-900">` |
| `<Typography variant="body2">` | `<p className="text-sm text-gray-700">` |
| `<Typography variant="caption">` | `<p className="text-xs text-gray-500">` |
| `<Button variant="contained" color="primary">` | `<button className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white">` |
| `<Button variant="outlined">` | `<button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">` |
| `<Chip label={...} color="primary">` | `<span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">` |
| `<Table size="small">` | `<table className="w-full text-sm">` |
| `<TableHead>` | `<thead><tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">` |
| `<TableCell>` | `<td className="px-4 py-2">` |
| `<CircularProgress>` | `<Loader2 className="animate-spin" />` |
| `<Alert severity="error">` | `<div className="rounded-lg border border-red-200 bg-red-50 p-4">` |
| `<Alert severity="success">` | `<div className="rounded-lg border border-gray-200 bg-gray-50 p-4">` (green not in palette, use gray + icon) |
| `<Dialog>` | Custom fixed-position overlay (see existing modal pattern in SalesOrderInternalModal) |
| `<DialogTitle>` | `<div className="border-b border-gray-200 p-4">` |
| `<DialogContent>` | `<div className="overflow-y-auto p-4">` |
| `<TextField>` | `<input className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm">` |
| `<Select>` | `<select className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm">` |

### Icon Translations (MUI → Lucide)

| MUI Icon | Lucide Icon |
|---|---|
| `<PersonIcon>` | `<User>` |
| `<LocationOnIcon>` | `<MapPin>` |
| `<CalendarTodayIcon>` | `<Calendar>` |
| `<NoteIcon>` | `<StickyNote>` |
| `<PaymentIcon>` | `<CreditCard>` |
| `<AccountCircleIcon>` | `<UserCircle>` |
| `<TrendingUpIcon>` | `<TrendingUp>` |
| `<PaymentsIcon>` | `<Banknote>` |
| `<ScienceIcon>` | `<FlaskConical>` |
| `<ShoppingBagIcon>` | `<ShoppingBag>` |
| `<VisibilityIcon>` | `<Eye>` |
| `<InventoryIcon>` | `<Package>` |
| `<ExpandMoreIcon>` | `<ChevronDown>` |
| `<ExpandLessIcon>` | `<ChevronUp>` |
| `<AccountBalanceIcon>` | `<Landmark>` |
| `<SendIcon>` | `<Send>` |
| `<ArrowBackIcon>` | `<ArrowLeft>` |
| `<CheckCircleIcon>` | `<CheckCircle>` |
| `<SearchIcon>` | `<Search>` |
| `<DownloadIcon>` | `<Download>` |
| `<PictureAsPdf>` | `<FileText>` |
| `<Close>` | `<X>` |
| `<OpenInNew>` | `<ExternalLink>` |

---

## 14. Data Flow Diagram

```
User clicks "Review" button on SalesOrderListPage
  │
  ├── navigates to /sales-orders/:id/review
  │   └── state: { customerId } passed from list row
  │
  ▼
ReviewCockpitPage
  ├── useStockOutDetail(orderId)  ─── fallback for customerId
  │
  ├── CockpitActions
  │   └── useBulkEscalate() ──── POST /StockOut/SubmitForMapItemAndBatch
  │
  ├── CustomerBasicInfo
  │   └── GET /Customer/GetCustomerDetails/{customerId}
  │
  ├── LifetimeSummary (3 parallel queries)
  │   ├── GET /Report/GetCustomerCreditSaleSummery  (since 2023-12-01)
  │   ├── GET /Dashboard/SampleIssueQuantity
  │   └── GET /Dashboard/TopProducts?topCount=3
  │
  ├── CreditSection (2 parallel queries)
  │   ├── GET /Report/GetCustomerCreditSaleSummery  (90-day window)
  │   ├── GET /StockOut/GetStockOutOrderDetails/{orderId}
  │   └── CreditDetailsModal (on demand)
  │       └── GET /Report/GetCustomerCreditHistory  (180-day window)
  │
  ├── ProductLoanSection
  │   ├── GET /Report/GetCustomerLoanSummery/{customerId}/0
  │   └── ProductLoanDetailsModal (on demand)
  │       └── GET /Report/GetCustomerLoanDetails/{customerId}/{productId}
  │
  ├── ChequeSection
  │   ├── GET /Report/GetCustomerChequeReport?partnerId={id}&chequeStatusId=1
  │   └── ChequeDetailsModal (on demand)
  │       └── GET /Report/GetCustomerChequeReport?partnerId={id}
  │
  ├── LCSection
  │   ├── GET /LCTracking/GetPiLcDocPaymentInfoByFilters?customerId={id}
  │   └── LCDetailsModal (on demand)
  │       └── GET /LCTracking/GetPiLcDocPaymentInfoByFilters?piSystemId={id}
  │
  └── TaxAitSection (2 parallel queries)
      ├── GET /Report/GetTaxAitDetails  (current tax year)
      ├── GET /CustomerPayment/GetPaymentSummary  (current tax year)
      └── TaxAitDetailsModal (on demand)
          └── Same APIs with custom date range
```

---

## 15. Key Gotchas & Constraints

### Must Follow

1. **Gray-only palette** — The v2 project strictly uses `gray-*` colors. The legacy cockpit uses blue, green, orange, purple accents. Convert these to gray-* variants or discuss with the team about allowing accent colors for metric cards only.

2. **No MUI** — All MUI components must be converted to Tailwind equivalents. No `@mui/material` imports in v2.

3. **apiClient, not fetch** — Legacy uses raw `fetch()`. V2 must use the `apiClient` axios instance from `@/config/env`.

4. **No Redux** — Legacy uses `useSelector`/`useDispatch` for customer details and escalation state. V2 uses TanStack Query hooks.

5. **TypeScript strict** — All components must be fully typed. No `any` (except in API response parsing where types are not yet known).

6. **customerId passing** — The legacy code requires `customerId` from `location.state`. If not present, it shows an error. The v2 version should be more robust: use `useStockOutDetail(orderId)` to extract `soCustomerId` as a fallback.

7. **Tax Year Calculation** — Tax year runs July 1 to June 30. The `getCurrentTaxYearDates()` logic must be preserved exactly.

8. **API Response Envelope** — All APIs return `{ statusCode, message, dataObj }`. Always check `statusCode === 200`.

9. **ExcelJS export** — Use the existing `utils/exportExcel.ts` utility. Do NOT add jsPDF for PDF export (legacy uses it, but v2 can use browser print or skip PDF).

10. **Modal pattern** — Use the same modal pattern as `SalesOrderInternalModal.tsx` — fixed overlay with `bg-black/40` backdrop.

### Data Quirks

- **Credit History API** returns `transctionInfo` (note the typo — not `transactionInfo`)
- **Cheque API** uses `partnerId` parameter (not `customerId`)
- **LC API** returns `piAmount` as the main amount field
- **Sample Quantity API** returns a raw number (not wrapped in `dataObj`)
- **Product Loan API** uses positional URL: `/GetCustomerLoanSummery/{customerId}/0` (the `/0` means "all products")

### StockOutListRow — Verify soCustomerId

Confirm that the `StockOutListRow` type in `types/stockOut.ts` includes `soCustomerId`. If not:
1. Add `soCustomerId?: number | null` to the type
2. Verify the list API response includes this field

If the API does NOT return `soCustomerId` in the list grid, use Option B: fetch order detail on the Review page to get the customerId.

---

## 16. Step-by-Step Checklist

### Phase 1: Types & Hooks (Foundation)
- [ ] Create `types/reviewCockpit.ts` with all interfaces
- [ ] Create `hooks/useReviewCockpit.ts` with all TanStack Query hooks
- [ ] Verify `StockOutListRow` includes `soCustomerId` field
- [ ] Test hooks with browser DevTools (React Query Devtools)

### Phase 2: List Page Button (Entry Point)
- [ ] Modify `renderRowActions()` in `SalesOrderListPage.tsx`:
  - Add `customerId` parameter to function signature
  - Add `Review` Link button before `Escalate` button
  - Pass `customerId` in call site from `row.soCustomerId`
- [ ] Test: "Review" button appears in standard mode, navigates to correct URL

### Phase 3: Main Page
- [ ] Create `pages/sales-orders/ReviewCockpitPage.tsx`
- [ ] Add route in `router/AppRouter.tsx`: `sales-orders/:id/review` → `ReviewCockpitPage`
- [ ] Test: Page renders with orderId, resolves customerId

### Phase 4: Core Sections (one at a time)
- [ ] Create `review-cockpit/CockpitActions.tsx` — escalation action bar
- [ ] Create `review-cockpit/CustomerBasicInfo.tsx` — customer profile
- [ ] Create `review-cockpit/LifetimeSummary.tsx` — 4 metric cards
- [ ] Create `review-cockpit/CreditSection.tsx` — 90-day credit table
- [ ] Create `review-cockpit/ProductLoanSection.tsx` — product loan table
- [ ] Create `review-cockpit/ChequeSection.tsx` — pending cheques
- [ ] Create `review-cockpit/LCSection.tsx` — LC/PI summary
- [ ] Create `review-cockpit/TaxAitSection.tsx` — tax/AIT summary

### Phase 5: Detail Modals
- [ ] Create `review-cockpit/CreditDetailsModal.tsx` — 180-day transaction modal
- [ ] Create `review-cockpit/ProductLoanDetailsModal.tsx` — loan detail modal
- [ ] Create `review-cockpit/ChequeDetailsModal.tsx` — all cheques modal
- [ ] Create `review-cockpit/LCDetailsModal.tsx` — LC detail modal
- [ ] Create `review-cockpit/TaxAitDetailsModal.tsx` — tax detail modal

### Phase 6: Polish & Testing
- [ ] Test escalation from cockpit (CockpitActions → useBulkEscalate)
- [ ] Test all 6 cockpit sections load data correctly
- [ ] Test all 5 detail modals open and display data
- [ ] Test Excel export from CreditDetailsModal
- [ ] Test clickable invoice numbers → SalesOrderInternalModal
- [ ] Test navigation: Back button returns to `/sales-orders`
- [ ] Test error states: missing customerId, API failures, empty data
- [ ] Verify TypeScript: `npm run build` passes with no errors
- [ ] Test on different screen sizes (responsive grid layout)

---

## Appendix A: Legacy CockpitActions Escalation Dialog Fields

The legacy escalation dialog collects optional metadata before escalating:

| Field | Type | Required | Notes |
|---|---|---|---|
| Escalation Reason | Select | No | Options: Credit Limit Exceeded, Payment History Concern, Documentation Pending, Risk Assessment Required, Management Review Needed, Other |
| Priority | Select | No | High, Medium (default), Low |
| Additional Notes | Textarea | No | Free text for operations team |

**Note:** These fields are collected in the UI but **not sent to the API**. The actual `escalateSalesOrderInternal()` action only sends `[orderId]`. The V2 implementation can include these fields for future API support or skip them for simplicity.

## Appendix B: Currency & Number Formatting

```typescript
// Format currency (matches legacy)
export function formatCurrency(amount: number | string | null | undefined): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

// Format large numbers (1000+ → "1.0K")
export function formatNumber(value: number | string | null | undefined): string {
  const num = Number(value) || 0
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toFixed(1)
}

// Format quantity (2 decimal places)
export function formatQuantity(quantity: number | string | null | undefined): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(quantity) || 0)
}

// Format date for display
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}
```

## Appendix C: Tax Year Date Calculation

```typescript
export function getCurrentTaxYearDates() {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1 // 1-12

  let startYear: number
  let endYear: number

  if (currentMonth >= 7) {
    // July to December → current year start
    startYear = currentYear
    endYear = currentYear + 1
  } else {
    // January to June → previous year start
    startYear = currentYear - 1
    endYear = currentYear
  }

  return {
    startDate: `${startYear}-07-01`,
    endDate: `${endYear}-06-30`,
    taxYear: `${startYear}-${endYear}`,
    displayPeriod: `1st July ${startYear} to 30th June ${endYear}`,
  }
}
```

## Appendix D: Cheque Status Mapping

| Status ID | Name | Color (Legacy) | V2 Tailwind |
|---|---|---|---|
| 1 | Pending | Orange | `text-gray-600` + pending icon |
| 2 | Cleared | Green | `text-gray-900` + check icon |
| 3 | Bounced | Red | `text-gray-900 bg-gray-100` + alert icon |
| 4 | Swap | Blue | `text-gray-600` |
| 5 | Expired | Red | `text-gray-500` + strikethrough |
| 6 | Returned | Grey | `text-gray-400` |
| 7 | On Hold | Orange | `text-gray-600` + clock icon |

## Appendix E: LC Lifecycle Color Mapping

The legacy code uses specific colors for LC lifecycle stages. In V2, convert to gray-* with descriptive labels:

| Lifecycle | Legacy Color | V2 Approach |
|---|---|---|
| Waiting for LC | Yellow | `bg-gray-100 text-gray-600` |
| LC Transmitted | Blue | `bg-gray-200 text-gray-700` |
| Waiting for Doc Submission | Light Blue | `bg-gray-100 text-gray-600` |
| Document submitted | Light Green | `bg-gray-200 text-gray-700` |
| Doc accepted by customer | Green | `bg-gray-300 text-gray-800` |
| Doc Submitted to Beneficiary Bank | Dark Green | `bg-gray-300 text-gray-800` |
| Doc Transmitted to Issuer Bank | Purple | `bg-gray-400 text-gray-900` |
| Doc Accepted by issuer bank | Dark Purple | `bg-gray-400 text-gray-900` |
| Payment Received | Cyan | `bg-gray-900 text-white` |
| AIT received | Orange | `bg-gray-700 text-white` |
| Product Delivered | Grey | `bg-gray-200 text-gray-500` |
