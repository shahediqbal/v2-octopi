# V2 Stock-Out Handoff Note — 2026-04-21

## Purpose

This note captures only the stock-out work completed in V2 so the same work can be reviewed, reused, or extended tomorrow, including follow-up work in admin modules.

## Completed Work So Far

### Sales Order create parity implementation for findings 1-6

Important instruction followed:
- Findings 7 and 8 were intentionally not implemented.

#### Finding 1. Standard create pricing semantics

Implemented result:
- Standard create now follows the legacy pricing behavior.
- Form state preserves final `unitPrice` for standard create behavior.
- Base price is preserved separately when needed through `baseUnitPrice`.
- Mapper behavior is now mode-aware so create/edit/admin flows do not all share the wrong pricing assumption.
- Standard-mode subtotal and line total behavior align with legacy create expectations.

Files changed:
- `v2-octopi/src/schemas/stockOutSchema.ts`
- `v2-octopi/src/pages/sales-orders/SalesOrderForm.tsx`
- `v2-octopi/src/pages/sales-orders/SalesOrderItemTable.tsx`
- `v2-octopi/src/pages/sales-orders/stockOutMappers.ts`
- `v2-octopi/src/pages/sales-orders/CreateSalesOrderPage.tsx`
- `v2-octopi/src/pages/sales-orders/EditSalesOrderPage.tsx`
- `v2-octopi/src/pages/sales-orders/stockOutMappers.test.ts`

#### Finding 2. Negative bill adjustment support

Implemented result:
- Negative `billAdjustmentAmount` is now accepted.
- This matches legacy behavior and the V2 UI text.

Files changed:
- `v2-octopi/src/schemas/stockOutSchema.ts`

#### Finding 3. Warehouse Transfer create flow parity

Implemented result:
- Added a dedicated Warehouse Transfer picker flow.
- Warehouse Transfer now behaves as quantity-only item entry.
- Pricing columns are hidden for Warehouse Transfer item rows.
- This aligns with the legacy create flow and downstream display assumptions.

Files changed:
- `v2-octopi/src/pages/sales-orders/SalesOrderForm.tsx`
- `v2-octopi/src/pages/sales-orders/SalesOrderItemTable.tsx`

#### Finding 4. Sidebar business intelligence parity

Implemented result:
- `PaymentInfo` now shows last payment amount.
- Sidebar now renders with proper select-state or no-data-state messaging in standard create flow.
- Stock, credit, price history, and last payment sections now behave consistently instead of disappearing prematurely.
- Last-payment handling was later corrected again after discovering that `/CustomerPayment/GetCustomerLastPayment/{id}` may return `dataObj` as an array.
- The UI now shows payment amount even when `paymentDate` is null.
- Purchase Return was not given a new sidebar because legacy create treats it as a special-order flow without that BI sidebar.

Files changed:
- `v2-octopi/src/pages/sales-orders/PaymentInfo.tsx`
- `v2-octopi/src/hooks/useStockOut.ts`
- `v2-octopi/src/types/stockOut.ts`
- `v2-octopi/src/pages/sales-orders/PaymentInfo.test.tsx`
- `v2-octopi/src/hooks/useStockOut.test.tsx`

#### Finding 5. Automatic price review

Implemented result:
- `soPriceReview` is now driven automatically in standard flow.
- Manual checkbox control is disabled for standard create.
- The form now follows the legacy auto-flagging behavior.

Files changed:
- `v2-octopi/src/pages/sales-orders/SalesOrderForm.tsx`

#### Finding 6. Header locking after items are added

Implemented result:
- In standard create, header selections become locked after the first item is added.
- This includes order type, order source, and customer or supplier selector where applicable.
- This matches the legacy create flow and prevents inconsistent header-item combinations.

Files changed:
- `v2-octopi/src/pages/sales-orders/SalesOrderForm.tsx`
- `v2-octopi/src/pages/sales-orders/SalesOrderForm.test.tsx`

## Tests and Validation Completed

Validated successfully:
- Targeted stock-out and sales-order tests passed.
- Added targeted tests for:
  - mapper behavior
  - create-form header locking
  - auto price review
  - payment info states
  - last-payment array response normalization
- Production build passed.

Verified commands during this work:
- `npm run test -- src/features/stock-out/calculations.test.ts src/pages/sales-orders/stockOutMappers.test.ts src/pages/sales-orders/StockOutPageStates.test.tsx src/pages/sales-orders/SalesOrderForm.test.tsx src/pages/sales-orders/PaymentInfo.test.tsx`
- `npm test -- src/hooks/useStockOut.test.tsx src/pages/sales-orders/PaymentInfo.test.tsx`
- `npm run build`

Status:
- Focused tests: pass
- Production build: pass

## Intentionally Not Implemented

Per instruction, these were not applied:
- Finding 7
- Finding 8

These remain intentionally untouched in this session.

## Important Technical Notes

### Last-payment API behavior

Endpoint:
- `/CustomerPayment/GetCustomerLastPayment/{customerId}`

Observed backend behavior:
- Sometimes returns `dataObj` as an array with one record instead of a single object.

Frontend handling now implemented:
- Normalize array response to first record in `useCustomerLastPayment()`.
- If payment amount exists but payment date is null, UI shows:
  - `Date unavailable`
  - `Amount: ...`
  instead of `No payments`.

### Standard create sidebar rule

Correct V2 behavior now:
- Standard create shows the BI card even before customer/product selection.
- The BI card shows select/no-data states until enough inputs exist.

Not added:
- A new Purchase Return BI sidebar was not introduced, because that would diverge from legacy create behavior.

## Good Starting Point For Tomorrow

Suggested continuation area:
- Admin-side stock-out or sales-order modules that still need parity or cleanup.

Recommended first checks tomorrow:
1. Review admin edit flows against the updated create-mode pricing semantics.
2. Check whether any admin tables or invoice views still assume the old `sodUnitPrice` / `sodBaseUnitPrice` behavior.
3. Review pending admin pages for any similar API-shape normalization issues.
4. Confirm whether admin-specific sales-order modules need the same BI or payment fixes.

## Main V2 Files Touched In This Session

### Stock-Out / Sales Orders
- `v2-octopi/src/hooks/useStockOut.ts`
- `v2-octopi/src/types/stockOut.ts`
- `v2-octopi/src/schemas/stockOutSchema.ts`
- `v2-octopi/src/pages/sales-orders/CreateSalesOrderPage.tsx`
- `v2-octopi/src/pages/sales-orders/EditSalesOrderPage.tsx`
- `v2-octopi/src/pages/sales-orders/SalesOrderForm.tsx`
- `v2-octopi/src/pages/sales-orders/SalesOrderItemTable.tsx`
- `v2-octopi/src/pages/sales-orders/PaymentInfo.tsx`
- `v2-octopi/src/pages/sales-orders/stockOutMappers.ts`

### Tests
- `v2-octopi/src/pages/sales-orders/StockOutPageStates.test.tsx`
- `v2-octopi/src/pages/sales-orders/stockOutMappers.test.ts`
- `v2-octopi/src/pages/sales-orders/SalesOrderForm.test.tsx`
- `v2-octopi/src/pages/sales-orders/PaymentInfo.test.tsx`
- `v2-octopi/src/hooks/useStockOut.test.tsx`

## Summary

At the end of this session:
- Sales-order create findings 1-6 are complete.
- Findings 7 and 8 remain intentionally excluded.
- Last-payment regression due to array-shaped API response is fixed.
- Focused tests and production build both pass.