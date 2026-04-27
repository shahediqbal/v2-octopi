# Reports Module — V2 Migration Plan

> **Purpose:** Comprehensive implementation guide for an AI agent to migrate all remaining legacy report pages into the `v2-octopi` project. Follow every pattern, convention, and structure exactly. Refer to `AI_DEVELOPER_GUIDE.md` for base rules; this document provides report-specific blueprints.

---

## TABLE OF CONTENTS

1. [Migration Status Matrix](#1-migration-status-matrix)
2. [V2 Report Architecture — Canonical Pattern](#2-v2-report-architecture--canonical-pattern)
3. [Shared Infrastructure Already Built](#3-shared-infrastructure-already-built)
4. [Report Blueprints — GROUP A: Table + Export Reports (Simple)](#4-group-a-table--export-reports-simple)
5. [Report Blueprints — GROUP B: Table + Export Reports (Standard)](#5-group-b-table--export-reports-standard)
6. [Report Blueprints — GROUP C: Interactive Table + Modal Reports](#6-group-c-interactive-table--modal-reports)
7. [Report Blueprints — GROUP D: Charts & Dashboard](#7-group-d-charts--dashboard)
8. [Report Blueprints — GROUP E: Operational Pages (Non-Report)](#8-group-e-operational-pages-non-report)
9. [Shared Components to Build](#9-shared-components-to-build)
10. [Implementation Sequence](#10-implementation-sequence)
11. [Routing & Sidebar Plan](#11-routing--sidebar-plan)
12. [File Checklist Per Report](#12-file-checklist-per-report)
13. [Testing Strategy](#13-testing-strategy)

---

## 1. Migration Status Matrix

| # | Legacy Route | Report Name | V2 Status | V2 Route |
|---|---|---|---|---|
| 1 | `/report/payment` | Payment Report | ✅ **DONE** | `/reports/payment` |
| 2 | `/report/mapped` | Mapping Report | ✅ **DONE** | `/reports/mapping` |
| 3 | `/report/sales` | Sales Report | ✅ **DONE** | `/reports/sales` |
| 4 | `/report/packedbyreport` | Repacking Packed By | ✅ **DONE** | `/reports/repacking-packed-by` |
| 5 | `/report/productout` | Product Out Report | ✅ **DONE** (admin variant) | `/reports/product-out` |
| 6 | `/report/delivery` | Delivery Report | ⚠️ **PLACEHOLDER** | `/reports/delivery` |
| 7 | `/report/delivery-conveyance` | Delivery Conveyance | 🔴 **TODO** | `/reports/delivery-conveyance` |
| 8 | `/report/pending-and-cancel-report` | Pending & Cancel | 🔴 **TODO** | `/reports/pending-cancel` |
| 9 | `/report/daily-invoice-tracking` | Daily Invoice Tracking | 🔴 **TODO** | `/reports/daily-invoice-tracking` |
| 10 | `/report/productloandetails` | Product Loan Details | 🔴 **TODO** | `/reports/product-loan` |
| 11 | `/report/stockoutbatchreport` | StockOut Batch Report | 🔴 **TODO** | `/reports/stockout-batch` |
| 12 | `/report/stockinbatchreport` | StockIn Batch Report | 🔴 **TODO** | `/reports/stockin-batch` |
| 13 | `/report/customercreditreport` | Customer Credit Report | 🔴 **TODO** | `/reports/customer-credit` |
| 14 | `/report/salesnpayment` | Sales & Payment Dashboard | 🔴 **TODO** | `/reports/sales-payment-dashboard` |
| 15 | `/report/loanreports` | Loan Reports | 🔴 **TODO** | `/reports/loan` |
| 16 | `/report/purchasepricehistory` | Purchase Price History | 🔴 **TODO** | `/reports/purchase-price-history` |
| 17 | `/report/dashboardlive` | Dashboard Live | 🔴 **SKIP** | — |
| 18 | `/report/productoutadmin` | Product Out (Admin) | ✅ **DONE** (same as #5) | `/reports/product-out` |
| 19 | `/report/monthlycreditreport` | Monthly Credit Report | 🔴 **TODO** | `/reports/monthly-credit` |
| 20 | `/report/reconcileaudit` | Stock Reconcile & Audit | 🔴 **TODO** | `/reports/reconcile-audit` |
| 21 | `/report/taxaitdetailsreport` | Tax AIT Details | 🔴 **TODO** | `/reports/tax-ait-details` |
| 22 | `/report/taxaitsummarreport` | Tax AIT Summary | 🔴 **TODO** | `/reports/tax-ait-summary` |
| 23 | `/report/stockoutwithsalesreturn` | StockOut With Sales Return | 🔴 **TODO** | `/reports/stockout-salesreturn` |
| 24 | `/report/employee-task` | Employee Task Report | 🔴 **TODO** | `/reports/employee-task` |
| 25 | `/customers/customerlist` | Customer Lookup | 🔴 **TODO** | `/customers/lookup` |
| 26 | `/packingessential/packingrelatedprint` | Packing Print Panel | 🔴 **TODO** | `/packing/print-panel` |
| 27 | `/allowance/checking` | Allowance Checking | 🔴 **TODO** | `/reports/allowance-checking` |
| 28 | `/sampleSticker/print` | Sample Sticker Panel | 🔴 **TODO** | `/sample-sticker/print-panel` |

> **SKIP:** `/report/dashboardlive` is a WIP placeholder in legacy (just "Waiting for real-time..." text via SignalR). Not worth migrating.

**Total remaining to build: 22 pages** (18 reports + 4 operational pages).

---

## 2. V2 Report Architecture — Canonical Pattern

Every report in V2 follows this **exact** pattern. Do not deviate.

> **⭐ TABLE-FIRST PRINCIPLE:** Every report (except Dashboard/Charts pages) **MUST display data in an on-screen HTML table first**. The flow is: User sets filters → clicks "Load Data" → data renders in a searchable `<table>` → user can optionally export to Excel (XLSX) or PDF via toolbar buttons. **No report should be export-only with no visible table.**

> **📊 SUMMARY STATS:** Every report displays summary stat cards (`StatCard` components) above the data table. These show at-a-glance aggregates (totals, unique counts, averages). Stats are **on-screen only** — they do NOT appear in the Excel data rows (the Excel `summaryCards` option puts them in a separate header area in the sheet).

### 2.1 File Structure Per Report

```
types/{reportName}.ts           ← TypeScript interfaces (item + filters)
hooks/use{ReportName}.ts        ← TanStack Query hook with `enabled` flag
pages/reports/{ReportName}Page.tsx  ← Full page component
```

For non-report operational pages:
```
types/{module}.ts
hooks/use{Module}.ts
pages/{module}/{PageName}Page.tsx
```

### 2.2 Type File Template

```typescript
/* ─── {Report Name} types ─── */

/** Single row returned by GET /Report/{Endpoint} */
export interface {ReportName}Item {
  fieldName: string | null
  // ... all fields from API response, every field nullable
}

/** Filters for the report query */
export interface {ReportName}Filters {
  startDate: string
  endDate: string
  // entity-specific IDs with 0 = all
}
```

**Rules:**
- Every API field is `string | null` or `number | null` — the API can return nulls.
- No `ApiResponse<T>` re-export needed — import from `@/types/customer`.

### 2.3 Hook File Template

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { {ReportName}Item, {ReportName}Filters } from '@/types/{reportName}'

export const {reportName}Keys = {
  all: ['{reportName}'] as const,
  list: (filters: {ReportName}Filters) => [...{reportName}Keys.all, 'list', filters] as const,
}

export function use{ReportName}(filters: {ReportName}Filters, enabled: boolean) {
  return useQuery({
    queryKey: {reportName}Keys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ReportName}Item[]>>(
          `/Report/{Endpoint}?param1=${filters.param1}&param2=${filters.param2}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
```

**Rules:**
- `enabled` parameter controls "Load Data" button behavior — query doesn't auto-fire.
- `staleTime: 2 * 60_000` for all reports.
- Use `apiClient` (not axios) — it auto-injects JWT.

### 2.4 Page Component Template

```typescript
import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Database, FileSpreadsheet, Loader2, RefreshCw, Search, {Icon} } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { use{ReportName} } from '@/hooks/use{ReportName}'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { {ReportName}Filters, {ReportName}Item } from '@/types/{reportName}'

// ─── Helpers (duplicated per page — not shared) ───
function todayStr() { /* ... */ }
function firstDayOfMonth() { /* ... */ }
function fmtDate(value: string | null) { /* ... */ }
function fmtDateShort(value: string) { /* ... */ }

// ─── Excel column definition ───
const EXCEL_COLUMNS = [
  { key: 'fieldName', header: 'Display Name', format: 'number' as const },
  // ...
] as const

export function {ReportName}Page() {
  // 1. Filter state
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [entityId, setEntityId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  // 2. Memoized filters (stable reference for TanStack Query key)
  const filters: {ReportName}Filters = useMemo(() => ({
    startDate: fromDate, endDate: toDate, entityId: entityId ?? 0,
  }), [fromDate, toDate, entityId])

  // 3. Query
  const { data: reportData = [], isLoading, isError, error, refetch } = use{ReportName}(filters, loadRequested)

  // 4. Date validation
  const dateError = useMemo(() => { /* ... */ }, [fromDate, toDate])

  // 5. Client-side search filter
  const filteredData = useMemo(() => { /* ... */ }, [reportData, searchTerm])

  // 6. Summary stats
  const uniqueX = useMemo(() => new Set(filteredData.map(i => i.field)).size, [filteredData])

  // 7. handleLoad + handleExport callbacks
  const handleLoad = useCallback(() => { /* ... */ }, [dateError, refetch])
  const handleExport = useCallback(async () => {
    await exportExcelOnDemand({
      fileName: `{Report}_${fromDate}_to_${toDate}`,
      title: '{Report Title}',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: '{Sheet}',
      columns: [...EXCEL_COLUMNS],
      data: filteredData as unknown as Record<string, unknown>[],
      filters: [ ['Date Range', `...`], ['Entity', label || 'All'] ],
      summaryCards: [ ['Total Records', reportData.length], ... ],
    })
  }, [/* deps */])

  // 8. JSX: Title → Filters → Error/Loading → Summary Stats → Data Table (always shown) → Export Toolbar (Excel/PDF) → Footer
  return ( /* ... */ )
}

// ─── Shared CSS class + StatCard (at bottom of file) ───
const inputCls = 'block w-full rounded-lg border border-gray-300 ...'
function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) { /* ... */ }
```

### 2.5 Styling Rules (CRITICAL)

- **ONLY gray-\* palette** — never use `slate`, `blue`, `indigo`, `violet`, `purple`.
- Status colors allowed: `red-*` (error), `emerald-*` (success/active), `amber-*` (warning/paused).
- Tailwind v4 — no `tailwind.config` classes, use standard utilities.
- All named exports — no `export default`.
- Icons from `lucide-react` only.

### 2.6 Dropdown Controls Reference

| Dropdown Type | Component | Hook | When to Use |
|---|---|---|---|
| Customer | `PaginatedCombobox type="customer"` | Auto via component | Large dataset, infinite scroll |
| Product | `PaginatedCombobox type="product"` | Auto via component | Large dataset |
| Employee | `PaginatedCombobox type="employee"` | Auto via component | Large dataset |
| Supplier | `PaginatedCombobox type="supplier"` | Auto via component | Large dataset |
| Channel | `DropdownSelect type="channel"` | `useDropdown('channel')` | Small dataset (load all) |
| Employee by Dept | Direct `apiClient.get` call | Custom hook | Special: filter by dept ID |

---

## 3. Shared Infrastructure Already Built

### 3.1 Excel Export Utility

**File:** `utils/exportExcel.ts` + `utils/lazyExportExcel.ts`

```typescript
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'

await exportExcelOnDemand({
  fileName: string,                          // without .xlsx extension
  title: string,                             // bold row 1 in Excel
  subtitle?: string,                         // italic row 2 (e.g., date range)
  columns: ExcelColumn[],                    // { key, header, width?, format? }
  data: Record<string, unknown>[],           // row data array
  filters?: [string, string | number][],     // → separate "Parameters" sheet
  summaryCards?: [string, string | number][], // summary row above table
  numericKeys?: string[],                    // shortcut for number formatting
  dateKeys?: string[],                       // shortcut for date formatting
  sheetName?: string,                        // default 'Report'
  creator?: string,                          // default 'Octopi ERP'
})
```

**`ExcelColumn.format` options:** `'number'` (#,##0.00), `'integer'` (#,##0), `'date'` (yyyy-mm-dd), `'datetime'` (yyyy-mm-dd hh:mm).

**Features:** Title/subtitle rows, generated timestamp, summary cards, frozen header, auto-sized columns, zebra striping, borders, separate "Parameters" sheet, footer with record count.

### 3.2 API Client

```typescript
import { apiClient } from '@/lib/api'
// .get<T>(url) / .post<T>(url, body) / .put<T>(url, body) / .delete<T>(url)
// JWT auto-injected from localStorage.userInfo.token
```

### 3.3 Toast System

```typescript
import { useToastStore } from '@/stores/toastStore'
const showToast = useToastStore((s) => s.showToast)
showToast({ message: 'Success!', type: 'success' })  // or 'error'
```

### 3.4 Existing Completed Reports (use as reference)

| Report | Page File | Hook File | Type File |
|---|---|---|---|
| Payment Report | `pages/reports/PaymentReportPage.tsx` | `hooks/usePaymentReport.ts` | `types/paymentReport.ts` |
| Sales Report | `pages/reports/SalesReportPage.tsx` | `hooks/useSalesReport.ts` | `types/salesReport.ts` |
| Mapping Report | `pages/reports/MappingReportPage.tsx` | `hooks/useMappingReport.ts` | `types/mappingReport.ts` |
| Repacking | `pages/reports/RepackingPackedByReportPage.tsx` | `hooks/useRepackingPackedByReport.ts` | `types/repackingPackedByReport.ts` |
| Product Out | `pages/reports/ProductOutReportPage.tsx` | `hooks/useProductOutReport.ts` | (types inline) |

> **Use `PaymentReportPage.tsx` as the gold-standard template** — it has the most complete pattern: date filters, customer dropdown, search, summary stats, table, Excel export, loading/error/empty states.

---

## 4. GROUP A: Table + Export Reports (Simple)

> **TABLE-FIRST RULE:** Every report in V2 **MUST display data in an on-screen HTML table first**. The user clicks "Load Data" → data renders in a table → then optionally exports to Excel/PDF via toolbar buttons. No report should be export-only.

These reports have simpler filters and table structures. The user clicks "Load Data", data renders in an on-screen table with search, and export buttons (Excel, PDF where applicable) are available in the toolbar. Some have dual datasets with tab switching (e.g., detail + summary views).

### 4.1 Delivery Report — UPGRADE from placeholder

| Property | Value |
|---|---|
| **V2 Route** | `/reports/delivery` |
| **V2 File** | `pages/reports/DeliveryReportPage.tsx` (replace existing placeholder) |
| **API** | `GET /Report/GetDeliveryInfoReport?startDate={}&endDate={}&parterId={}` |
| **Filters** | From date, To date, Customer (`PaginatedCombobox type="customer"`) |
| **On-screen display** | Summary stats + searchable data table + Excel export button |
| **On-screen table columns** | |

| Header | Field | Format |
|---|---|---|
| Invoice No | `soSystemNo` | — |
| Invoice Date | `invoiceDate` | date |
| Customer Name | `entityName` | — |
| Address | `entityAddress` | — |
| Final Bill | `sobFinalBill` | currency |
| Job Type | `jobType` | — |
| Lifecycle | `lifecycleName` | — |
| Order From | `soOrderFrom` | — |
| At Escalation | `atEscalation` | datetime |
| At Invoicing | `atInvoicing` | datetime |
| At Packing | `atPacking` | datetime |
| At Assign | `atAssign` | datetime |
| At Delivery | `atDelivery` | datetime |
| Delivered | `delivered` | datetime |
| Delivered By | `deliveredBy` | — |

| **Excel columns** | Same as table columns above |

```typescript
const EXCEL_COLUMNS = [
  { key: 'soSystemNo', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'entityName', header: 'Customer Name' },
  { key: 'entityAddress', header: 'Address', width: 28 },
  { key: 'sobFinalBill', header: 'Final Bill', format: 'number' as const },
  { key: 'jobType', header: 'Job Type' },
  { key: 'lifecycleName', header: 'Lifecycle' },
  { key: 'soOrderFrom', header: 'Order From' },
  { key: 'atEscalation', header: 'At Escalation', format: 'datetime' as const },
  { key: 'atInvoicing', header: 'At Invoicing', format: 'datetime' as const },
  { key: 'atPacking', header: 'At Packing', format: 'datetime' as const },
  { key: 'atAssign', header: 'At Assign', format: 'datetime' as const },
  { key: 'atDelivery', header: 'At Delivery', format: 'datetime' as const },
  { key: 'delivered', header: 'Delivered', format: 'datetime' as const },
  { key: 'deliveredBy', header: 'Delivered By' },
] as const
```

| **Type interface** | |

```typescript
export interface DeliveryReportItem {
  soSystemNo: string | null
  invoiceDate: string | null
  entityName: string | null
  entityAddress: string | null
  sobFinalBill: number | null
  jobType: string | null
  lifecycleName: string | null
  soOrderFrom: string | null
  atEscalation: string | null
  atInvoicing: string | null
  atPacking: string | null
  atAssign: string | null
  atDelivery: string | null
  delivered: string | null
  deliveredBy: string | null
}
export interface DeliveryReportFilters {
  startDate: string
  endDate: string
  partnerId: number
}
```

| **Summary stats** | Total Records, Unique Customers, Total Final Bill |
| **Icon** | `Truck` |

---

### 4.2 Product Loan Details

| Property | Value |
|---|---|
| **V2 Route** | `/reports/product-loan` |
| **API (detail)** | `GET /Report/GetCustomerLoanDetails/{customerId}/{productId}` (use `0` for all) |
| **API (summary)** | `GET /Report/GetCustomerLoanSummery/{customerId}/{productId}` (use `0` for all) |
| **Filters** | Customer (`PaginatedCombobox type="customer"`), Product (`PaginatedCombobox type="product"`) |
| **Display** | **Two tabs** ("Details" / "Summary") — each tab shows its data in an on-screen table + its own Excel export button |
| **Two hooks needed** | `useProductLoanDetails(customerId, productId, enabled)`, `useProductLoanSummary(customerId, productId, enabled)` |

**Detail tab — on-screen table columns:**

| Header | Field |
|---|---|
| Invoice No | `manualInvoice` |
| Invoice Date | `invoiceDate` |
| Product Name | `productName` |
| Loan Received Qty | `loanReceivedQty` |
| Loan Given Qty | `loanGivenQty` |

**Summary tab — on-screen table columns:**

| Header | Field |
|---|---|
| Product Name | `productName` |
| Loan Received Qty | `loanReceivedQty` |
| Loan Given Qty | `loanGivenQty` |
| Balance Qty | `balanceQty` |

| **Summary stats (Detail tab)** | Total Records, Total Received Qty, Total Given Qty |
| **Summary stats (Summary tab)** | Total Products, Total Received, Total Given, Net Balance |

```typescript
// ─── Detail item ───
export interface ProductLoanDetailItem {
  manualInvoice: string | null
  invoiceDate: string | null
  productName: string | null
  loanReceivedQty: number | null
  loanGivenQty: number | null
}

// ─── Summary item ───
export interface ProductLoanSummaryItem {
  productName: string | null
  loanReceivedQty: number | null
  loanGivenQty: number | null
  balanceQty: number | null
}

export interface ProductLoanFilters {
  customerId: number
  productId: number
}
```

**Detail Excel columns:**
```typescript
const DETAIL_EXCEL_COLUMNS = [
  { key: 'manualInvoice', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'productName', header: 'Product Name' },
  { key: 'loanReceivedQty', header: 'Loan Received Qty', format: 'number' as const },
  { key: 'loanGivenQty', header: 'Loan Given Qty', format: 'number' as const },
] as const
```

**Summary Excel columns:**
```typescript
const SUMMARY_EXCEL_COLUMNS = [
  { key: 'productName', header: 'Product Name' },
  { key: 'loanReceivedQty', header: 'Loan Received Qty', format: 'number' as const },
  { key: 'loanGivenQty', header: 'Loan Given Qty', format: 'number' as const },
  { key: 'balanceQty', header: 'Balance Qty', format: 'number' as const },
] as const
```

| **Icon** | `Package` |

---

### 4.3 Loan Reports

| Property | Value |
|---|---|
| **V2 Route** | `/reports/loan` |
| **API (detail)** | `GET /Report/GetReportLoanDetails/{customerId}/{productId}` |
| **API (summary)** | `GET /Report/GetReportLoanSummery/{customerId}/{productId}` |
| **Filters** | Customer (`PaginatedCombobox`), Product (`PaginatedCombobox`) |
| **Display** | **Two tabs** ("Details" / "Summary") — each tab shows its data in an on-screen table with search + its own Excel export button |

**Detail tab — on-screen table columns:**

| Header | Field |
|---|---|
| Customer ID | `customerId` |
| Customer Name | `customerName` |
| Address | `customerAddress` |
| Invoice No | `invoiceNo` |
| Invoice Date | `invoiceDate` |
| Product Name | `productName` |
| Loan Given | `loanGivenQuantity` |
| Loan Received | `loanReceiveQuantity` |

**Summary tab — on-screen table columns:**

| Header | Field |
|---|---|
| Customer ID | `customerId` |
| Customer Name | `customerName` |
| Address | `customerAddress` |
| Product Name | `productName` |
| Loan Given | `loanGivenQuantity` |
| Loan Received | `loanReceiveQuantity` |
| Balance | `balanceQuantity` |

| **Summary stats (Detail tab)** | Total Records, Unique Customers, Total Given, Total Received |
| **Summary stats (Summary tab)** | Total Products, Total Given, Total Received, Net Balance |

> **Design Note:** When a specific customer is selected, hide `customerId`, `customerName`, `customerAddress` columns from both the table and the Excel export — dynamically filter the columns array.

```typescript
// ─── Detail (all customers) ───
export interface LoanReportDetailItem {
  customerId: number | null
  customerName: string | null
  customerAddress: string | null
  invoiceNo: string | null
  invoiceDate: string | null
  productName: string | null
  loanGivenQuantity: number | null
  loanReceiveQuantity: number | null
}

// ─── Summary (all customers) ───
export interface LoanReportSummaryItem {
  customerId: number | null
  customerName: string | null
  customerAddress: string | null
  productName: string | null
  loanGivenQuantity: number | null
  loanReceiveQuantity: number | null
  balanceQuantity: number | null
}

export interface LoanReportFilters {
  customerId: number
  productId: number
}
```

**Detail Excel columns:**
```typescript
const DETAIL_COLUMNS = [
  { key: 'customerId', header: 'Customer ID', format: 'integer' as const },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'customerAddress', header: 'Address', width: 28 },
  { key: 'invoiceNo', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'productName', header: 'Product Name' },
  { key: 'loanGivenQuantity', header: 'Loan Given', format: 'number' as const },
  { key: 'loanReceiveQuantity', header: 'Loan Received', format: 'number' as const },
] as const
```

**Summary Excel columns:**
```typescript
const SUMMARY_COLUMNS = [
  { key: 'customerId', header: 'Customer ID', format: 'integer' as const },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'customerAddress', header: 'Address', width: 28 },
  { key: 'productName', header: 'Product Name' },
  { key: 'loanGivenQuantity', header: 'Loan Given', format: 'number' as const },
  { key: 'loanReceiveQuantity', header: 'Loan Received', format: 'number' as const },
  { key: 'balanceQuantity', header: 'Balance', format: 'number' as const },
] as const
```

| **Icon** | `BookOpen` |

---

### 4.4 Monthly Credit Report

| Property | Value |
|---|---|
| **V2 Route** | `/reports/monthly-credit` |
| **API** | `GET /Report/GetCreditSummaryByMktByMonthForMd?employeeId={}&startDate={}&endDate={}` |
| **Filters** | From/To date, Employee (`PaginatedCombobox type="employee"`) — **note: legacy had role-based logic where role 9 auto-uses own employee ID. In V2, just show the employee dropdown for all users.** |
| **Display** | On-screen data table with search + Excel export button |

| **Summary stats** | Total Records *(expand after API shape is confirmed)* |

> **Implementation note:** The legacy used a custom `exportToExcelMonthlyCreditReport` util without on-screen display. In V2, call the API first, inspect the response shape, define the type interface, build on-screen table columns, and use the standard `exportExcelOnDemand` for export. The table and Excel export should use the same column definitions. This report may need runtime inspection to finalize column definitions.

| **Icon** | `CalendarRange` |

---

### 4.5 Stock Reconcile & Audit Report

| Property | Value |
|---|---|
| **V2 Route** | `/reports/reconcile-audit` |
| **API (reconciliation)** | `GET /Report/GetCurrentStockReconciliation?productId={}&channelId={}&dateFrom={}&dateTo={}` |
| **API (audit)** | `GET /Report/GetCurrentStockAudit?productId={}&channelId={}&dateFrom={}&dateTo={}` |
| **Filters** | From/To date (optional), Product (`PaginatedCombobox type="product"`), Channel (`DropdownSelect type="channel"`) |
| **Validation** | Audit export requires both Product AND Channel selected |
| **Display** | **Two tabs** ("Reconciliation" / "Audit") — each tab shows its data in an on-screen table + its own Excel export button. Audit tab disabled until both Product AND Channel are selected |

**Reconciliation tab — on-screen table columns:**

| Header | Field | Format |
|---|---|---|
| Channel | `channelName` | — |
| Product | `productName` | — |
| Opening Stock | `openingStock` | number |
| Stock In | `stockInQty` | number |
| Stock Out | `stockOutQty` | number |
| Adjustment | `adjustmentQty` | number |
| Calc. Closing | `calculatedClosing` | number |
| Current Qty | `currentQty` | number |
| Variance | `variance` | number (highlight red if ≠ 0) |

**Audit tab — on-screen table columns:**

| Header | Field | Format |
|---|---|---|
| Channel | `channelName` | — |
| Product | `productName` | — |
| Movement Date | `movementDate` | date |
| Movement Type | `movementType` | — |
| Reference No | `referenceNo` | — |
| Qty In | `qtyIn` | number |
| Qty Out | `qtyOut` | number |
| Qty Adj | `qtyAdj` | number |
| Qty Change | `qtyChange` | number |
| Running Balance | `runningBalance` | number |
| Opening Balance | `openingBalanceAtStart` | number |
| Remarks | `remarks` | — |

```typescript
export interface ReconciliationItem {
  channelName: string | null
  productName: string | null
  openingStock: number | null
  stockInQty: number | null
  stockOutQty: number | null
  adjustmentQty: number | null
  calculatedClosing: number | null
  currentQty: number | null
  variance: number | null
}

export interface AuditItem {
  channelName: string | null
  productName: string | null
  movementDate: string | null
  movementType: string | null
  referenceNo: string | null
  qtyIn: number | null
  qtyOut: number | null
  qtyAdj: number | null
  qtyChange: number | null
  runningBalance: number | null
  openingBalanceAtStart: number | null
  remarks: string | null
}

export interface ReconcileAuditFilters {
  productId: number
  channelId: number
  dateFrom: string
  dateTo: string
}
```

**Reconciliation Excel:**
```typescript
const RECONCILIATION_COLUMNS = [
  { key: 'channelName', header: 'Channel' },
  { key: 'productName', header: 'Product' },
  { key: 'openingStock', header: 'Opening Stock', format: 'number' as const },
  { key: 'stockInQty', header: 'Stock In', format: 'number' as const },
  { key: 'stockOutQty', header: 'Stock Out', format: 'number' as const },
  { key: 'adjustmentQty', header: 'Adjustment', format: 'number' as const },
  { key: 'calculatedClosing', header: 'Calc. Closing', format: 'number' as const },
  { key: 'currentQty', header: 'Current Qty', format: 'number' as const },
  { key: 'variance', header: 'Variance', format: 'number' as const },
] as const
```

**Audit Excel:**
```typescript
const AUDIT_COLUMNS = [
  { key: 'channelName', header: 'Channel' },
  { key: 'productName', header: 'Product' },
  { key: 'movementDate', header: 'Movement Date', format: 'date' as const },
  { key: 'movementType', header: 'Movement Type' },
  { key: 'referenceNo', header: 'Reference No' },
  { key: 'qtyIn', header: 'Qty In', format: 'number' as const },
  { key: 'qtyOut', header: 'Qty Out', format: 'number' as const },
  { key: 'qtyAdj', header: 'Qty Adj', format: 'number' as const },
  { key: 'qtyChange', header: 'Qty Change', format: 'number' as const },
  { key: 'runningBalance', header: 'Running Balance', format: 'number' as const },
  { key: 'openingBalanceAtStart', header: 'Opening Balance', format: 'number' as const },
  { key: 'remarks', header: 'Remarks', width: 25 },
] as const
```

| **Summary stats (Reconciliation tab)** | Total Products, Total Stock In, Total Stock Out, Total Adjustment, Total Variance |
| **Summary stats (Audit tab)** | Total Movements, Total Qty In, Total Qty Out, Total Qty Change |

> **Two separate hooks** needed: `useReconciliation(filters, enabled)`, `useAudit(filters, enabled)`. Both in the same hook file `useReconcileAudit.ts`.

| **Icon** | `Scale` |

---

### 4.6 StockOut With Sales Return

| Property | Value |
|---|---|
| **V2 Route** | `/reports/stockout-salesreturn` |
| **API** | `GET /Report/GetCustomerStockOutWithStockInReport?customerId={}&productId={}&startDate={}&endDate={}` |
| **Filters** | Customer (`PaginatedCombobox`), Product (`PaginatedCombobox`), From/To date (optional) |
| **Display** | On-screen data table with search + Excel export button |

| **Summary stats** | Total Records *(expand after API shape is confirmed)* |

> **Implementation note:** Call the API first, log the response to determine exact field names and define the type interface. Then build the on-screen table and Excel columns based on the discovered fields. The table and Excel export should use the same column definitions.

| **Icon** | `ArrowLeftRight` |

---

## 5. GROUP B: Table + Export Reports (Standard)

These reports have richer table structures with more columns, summary stats, and Excel export.

### 5.1 Delivery Conveyance Report

| Property | Value |
|---|---|
| **V2 Route** | `/reports/delivery-conveyance` |
| **API** | `GET /Report/GetDeliveryConveyance?startDate={}&endDate={}&employeeId={}` |
| **Filters** | From/To date, Employee (`PaginatedCombobox type="employee"`), Search text |
| **On-screen table columns** | |

| Header | Field |
|---|---|
| Task Id | `taskId` |
| Task Name | `taskName` |
| Task Description | `taskDescription` |
| Destination | `taskDestination` |
| Vehicle | `vehicleName` |
| Transport Cost | `taskTransportationCost` |
| Start Location | `startLocation` |
| End Location | `endLocation` |

| **Summary stats** | Total Records, Filtered Records, Unique Employees, Unique Invoices |

```typescript
export interface DeliveryConveyanceItem {
  taskId: number | null
  taskName: string | null
  taskDescription: string | null
  taskDestination: string | null
  vehicleName: string | null
  taskTransportationCost: number | null
  startLocation: string | null
  endLocation: string | null
  employeeId: number | null
  employeeName: string | null
  invoiceNo: string | null
}

export interface DeliveryConveyanceFilters {
  startDate: string
  endDate: string
  employeeId: number
}
```

**Excel columns:** Same as table + `employeeId`, `employeeName`, `invoiceNo`.

| **Icon** | `Truck` |

---

### 5.2 StockOut Batch Report

| Property | Value |
|---|---|
| **V2 Route** | `/reports/stockout-batch` |
| **API** | `GET /Report/GetAllStockOutBatchRelatedReport?customerId={}&productId={}&startDate={}&endDate={}` |
| **Filters** | From/To date (default: 1st of month to today), Customer (`PaginatedCombobox`), Product (`PaginatedCombobox`), Search text |
| **On-screen table columns** | |

| Header | Field |
|---|---|
| Invoice No | `soSystemId` |
| Invoice Date | `invoiceDate` |
| Customer | `customerName` |
| Product | `productName` |
| Batch No | `batchNo` |
| Production Date | `batchProductionDate` |
| Expiry Date | `batchExpiryDate` |
| Certificate No | `batchCertificateNo` |
| Sales Qty | `soldQuantity` |

| **Summary stats** | Total Records, Filtered Records, Unique Customers, Unique Products, Total Quantity |

```typescript
export interface StockOutBatchItem {
  soSystemId: number | null
  invoiceDate: string | null
  customerId: number | null
  customerName: string | null
  productId: number | null
  productName: string | null
  batchId: number | null
  batchNo: string | null
  batchProductionDate: string | null
  batchExpiryDate: string | null
  batchCertificateNo: string | null
  soldQuantity: number | null
}

export interface StockOutBatchFilters {
  startDate: string
  endDate: string
  customerId: number
  productId: number
}
```

**Excel columns:**
```typescript
const EXCEL_COLUMNS = [
  { key: 'soSystemId', header: 'Invoice No', format: 'integer' as const },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'customerId', header: 'Customer ID', format: 'integer' as const },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'productId', header: 'Product ID', format: 'integer' as const },
  { key: 'productName', header: 'Product Name' },
  { key: 'batchId', header: 'Batch ID', format: 'integer' as const },
  { key: 'batchNo', header: 'Batch No' },
  { key: 'batchProductionDate', header: 'Production Date', format: 'date' as const },
  { key: 'batchExpiryDate', header: 'Expiry Date', format: 'date' as const },
  { key: 'batchCertificateNo', header: 'Certificate No' },
  { key: 'soldQuantity', header: 'Sold Qty', format: 'number' as const },
] as const
```

| **Icon** | `PackageOpen` |

---

### 5.3 StockIn Batch Report

| Property | Value |
|---|---|
| **V2 Route** | `/reports/stockin-batch` |
| **API** | `GET /Report/GetAllStockInBatchReport?supplierId={}&productId={}&startDate={}&endDate={}` |
| **Filters** | From/To date, Supplier (`PaginatedCombobox type="supplier"`), Product (`PaginatedCombobox type="product"`), Search text |
| **On-screen table columns** | |

| Header | Field |
|---|---|
| Supplier ID | `supplierId` |
| Supplier Name | `supplierName` |
| Invoice No | `invoiceNo` |
| SI System No | `siSystemNo` |
| Invoice Date | `invoiceDate` |
| Product ID | `productId` |
| Product Name | `productName` |
| Batch No | `batchNo` |
| Production Date | `batchProductionDate` |
| Expiry Date | `batchExpiryDate` |
| Received Qty | `receivedQty` |

```typescript
export interface StockInBatchItem {
  supplierId: number | null
  supplierName: string | null
  invoiceNo: string | null
  siSystemNo: string | null
  invoiceDate: string | null
  productId: number | null
  productName: string | null
  batchNo: string | null
  batchProductionDate: string | null
  batchExpiryDate: string | null
  receivedQty: number | null
}

export interface StockInBatchFilters {
  startDate: string
  endDate: string
  supplierId: number
  productId: number
}
```

| **Summary stats** | Total Records, Filtered Records, Unique Suppliers, Unique Products, Total Received Qty |
| **Icon** | `PackagePlus` |

---

### 5.4 Purchase Price History

| Property | Value |
|---|---|
| **V2 Route** | `/reports/purchase-price-history` |
| **API** | `GET /Report/GetPurchasePriceHistory/{productId}` |
| **Filters** | Product (`PaginatedCombobox type="product"`), "All Products" toggle button |
| **No date filter** — loads by product selection only |
| **On-screen table columns** | |

| Header | Field |
|---|---|
| Supplier ID | `supplierId` |
| Supplier Name | `supplierName` |
| Product ID | `productId` (only when "All") |
| Product Name | `productName` (only when "All") |
| Confirmed Unit Price | `confirmedUnitPrice` |
| Invoice Date | `invoiceDate` |

```typescript
export interface PurchasePriceHistoryItem {
  supplierId: number | null
  supplierName: string | null
  productId: number | null
  productName: string | null
  confirmedUnitPrice: number | null
  invoiceDate: string | null
}

export interface PurchasePriceHistoryFilters {
  productId: number  // 0 = all
}
```

| **Summary stats** | Total Records, Unique Suppliers, Avg Unit Price, Min Price, Max Price |

> **Design note:** No date range filter. The hook `enabled` flag should trigger on product selection or "All Products" button click.

| **Icon** | `TrendingUp` |

---

### 5.5 Tax AIT Details Report

| Property | Value |
|---|---|
| **V2 Route** | `/reports/tax-ait-details` |
| **API** | `GET /Report/GetTaxAitDetails?startDate={}&endDate={}&customerId={}` |
| **Filters** | Start date (required), End date (required), Customer (`PaginatedCombobox`, optional — 0 = all) |
| **On-screen table columns** | |

| Header | Field | Notes |
|---|---|---|
| Invoice No | `systemNo` | Show as badge/chip |
| Date | `invoiceDate` | |
| Customer | `customerName` + `customerAddress` | Two lines |
| Month | `monthName` + `yearMonth` | |
| Taxable Base | `taxableBase` | Currency format |
| VAT Rate | `vatRatePct` | Percentage |
| AIT Rate | `aitRatePct` | Percentage |
| VAT Amount | `vatAmount` | Currency format |
| AIT Amount | `aitAmount` | Currency format |
| Running Total | `runningTaxableBaseByCustomer` | Currency format |

| **Summary stats** | Total Invoices, Total Taxable Base, Total VAT, Total AIT |

```typescript
export interface TaxAitDetailItem {
  systemNo: string | null
  invoiceDate: string | null
  customerName: string | null
  customerAddress: string | null
  monthName: string | null
  yearMonth: string | null
  taxableBase: number | null
  vatRatePct: number | null
  aitRatePct: number | null
  vatAmount: number | null
  aitAmount: number | null
  runningTaxableBaseByCustomer: number | null
}

export interface TaxAitDetailFilters {
  startDate: string
  endDate: string
  customerId: number
}
```

**Excel columns:**
```typescript
const EXCEL_COLUMNS = [
  { key: 'systemNo', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Date', format: 'date' as const },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'customerAddress', header: 'Address', width: 28 },
  { key: 'monthName', header: 'Month' },
  { key: 'yearMonth', header: 'Period' },
  { key: 'taxableBase', header: 'Taxable Base', format: 'number' as const },
  { key: 'vatRatePct', header: 'VAT Rate %', format: 'number' as const },
  { key: 'aitRatePct', header: 'AIT Rate %', format: 'number' as const },
  { key: 'vatAmount', header: 'VAT Amount', format: 'number' as const },
  { key: 'aitAmount', header: 'AIT Amount', format: 'number' as const },
  { key: 'runningTaxableBaseByCustomer', header: 'Running Total', format: 'number' as const },
] as const
```

| **Icon** | `Receipt` |

---

### 5.6 Tax AIT Summary Report

| Property | Value |
|---|---|
| **V2 Route** | `/reports/tax-ait-summary` |
| **API** | `GET /Report/GetTaxAitSummary?startDate={}&endDate={}&customerId={}` |
| **Filters** | Start date (required), End date (required), Customer (optional) |
| **On-screen table columns** | |

| Header | Field |
|---|---|
| Customer | `customerName` + `customerAddress` |
| Period | `yearMonth` |
| Month | `monthName` + year |
| Invoices | `invoiceCount` (badge) |
| Taxable Base | `sumTaxableBase` |
| VAT Amount | `sumVatAmount` |
| AIT Amount | `sumAitAmount` |
| Running Taxable | `runningSumTaxableBaseByCustomer` |
| Running VAT | `runningSumVatByCustomer` |
| Running AIT | `runningSumAitByCustomer` |

| **Summary stats** | Total Months, Total Invoices, Total Taxable Base, Total VAT, Total AIT |

```typescript
export interface TaxAitSummaryItem {
  customerName: string | null
  customerAddress: string | null
  yearMonth: string | null
  monthName: string | null
  year: number | null
  invoiceCount: number | null
  sumTaxableBase: number | null
  sumVatAmount: number | null
  sumAitAmount: number | null
  runningSumTaxableBaseByCustomer: number | null
  runningSumVatByCustomer: number | null
  runningSumAitByCustomer: number | null
}

export interface TaxAitSummaryFilters {
  startDate: string
  endDate: string
  customerId: number
}
```

| **Icon** | `ReceiptText` |

---

### 5.7 Employee Task Report

| Property | Value |
|---|---|
| **V2 Route** | `/reports/employee-task` |
| **API (summary)** | `GET /Task/summary?startDate={}&endDate={}&employeeId={}` |
| **API (details)** | `GET /Task/details?startDate={}&endDate={}&employeeId={}` |
| **Filters** | From/To date, Employee (`PaginatedCombobox type="employee"`, optional), Search text |
| **Display** | TWO tables (Summary + Details) with TWO Excel export buttons |

**Summary table columns:**

| Header | Field |
|---|---|
| Employee ID | `employeeId` |
| Code | `employeeCode` |
| Name | `employeeFullName` |
| Total Assigned | `totalTasksAssigned` |
| Completed | `completedTasks` |
| Pending | `pendingTasks` |
| Completion % | `completionRatePercentage` |
| Evening Tasks | `eveningTaskCount` |
| Evening % | `eveningTaskPercentage` |
| Avg Assign→Start | `avgAssignToStartMinutes` |
| Avg Duration | `avgTaskDurationMinutes` |
| Distinct Transport | `distinctTransportCount` |

**Detail table columns** (nested: employees → tasks[], must be flattened):

| Header | Field |
|---|---|
| Employee ID | `employeeId` |
| Code | `employeeCode` |
| Name | `employeeFullName` |
| Task ID | `taskId` |
| Destination | `taskDestination` |
| Invoice No | `soSystemNo` |
| Assign Time | `taskAssignTime` |
| Start Time | `taskStartTime` |
| End Time | `taskEndTime` |
| Transport | `movementTransportName` |
| Assign→Start (min) | `taskAssignToStartMinutes` |
| Duration (min) | `taskDurationMinutes` |
| Completed | `isCompleted` |

```typescript
// ─── Summary response ───
export interface EmployeeTaskSummary {
  employeeId: number | null
  employeeCode: string | null
  employeeFullName: string | null
  totalTasksAssigned: number | null
  completedTasks: number | null
  pendingTasks: number | null
  completionRatePercentage: number | null
  eveningTaskCount: number | null
  eveningTaskPercentage: number | null
  avgAssignToStartMinutes: number | null
  avgTaskDurationMinutes: number | null
  distinctTransportCount: number | null
}

// ─── Detail nested response ───
export interface EmployeeTaskDetailResponse {
  employeeId: number
  employeeCode: string
  employeeFullName: string
  tasks: EmployeeTask[]
}

export interface EmployeeTask {
  taskId: number | null
  taskDestination: string | null
  soSystemNo: string | null
  taskAssignTime: string | null
  taskStartTime: string | null
  taskEndTime: string | null
  movementTransportName: string | null
  taskAssignToStartMinutes: number | null
  taskDurationMinutes: number | null
  isCompleted: boolean | null
}

// ─── Flattened for table display ───
export interface EmployeeTaskDetailFlat extends EmployeeTask {
  employeeId: number
  employeeCode: string
  employeeFullName: string
}

export interface EmployeeTaskFilters {
  startDate: string
  endDate: string
  employeeId: number
}
```

> **Two hooks** in one file: `useEmployeeTaskSummary(filters, enabled)` and `useEmployeeTaskDetails(filters, enabled)`. Flatten the nested `tasks[]` on the page component for display.

| **Summary stats (Summary tab)** | Total Employees, Total Tasks Assigned, Total Completed, Total Pending, Avg Completion % |
| **Summary stats (Details tab)** | Total Records, Total Completed, Total Pending, Avg Duration (min) |

**UI Design:** Use a **tab** or **accordion** to show Summary vs Details sections. Each section has its own Excel export button.

| **Icon** | `ClipboardList` |

---

## 6. GROUP C: Interactive Table + Modal Reports

These reports display data in a searchable/filterable table with row-level action buttons that open a **modal** showing invoice details.

### 6.1 Shared Invoice Detail Modal

**Build this FIRST** — all three reports in this group use the same modal.

**File:** `components/reports/InvoiceDetailModal.tsx`

**API:** `GET /StockOut/GetStockOutByIdInternal/{soSystemId}` — reuse existing hook if available (check `useSalesOrders` or create a shared `useInvoiceDetail` hook).

**Modal content (from legacy `salesorderinternalsingle`):**
1. **Items table:** `productName`, `sodQty`, `sodUnitPrice`, `sodFinalCalculatedUnitPrice`
2. **Bill summary:** `calculatedBill`, `billVatPercantage`, `billAitPercantage`, `billDiscount`, `billAdjustment`
3. **Conditional:** Hide price columns when `jobType` is `Sample_Issue` or `Warehouse_Transfer`

**Props:**
```typescript
interface InvoiceDetailModalProps {
  soSystemId: number | null
  onClose: () => void
}
```

**Design:** Use the same modal pattern as `EditBatchModal` — fixed overlay, white card, loading spinner, close button.

---

### 6.2 Pending & Cancel Report

| Property | Value |
|---|---|
| **V2 Route** | `/reports/pending-cancel` |
| **API** | `GET /Report/GetPendingAndCancelReport?status=1` |
| **Auto-load on mount** — no "Load Data" button needed (set `enabled: true` always) |
| **Filters** | Client-side column filters via `<select>` dropdowns on: Pending Status, Channel, Assign To |
| **On-screen table columns** | |

| Header | Field | Filter? |
|---|---|---|
| Customer Name | `customerName` | No |
| Invoice Number | `soSystemNo` | No |
| View | (action button → opens InvoiceDetailModal) | — |
| Invoice Date | `invoiceDate` | No |
| Pending Status | `soSystemPending` | `<select>` filter |
| Decision Pending | `soDecesionPending` | No |
| Pending Duration | `daysPending` | No |
| Channel | `channelName` | `<select>` filter |
| Assign To | `lastAssignedFirstName + lastAssignedLastName` | `<select>` filter |

```typescript
export interface PendingCancelReportItem {
  customerName: string | null
  soSystemNo: string | null
  soSystemId: number | null
  invoiceDate: string | null
  soSystemPending: string | null
  soDecesionPending: string | null
  daysPending: number | null
  channelName: string | null
  lastAssignedFirstName: string | null
  lastAssignedLastName: string | null
}
```

| **Summary stats** | Total Records, Filtered Records, Unique Channels, Avg Pending Duration (days) |

> **Column filter pattern:** For each filterable column, extract unique values from the dataset, render a `<select>` above or inline with the column header, and filter the data client-side.

| **Icon** | `AlertTriangle` |

---

### 6.3 Daily Invoice Tracking

| Property | Value |
|---|---|
| **V2 Route** | `/reports/daily-invoice-tracking` |
| **API** | `GET /Report/GetDailyActivityTAT?startDate={}&endDate={}&parterId={}` |
| **Filters** | From/To date, Customer (`PaginatedCombobox`), Search/Reset buttons |
| **On-screen table columns** | |

| Header | Field | Filter? |
|---|---|---|
| Life Cycle | `lifecycleName` | `<select>` filter |
| Customer Name | `customerName` | No |
| Invoice Id | `soSystemId` | No |
| View | (action button → InvoiceDetailModal) | — |
| Invoice Date | `invoiceDate` | No |
| Order Duration | `orderDuration` | No |
| Delivered By | `empFirstName + empLastName` | No |
| Pending Duration | `daysPending` | No |
| Channel Name | `channelName` | `<select>` filter |

```typescript
export interface DailyInvoiceTrackingItem {
  lifecycleName: string | null
  customerName: string | null
  soSystemId: number | null
  invoiceDate: string | null
  orderDuration: string | null
  empFirstName: string | null
  empLastName: string | null
  daysPending: number | null
  channelName: string | null
}

export interface DailyInvoiceTrackingFilters {
  startDate: string
  endDate: string
  partnerId: number
}
```

| **Summary stats** | Total Records, Filtered Records, Unique Customers, Unique Channels |
| **Icon** | `CalendarClock` |

---

### 6.4 Allowance Checking

| Property | Value |
|---|---|
| **V2 Route** | `/reports/allowance-checking` |
| **API** | `GET /Report/GetAllowanceRelatedReport?startDate={}&endDate={}&employeeId={}` |
| **Filters** | From/To date, Employee (`PaginatedCombobox type="employee"`), Search text |
| **On-screen table columns** | |

| Header | Field | Filter? |
|---|---|---|
| Task Id | `taskId` | No |
| Customer Name | `customerName` | `<select>` filter |
| Invoice Id | `taskRelatedInvoiceId` | No |
| View | (action button → InvoiceDetailModal) | — |
| Invoice Created | `atInvoicing` | No |
| Assign Time | `taskAssignTime` | No |
| Task Start | `taskStartTime` | No |
| Delivered Time | `delivered` | No |
| Task End | `taskEndTime` | No |

```typescript
export interface AllowanceCheckingItem {
  taskId: number | null
  customerName: string | null
  taskRelatedInvoiceId: number | null
  atInvoicing: string | null
  taskAssignTime: string | null
  taskStartTime: string | null
  delivered: string | null
  taskEndTime: string | null
}

export interface AllowanceCheckingFilters {
  startDate: string
  endDate: string
  employeeId: number
}
```

| **Summary stats** | Total Records, Filtered Records, Unique Customers |
| **Icon** | `BadgeCheck` |

---

## 7. GROUP D: Charts & Dashboard

### 7.1 Customer Credit Report

| Property | Value |
|---|---|
| **V2 Route** | `/reports/customer-credit` |
| **API (detail)** | `GET /Report/GetCustomerCreditHistory?startDate={}&endDate={}&customerId={}` |
| **API (summary)** | `GET /Report/GetCustomerCreditSaleSummery?customerId={}&startDate={}&endDate={}` |
| **Filters** | From/To date, Customer (`PaginatedCombobox type="customer"`) |
| **Display** | Detail view + Summary view (toggle/tab), multiple export options |

**Detail response shape:** `{ customerInfo: {...}, transctionInfo: [...] }`

**Detail columns:**

| Header | Field |
|---|---|
| Date | `date` |
| Transaction Type | `job_type` |
| Transaction Number | `transaction_number` |
| Sales Value | `payable_amount` |
| Payment Received | `paid_amount` |
| Adjustment | `returned_amount` |
| Current Balance | `linq_calculated_due_amount` |

**Summary columns:**

| Header | Field |
|---|---|
| Customer ID | `customerId` |
| Customer Name | `customerName` |
| Address | `customerAddress` |
| Marketing | `marketingName` |
| Opening Credit | `openingCredit` |
| Total Sale | `totalSale` |
| Total Paid | `totalPaid` |
| Total Adjustment | `totalAdjustment` |
| Total Due | `totalDue` |

**Export options (all three):**
1. **Detail Excel** — credit transaction history
2. **Detail PDF** — via browser print (`window.print()` with a print-friendly layout) — DO NOT use jsPDF in V2. Instead, create a `print:hidden` / `@media print` styled section and call `window.print()`.
3. **Summary Excel** — customer credit summary

```typescript
export interface CreditHistoryResponse {
  customerInfo: {
    customerId: number
    customerName: string
    customerAddress: string
  }
  transctionInfo: CreditTransactionItem[]
}

export interface CreditTransactionItem {
  serial_no: number | null
  date: string | null
  job_type: string | null
  transaction_number: string | null
  payable_amount: number | null
  paid_amount: number | null
  returned_amount: number | null
  linq_calculated_due_amount: number | null
}

export interface CreditSummaryItem {
  customerId: number | null
  customerName: string | null
  customerAddress: string | null
  marketingName: string | null
  openingCredit: number | null
  totalSale: number | null
  totalPaid: number | null
  totalAdjustment: number | null
  totalDue: number | null
}

export interface CustomerCreditFilters {
  startDate: string
  endDate: string
  customerId: number
}
```

> **UI Design:** Use two **tabs** ("Transaction History" / "Credit Summary"). Each tab shows its own table and has its own Excel export button. The Transaction History tab also gets a "Print" button.

| **Icon** | `CreditCard` |

---

### 7.2 Sales & Payment Dashboard

| Property | Value |
|---|---|
| **V2 Route** | `/reports/sales-payment-dashboard` |
| **API calls (4 total):** | |
| Daily Sales | `GET /Report/GetSummarySalesOrPayment?startdate={}&enddate={}&intervalType=daily&dataType=sales` |
| Daily Payment | `GET /Report/GetSummarySalesOrPayment?startdate={}&enddate={}&intervalType=daily&dataType=payment` |
| Weekly Sales | same with `intervalType=weekly` |
| Weekly Payment | same with `intervalType=weekly` |
| Monthly Sales | same with `intervalType=monthly` |
| Monthly Payment | same with `intervalType=monthly` |
| Monthly Summary | `GET /Report/GetMonthlyPurchaseSalesPaymentSummary` |
| **No filters** — date ranges are auto-computed (last 30d, last 12w, last 1y) |
| **No Excel export** |

**Data shape:**
```typescript
export interface SalesPaymentSummaryItem {
  intervalValue: string
  amount: number
}

export interface MonthlyPurchaseSalesPaymentItem {
  monthName: string
  totalPurchase: number
  totalSales: number
  totalPayment: number
}
```

> **Chart Library Decision:** The legacy used `react-google-charts`. For V2, use **simple HTML/CSS bar charts** built with Tailwind — no additional chart library needed. Use horizontal bar segments with `%`-based widths. This keeps the bundle small and matches the gray-only design system.

**Alternative:** If the user prefers real charts, add `recharts` (lightweight, React-native). Do NOT use `react-google-charts` (heavy, external dependency).

**UI Design:** Four card sections stacked vertically:
1. **Daily Summary (Last 30 Days)** — bar chart or table
2. **Weekly Summary (Last 12 Weeks)** — bar chart or table
3. **Yearly Summary (Last 1 Year)** — bar chart or table
4. **Monthly Purchase/Sales/Payment** — table with colored amounts

Each section has a toggle between Chart view and Table view.

| **Icon** | `BarChart3` |

---

## 8. GROUP E: Operational Pages (Non-Report)

### 8.1 Customer Lookup

| Property | Value |
|---|---|
| **V2 Route** | `/customers/lookup` |
| **APIs** | Reuse existing `useCustomers`, `useProducts` hooks for dropdown data. For stock: `GET /Stock/GetCurrentStock/{productId}/{channelId}` |
| **No date filter** |
| **UI Design** | Two side-by-side cards:  |

**Left card — Product Info:**
- Product `PaginatedCombobox type="product"` dropdown
- On selection, shows: Product ID, Name, Category, Function, Current Qty

**Right card — Customer Info:**
- Customer `PaginatedCombobox type="customer"` dropdown
- On selection, shows: Customer ID, Name, Contact Number, Address, Belongs To (employee)

> **Simple page** — no table, no Excel, no modal. Just two lookup panels.

| **Icon** | `Search` |

---

### 8.2 Packing Print Panel

| Property | Value |
|---|---|
| **V2 Route** | `/packing/print-panel` |
| **API** | `GET /StockOut/StockOutPrintReportGridData?currentStatus={}&startDate={}&endDate={}&customerId={}` |
| **Filters** | Start/End date, Customer (`PaginatedCombobox`) |
| **Table columns** | Order No, Order Date, Customer, Address, Order Type, Order From |
| **Actions per row** | View (modal), Sticker (modal), Packing List (modal) |

> **Complex page** — depends on `SalesOrderStickerModal`, `SalesOrderInternalModal`, `KarjadeshView` modal components. Check if these already exist in V2 from the sticker packing module (they should — `SalesOrderStickerModal` was reused for `PrintPanelPage`). Build incrementally.

```typescript
export interface PackingPrintItem {
  soSystemId: number | null
  soSystemNo: string | null
  invoiceDate: string | null
  customerName: string | null
  supplierName: string | null
  customerAddress: string | null
  supplierAddress: string | null
  jobType: string | null
  soOrderFrom: string | null
}

export interface PackingPrintFilters {
  currentStatus: number
  startDate: string
  endDate: string
  customerId: number
}
```

> **Note:** This page reuses modals that may already be in V2. Check `v2-octopi/src/pages/sales-orders/SalesOrderStickerModal.tsx` and similar before building new ones. If modal components don't exist, they need to be created as shared components.

| **Icon** | `Printer` |

---

### 8.3 Sample Sticker Panel

| Property | Value |
|---|---|
| **V2 Route** | `/sample-sticker/print-panel` |
| **API** | `GET /StockOut/StickerStockOutOrderGridData/{orderType}` |
| **Nearly identical to Packing Print Panel** but uses `SampleStickerModal` instead of `SalesOrderStickerModal` |

> **Implement after** Packing Print Panel — share as much code as possible.

| **Icon** | `Sticker` |

---

## 9. Shared Components to Build

Before implementing the reports, build these shared components:

### 9.1 `InvoiceDetailModal` (for GROUP C reports)

```
components/reports/InvoiceDetailModal.tsx
```

Used by: Pending & Cancel, Daily Invoice Tracking, Allowance Checking.

### 9.2 Column Filter Select (for GROUP C reports)

Simple inline `<select>` that extracts unique values from a data column and filters. Can be a helper function inside each page — no need for a separate component file.

```typescript
function ColumnFilter({ values, selected, onChange, placeholder }: {
  values: string[]
  selected: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <select value={selected} onChange={e => onChange(e.target.value)} className={inputCls}>
      <option value="">{placeholder}</option>
      {values.map(v => <option key={v} value={v}>{v}</option>)}
    </select>
  )
}
```

---

## 10. Implementation Sequence

Implement in this exact order to maximize code reuse:

### Phase 1: Quick Wins — Simple Table + Export Reports (6 reports)
These have simpler table structures — filters + table display + Excel export.

1. **Delivery Report** (upgrade from placeholder)
2. **StockOut With Sales Return**
3. **Product Loan Details**
4. **Loan Reports**
5. **Monthly Credit Report**
6. **Stock Reconcile & Audit**

### Phase 2: Standard Table + Export Reports (7 reports)
Richer tables with more columns, summary stats, search, and Excel export.

7. **Delivery Conveyance**
8. **StockOut Batch Report**
9. **StockIn Batch Report**
10. **Purchase Price History**
11. **Tax AIT Details**
12. **Tax AIT Summary**
13. **Employee Task Report**

### Phase 3: Interactive Reports with Modals (3 reports)
Build `InvoiceDetailModal` first, then the reports.

14. **InvoiceDetailModal** (shared component)
15. **Pending & Cancel Report**
16. **Daily Invoice Tracking**
17. **Allowance Checking**

### Phase 4: Complex Pages (4 pages)

18. **Customer Credit Report** (tabs + multiple exports + print)
19. **Sales & Payment Dashboard** (charts + multiple APIs)
20. **Customer Lookup** (simple two-panel page)
21. **Packing Print Panel** (DataGrid + modals)
22. **Sample Sticker Panel** (similar to Packing Print Panel)

---

## 11. Routing & Sidebar Plan

### 11.1 Routes to Add in `AppRouter.tsx`

```typescript
// ── Reports (Phase 1-3) ──
<Route path="reports/delivery" element={<DeliveryReportPage />} />           // REPLACE placeholder
<Route path="reports/delivery-conveyance" element={<DeliveryConveyanceReportPage />} />
<Route path="reports/pending-cancel" element={<PendingCancelReportPage />} />
<Route path="reports/daily-invoice-tracking" element={<DailyInvoiceTrackingPage />} />
<Route path="reports/product-loan" element={<ProductLoanReportPage />} />
<Route path="reports/stockout-batch" element={<StockOutBatchReportPage />} />
<Route path="reports/stockin-batch" element={<StockInBatchReportPage />} />
<Route path="reports/customer-credit" element={<CustomerCreditReportPage />} />
<Route path="reports/sales-payment-dashboard" element={<SalesPaymentDashboardPage />} />
<Route path="reports/loan" element={<LoanReportPage />} />
<Route path="reports/purchase-price-history" element={<PurchasePriceHistoryPage />} />
<Route path="reports/monthly-credit" element={<MonthlyCreditReportPage />} />
<Route path="reports/reconcile-audit" element={<ReconcileAuditReportPage />} />
<Route path="reports/tax-ait-details" element={<TaxAitDetailsReportPage />} />
<Route path="reports/tax-ait-summary" element={<TaxAitSummaryReportPage />} />
<Route path="reports/stockout-salesreturn" element={<StockOutSalesReturnReportPage />} />
<Route path="reports/employee-task" element={<EmployeeTaskReportPage />} />
<Route path="reports/allowance-checking" element={<AllowanceCheckingReportPage />} />

// ── Operational Pages (Phase 4) ──
<Route path="customers/lookup" element={<CustomerLookupPage />} />
<Route path="packing/print-panel" element={<PackingPrintPanelPage />} />
<Route path="sample-sticker/print-panel" element={<SampleStickerPanelPage />} />
```

### 11.2 Legacy Redirects to Add

```typescript
// Map old routes to new V2 routes
<Route path="report/delivery-conveyance" element={<Navigate to="/reports/delivery-conveyance" replace />} />
<Route path="report/pending-and-cancel-report" element={<Navigate to="/reports/pending-cancel" replace />} />
<Route path="report/daily-invoice-tracking" element={<Navigate to="/reports/daily-invoice-tracking" replace />} />
<Route path="report/productloandetails" element={<Navigate to="/reports/product-loan" replace />} />
<Route path="report/stockoutbatchreport" element={<Navigate to="/reports/stockout-batch" replace />} />
<Route path="report/stockinbatchreport" element={<Navigate to="/reports/stockin-batch" replace />} />
<Route path="report/customercreditreport" element={<Navigate to="/reports/customer-credit" replace />} />
<Route path="report/salesnpayment" element={<Navigate to="/reports/sales-payment-dashboard" replace />} />
<Route path="report/loanreports" element={<Navigate to="/reports/loan" replace />} />
<Route path="report/purchasepricehistory" element={<Navigate to="/reports/purchase-price-history" replace />} />
<Route path="report/productoutadmin" element={<Navigate to="/reports/product-out" replace />} />
<Route path="report/monthlycreditreport" element={<Navigate to="/reports/monthly-credit" replace />} />
<Route path="report/reconcileaudit" element={<Navigate to="/reports/reconcile-audit" replace />} />
<Route path="report/taxaitdetailsreport" element={<Navigate to="/reports/tax-ait-details" replace />} />
<Route path="report/taxaitsummarreport" element={<Navigate to="/reports/tax-ait-summary" replace />} />
<Route path="report/stockoutwithsalesreturn" element={<Navigate to="/reports/stockout-salesreturn" replace />} />
<Route path="report/employee-task" element={<Navigate to="/reports/employee-task" replace />} />
<Route path="customers/customerlist" element={<Navigate to="/customers/lookup" replace />} />
<Route path="packingessential/packingrelatedprint" element={<Navigate to="/packing/print-panel" replace />} />
<Route path="allowance/checking" element={<Navigate to="/reports/allowance-checking" replace />} />
<Route path="sampleSticker/print" element={<Navigate to="/sample-sticker/print-panel" replace />} />
```

### 11.3 Sidebar Entries

Add to `staticNav` array in `Sidebar.tsx`. Group logically:

```typescript
// Reports
{ id: 'delivery-report', label: 'Delivery Report', path: '/reports/delivery', icon: Truck },
{ id: 'delivery-conveyance', label: 'Delivery Conveyance', path: '/reports/delivery-conveyance', icon: Truck },
{ id: 'pending-cancel', label: 'Pending & Cancel', path: '/reports/pending-cancel', icon: AlertTriangle },
{ id: 'daily-invoice', label: 'Daily Invoice Tracking', path: '/reports/daily-invoice-tracking', icon: CalendarClock },
{ id: 'product-loan', label: 'Product Loan Details', path: '/reports/product-loan', icon: Package },
{ id: 'loan-reports', label: 'Loan Reports', path: '/reports/loan', icon: BookOpen },
{ id: 'stockout-batch', label: 'StockOut Batch Report', path: '/reports/stockout-batch', icon: PackageOpen },
{ id: 'stockin-batch', label: 'StockIn Batch Report', path: '/reports/stockin-batch', icon: PackagePlus },
{ id: 'customer-credit', label: 'Customer Credit', path: '/reports/customer-credit', icon: CreditCard },
{ id: 'sales-payment-dash', label: 'Sales & Payment', path: '/reports/sales-payment-dashboard', icon: BarChart3 },
{ id: 'purchase-price', label: 'Purchase Price History', path: '/reports/purchase-price-history', icon: TrendingUp },
{ id: 'monthly-credit', label: 'Monthly Credit', path: '/reports/monthly-credit', icon: CalendarRange },
{ id: 'reconcile-audit', label: 'Reconcile & Audit', path: '/reports/reconcile-audit', icon: Scale },
{ id: 'tax-ait-details', label: 'Tax AIT Details', path: '/reports/tax-ait-details', icon: Receipt },
{ id: 'tax-ait-summary', label: 'Tax AIT Summary', path: '/reports/tax-ait-summary', icon: ReceiptText },
{ id: 'stockout-salesreturn', label: 'StockOut + Sales Return', path: '/reports/stockout-salesreturn', icon: ArrowLeftRight },
{ id: 'employee-task', label: 'Employee Task Report', path: '/reports/employee-task', icon: ClipboardList },
{ id: 'allowance-checking', label: 'Allowance Checking', path: '/reports/allowance-checking', icon: BadgeCheck },
// Operational
{ id: 'customer-lookup', label: 'Customer Lookup', path: '/customers/lookup', icon: Search },
{ id: 'packing-print', label: 'Packing Print Panel', path: '/packing/print-panel', icon: Printer },
{ id: 'sample-sticker', label: 'Sample Sticker Print', path: '/sample-sticker/print-panel', icon: Sticker },
```

---

## 12. File Checklist Per Report

For each report, create these files in this order:

| Step | File | Template |
|---|---|---|
| 1 | `types/{reportName}.ts` | Section 2.2 |
| 2 | `hooks/use{ReportName}.ts` | Section 2.3 |
| 3 | `pages/reports/{ReportName}Page.tsx` | Section 2.4 |
| 4 | Update `router/AppRouter.tsx` | Section 11.1 + 11.2 |
| 5 | Update `layout/Sidebar.tsx` | Section 11.3 |
| 6 | Run `get_errors` on all modified files | — |

**Naming convention for filenames:**

| Report | Type File | Hook File | Page File |
|---|---|---|---|
| Delivery | `deliveryReport.ts` | `useDeliveryReport.ts` | `DeliveryReportPage.tsx` |
| Delivery Conveyance | `deliveryConveyanceReport.ts` | `useDeliveryConveyanceReport.ts` | `DeliveryConveyanceReportPage.tsx` |
| Pending & Cancel | `pendingCancelReport.ts` | `usePendingCancelReport.ts` | `PendingCancelReportPage.tsx` |
| Daily Invoice Tracking | `dailyInvoiceTracking.ts` | `useDailyInvoiceTracking.ts` | `DailyInvoiceTrackingPage.tsx` |
| Product Loan | `productLoanReport.ts` | `useProductLoanReport.ts` | `ProductLoanReportPage.tsx` |
| StockOut Batch | `stockOutBatchReport.ts` | `useStockOutBatchReport.ts` | `StockOutBatchReportPage.tsx` |
| StockIn Batch | `stockInBatchReport.ts` | `useStockInBatchReport.ts` | `StockInBatchReportPage.tsx` |
| Customer Credit | `customerCreditReport.ts` | `useCustomerCreditReport.ts` | `CustomerCreditReportPage.tsx` |
| Sales & Payment Dashboard | `salesPaymentDashboard.ts` | `useSalesPaymentDashboard.ts` | `SalesPaymentDashboardPage.tsx` |
| Loan Reports | `loanReport.ts` | `useLoanReport.ts` | `LoanReportPage.tsx` |
| Purchase Price History | `purchasePriceHistory.ts` | `usePurchasePriceHistory.ts` | `PurchasePriceHistoryPage.tsx` |
| Monthly Credit | `monthlyCreditReport.ts` | `useMonthlyCreditReport.ts` | `MonthlyCreditReportPage.tsx` |
| Reconcile & Audit | `reconcileAuditReport.ts` | `useReconcileAuditReport.ts` | `ReconcileAuditReportPage.tsx` |
| Tax AIT Details | `taxAitDetailsReport.ts` | `useTaxAitDetailsReport.ts` | `TaxAitDetailsReportPage.tsx` |
| Tax AIT Summary | `taxAitSummaryReport.ts` | `useTaxAitSummaryReport.ts` | `TaxAitSummaryReportPage.tsx` |
| StockOut Sales Return | `stockOutSalesReturnReport.ts` | `useStockOutSalesReturnReport.ts` | `StockOutSalesReturnReportPage.tsx` |
| Employee Task | `employeeTaskReport.ts` | `useEmployeeTaskReport.ts` | `EmployeeTaskReportPage.tsx` |
| Allowance Checking | `allowanceCheckingReport.ts` | `useAllowanceCheckingReport.ts` | `AllowanceCheckingReportPage.tsx` |
| Customer Lookup | (no type file needed) | (reuse existing hooks) | `CustomerLookupPage.tsx` |
| Packing Print Panel | `packingPrint.ts` | `usePackingPrint.ts` | `PackingPrintPanelPage.tsx` |
| Sample Sticker Panel | (reuse packing types) | (reuse packing hooks) | `SampleStickerPanelPage.tsx` |

---

## 13. Testing Strategy

After implementing each report:

1. **TypeScript check:** Run `get_errors` on all new/modified files — must be zero errors.
2. **Build check:** Run `npm run build` in `v2-octopi/` — must succeed.
3. **Route check:** Verify the route works by navigating to it in the browser.
4. **Legacy redirect check:** Verify the old route redirects correctly.
5. **API check:** Verify the "Load Data" button triggers the correct API call and data renders.
6. **Excel check:** Verify "Export Excel" downloads a properly formatted `.xlsx` file.
7. **Empty state check:** Verify the empty/error/loading states render correctly.

---

## APPENDIX A: Complete API Endpoint Reference

| # | Endpoint | Method | Used By |
|---|---|---|---|
| 1 | `/Report/GetDeliveryInfoReport` | GET | Delivery Report |
| 2 | `/Report/GetDeliveryConveyance` | GET | Delivery Conveyance |
| 3 | `/Report/GetPendingAndCancelReport` | GET | Pending & Cancel |
| 4 | `/Report/GetDailyActivityTAT` | GET | Daily Invoice Tracking |
| 5 | `/Report/GetCustomerLoanDetails/{cId}/{pId}` | GET | Product Loan Details |
| 6 | `/Report/GetCustomerLoanSummery/{cId}/{pId}` | GET | Product Loan Summary |
| 7 | `/Report/GetAllStockOutBatchRelatedReport` | GET | StockOut Batch |
| 8 | `/Report/GetAllStockInBatchReport` | GET | StockIn Batch |
| 9 | `/Report/GetCustomerCreditHistory` | GET | Customer Credit Detail |
| 10 | `/Report/GetCustomerCreditSaleSummery` | GET | Customer Credit Summary |
| 11 | `/Report/GetSummarySalesOrPayment` | GET | Sales & Payment Dashboard |
| 12 | `/Report/GetMonthlyPurchaseSalesPaymentSummary` | GET | Sales & Payment Dashboard |
| 13 | `/Report/GetReportLoanDetails/{cId}/{pId}` | GET | Loan Reports Detail |
| 14 | `/Report/GetReportLoanSummery/{cId}/{pId}` | GET | Loan Reports Summary |
| 15 | `/Report/GetPurchasePriceHistory/{pId}` | GET | Purchase Price History |
| 16 | `/Report/GetCreditSummaryByMktByMonthForMd` | GET | Monthly Credit |
| 17 | `/Report/GetCurrentStockReconciliation` | GET | Reconcile Report |
| 18 | `/Report/GetCurrentStockAudit` | GET | Audit Report |
| 19 | `/Report/GetTaxAitDetails` | GET | Tax AIT Details |
| 20 | `/Report/GetTaxAitSummary` | GET | Tax AIT Summary |
| 21 | `/Report/GetCustomerStockOutWithStockInReport` | GET | StockOut + Sales Return |
| 22 | `/Task/summary` | GET | Employee Task Summary |
| 23 | `/Task/details` | GET | Employee Task Details |
| 24 | `/Report/GetAllowanceRelatedReport` | GET | Allowance Checking |
| 25 | `/StockOut/GetStockOutByIdInternal/{id}` | GET | Invoice Detail Modal |
| 26 | `/StockOut/StockOutPrintReportGridData` | GET | Packing Print Panel |
| 27 | `/StockOut/StickerStockOutOrderGridData/{type}` | GET | Sample Sticker Panel |

---

## APPENDIX B: Quick Reference — What to Copy From

| Scenario | Reference File |
|---|---|
| Standard report (filters + table + Excel) | `PaymentReportPage.tsx` |
| All reports (table-first + export) | `PaymentReportPage.tsx` (every report shows table first) |
| Report hook pattern | `usePaymentReport.ts` |
| Type definitions pattern | `types/paymentReport.ts` |
| Dual-API report (summary + detail) | Build from `usePaymentReport.ts` × 2 hooks |
| Modal pattern | `pages/batches/BatchListPage.tsx` → `EditBatchModal` |
| PaginatedCombobox usage | Any existing report page filter section |
| DropdownSelect (load-all) usage | `src/components/dropdowns/DropdownSelect.tsx` |
| Excel export call | `exportExcelOnDemand()` from `@/utils/lazyExportExcel` |

---

*Document generated for AI agent implementation. Follow every pattern exactly.*
