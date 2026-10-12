# Dashboard Plan — v2-octopi

**Date:** 2026-04-27

---

## Overview

Replace the current static placeholder `DashboardPage.tsx` with a role-aware dashboard system.
Each of the 8 roles gets a dedicated dashboard view. Roles 1 (Management) and 2 (Super Admin) share
the same full executive dashboard. Role 3 (Admin) sees a scoped-down version. Roles 4–8 each get an
operational view tailored to their daily function.

A date range selector (This Month / Last Month / This Year) at the top of each dashboard controls
all data widgets on that page.

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Charts | **Recharts** | Most popular React chart lib, composable, Tailwind-friendly, tree-shakeable |
| Server state | **TanStack Query** (already installed) | Consistent with rest of app |
| UI components | **Tailwind CSS** (already installed) | No extra UI lib needed |
| Auth / Role detection | `jwtDecode` on `token` from `localStorage.userInfo` | Already used in `authBridge.ts` |
| Date utilities | **Native `Date` JS** | Simple month/year ranges need no library |
| State | **React `useState`** per dashboard | Date range filter is local; no global store needed |

### Recharts Components Used

| Component | Used for |
|---|---|
| `BarChart` + `Bar` | Monthly sales vs purchases vs payments comparison |
| `LineChart` + `Line` | Sales / payment trend over selected period |
| `PieChart` + `Pie` + `Cell` | Cheque status breakdown, stock-in status, delivery status |
| `ResponsiveContainer` | Wraps all charts for fluid width |
| `Tooltip`, `Legend`, `XAxis`, `YAxis`, `CartesianGrid` | Standard chart accessories |

---

## Role Dashboard Map

| Role ID | Role Name | Dashboard Component | Notes |
|---|---|---|---|
| 1 | Management | `ManagementDashboard` | Full executive view |
| 2 | Super Admin | `ManagementDashboard` | Same component as Management |
| 3 | Admin | `AdminDashboard` | Management subset — no credit totals or top-customer chart |
| 4 | Controller | `ControllerDashboard` | Operational — stock in/out, delivery, product handling |
| 5 | Operator | `OperatorDashboard` | Workflow queue counts + clickable work tiles |
| 6 | Delivery | `DeliveryDashboard` | Delivery-focused — today's runs, conveyance, status |
| 7 | Front Desk | `FrontDeskDashboard` | Walk-in customer handling — quick-action tiles + 3 KPIs |
| 8 | Delivery Point | `DeliveryPointDashboard` | Full operations (same widgets as Controller) |

---

## Dashboard Layouts

### 1. Management / Super Admin Dashboard

**KPI Cards (date-range-aware):**
- Today's Orders Count + Revenue
- Outstanding Customer Credit Total (all-time)
- Total Stock-In Value (selected range)
- Product Loan Balance (units)
- Cheque Pending Count + Amount

**Charts:**
1. **Monthly Purchase vs Sales vs Payment Bar Chart** — full year, 3 series
   - Hook: `useMonthlyPurchaseSalesPayment()` ✓ already exists
2. **Sales Trend Line** — for selected date range
   - Hook: `useSalesPaymentSummary(start, end, 'monthly', 'sales')` ✓ already exists
3. **Cheque Status Pie Chart** — pending / cleared / bounced
   - Hook: `useGetChequeStatusSummary(start, end)` — **new endpoint**
4. **Top 10 Customers by Sales** — horizontal bar chart
   - Hook: `useGetTopCustomers(start, end, limit=10)` — **new endpoint**
5. **Customer Product Loan & Stock Analysis** — loan issued vs received vs balance
   - Hook: `useProductLoanReport` ✓ already exists

---

### 2. Admin Dashboard

Same as Management but without:
- Outstanding Customer Credit KPI
- Top Customers chart
- Cheque Status Pie Chart

Shows: Orders KPIs + Monthly bar chart + Sales trend line + Stock-in summary

---

### 3. Operator Dashboard

**Purpose:** Current state of the operational work queue.

**KPI Cards (live state — no date filter):**
- Pending Sales Orders
- Awaiting Confirm-Qty (stock-in)
- Awaiting Packaging
- Escalation Queue Count
- Price Update Pending Count

**Clickable Work Tiles (link to the relevant list page):**
- `/sales-orders` — Pending Orders
- `/stock-in/confirm-qty` — Confirm Quantity
- `/sales-orders/packages` — Packaging Queue
- `/sales-orders/escalations` — Escalation Queue
- `/stock-in/price-update` — Price Update Queue

**Hook:** `useGetStockQueueSummary()` — **new endpoint**
Returns: `{ pendingOrders, confirmQtyPending, packagingPending, priceUpdatePending, escalationPending }`

---

### 4. Delivery Dashboard

**KPI Cards:**
- Assigned Deliveries Today
- Completed Today
- Pending / In-Transit
- Total Conveyance Trips

**Charts:**
1. Delivery Status Pie — assigned / completed / pending
2. Daily Delivery Trend Line — last 30 days

**Hooks:**
- `useGetDeliverySummary(start, end)` — **new endpoint**
- `useDeliveryReport(start, end)` ✓ already exists
- `useDeliveryConveyance` ✓ already exists

---

### 5. Controller Dashboard (Operational)

**KPI Cards:**
- Total Stock-In value + count (selected range)
- Total Stock-Out (selected range)
- Pending Deliveries
- Product Loan Balance

**Charts:**
1. Monthly Purchase vs Sales Bar Chart
2. Stock-In Status Pie — pending / confirmed / price-update
   - Hook: `useStockInSummary(start, end)` ✓ already exists
3. Product Loan Balance by Product — horizontal bar chart

---

### 6. Front Desk Dashboard

**Quick Action Tiles (primary content):**
- New Sales Order → `/sales-orders/create`
- Customer Lookup → `/customers/lookup`
- New Quotation → `/quotations`
- Customer Transactions → `/customers/transactions`

**KPI Cards:**
- Today's Orders Created
- Open Quotations Count
- Pending Cheques from Customers

**No charts** — action-oriented role.

---

### 7. Delivery Point Dashboard

Same widgets as **Controller Dashboard** — full operational view.

---

## New Backend API Endpoints Required

All return `ApiResponse<T>` matching the existing `{ code, dataObj, message }` wrapper.
All date params use `YYYY-MM-DD` format.

| # | Endpoint | Params | Response shape |
|---|---|---|---|
| 1 | `GET /Dashboard/GetOrderKPI` | `startDate`, `endDate` | `{ totalOrders, totalRevenue, todayOrders, todayRevenue, pendingOrders }` |
| 2 | `GET /Dashboard/GetChequeStatusSummary` | `startDate`, `endDate` | `[{ statusId, statusName, count, totalAmount }]` |
| 3 | `GET /Dashboard/GetCreditSummary` | *(none — all-time)* | `{ totalOutstanding, affectedCustomers }` |
| 4 | `GET /Dashboard/GetStockQueueSummary` | *(none — live state)* | `{ pendingOrders, confirmQtyPending, packagingPending, priceUpdatePending, escalationPending }` |
| 5 | `GET /Dashboard/GetDeliverySummary` | `startDate`, `endDate` | `{ todayAssigned, todayCompleted, pendingCount, conveyanceCount }` |
| 6 | `GET /Dashboard/GetTopCustomers` | `startDate`, `endDate`, `limit` | `[{ customerId, customerName, totalSales, orderCount }]` |
| 7 | `GET /Dashboard/GetProductLoanSummary` | `startDate`, `endDate` | `{ totalIssued, totalReceived, balanceQty, topProducts: [...] }` |

---

## Existing Hooks Reused (No Change Required)

| Hook | Used in |
|---|---|
| `useMonthlyPurchaseSalesPayment()` | Management, Admin, Controller bar charts |
| `useSalesPaymentSummary(start, end, intervalType, dataType)` | Management, Admin trend line |
| `useStockInSummary(start, end, statusId)` | Management, Controller, Delivery Point |
| `useDeliveryReport(start, end)` | Delivery, Controller, Delivery Point |
| `useDeliveryConveyance(start, end)` | Delivery dashboard |
| `useProductLoanReport(start, end)` | Management, Controller, Delivery Point |

---

## Role ID Detection

Add a new exported function to `src/auth/authBridge.ts`:

```ts
export function getCurrentUserRoleId(): number | null {
  const token = getAccessToken()
  if (!token) return null
  try {
    const decoded = jwtDecode<{ UserRoleId?: string | number }>(token)
    const id = Number(decoded.UserRoleId)
    return Number.isFinite(id) ? id : null
  } catch {
    return null
  }
}
```

> **⚠️ Note:** The exact JWT claim name (`UserRoleId`, `RoleId`, `role`) must be verified by
> running `console.log(jwtDecode(token))` in the browser console after a real login.
> The implementation uses `UserRoleId` to match the existing `UserMenus` / `UserMenuPlainList`
> claim naming convention in the same token.

---

## Date Range Helper

```ts
type DateRangeSelection = 'this-month' | 'last-month' | 'this-year'
type DateRange = { startDate: string; endDate: string; label: string }

export function getDateRange(selection: DateRangeSelection): DateRange {
  const now = new Date()
  if (selection === 'this-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { startDate: toISO(start), endDate: toISO(end), label: 'This Month' }
  }
  if (selection === 'last-month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end   = new Date(now.getFullYear(), now.getMonth(), 0)
    return { startDate: toISO(start), endDate: toISO(end), label: 'Last Month' }
  }
  return { startDate: `${now.getFullYear()}-01-01`, endDate: `${now.getFullYear()}-12-31`, label: 'This Year' }
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}
```

---

## File Structure

```
src/pages/dashboard/
  DashboardRouter.tsx              ← reads roleId, renders correct dashboard
  ManagementDashboard.tsx
  AdminDashboard.tsx
  OperatorDashboard.tsx
  DeliveryDashboard.tsx
  ControllerDashboard.tsx
  FrontDeskDashboard.tsx
  DeliveryPointDashboard.tsx
  shared/
    KPICard.tsx                    ← reusable metric tile
    DateRangeSelector.tsx          ← This Month / Last Month / This Year
    ChartContainer.tsx             ← ResponsiveContainer wrapper with title + loading state

src/hooks/
  useDashboard.ts                  ← all 7 new dashboard API hooks

src/auth/
  authBridge.ts                    ← add getCurrentUserRoleId()

src/pages/
  DashboardPage.tsx                ← replace static content with <DashboardRouter />
```

---

## Implementation Phases

### Phase 1 — Foundation
1. `npm install recharts`
2. Add `getCurrentUserRoleId()` to `authBridge.ts` *(verify JWT claim name first)*
3. Create `src/hooks/useDashboard.ts` with stubs for all 7 new hooks
4. Create shared components: `KPICard`, `DateRangeSelector`, `ChartContainer`
5. Create `DashboardRouter.tsx` + update `DashboardPage.tsx`

### Phase 2 — Management + Admin (highest business value)
6. Build `ManagementDashboard.tsx` — real data from `useMonthlyPurchaseSalesPayment()`; stubs for new endpoints
7. Build `AdminDashboard.tsx` as a subset

### Phase 3 — Operational Dashboards
8. `OperatorDashboard.tsx` — queue tiles + `GetStockQueueSummary`
9. `ControllerDashboard.tsx` + `DeliveryPointDashboard.tsx`
10. `DeliveryDashboard.tsx`

### Phase 4 — Front Desk + QA
11. `FrontDeskDashboard.tsx`
12. Role smoke-test for all 8 roles

---

## Key Decisions

- Management + Super Admin share one component — no duplication
- Admin is a separate component, not a prop variant (different widget set)
- Front Desk has no charts — action-first design
- Operator has no charts — queue counts + direct work links
- Date range filter is local `useState` per dashboard component
- No real-time push — TanStack Query `refetchOnWindowFocus` is sufficient for v1
- Drill-down chart interactivity (click bar → filtered list) deferred to v2

---

## What the Backend Team Needs

Share the 7 endpoint definitions above. Key constraints:
- All use existing `ApiResponse<T>` wrapper
- All date params use `YYYY-MM-DD`
- `GetStockQueueSummary` and `GetCreditSummary` require no date params (live/all-time state)
- `GetOrderKPI` aggregates from existing sales order data — same source as the sales reports
# Dashboard Plan — v2-octopi

**Date:** 2026-04-27

---

## Overview

Replace the current static placeholder `DashboardPage.tsx` with a role-aware dashboard system.
Each of the 8 roles gets a dedicated dashboard view. Roles 1 (Management) and 2 (Super Admin) share
the same full executive dashboard. Role 3 (Admin) sees a scoped-down version. Roles 4–8 each get an
operational view tailored to their daily function.

A date range selector (This Month / Last Month / This Year) at the top of each dashboard controls
all data widgets on that page.

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Charts | **Recharts** | Most popular React chart lib, composable, Tailwind-friendly, tree-shakeable |
| Server state | **TanStack Query** (already installed) | Consistent with rest of app |
| UI components | **Tailwind CSS** (already installed) | No extra UI lib needed |
| Auth / Role detection | `jwtDecode` on `token` from `localStorage.userInfo` | Already used in `authBridge.ts` |
| Date utilities | **Native `Date` JS** | Simple month/year ranges need no library |
| State | **React `useState`** per dashboard | Date range filter is local; no global store needed |

### Recharts Components Used

| Component | Used for |
|---|---|
| `BarChart` + `Bar` | Monthly sales vs purchases vs payments comparison |
| `LineChart` + `Line` | Sales / payment trend over selected period |
| `PieChart` + `Pie` + `Cell` | Cheque status breakdown, stock-in status, delivery status |
| `ResponsiveContainer` | Wraps all charts for fluid width |
| `Tooltip`, `Legend`, `XAxis`, `YAxis`, `CartesianGrid` | Standard chart accessories |

---

## Role Dashboard Map

| Role ID | Role Name | Dashboard Component | Notes |
|---|---|---|---|
| 1 | Management | `ManagementDashboard` | Full executive view |
| 2 | Super Admin | `ManagementDashboard` | Same component as Management |
| 3 | Admin | `AdminDashboard` | Management subset — no credit totals or top-customer chart |
| 4 | Controller | `ControllerDashboard` | Operational — stock in/out, delivery, product handling |
| 5 | Operator | `OperatorDashboard` | Workflow queue counts + clickable work tiles |
| 6 | Delivery | `DeliveryDashboard` | Delivery-focused — today's runs, conveyance, status |
| 7 | Front Desk | `FrontDeskDashboard` | Walk-in customer handling — quick-action tiles + 3 KPIs |
| 8 | Delivery Point | `DeliveryPointDashboard` | Full operations (same widgets as Controller) |

---

## Dashboard Layouts

### 1. Management / Super Admin Dashboard

**KPI Cards (date-range-aware):**
- Today's Orders Count + Revenue
- Outstanding Customer Credit Total (all-time)
- Total Stock-In Value (selected range)
- Product Loan Balance (units)
- Cheque Pending Count + Amount

**Charts:**
1. **Monthly Purchase vs Sales vs Payment Bar Chart** — full year, 3 series
   - Hook: `useMonthlyPurchaseSalesPayment()` ✓ already exists
2. **Sales Trend Line** — for selected date range
   - Hook: `useSalesPaymentSummary(start, end, 'monthly', 'sales')` ✓ already exists
3. **Cheque Status Pie Chart** — pending / cleared / bounced
   - Hook: `useGetChequeStatusSummary(start, end)` — **new endpoint**
4. **Top 10 Customers by Sales** — horizontal bar chart
   - Hook: `useGetTopCustomers(start, end, limit=10)` — **new endpoint**
5. **Customer Product Loan & Stock Analysis** — loan issued vs received vs balance
   - Hook: `useProductLoanReport` ✓ already exists

---

### 2. Admin Dashboard

Same as Management but without:
- Outstanding Customer Credit KPI
- Top Customers chart
- Cheque Status Pie Chart

Shows: Orders KPIs + Monthly bar chart + Sales trend line + Stock-in summary

---

### 3. Operator Dashboard

**Purpose:** Current state of the operational work queue.

**KPI Cards (live state — no date filter):**
- Pending Sales Orders
- Awaiting Confirm-Qty (stock-in)
- Awaiting Packaging
- Escalation Queue Count
- Price Update Pending Count

**Clickable Work Tiles (link to the relevant list page):**
- `/sales-orders` — Pending Orders
- `/stock-in/confirm-qty` — Confirm Quantity
- `/sales-orders/packages` — Packaging Queue
- `/sales-orders/escalations` — Escalation Queue
- `/stock-in/price-update` — Price Update Queue

**Hook:** `useGetStockQueueSummary()` — **new endpoint**
Returns: `{ pendingOrders, confirmQtyPending, packagingPending, priceUpdatePending, escalationPending }`

---

### 4. Delivery Dashboard

**KPI Cards:**
- Assigned Deliveries Today
- Completed Today
- Pending / In-Transit
- Total Conveyance Trips

**Charts:**
1. Delivery Status Pie — assigned / completed / pending
2. Daily Delivery Trend Line — last 30 days

**Hooks:**
- `useGetDeliverySummary(start, end)` — **new endpoint**
- `useDeliveryReport(start, end)` ✓ already exists
- `useDeliveryConveyance` ✓ already exists

---

### 5. Controller Dashboard (Operational)

**KPI Cards:**
- Total Stock-In value + count (selected range)
- Total Stock-Out (selected range)
- Pending Deliveries
- Product Loan Balance

**Charts:**
1. Monthly Purchase vs Sales Bar Chart
2. Stock-In Status Pie — pending / confirmed / price-update
   - Hook: `useStockInSummary(start, end)` ✓ already exists
3. Product Loan Balance by Product — horizontal bar chart

---

### 6. Front Desk Dashboard

**Quick Action Tiles (primary content):**
- New Sales Order → `/sales-orders/create`
- Customer Lookup → `/customers/lookup`
- New Quotation → `/quotations`
- Customer Transactions → `/customers/transactions`

**KPI Cards:**
- Today's Orders Created
- Open Quotations Count
- Pending Cheques from Customers

**No charts** — action-oriented role.

---

### 7. Delivery Point Dashboard

Same widgets as **Controller Dashboard** — full operational view.

---

## New Backend API Endpoints Required

All return `ApiResponse<T>` matching the existing `{ code, dataObj, message }` wrapper.
All date params use `YYYY-MM-DD` format.

| # | Endpoint | Params | Response shape |
|---|---|---|---|
| 1 | `GET /Dashboard/GetOrderKPI` | `startDate`, `endDate` | `{ totalOrders, totalRevenue, todayOrders, todayRevenue, pendingOrders }` |
| 2 | `GET /Dashboard/GetChequeStatusSummary` | `startDate`, `endDate` | `[{ statusId, statusName, count, totalAmount }]` |
| 3 | `GET /Dashboard/GetCreditSummary` | *(none — all-time)* | `{ totalOutstanding, affectedCustomers }` |
| 4 | `GET /Dashboard/GetStockQueueSummary` | *(none — live state)* | `{ pendingOrders, confirmQtyPending, packagingPending, priceUpdatePending, escalationPending }` |
| 5 | `GET /Dashboard/GetDeliverySummary` | `startDate`, `endDate` | `{ todayAssigned, todayCompleted, pendingCount, conveyanceCount }` |
| 6 | `GET /Dashboard/GetTopCustomers` | `startDate`, `endDate`, `limit` | `[{ customerId, customerName, totalSales, orderCount }]` |
| 7 | `GET /Dashboard/GetProductLoanSummary` | `startDate`, `endDate` | `{ totalIssued, totalReceived, balanceQty, topProducts: [...] }` |

---

## Existing Hooks Reused (No Change Required)

| Hook | Used in |
|---|---|
| `useMonthlyPurchaseSalesPayment()` | Management, Admin, Controller bar charts |
| `useSalesPaymentSummary(start, end, intervalType, dataType)` | Management, Admin trend line |
| `useStockInSummary(start, end, statusId)` | Management, Controller, Delivery Point |
| `useDeliveryReport(start, end)` | Delivery, Controller, Delivery Point |
| `useDeliveryConveyance(start, end)` | Delivery dashboard |
| `useProductLoanReport(start, end)` | Management, Controller, Delivery Point |

---

## Role ID Detection

Add a new exported function to `src/auth/authBridge.ts`:

```ts
export function getCurrentUserRoleId(): number | null {
  const token = getAccessToken()
  if (!token) return null
  try {
    const decoded = jwtDecode<{ UserRoleId?: string | number }>(token)
    const id = Number(decoded.UserRoleId)
    return Number.isFinite(id) ? id : null
  } catch {
    return null
  }
}
```

> **⚠️ Note:** The exact JWT claim name (`UserRoleId`, `RoleId`, `role`) must be verified by
> running `console.log(jwtDecode(token))` in the browser console after a real login.
> The implementation uses `UserRoleId` to match the existing `UserMenus` / `UserMenuPlainList`
> claim naming convention in the same token.

---

## Date Range Helper

```ts
type DateRangeSelection = 'this-month' | 'last-month' | 'this-year'
type DateRange = { startDate: string; endDate: string; label: string }

export function getDateRange(selection: DateRangeSelection): DateRange {
  const now = new Date()
  if (selection === 'this-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { startDate: toISO(start), endDate: toISO(end), label: 'This Month' }
  }
  if (selection === 'last-month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end   = new Date(now.getFullYear(), now.getMonth(), 0)
    return { startDate: toISO(start), endDate: toISO(end), label: 'Last Month' }
  }
  return { startDate: `${now.getFullYear()}-01-01`, endDate: `${now.getFullYear()}-12-31`, label: 'This Year' }
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}
```

---

## File Structure

```
src/pages/dashboard/
  DashboardRouter.tsx              ← reads roleId, renders correct dashboard
  ManagementDashboard.tsx
  AdminDashboard.tsx
  OperatorDashboard.tsx
  DeliveryDashboard.tsx
  ControllerDashboard.tsx
  FrontDeskDashboard.tsx
  DeliveryPointDashboard.tsx
  shared/
    KPICard.tsx                    ← reusable metric tile
    DateRangeSelector.tsx          ← This Month / Last Month / This Year
    ChartContainer.tsx             ← ResponsiveContainer wrapper with title + loading state

src/hooks/
  useDashboard.ts                  ← all 7 new dashboard API hooks

src/auth/
  authBridge.ts                    ← add getCurrentUserRoleId()

src/pages/
  DashboardPage.tsx                ← replace static content with <DashboardRouter />
```

---

## Implementation Phases

### Phase 1 — Foundation
1. `npm install recharts`
2. Add `getCurrentUserRoleId()` to `authBridge.ts` *(verify JWT claim name first)*
3. Create `src/hooks/useDashboard.ts` with stubs for all 7 new hooks
4. Create shared components: `KPICard`, `DateRangeSelector`, `ChartContainer`
5. Create `DashboardRouter.tsx` + update `DashboardPage.tsx`

### Phase 2 — Management + Admin (highest business value)
6. Build `ManagementDashboard.tsx` — real data from `useMonthlyPurchaseSalesPayment()`; stubs for new endpoints
7. Build `AdminDashboard.tsx` as a subset

### Phase 3 — Operational Dashboards
8. `OperatorDashboard.tsx` — queue tiles + `GetStockQueueSummary`
9. `ControllerDashboard.tsx` + `DeliveryPointDashboard.tsx`
10. `DeliveryDashboard.tsx`

### Phase 4 — Front Desk + QA
11. `FrontDeskDashboard.tsx`
12. Role smoke-test for all 8 roles

---

## Key Decisions

- Management + Super Admin share one component — no duplication
- Admin is a separate component, not a prop variant (different widget set)
- Front Desk has no charts — action-first design
- Operator has no charts — queue counts + direct work links
- Date range filter is local `useState` per dashboard component
- No real-time push — TanStack Query `refetchOnWindowFocus` is sufficient for v1
- Drill-down chart interactivity (click bar → filtered list) deferred to v2

---

## What the Backend Team Needs

Share the 7 endpoint definitions above. Key constraints:
- All use existing `ApiResponse<T>` wrapper
- All date params use `YYYY-MM-DD`
- `GetStockQueueSummary` and `GetCreditSummary` require no date params (live/all-time state)
- `GetOrderKPI` aggregates from existing sales order data — same source as the sales reports
