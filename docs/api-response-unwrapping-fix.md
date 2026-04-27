# V2 API Response Unwrapping Fix — Reference Doc

## The Problem

The backend API returns two different response shapes depending on the endpoint:

| Shape | Example | Used for |
|---|---|---|
| **Doubly-nested** (list endpoints) | `{ dataObj: { data: [...] } }` | Most list/grid/history endpoints |
| **Singly-nested** (mutation response / simple object) | `{ dataObj: {...} }` | Create/update responses, some detail endpoints |

The v2 TanStack Query hooks were written assuming singly-nested `{ dataObj: [...] }` for all endpoints.  
For doubly-nested endpoints this returns a `{ data: [] }` **object** instead of an array — causing
`.filter()` / `.map()` to throw a `TypeError`, which surfaces as the red *"Failed to load …"* error banner.

---

## How to Identify a Doubly-Nested Endpoint

Check the **legacy Redux action** in `src/redux/actions/*.js`:

```js
// Doubly-nested — needs the fix
payload: data.dataObj.data        // ← .data present

// Singly-nested — no fix needed
payload: data.dataObj             // ← no .data
```

---

## Fix Pattern

```ts
// Lists / arrays — doubly-nested
.then((r) => r.dataObj?.data ?? [])

// Single-item detail — doubly-nested
.then((r) => r.dataObj?.data)

// Mutation responses / singly-nested — leave as-is
.then((r) => r.dataObj)
```

Also update the TypeScript generic on the `apiClient.get<>()` call to match:

```ts
// Before
apiClient.get<ApiResponse<PurchasePrice[]>>('/Price/GetAllPurcashePriceGrid')

// After
apiClient.get<ApiResponse<{ data: PurchasePrice[] }>>('/Price/GetAllPurcashePriceGrid')
```

---

## Fixed So Far

### `src/hooks/usePrice.ts` — fixed April 20 2026

| Hook | Endpoint | Fix Applied |
|---|---|---|
| `useSellingPrices()` | `GET /Price/GetAllSellingPrice` | `r.dataObj?.data ?? []` |
| `useSellingPriceHistory()` | `GET /Price/GetProductPriceHistory/{id}` | `r.dataObj?.data ?? []` |
| `useSellingPriceDetail()` | `GET /Price/GetAllSellingPriceByProductId/{id}` | `r.dataObj?.data` |
| `usePurchasePrices()` | `GET /Price/GetAllPurcashePriceGrid` | `r.dataObj?.data ?? []` |
| `usePurchasePriceHistory()` | `GET /Price/GetPurchasePriceHistory/{id}` | `r.dataObj?.data ?? []` |
| `usePurchasePriceDetail()` | `GET /Price/GetPurchasePriceById/{id}` | `r.dataObj?.data` |

---

## Modules Still To Check

> Update this table as more modules are confirmed:

| Hook File | Status | Notes |
|---|---|---|
| `usePrice.ts` | ✅ Fixed | All 6 queries fixed |
| `useSuppliers.ts` | ⬜ TBD | Check legacy `supplierActions.js` |
| `useCheques.ts` | ⬜ TBD | Check legacy cheque actions |
| `useStockOut.ts` | ⬜ TBD | Check legacy stock-out actions |
| `useLcTracking.ts` | ⬜ TBD | Check legacy LC actions |
| `useQuotation.ts` | ⬜ TBD | Check legacy quotation actions |
| _(others to be shared)_ | ⬜ TBD | — |

---

## Quick Diagnosis Checklist

1. Page shows red error banner ("Failed to load …")
2. Open browser DevTools → Network tab → find the failing API request → check response body
3. If response is `{ dataObj: { data: [...] } }` → hook needs `.dataObj?.data` fix
4. Search legacy action file for the endpoint URL to confirm double-nesting
5. Apply fix pattern above to the hook's `queryFn`
