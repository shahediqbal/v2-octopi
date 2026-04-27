# Stock-In Create Parity Findings

## Scope

This note isolates only the create-page parity findings for:

- Legacy route: `/stockin/create`
- V2 route: `/stock-in/create`

The goal is to show what is actually missing, changed, or simplified in V2-Octopi so the remaining work is easy to understand without reading the larger migration plan.

## Files Compared

V2 files checked:

- `v2-octopi/src/pages/stock-in/AddStockInPage.tsx`
- `v2-octopi/src/pages/stock-in/StockInForm.tsx`
- `v2-octopi/src/pages/stock-in/StockInItemTable.tsx`
- `v2-octopi/src/pages/stock-in/PackModal.tsx`
- `v2-octopi/src/hooks/useStockIn.ts`
- `v2-octopi/src/features/stock-in/modes.ts`

Legacy files checked:

- `src/pages/stockin/CreateStockIn.js`
- `src/core/SalesOrderStockinItem.js`
- `src/pages/Maps/AddMapForStockin.js`
- `src/pages/Maps/EditMapForStockin.js`

## Confirmed Missing Or Changed In V2

### 1. `Sample_Issue` special create flow is missing

Legacy behavior:

- A dedicated `Sample_Issue` branch exists in the create page.
- It shows two tabs: `Sample By Category` and `Sample By Product`.
- `Sample By Category` bulk-adds products through `listProductDetailsBasedCategory(...)`.
- This is a different entry flow from the normal priced stock-in form.

Current V2 behavior:

- All create flows go through one standard product picker and one standard item table.
- No sample-specific tab flow exists.

Why this matters:

- Users cannot reproduce the legacy sample-entry workflow in V2.

### 2. `Warehouse_Transfer` quantity-only flow is missing

Legacy behavior:

- `Warehouse_Transfer` uses a simplified add-item flow with product plus quantity.
- The page does not follow the normal priced purchase/return flow for this mode.

Current V2 behavior:

- V2 still uses the standard item model with declared unit price and bill summary.

Why this matters:

- Warehouse transfer behavior is not aligned with the legacy operational workflow.

### 3. Partner rules do not fully match legacy for special order types

Legacy behavior visible on the create page:

- Supplier shown only for `Sample_Receive`, `Regular_Purchase`, and `Excess_From_Intact`.
- Customer shown only for `Exchange_Inward`, `Sales_Return`, and `Loan_Receive`.
- Neither supplier nor customer shown for `Mixing_Received`, `Internal_Transfer`, `Warehouse_Transfer`, and `Sample_Issue`.

Current V2 behavior:

- `requiresSupplier()` currently treats `Warehouse_Transfer` and `Sample_Issue` as supplier flows.

Why this matters:

- Users can be asked for the wrong partner data in V2 for these special types.

### 4. Header locking after adding items is missing

Legacy behavior:

- After items are added, the create page locks core header fields through the `switchTStuck` path.
- This prevents changing receive type or dependent header values mid-entry.

Current V2 behavior:

- Header fields remain editable after item rows are added.

Why this matters:

- Users can create mismatched header and item combinations that legacy prevented.

### 5. Supplier and customer address preview is missing

Legacy behavior:

- After selecting a supplier or customer, the form shows a read-only address preview.

Current V2 behavior:

- The payload shape still has `supplierAddress` and `customerAddress`.
- The create page does not fetch and render those address previews.

Why this matters:

- Users lose an immediate verification step they had in legacy.

### 6. Pack modal is only partial parity

Legacy behavior:

- Pack add/edit uses the pack-type lookup.
- It stores structured fields including pack type, pack size, pack quantity, and remarks.

Current V2 behavior:

- `PackModal` exposes `packDetails`, `packQuantity`, and free-text `packTypeName`.
- It does not load pack-type dropdown options.
- It does not capture legacy-style pack size and remarks as separate fields.

Why this matters:

- Pack metadata entry is less structured than the legacy form.

### 7. Discount percent toggle is missing

Legacy behavior:

- Discount can be interpreted as fixed amount or percentage.
- A visible `%` checkbox toggles the interpretation mode.

Current V2 behavior:

- V2 only has a flat discount amount input.

Why this matters:

- Discount semantics are reduced compared with legacy.

### 8. Currency selection is simplified

Legacy behavior:

- A constrained selector is shown in the create page for `BDT` and `USD`.

Current V2 behavior:

- `sibCurrencyName` is a plain text field.

Why this matters:

- The user no longer gets the stricter legacy selection behavior.

### 9. Total quantity summary is missing

Legacy behavior:

- The footer summary shows aggregate quantity in `Kg`.

Current V2 behavior:

- No aggregate quantity summary is shown on the create page.

Why this matters:

- Users lose a quick operational cross-check before saving.

## Batch And Pack Code-Level Issues In V2

These are code-level problems or risks in the current V2 implementation, separate from high-level UI parity.

### 1. Batch object shape in V2 does not match the legacy create contract

Legacy batch objects built by `CreateStockIn.js` use fields like:

- `batchNo`
- `batchProductionDate`
- `batchExpiryDate`
- `batchCertificateNo`
- `batchTestDate`
- `batchTestReport`

Current V2 batch objects use:

- `batchNumber`
- `expiryDate`
- `quantity`

Why this is a code-level issue:

- `AddStockInPage.tsx` and `EditStockInPage.tsx` send `sidBatches` straight to the API without any mapping layer.
- `EditStockInPage.tsx` also loads `item.sidBatches` straight into form defaults without normalization.
- If the backend still returns or expects the legacy shape, V2 batch create/edit will silently send the wrong contract and existing batch rows will not prefill correctly.

### 2. Pack object shape in V2 does not match the legacy create contract

Legacy pack objects built by `AddMapForStockin.js` and `EditMapForStockin.js` use fields like:

- `sipPackTypeId`
- `sipPackSize`
- `sipPackQty`
- `sipPackRemarks`
- `packTypeName`

Current V2 pack objects use:

- `packDetails`
- `packQuantity`
- `packTypeId`
- `packTypeName`

Why this is a code-level issue:

- `AddStockInPage.tsx` and `EditStockInPage.tsx` send `sidPacks` directly without converting to the legacy field names.
- `EditStockInPage.tsx` loads `item.sidPacks` directly into the form state without normalization.
- If the backend still speaks the legacy pack contract, V2 pack create/edit is contract-incompatible.

### 3. Existing batch rows in V2 can render blank if detail data comes back in legacy field names

Current V2 `StockInItemTable.tsx` expects batch rows to have:

- `batchNumber`
- `expiryDate`
- `quantity`

If detail data still comes back with legacy names such as `batchNo` and `batchExpiryDate`, the expanded batch table will show blank or missing values.

### 4. Existing pack rows in V2 can render blank if detail data comes back in legacy field names

Current V2 `StockInItemTable.tsx` expects pack rows to have:

- `packDetails`
- `packQuantity`
- `packTypeName`

If detail data comes back with legacy names such as `sipPackSize`, `sipPackQty`, and `sipPackRemarks`, the V2 expanded pack table will not display those values correctly because there is no normalization layer.

### 5. Batch modal currently drops legacy metadata even if the API tolerates the simplified shape

Legacy batch add/edit supports more metadata than V2 currently captures:

- production date
- expiry date
- certificate number
- test date
- test report flag

Current V2 `BatchModal` only captures:

- batch number
- expiry date
- quantity

Why this matters:

- Even if create does not hard-fail, V2 still loses legacy batch metadata at the form level.

### 6. Pack modal currently drops legacy metadata even if the API tolerates the simplified shape

Legacy pack add/edit supports:

- pack type dropdown
- pack size
- pack quantity
- remarks

Current V2 `PackModal` captures only a simplified combination of:

- `packDetails`
- `packQuantity`
- free-text `packTypeName`

Why this matters:

- Even if the API accepts the request, V2 is not preserving the same structured pack information.

## Present In V2 Already

These create-page capabilities are already present in V2 and should not be treated as missing:

- Standard create page and submission flow
- Order type selection
- Source and destination channel selection
- Source versus destination channel validation
- Conditional supplier and customer selection for the main standard cases
- Product add flow through the shared item table
- Loan receive mapped-product selection
- Batch add/edit support
- Basic pack add/edit support
- Physical invoice received flag and date
- Discount amount and adjustment amount fields
- Final bill total calculation

## Not Counted As Confirmed Gaps In This Pass

These were intentionally left out of the confirmed-missing list because the legacy page did not clearly prove them as active visible create-page features:

- `Order From`
- A top-level pack-type field on the main create form
- The hidden legacy price-summary sidebar

## Suggested Priority Order

If implementation starts from highest practical parity impact, this order is the most defensible:

1. Fix partner-rule mismatches for `Sample_Issue` and `Warehouse_Transfer`.
2. Add header locking after item entry.
3. Implement the `Warehouse_Transfer` quantity-only flow.
4. Implement the `Sample_Issue` special flow, including category-based bulk add.
5. Restore partner address preview.
6. Add a batch/pack normalization layer for load and submit paths so V2 can safely work against the legacy contract.
7. Upgrade the batch and pack modals to preserve legacy structured fields.
8. Restore discount-percent, currency-selector, and total-quantity summary behavior.

## Short Summary

The main gap is not the basic stock-in create path. V2 already handles the standard create workflow.

The actual missing parity is concentrated in:

- special create modes
- header lock behavior
- richer partner and pack metadata display
- richer bill controls

That means the next implementation pass should focus on mode-specific behavior rather than rebuilding the whole stock-in create page.