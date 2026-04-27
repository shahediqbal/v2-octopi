# Stock-In Reports V2 Migration — AI Agent Execution Plan

## Overview

Migrate 6 missing stock-in report pages from the legacy React/Redux project to v2-octopi (React 19 + TypeScript + TanStack Query + Tailwind v4).

**Reference implementation:** `src/pages/reports/StockInBatchReportPage.tsx` — follow this file's exact patterns for all 6 reports.

---

## CRITICAL RULES

- **Named exports only** — NO default exports
- **Color palette:** ONLY `gray-*` — NO `blue`, `slate`, `indigo`, `purple`
- **Always use `@/` import alias** — NO relative paths
- **API responses:** Always unwrap with `.then(r => r.dataObj ?? [])`
- **Tables display FIRST** — on-screen HTML table before export options
- **Dropdowns:** Use centralized `DropdownSelect` (loadAll) or `PaginatedCombobox` (paginated) from `@/components/dropdowns`
- **Excel export:** Use `exportExcelOnDemand` from `@/utils/lazyExportExcel`
- **All nullable fields** in types: `T | null`

---

## FILES TO CREATE PER REPORT

For each report, create exactly 3 files:

```
src/types/{reportName}.ts          ← TypeScript interfaces (item + filters)
src/hooks/use{ReportName}.ts       ← TanStack Query hook with enabled flag
src/pages/reports/{ReportName}Page.tsx  ← Full page component
```

Then update these existing files:

```
src/router/AppRouter.tsx           ← Add route + legacy redirect
src/auth/menuMapper.ts             ← Add legacy path mapping
```

---

## REPORT 1: Current Stock Report

### Legacy
- **Path:** `/report/currentstock`
- **API:** `GET /Stock/GetCurrentStock/{productId}/{channelId}`
- **Filters:** Product (paginated dropdown), Channel (loadAll dropdown)
- **Columns:** productCategoryName, productId, productName, currentQty

### V2 Implementation

**File: `src/types/currentStock.ts`**
```typescript
export interface CurrentStockItem {
  productCategoryName: string | null
  productId: number | null
  productName: string | null
  currentQty: number | null
}

export interface CurrentStockFilters {
  productId: number
  channelId: number
}
```

**File: `src/hooks/useCurrentStock.ts`**
```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { CurrentStockItem, CurrentStockFilters } from '@/types/currentStock'

export const currentStockKeys = {
  all: ['currentStock'] as const,
  list: (f: CurrentStockFilters) => [...currentStockKeys.all, 'list', f] as const,
}

export function useCurrentStock(filters: CurrentStockFilters, enabled: boolean) {
  return useQuery({
    queryKey: currentStockKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<CurrentStockItem[]>>(
          `/Stock/GetCurrentStock/${filters.productId}/${filters.channelId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
```

**File: `src/pages/reports/CurrentStockReportPage.tsx`**

Page structure:
- Title: "Current Stock Report" / subtitle: "View current stock levels by product and channel."
- Filters row: Product (PaginatedCombobox type="product"), Channel (DropdownSelect type="channel")
- "Load Data" button (disabled if no product AND no channel selected)
- Summary stats: Total Records, Unique Products, Total Quantity
- Table columns: Category | Product ID | Product Name | Current Qty
- Excel export button
- Follow exact pattern from `StockInBatchReportPage.tsx`

**Route:** `/reports/current-stock` → `CurrentStockReportPage`
**Legacy redirect:** `/report/currentstock` → `/reports/current-stock`
**Menu mapper:** `'/report/currentstock': '/reports/current-stock'`

---

## REPORT 2: Product In Report (Product Stock-In Report)

### Legacy
- **Path:** `/report/productin`
- **API:** `GET /Report/GetProductInReport?startDate={from}&endDate={to}&productId={id}`
- **Filters:** From Date, To Date, Product (optional), client-side search term
- **Columns (17):** siSystemId, siSystemNo, siInvoiceNo, siInvoiceDate, siSupplierId, supplierName, customerName, jobType, sidProductId, productName, sidMappedProductId, mappedProductName, sidConfirmedQty, sidConfirmedUnitPrice, siCurrentStatus, lifecycleName, siRemarks

### V2 Implementation

**File: `src/types/productInReport.ts`**
```typescript
export interface ProductInReportItem {
  siSystemId: number | null
  siSystemNo: string | null
  siInvoiceNo: string | null
  siInvoiceDate: string | null
  siSupplierId: number | null
  supplierName: string | null
  customerName: string | null
  jobType: string | null
  sidProductId: number | null
  productName: string | null
  sidMappedProductId: number | null
  mappedProductName: string | null
  sidConfirmedQty: number | null
  sidConfirmedUnitPrice: number | null
  siCurrentStatus: number | null
  lifecycleName: string | null
  siRemarks: string | null
}

export interface ProductInReportFilters {
  startDate: string
  endDate: string
  productId: number
}
```

**File: `src/hooks/useProductInReport.ts`**
```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { ProductInReportItem, ProductInReportFilters } from '@/types/productInReport'

export const productInReportKeys = {
  all: ['productInReport'] as const,
  list: (f: ProductInReportFilters) => [...productInReportKeys.all, 'list', f] as const,
}

export function useProductInReport(filters: ProductInReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: productInReportKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<ProductInReportItem[]>>(
          `/Report/GetProductInReport?startDate=${filters.startDate}&endDate=${filters.endDate}&productId=${filters.productId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
```

**File: `src/pages/reports/ProductInReportPage.tsx`**

Page structure:
- Title: "Product Stock In Report" / subtitle: "View product-level stock-in transaction details."
- Filters row: From Date, To Date, Product (PaginatedCombobox, optional — pass 0 for all)
- Date validation (from <= to)
- "Load Data" button
- Client-side search: filter by productName, supplierName, siSystemNo, siInvoiceNo
- Summary stats: Total Records, Filtered, Unique Suppliers, Unique Products, Total Receive Qty
- Table columns: Invoice No (siSystemNo) | Supplier Invoice (siInvoiceNo) | Date | Supplier | Customer | Job Type | Product ID | Product Name | Mapped Product | Receive Qty | Unit Price | Status | Remarks
- Excel export with all 17 columns
- Follow exact pattern from `StockInBatchReportPage.tsx`

**Route:** `/reports/product-in` → `ProductInReportPage`
**Legacy redirect:** `/report/productin` → `/reports/product-in`
**Menu mapper:** `'/report/productin': '/reports/product-in'`

---

## REPORT 3: Stock Adjustment Report

### Legacy
- **Path:** `/report/stockin/stockadjustmentreport`
- **API:** `GET /StockIn/GetStockAdjustmentDetails/{referenceNameId}`
- **Reference dropdown API:** `GET /KeyValue/GetAdjsutmentRef` → returns `{ key, value }[]`
- **Filters:** Reference Name (dropdown from GetAdjsutmentRef endpoint)
- **Columns:** sadAutoId (ID), productName, sadProductQty (Quantity), sadIsIncreased (boolean → "Yes"/"No")

### V2 Implementation

**File: `src/types/stockAdjustmentReport.ts`**
```typescript
export interface StockAdjustmentReportItem {
  sadAutoId: number | null
  productName: string | null
  sadProductQty: number | null
  sadIsIncreased: boolean | null
}
```

**File: `src/hooks/useStockAdjustmentReport.ts`**
```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { StockAdjustmentReportItem } from '@/types/stockAdjustmentReport'

export const stockAdjustmentReportKeys = {
  all: ['stockAdjustmentReport'] as const,
  list: (refId: number) => [...stockAdjustmentReportKeys.all, 'list', refId] as const,
  references: ['stockAdjustmentReport', 'references'] as const,
}

export function useAdjustmentReferences() {
  return useQuery({
    queryKey: stockAdjustmentReportKeys.references,
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ key: number; value: string }[]>>('/KeyValue/GetAdjsutmentRef')
        .then((r) =>
          (r.dataObj ?? [])
            .filter((item) => item.value != null)
            .map((item) => ({ id: item.key, label: item.value }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        ),
    staleTime: 5 * 60_000,
  })
}

export function useStockAdjustmentReport(referenceId: number, enabled: boolean) {
  return useQuery({
    queryKey: stockAdjustmentReportKeys.list(referenceId),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StockAdjustmentReportItem[]>>(
          `/StockIn/GetStockAdjustmentDetails/${referenceId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
```

**File: `src/pages/reports/StockAdjustmentReportPage.tsx`**

Page structure:
- Title: "Stock Adjustment Report" / subtitle: "View stock adjustment details by reference."
- Filters row: Reference Name (custom autocomplete from `useAdjustmentReferences()` hook — NOT from centralized dropdown since it uses a separate endpoint `/KeyValue/GetAdjsutmentRef`)
- "Load Data" button (disabled if no reference selected)
- Summary stats: Total Records, Total Increased, Total Decreased, Total Quantity
- Table columns: ID (sadAutoId) | Product Name | Quantity | Increased? (render sadIsIncreased as green "Yes" / red "No" text)
- Excel export
- Follow exact pattern from `StockInBatchReportPage.tsx`

**Route:** `/reports/stock-adjustment` → `StockAdjustmentReportPage`
**Legacy redirect:** `/report/stockin/stockadjustmentreport` → `/reports/stock-adjustment`
**Menu mapper:** `'/report/stockin/stockadjustmentreport': '/reports/stock-adjustment'`

---

## REPORT 4: Stock By Product Report (Current Stock By Product)

### Legacy
- **Path:** `/report/getstockbyproduct`
- **API:** `GET /Stock/GetCurrentStock/{productId}/2` (channel ID fixed to 2)
- **Filters:** Product (required, paginated)
- **Columns:** productCategoryName, productId, productName, currentQty

### V2 Implementation

**File: `src/types/stockByProduct.ts`**
```typescript
export interface StockByProductItem {
  productCategoryName: string | null
  productId: number | null
  productName: string | null
  currentQty: number | null
}
```

**File: `src/hooks/useStockByProduct.ts`**
```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { StockByProductItem } from '@/types/stockByProduct'

export const stockByProductKeys = {
  all: ['stockByProduct'] as const,
  detail: (productId: number) => [...stockByProductKeys.all, 'detail', productId] as const,
}

export function useStockByProduct(productId: number, enabled: boolean) {
  return useQuery({
    queryKey: stockByProductKeys.detail(productId),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StockByProductItem[]>>(
          `/Stock/GetCurrentStock/${productId}/2`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
```

**File: `src/pages/reports/StockByProductReportPage.tsx`**

Page structure:
- Title: "Stock By Product" / subtitle: "View current stock levels for a specific product."
- Filters row: Product (PaginatedCombobox type="product", required)
- "Load Data" button (disabled if no product selected)
- Summary stats: Total Records, Total Current Qty
- Table columns: Category | Product ID | Product Name | Current Stock
- Excel export
- Follow exact pattern from `StockInBatchReportPage.tsx`

**Route:** `/reports/stock-by-product` → `StockByProductReportPage`
**Legacy redirect:** `/report/getstockbyproduct` → `/reports/stock-by-product`
**Menu mapper:** `'/report/getstockbyproduct': '/reports/stock-by-product'`

---

## REPORT 5: Stock In Summary Report

### Legacy
- **Path:** `/report/productinsummaryreport`
- **API:** `GET /Report/GetStockInSummaryReport?startDate={start}&endDate={end}&statusId=52&supplierId={id}&customerId={id}`
- **StatusId:** Fixed to 52 ("Stock in data approved")
- **Filters:** Start Date, End Date, Supplier (PaginatedCombobox, optional), Customer (PaginatedCombobox, optional)
- **Columns:** siInvoiceNo, siInvoiceDate, jobType, lifecycleName, sourceChannelName → destinationChannelName, partyName + partyAddress, sibFinalAmount, sibFinalConvertedBill, sibCurrencyName
- **Totals:** count, sum of sibFinalAmount, sum of sibFinalConvertedBill

### V2 Implementation

**File: `src/types/stockInSummary.ts`**
```typescript
export interface StockInSummaryItem {
  siInvoiceNo: string | null
  siInvoiceDate: string | null
  jobType: string | null
  lifecycleName: string | null
  sourceChannelName: string | null
  destinationChannelName: string | null
  partyName: string | null
  partyAddress: string | null
  sibFinalAmount: number | null
  sibFinalConvertedBill: number | null
  sibCurrencyName: string | null
}

export interface StockInSummaryFilters {
  startDate: string
  endDate: string
  statusId: number        // fixed: 52
  supplierId: number      // 0 = all
  customerId: number      // 0 = all
}
```

**File: `src/hooks/useStockInSummary.ts`**
```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { StockInSummaryItem, StockInSummaryFilters } from '@/types/stockInSummary'

export const stockInSummaryKeys = {
  all: ['stockInSummary'] as const,
  list: (f: StockInSummaryFilters) => [...stockInSummaryKeys.all, 'list', f] as const,
}

export function useStockInSummary(filters: StockInSummaryFilters, enabled: boolean) {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    statusId: String(filters.statusId),
  })
  if (filters.supplierId) params.set('supplierId', String(filters.supplierId))
  if (filters.customerId) params.set('customerId', String(filters.customerId))

  return useQuery({
    queryKey: stockInSummaryKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StockInSummaryItem[]>>(
          `/Report/GetStockInSummaryReport?${params.toString()}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
```

**File: `src/pages/reports/StockInSummaryReportPage.tsx`**

Page structure:
- Title: "Stock In Summary Report" / subtitle: "View aggregated stock-in data with financial summary."
- Filters row: Start Date, End Date, Supplier (PaginatedCombobox, optional), Customer (PaginatedCombobox, optional)
- Note: statusId is always 52 (hardcoded, not shown to user)
- Date validation
- "Load Data" button
- Summary stats: Total Records, Total Final Amount (formatted currency), Total Converted Bill (formatted currency)
- Table columns: Invoice No | Date | Job Type | Status | Source → Destination (combine sourceChannelName + " → " + destinationChannelName) | Party (partyName, with partyAddress as secondary text) | Final Amount | Converted Bill | Currency
- Format amounts: `toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`
- Excel export with proper number formatting
- Follow exact pattern from `StockInBatchReportPage.tsx`

**Route:** `/reports/stockin-summary` → `StockInSummaryReportPage`
**Legacy redirect:** `/report/productinsummaryreport` → `/reports/stockin-summary`
**Menu mapper:** `'/report/productinsummaryreport': '/reports/stockin-summary'`

---

## REPORT 6: Product In With Adjustment Report

### Legacy
- **Path:** `/report/productin-with-adjustment`
- **API:** `GET /Report/GetProductStockInWithAdjustment?startDate={from}&endDate={to}&productId={id}`
- **Filters:** From Date, To Date, Product (optional), client-side search
- **Columns:** siSystemNo, siInvoiceDate, supplierName, customerName, productName, sidConfirmedQty, sidConfirmedUnitPrice, adjustmentAmount, adjustedUnitPrice
- **IMPORTANT field fallback logic:**
  - `adjustmentAmount` = `value.adjustmentAmount ?? value.sidAdjustedAmount ?? value.sidAdjustmentAmount ?? value.sidAdjustmentQty ?? 0`
  - `adjustedUnitPrice` = `value.adjustedUnitPrice ?? value.sidAdjustedUnitPrice ?? value.sidFinalUnitPrice ?? value.sidConfirmedUnitPrice ?? 0`

### V2 Implementation

**File: `src/types/productInWithAdjustment.ts`**
```typescript
export interface ProductInWithAdjustmentItem {
  siSystemNo: string | null
  siInvoiceDate: string | null
  supplierName: string | null
  customerName: string | null
  sidProductId: number | null
  productName: string | null
  sidConfirmedQty: number | null
  sidConfirmedUnitPrice: number | null
  adjustmentAmount: number | null
  adjustedUnitPrice: number | null
  // Raw API fields (used for fallback mapping in hook)
  sidAdjustedAmount?: number | null
  sidAdjustmentAmount?: number | null
  sidAdjustmentQty?: number | null
  sidAdjustedUnitPrice?: number | null
  sidFinalUnitPrice?: number | null
}

export interface ProductInWithAdjustmentFilters {
  startDate: string
  endDate: string
  productId: number
}
```

**File: `src/hooks/useProductInWithAdjustment.ts`**
```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { ProductInWithAdjustmentItem, ProductInWithAdjustmentFilters } from '@/types/productInWithAdjustment'

export const productInWithAdjustmentKeys = {
  all: ['productInWithAdjustment'] as const,
  list: (f: ProductInWithAdjustmentFilters) => [...productInWithAdjustmentKeys.all, 'list', f] as const,
}

export function useProductInWithAdjustment(filters: ProductInWithAdjustmentFilters, enabled: boolean) {
  return useQuery({
    queryKey: productInWithAdjustmentKeys.list(filters),
    queryFn: async () => {
      const raw = await apiClient
        .get<ApiResponse<ProductInWithAdjustmentItem[]>>(
          `/Report/GetProductStockInWithAdjustment?startDate=${filters.startDate}&endDate=${filters.endDate}&productId=${filters.productId}`,
        )
        .then((r) => r.dataObj ?? [])

      // Apply field fallback logic from legacy
      return raw.map((item) => ({
        ...item,
        adjustmentAmount:
          item.adjustmentAmount ?? item.sidAdjustedAmount ?? item.sidAdjustmentAmount ?? item.sidAdjustmentQty ?? 0,
        adjustedUnitPrice:
          item.adjustedUnitPrice ?? item.sidAdjustedUnitPrice ?? item.sidFinalUnitPrice ?? item.sidConfirmedUnitPrice ?? 0,
      }))
    },
    enabled,
    staleTime: 2 * 60_000,
  })
}
```

**File: `src/pages/reports/ProductInWithAdjustmentPage.tsx`**

Page structure:
- Title: "Stock In Report With Adjustment" / subtitle: "View stock-in transactions with price adjustment details."
- Filters row: From Date, To Date, Product (PaginatedCombobox, optional — pass 0 for all)
- Date validation
- "Load Data" button
- Client-side search: filter by productName, supplierName, siSystemNo, siInvoiceDate
- Summary stats: Total Records, Filtered, Total Receive Qty, Total Adjustment Amount
- Table columns: Invoice No | Date | Supplier | Customer | Product | Receive Qty | Unit Price | Adjustment Amount | Adjusted Unit Price
- Format numbers: `toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 4 })`
- Excel export with number formatting for quantity and price columns
- Follow exact pattern from `StockInBatchReportPage.tsx`

**Route:** `/reports/product-in-adjustment` → `ProductInWithAdjustmentPage`
**Legacy redirect:** `/report/productin-with-adjustment` → `/reports/product-in-adjustment`
**Menu mapper:** `'/report/productin-with-adjustment': '/reports/product-in-adjustment'`

---

## ROUTER UPDATES

In `src/router/AppRouter.tsx`, add inside the `<Route element={<AppShell />}>` block:

```typescript
// Stock-In Reports
<Route path="reports/current-stock" element={<CurrentStockReportPage />} />
<Route path="reports/product-in" element={<ProductInReportPage />} />
<Route path="reports/stock-adjustment" element={<StockAdjustmentReportPage />} />
<Route path="reports/stock-by-product" element={<StockByProductReportPage />} />
<Route path="reports/stockin-summary" element={<StockInSummaryReportPage />} />
<Route path="reports/product-in-adjustment" element={<ProductInWithAdjustmentPage />} />
```

Add legacy redirects:

```typescript
<Route path="report/currentstock" element={<Navigate to="/reports/current-stock" replace />} />
<Route path="report/productin" element={<Navigate to="/reports/product-in" replace />} />
<Route path="report/stockin/stockadjustmentreport" element={<Navigate to="/reports/stock-adjustment" replace />} />
<Route path="report/getstockbyproduct" element={<Navigate to="/reports/stock-by-product" replace />} />
<Route path="report/productinsummaryreport" element={<Navigate to="/reports/stockin-summary" replace />} />
<Route path="report/productin-with-adjustment" element={<Navigate to="/reports/product-in-adjustment" replace />} />
```

## MENU MAPPER UPDATES

In `src/auth/menuMapper.ts`, add to the `PATH_MAP`:

```typescript
'/report/currentstock': '/reports/current-stock',
'/report/productin': '/reports/product-in',
'/report/stockin/stockadjustmentreport': '/reports/stock-adjustment',
'/report/getstockbyproduct': '/reports/stock-by-product',
'/report/productinsummaryreport': '/reports/stockin-summary',
'/report/productin-with-adjustment': '/reports/product-in-adjustment',
```

---

## IMPLEMENTATION ORDER

1. **Report 4** (Stock By Product) — simplest, single filter, small table
2. **Report 1** (Current Stock) — similar to Report 4, adds channel dropdown
3. **Report 3** (Stock Adjustment) — new custom dropdown endpoint
4. **Report 2** (Product In) — date range + search + 17 columns
5. **Report 6** (Product In With Adjustment) — date range + field fallback logic
6. **Report 5** (Stock In Summary) — most complex, multiple optional filters + financial totals

---

## STYLING REFERENCE

Copy these exact patterns from `StockInBatchReportPage.tsx`:

```typescript
// Input styling
const inputCls = 'h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200'

// Date helpers
function todayStr() { /* same as StockInBatchReportPage */ }
function firstDayOfMonth() { /* same as StockInBatchReportPage */ }
function fmtDate(value: string | null) { /* same */ }
function fmtDateShort(value: string) { /* same */ }
function fmtQty(value: number | null) { /* same */ }

// StatCard component — reuse the inline StatCard from StockInBatchReportPage
```

## VERIFICATION CHECKLIST

After implementing each report, verify:
- [ ] `npx tsc --noEmit` passes (zero errors)
- [ ] Route renders the page at the v2 path
- [ ] Legacy redirect works (e.g., `/report/currentstock` → `/reports/current-stock`)
- [ ] Menu mapper entry added
- [ ] Filters work and "Load Data" fetches from API
- [ ] Table displays data with proper formatting
- [ ] Client-side search filters table rows (where applicable)
- [ ] Summary stats calculate correctly from data
- [ ] Excel export works with proper column formatting
- [ ] Page is responsive (stacks on mobile)
