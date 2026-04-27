# Stock-In Module — V2 Migration: Understanding & Execution Plan

> **Purpose**: Complete technical reference for migrating the legacy Stock-In module to V2-Octopi ERP.  
> **Audience**: AI agents, developers performing the migration.  
> **Last Updated**: 2026-04-13

---

## Table of Contents

1. [Module Scope & Route Inventory](#1-module-scope--route-inventory)
2. [Legacy File Inventory](#2-legacy-file-inventory)
3. [Complete API Endpoint Inventory](#3-complete-api-endpoint-inventory)
4. [Data Models & TypeScript Interfaces](#4-data-models--typescript-interfaces)
5. [Business Workflow & Status Lifecycle](#5-business-workflow--status-lifecycle)
6. [Order Type Logic & Conditional Fields](#6-order-type-logic--conditional-fields)
7. [Financial Calculations](#7-financial-calculations)
8. [Legacy Redux State Management](#8-legacy-redux-state-management)
9. [Key Technical Findings from Legacy](#9-key-technical-findings-from-legacy)
10. [V2 Architecture & File Organization](#10-v2-architecture--file-organization)
11. [V2 Route Mapping (Legacy → V2)](#11-v2-route-mapping-legacy--v2)
12. [V2 Module Layout (Files to Create)](#12-v2-module-layout-files-to-create)
13. [Query Strategy & Cache Invalidation](#13-query-strategy--cache-invalidation)
14. [Mode System Design](#14-mode-system-design)
15. [Form Schema Design (Zod)](#15-form-schema-design-zod)
16. [Component Breakdown](#16-component-breakdown)
17. [Dropdown Integration](#17-dropdown-integration)
18. [Excel & PDF Export](#18-excel--pdf-export)
19. [Execution Plan (Phases)](#19-execution-plan-phases)
20. [Migration Checklist](#20-migration-checklist)

---

## 1. Module Scope & Route Inventory

The Stock-In module handles **inbound inventory management** — receiving goods from suppliers, customers (returns/exchanges), internal transfers, and adjustments. It includes CRUD, escalation, quantity confirmation, admin actions, invoicing, pricing, and reporting.

### 1.1 Core Routes (8 routes)

| # | Legacy Route | Purpose | Legacy Component |
|---|---|---|---|
| 1 | `/stockin/list` | List pending stock-in orders (status 50) | `Stockin.js` |
| 2 | `/stockin/create` | Create new stock-in order | `CreateStockIn.js` |
| 3 | `/stockin/:id/edit` | Edit draft stock-in order | `EditStockin.js` |
| 4 | `/stockin/unapprovedqty/list` | List escalated orders awaiting qty confirmation | `StockinForConfirmation.js` |
| 5 | `/stockin/:id/confirmQty` | Confirm received quantities | `UpdateStockinQuantity.js` |
| 6 | `/stockin/stockadjustment` | Stock adjustment/correction | `CreatestockAdjustment.js` |
| 7 | `/stockin/priceupdatelist` | List orders eligible for price update | `StockInPriceEditList.js` |
| 8 | `/stockin/:id/updateprice` | Update item prices on existing order | `StockInPriceUpdate.js` |

### 1.2 Admin Routes (3 routes)

| # | Legacy Route | Purpose | Legacy Component |
|---|---|---|---|
| 9 | `/stockinadminaction` | List approved/received stock-ins (status 52) | `ListStockInApproved.js` |
| 10 | `/stockin/:id/stockinadminrevert` | Revert approved stock-in | `StockInAdminRevert.js` |
| 11 | *(escalation action on list page)* | Escalate pending to operation team | Built into `Stockin.js` |

### 1.3 Invoice & Reporting Routes (3 routes)

| # | Legacy Route | Purpose | Legacy Component |
|---|---|---|---|
| 12 | `/stockin/stockininvoicelist` | Search stock-in invoices/challans | `StockInInvoiceList.js` |
| 13 | `/stockin/invoicereport` | Generate invoice report with PDF export | `ProdctInReport.js` |
| 14 | *(stock adjustment report)* | Stock adjustment history | `StockAdjustmentReport.js` |

**Total: 14 distinct views/pages across 12 routes**

---

## 2. Legacy File Inventory

### 2.1 Page Components

| File | Path | Purpose |
|---|---|---|
| `Stockin.js` | `src/pages/stockin/Stockin.js` | Pending stock-in list (DataGrid, escalation) |
| `CreateStockIn.js` | `src/pages/stockin/CreateStockIn.js` | Create form with items, batch/pack management |
| `EditStockin.js` | `src/pages/stockin/EditStockin.js` | Edit form (pre-populated from API) |
| `StockinForConfirmation.js` | `src/pages/stockin/StockinForConfirmation.js` | Unapproved qty list |
| `UpdateStockinQuantity.js` | `src/pages/stockin/UpdateStockinQuantity.js` | Confirm received qty per item |
| `StockInPriceEditList.js` | `src/pages/stockin/StockInPriceEditList.js` | Price update list |
| `StockInPriceUpdate.js` | `src/pages/stockin/StockInPriceUpdate.js` | Update prices (similar to edit) |
| `StockInInvoiceList.js` | `src/pages/stockin/StockInInvoiceList.js` | Invoice/challan search |
| `StockInInvoiceListStyle.js` | `src/pages/stockin/StockInInvoiceListStyle.js` | Styles for invoice list |
| `ProdctInReport.js` | `src/pages/stockin/ProdctInReport.js` | Invoice report + PDF export |
| `ListStockInApproved.js` | `src/pages/stockin/StockRevert/ListStockInApproved.js` | Admin: approved stock-in list |
| `StockInAdminRevert.js` | `src/pages/stockin/StockRevert/StockInAdminRevert.js` | Admin: revert approved stock-in |
| `CreatestockAdjustment.js` | `src/pages/StockAdjustment/CreatestockAdjustment.js` | Stock adjustment form |
| `StockAdjustmentReport.js` | `src/pages/StockAdjustment/StockAdjustmentReport.js` | Adjustment history report |

### 2.2 Core/Shared Components (Stock-In Specific)

| File | Path | Purpose |
|---|---|---|
| `SalesOrderStockinItem.js` | `src/core/SalesOrderStockinItem.js` | Item row in create/edit forms |
| `ConfrimStockinItem.js` | `src/core/ConfrimStockinItem.js` | Read-only item display for confirmation |
| `AdminRevertStockIn.js` | `src/core/AdminRevertStockIn.js` | Item table for revert (fields disabled) |
| `StockInItemModal.js` | `src/core/StockInItemModal.js` | Detailed item view modal |
| `StokInChallanModal.js` | `src/core/StokInChallanModal.js` | Invoice/challan details modal |
| `StockinView.js` | `src/core/StockinView.js` | Quick preview of stock-in details |

### 2.3 Redux Files

| File | Path | Purpose |
|---|---|---|
| `stockInConstants.js` | `src/redux/constants/stockInConstants.js` | 48 action type constants |
| `stockInActions.js` | `src/redux/actions/stockInActions.js` | 10 action creators |
| `StockinReducers.js` | `src/redux/reducers/StockinReducers.js` | 10 reducer functions |

### 2.4 Supporting Modals (used in Create/Edit/Price Update)

| Modal | Purpose |
|---|---|
| `AddBatchForStockin` | Add batch details (batch number, expiry date) to line item |
| `EditBatchForStockin` | Edit existing batch details |
| `AddMapForStockin` | Add pack/mapping details to line item |
| `EditMapForStockin` | Edit existing pack/mapping details |

---

## 3. Complete API Endpoint Inventory

### 3.1 CRUD Operations

| HTTP | Endpoint | Purpose | Used By |
|---|---|---|---|
| `POST` | `/StockIn/CreateStockInOrder` | Create new stock-in order | CreateStockIn |
| `GET` | `/StockIn/GetStockInOrderDetails/{id}` | Get order details by ID | Edit, ConfirmQty, PriceUpdate, AdminRevert, InvoiceReport |
| `PUT` | `/StockIn/UpdateStockInOrder` | Update existing stock-in order | Edit, PriceUpdate, ConfirmQty |

### 3.2 List Operations

| HTTP | Endpoint | Purpose | Status Code |
|---|---|---|---|
| `GET` | `/StockIn/StockInOrderGridData/50` | Pending/draft orders | status=50 |
| `GET` | `/StockIn/StockInOrderGridData/52` | Approved/received orders | status=52 |
| `GET` | `/StockIn/StockInOrderGridData/{order}` | Generic list by status | Various |

### 3.3 Workflow Operations

| HTTP | Endpoint | Purpose | Used By |
|---|---|---|---|
| `PUT` | `/StockIn/SubmitForStockConfirmation` | Escalate to operation team | Stockin list (escalate action) |
| `PUT` | `/StockIn/ConfirmReceivedStock/{id}` | Confirm received quantities | UpdateStockinQuantity |
| `PUT` | `/StockIn/RevertReceivedStock/{siSystemId}` | Revert approved stock-in | StockInAdminRevert |

### 3.4 Stock Adjustment

| HTTP | Endpoint | Purpose | Used By |
|---|---|---|---|
| `POST` | `/StockIn/AdjustStock` | Create stock adjustment | CreatestockAdjustment |

### 3.5 Invoice & Reporting

| HTTP | Endpoint | Purpose | Used By |
|---|---|---|---|
| `GET` | `/StockIn/GetStockInInvoiceList/{supplierId}/{customerId}` | Search invoices by supplier/customer | StockInInvoiceList |
| `GET` | `/StockIn/GetStockInChallan/{id}` | Get challan/invoice details | StockInInvoiceList (modal) |

### 3.6 Lookup/Dependency Endpoints (Shared)

| HTTP | Endpoint | Purpose |
|---|---|---|
| `GET` | `/KeyValue/GetDropdown?type=supplier` | Supplier dropdown |
| `GET` | `/KeyValue/GetDropdown?type=customer` | Customer dropdown (paginated) |
| `GET` | `/KeyValue/GetDropdown?type=channel` | Channel dropdown |
| `GET` | `/KeyValue/GetDropdown?type=packType` | Pack type dropdown |
| `GET` | `/KeyValue/GetDropdown?type=product` | Product dropdown (paginated) |
| `GET` | `/KeyValue/GetDropdown?type=productCategory` | Product category dropdown |
| `GET` | *Legacy endpoints for order type, order from* | May need new dropdown types |

### 3.7 API Response Format

All endpoints follow the standard wrapper:
```typescript
interface ApiResponse<T> {
  dataObj: T;
  errMsg?: string;
  title?: string;
}
```

---

## 4. Data Models & TypeScript Interfaces

### 4.1 Stock-In Order (Header)

```typescript
// V2 type definition
export interface StockInGeneralData {
  siSystemId: number;              // Primary key / system ID
  siSystemNo: string;             // Display number (e.g., "SI-00123")
  siCustomerInvoice: string;      // External reference / invoice number
  siSupplierId: number | null;    // Supplier ID (for purchase types)
  siCustomerId: number | null;    // Customer ID (for return/exchange types)
  siChannelId: number;            // Source channel ID
  siDestinationChannelId: number; // Destination channel ID
  siOrderTypeId: number;          // Order type enum value
  siOrderType: string;            // Order type label
  siOrderFromId: number;          // "Order From" enum value
  siOrderFrom: string;            // "Order From" label
  siPackTypeId: number;           // Pack type enum value
  siDateOfIssue: string;          // ISO date string
  siCurrentStatus: number;        // Status code (50=pending, 52=approved)
  siNotes: string;                // General notes
  siCreatedAt: string;            // Creation timestamp
  siUpdatedAt: string;            // Last update timestamp
  // Display-only fields from list grid:
  supplierName?: string;
  customerName?: string;
  channelName?: string;
  destinationChannelName?: string;
}
```

### 4.2 Stock-In Item (Line Item)

```typescript
export interface StockInItemData {
  sidId: number;                          // Item primary key
  sidProductId: number;                   // Product ID
  sidProductName: string;                // Product name (display)
  sidDeclaredQty: number;               // User-declared quantity
  sidConfirmedQty: number | null;       // Operation-confirmed quantity
  sidDeclaredUnitPrice: number;         // User-declared unit price
  sidConfirmedUnitPrice: number | null; // Operation-confirmed unit price
  sidLineTotal: number;                 // qty × unitPrice (auto-calculated)
  sidProductStrength: string;           // Product strength/potency
  sidBatches: StockInBatch[];           // Batch details array
  sidPacks: StockInPack[];             // Pack/mapping details array
  sidMappedProductId: number | null;   // For Loan_Receive: mapped product ID
  sidMappedProductName: string;        // For Loan_Receive: mapped product name
}
```

### 4.3 Stock-In Batch

```typescript
export interface StockInBatch {
  batchId: number;
  batchNumber: string;
  expiryDate: string;        // ISO date
  quantity: number;
  // Additional batch fields as determined by API
}
```

### 4.4 Stock-In Pack/Mapping

```typescript
export interface StockInPack {
  packId: number;
  packDetails: string;
  // Additional pack fields as determined by API
}
```

### 4.5 Stock-In Bill/Financial Summary

```typescript
export interface StockInBillData {
  subTotal: number;         // Sum of all line totals
  vatAmount: number;        // VAT amount
  aitAmount: number;        // AIT (Advance Income Tax) amount
  discountAmount: number;   // Discount amount
  total: number;            // Final total = subTotal + VAT + AIT - discount
}
```

### 4.6 Stock-In Order Detail (Complete)

```typescript
export interface StockInOrderDetail {
  stockInGeneralData: StockInGeneralData;
  stockInItemsData: StockInItemData[];
  stockInBillData: StockInBillData;
}
```

### 4.7 Stock-In List Row (Grid)

```typescript
export interface StockInListRow {
  siSystemId: number;
  siSystemNo: string;
  productName: string;
  unitPrice: number;
  declaredQty: number;
  confirmedQty: number | null;
  supplierName: string;
  customerName: string;
  orderType: string;
  status: number;
  createdAt: string;
}
```

### 4.8 Stock Adjustment

```typescript
export interface StockAdjustmentPayload {
  soCustomerReferance: string;    // Reference number (mandatory)
  channelId: number;              // Channel ID (mandatory)
  dateOfIssue: string;            // ISO date
  notes: string;
  items: StockAdjustmentItem[];
}

export interface StockAdjustmentItem {
  productId: number;
  productName: string;
  quantity: number;           // Can be negative for deductions
  currentStock: number;      // Read-only, fetched from API
}
```

### 4.9 Stock-In Invoice/Challan

```typescript
export interface StockInInvoice {
  id: number;
  invoiceNumber: string;
  supplierName: string;
  customerName: string;
  date: string;
  totalAmount: number;
  items: StockInInvoiceItem[];
}

export interface StockInInvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface StockInInvoiceFilters {
  supplierId: number;
  customerId: number;
  startDate?: string;
  endDate?: string;
}
```

### 4.10 Escalation Payload

```typescript
// Submitted when escalating from pending list
export type EscalationPayload = StockInItemData[];
// Sent via PUT /StockIn/SubmitForStockConfirmation
```

### 4.11 Quantity Confirmation Payload

```typescript
export interface QuantityConfirmationItem {
  productId: number;
  sidConfirmedQty: number;
  sidConfirmedUnitPrice: number;
}
// Array sent via PUT /StockIn/ConfirmReceivedStock/{id}
```

### 4.12 Admin Revert Payload

```typescript
export interface RevertItem {
  productId: number;
  sidConfirmedQty: number;    // Quantity being reverted
}
// Array sent via PUT /StockIn/RevertReceivedStock/{siSystemId}
```

---

## 5. Business Workflow & Status Lifecycle

### 5.1 Main Stock-In Lifecycle

```
┌─────────────┐    Escalate      ┌──────────────┐    Confirm Qty    ┌─────────────┐
│   PENDING    │ ──────────────► │  ESCALATED    │ ───────────────► │  APPROVED    │
│  (Status 50) │                 │ (In-between)  │                  │ (Status 52)  │
└──────┬───────┘                 └───────────────┘                  └──────┬───────┘
       │                                                                   │
       │ Edit                                                              │ Admin Revert
       ▼                                                                   ▼
┌─────────────┐                                                    ┌─────────────┐
│  EDIT FORM  │                                                    │  REVERTED   │
│ (same form) │                                                    │ (back to    │
└─────────────┘                                                    │  pending)   │
                                                                   └─────────────┘
```

### 5.2 Step-by-Step Flow

1. **Create** (`/stockin/create`): User creates stock-in order with supplier/customer, order type, channel, items (products + quantities + prices). System saves as **Pending (status 50)**.

2. **Edit** (`/stockin/:id/edit`): User can edit any pending order — modify items, quantities, prices, batches, packs.

3. **Escalate** (action on `/stockin/list`): User selects one or more pending orders and submits them to the operation team for physical verification. API: `PUT /StockIn/SubmitForStockConfirmation`.

4. **Quantity Confirmation** (`/stockin/:id/confirmQty`): Operation team physically verifies received goods and enters **confirmed quantities** and **confirmed unit prices** (which may differ from declared). API: `PUT /StockIn/ConfirmReceivedStock/{id}`.

5. **Approved** (status 52): After quantity confirmation, the stock-in order moves to approved status. Stock is added to inventory.

6. **Admin Revert** (`/stockin/:id/stockinadminrevert`): Admin can reverse an approved stock-in, removing the confirmed quantities from inventory. API: `PUT /StockIn/RevertReceivedStock/{siSystemId}`.

### 5.3 Ancillary Flows

- **Price Update** (`/stockin/priceupdatelist` → `/stockin/:id/updateprice`): Modify item prices on existing orders (post-creation price corrections).

- **Stock Adjustment** (`/stockin/stockadjustment`): Independent from stock-in orders — allows direct adjustment of stock quantities (positive or negative) at a channel level. Reference number required for audit trail.

- **Invoice Search** (`/stockin/stockininvoicelist`): Search stock-in invoices by supplier + customer combination. View challan details in modal.

- **Invoice Report** (`/stockin/invoicereport`): Enter a stock-in system ID, view order details, and export to PDF.

---

## 6. Order Type Logic & Conditional Fields

### 6.1 Order Types

The stock-in order type determines which partner entity (supplier or customer) is required:

| Order Type | Requires | Description |
|---|---|---|
| `Sample_Receive` | **Supplier** | Receiving product samples from suppliers |
| `Regular_Purchase` | **Supplier** | Standard purchase order receipt |
| `Excess_From_Intact` | **Supplier** | Receiving excess/overflow inventory |
| `Exchange_Inward` | **Customer** | Customer exchange — receiving returned items |
| `Sales_Return` | **Customer** | Products returned from a sale |
| `Loan_Receive` | **Customer** | Receiving loaned products back (special: auto-loads mapped products) |
| `Mixing_Received` | **Neither** | Internal mixing operation output |
| `Internal_Transfer` | **Neither** | Internal channel-to-channel transfer |

### 6.2 Conditional UI Behavior

```
if orderType in [Sample_Receive, Regular_Purchase, Excess_From_Intact]:
    SHOW Supplier dropdown (required)
    HIDE Customer dropdown

if orderType in [Exchange_Inward, Sales_Return, Loan_Receive]:
    SHOW Customer dropdown (required)
    HIDE Supplier dropdown

if orderType in [Mixing_Received, Internal_Transfer]:
    HIDE Supplier dropdown
    HIDE Customer dropdown
```

### 6.3 Loan_Receive Special Logic

When `orderType === 'Loan_Receive'`:
1. After selecting a product, system auto-fetches mapped products via `listBatchAndMappedItemBasedOnProduct(productId)`
2. User must select a **mapped product** for each line item
3. The mapped product info is stored as `sidMappedProductId` and displayed in confirmation views
4. The `ConfrimStockinItem` component shows an additional "Mapped Product" column for Loan_Receive orders

### 6.4 Channel Validation

- **Source Channel** and **Destination Channel** are both mandatory
- **Validation Rule**: Source Channel ≠ Destination Channel
- Both use the `channel` dropdown type from the centralized dropdown system

---

## 7. Financial Calculations

### 7.1 Line Item Calculation

```typescript
lineTotal = sidDeclaredQty × sidDeclaredUnitPrice
// OR after confirmation:
lineTotal = sidConfirmedQty × sidConfirmedUnitPrice
```

### 7.2 Bill Calculations

```typescript
subTotal = Σ(lineTotal for all items)
vatAmount = computed (exact logic TBD from API/legacy)
aitAmount = computed (exact logic TBD from API/legacy)
discountAmount = computed (exact logic TBD from API/legacy)
total = subTotal + vatAmount + aitAmount - discountAmount
```

### 7.3 Validation Rules

- Line Total cannot be negative
- Quantity must be positive (except stock adjustment which allows negative)
- Unit Price must be non-negative

### 7.4 V2 Implementation

Create `features/stock-in/calculations.ts` with pure functions:

```typescript
export function calculateLineTotal(qty: number, unitPrice: number): number
export function calculateSubtotal(items: StockInItemData[]): number
export function calculateTotal(params: {
  subtotal: number;
  vatAmount: number;
  aitAmount: number;
  discountAmount: number;
}): number
export function validateLineTotal(lineTotal: number): boolean
```

---

## 8. Legacy Redux State Management

### 8.1 Action Types (48 constants)

```
STOCKIN_LIST_REQUEST / SUCCESS / FAIL
STOCKIN_CREATE_REQUEST / SUCCESS / FAIL / RESET
STOCKIN_ESCALATION_REQUEST / SUCCESS / FAIL / RESET
STOCKIN_DETAILS_REQUEST / SUCCESS / FAIL / RESET
STOCKIN_UPDATE_REQUEST / SUCCESS / FAIL / RESET
STOCKIN_QUANTITY_UPDATE_REQUEST / SUCCESS / FAIL / RESET
STOCKIN_ADJUST_REQUEST / SUCCESS / FAIL / RESET
STOCKIN_CHALLAN_REQUEST / SUCCESS / FAIL / RESET
STOCKIN_DATABYID_REQUEST / SUCCESS / FAIL / RESET
STOCK_IN_ADMIN_REVERT_REQUEST / SUCCESS / FAIL / RESET
```

### 8.2 Action Creators (10 functions)

| Action Creator | API Call | Method |
|---|---|---|
| `createStockin(data)` | `/StockIn/CreateStockInOrder` | POST |
| `listStockin(order)` | `/StockIn/StockInOrderGridData/{order}` | GET |
| `listStockinDetails(id)` | `/StockIn/GetStockInOrderDetails/{id}` | GET |
| `updateStockin(data)` | `/StockIn/UpdateStockInOrder` | PUT |
| `escalateStockin(data)` | `/StockIn/SubmitForStockConfirmation` | PUT |
| `updateStockinQty(id, data)` | `/StockIn/ConfirmReceivedStock/{id}` | PUT |
| `adjustStockin(data)` | `/StockIn/AdjustStock` | POST |
| `listStokInInvoiceAction(supplier, customer)` | `/StockIn/GetStockInInvoiceList/{sId}/{cId}` | GET |
| `detailsStokInDataByIdAction(id)` | `/StockIn/GetStockInChallan/{id}` | GET |
| `revertReceivedStock(siSystemId, items)` | `/StockIn/RevertReceivedStock/{id}` | PUT |

### 8.3 Reducers (10 functions)

| Reducer | State Shape | Purpose |
|---|---|---|
| `listStockinReducer` | `{ stockin: [], loading, error }` | Stock-in list array |
| `StockinCreateReducer` | `{ success, createdStockin, loading, error }` | Create operation |
| `StockinEscalateReducer` | `{ success, escalatedStockin, loading, error }` | Escalation operation |
| `StockinDetailsReducer` | `{ stockinsingle: {}, loading, error }` | Single order details |
| `StockinUpdateReducer` | `{ success, updatedStockin, loading, error }` | Update operation |
| `StockinQtyUpdateReducer` | `{ success, loading, error }` | Qty confirmation |
| `StockinAdjustReducer` | `{ success, loading, error }` | Stock adjustment |
| `listStockinInvoiceReducer` | `{ invoices: [], loading, error }` | Invoice list |
| `detailsStockinDataByIdeReducer` | `{ challan: {}, loading, error }` | Challan details |
| `stockInAdminRevertReducer` | `{ success, loading, error }` | Admin revert |

### 8.4 V2 Replacement

All Redux state is replaced by **TanStack Query** with:
- Query key factory (`stockInKeys`)
- Individual hooks per operation
- Automatic cache invalidation on mutations
- No manual loading/error state management

---

## 9. Key Technical Findings from Legacy

### 9.1 Form Duplication

**Problem**: `CreateStockIn.js`, `EditStockin.js`, and `StockInPriceUpdate.js` share ~80% identical form code. Each has its own copy of item management, batch/pack modals, and calculation logic.

**V2 Solution**: ONE shared `StockInForm` component with mode-based field editability (like stock-out's approach).

### 9.2 Item Component Fragmentation

**Problem**: 3 different item display components (`SalesOrderStockinItem`, `ConfrimStockinItem`, `AdminRevertStockIn`) with separate implementations for the same data.

**V2 Solution**: ONE shared `StockInItemTable` component with columns/editability driven by mode.

### 9.3 List Page Duplication

**Problem**: 4 list pages (`Stockin.js`, `StockinForConfirmation.js`, `ListStockInApproved.js`, `StockInPriceEditList.js`) all call the same API with different status codes but have separate component files.

**V2 Solution**: ONE shared `StockInListPage` component with `mode` prop that determines status filter, visible columns, and available actions.

### 9.4 Batch/Pack Modal Pattern

**Problem**: Legacy uses 4 separate modal components (Add/Edit × Batch/Pack).

**V2 Solution**: 2 modal components (`BatchModal`, `PackModal`) each handling both add and edit modes via props.

### 9.5 No Form Validation Library

**Problem**: Legacy uses manual validation with inline checks.

**V2 Solution**: React Hook Form + Zod for declarative validation.

### 9.6 Date Handling

**Problem**: Legacy uses raw date strings and manual formatting.

**V2 Solution**: Consistent ISO string handling with utility formatting functions.

### 9.7 PDF Export (Invoice Report)

**Problem**: Legacy uses `html2canvas` + `jsPDF` to capture HTML as image then create PDF.

**V2 Solution**: Keep the same approach or consider structured PDF generation. This is a lower-priority feature.

### 9.8 Stock Adjustment is Semi-Independent

**Problem**: Stock adjustment has its own form, own API, and is conceptually different from stock-in orders.

**V2 Solution**: Keep as a separate sub-module within stock-in (`pages/stock-in/StockAdjustmentPage.tsx`) with its own form and schema.

### 9.9 2026-04-23 Create-Page Parity Findings

This comparison was re-checked against the current V2 create implementation (`AddStockInPage.tsx`, `StockInForm.tsx`, `StockInItemTable.tsx`, `PackModal.tsx`) and the legacy create flow (`CreateStockIn.js`, `SalesOrderStockinItem.js`, `AddMapForStockin.js`).

Confirmed legacy features or behaviors still missing, simplified, or changed in the current V2 `/stock-in/create` flow:

1. **`Sample_Issue` special create flow is not implemented in V2.**
  - Legacy create has a dedicated `Sample_Issue` branch with two tabs: `Sample By Category` and `Sample By Product`.
  - The category tab bulk-adds products through `listProductDetailsBasedCategory(...)`.
  - V2 currently routes all create flows through the same standard product picker and item table, so this sample-specific workflow is missing.

2. **`Warehouse_Transfer` quantity-only behavior is not matched.**
  - Legacy `Warehouse_Transfer` create UI adds items with product + quantity only and uses a sample-style simplified entry path.
  - V2 still uses the standard priced item flow, with declared unit price and bill-summary behavior exposed.

3. **Partner-selection rules do not fully match legacy for special types.**
  - Legacy visible create UI shows supplier only for `Sample_Receive`, `Regular_Purchase`, and `Excess_From_Intact`.
  - Legacy visible create UI shows customer only for `Exchange_Inward`, `Sales_Return`, and `Loan_Receive`.
  - Legacy visible create UI shows neither supplier nor customer for `Mixing_Received`, `Internal_Transfer`, `Warehouse_Transfer`, and `Sample_Issue`.
  - Current V2 `requiresSupplier()` also treats `Warehouse_Transfer` and `Sample_Issue` as supplier flows, which does not match the legacy create page.

4. **Header locking after item entry is missing.**
  - Legacy create disables core header fields after items are added (`switchTStuck` path), including receive type and several dependent header selections.
  - Current V2 create keeps the header editable after item rows are added.

5. **Supplier/customer address preview is missing.**
  - Legacy create shows read-only supplier or customer address immediately after a partner is selected.
  - Current V2 stores `supplierAddress` and `customerAddress` in the form payload shape but does not fetch and render the preview on the create page.

6. **Pack modal parity is incomplete.**
  - Legacy pack modal uses the pack-type lookup (`listPackTypesForInvoice`) and stores structured fields such as pack type, pack size, pack quantity, and remarks.
  - Current V2 `PackModal` only exposes `packDetails`, `packQuantity`, and free-text `packTypeName`; it does not load pack-type options or capture legacy-style remarks/size fields separately.

7. **Discount percent toggle is missing.**
  - Legacy create has a visible `%` checkbox that switches discount interpretation between fixed amount and percentage.
  - Current V2 create only supports a flat numeric discount amount.

8. **Currency selection is simplified.**
  - Legacy create offers a constrained currency selector (`BDT` / `USD`) in the create flow.
  - Current V2 create exposes a plain text `sibCurrencyName` field instead of the legacy selector behavior.

9. **Total quantity summary is missing from the create footer.**
  - Legacy create shows total quantity in the summary area (`Kg`).
  - Current V2 create does not show the aggregate quantity summary on the create page.

Items explicitly **not** counted as confirmed create-page gaps from this pass:

- **`Order From`**: legacy state/actions still load it, but this pass did not confirm a visible active `Order From` control in the rendered legacy create UI.
- **Top-level pack type field on the main form**: legacy loads pack types globally, but confirmed live usage in this pass is inside the add/edit pack modal.
- **Price-summary sidebar**: legacy file still contains related code, but the current render path keeps that panel hidden, so it was not treated as a required parity feature.

Practical reading of the current parity status:

- V2 already covers the core standard create flow: order type, source/destination channels, conditional customer/supplier selection, item rows, loan mapped-product selection, batches, packs, invoice-received flag, and bill totals.
- The main remaining create-page parity gaps are the special-case entry modes (`Sample_Issue`, `Warehouse_Transfer`), legacy header-lock behavior, structured pack metadata entry, and the richer bill/tax controls.

---

## 10. V2 Architecture & File Organization

Following V2-Octopi conventions (TypeScript, TanStack Query, React Hook Form + Zod, Tailwind CSS, Lucide icons):

```
v2-octopi/src/
├── types/
│   └── stockIn.ts                        # All stock-in TypeScript interfaces
├── schemas/
│   └── stockInSchema.ts                  # Zod schemas for all forms
├── hooks/
│   └── useStockIn.ts                     # TanStack Query hooks + mutations
├── features/
│   └── stock-in/
│       ├── calculations.ts               # Pure financial calculation functions
│       ├── modes.ts                       # ListMode, EditMode, PermissionProfile
│       └── fieldRules.ts                 # Per-mode field editability rules
├── pages/
│   └── stock-in/
│       ├── StockInListPage.tsx           # Shared list (mode-driven)
│       ├── AddStockInPage.tsx            # Create new stock-in
│       ├── EditStockInPage.tsx           # Edit existing (mode-driven)
│       ├── ConfirmQuantityPage.tsx       # Confirm received quantities
│       ├── StockAdjustmentPage.tsx       # Stock adjustment form
│       ├── StockInInvoiceListPage.tsx    # Invoice/challan search
│       ├── StockInInvoiceReportPage.tsx  # Invoice report + PDF
│       ├── StockInForm.tsx              # Shared form component
│       ├── StockInItemTable.tsx          # Shared item table component
│       ├── BatchModal.tsx               # Add/edit batch modal
│       ├── PackModal.tsx                # Add/edit pack modal
│       ├── ChallanModal.tsx             # Invoice/challan details modal
│       └── StockInItemDetailModal.tsx   # Single item detail view
└── router/
    └── AppRouter.tsx                     # Add stock-in routes
```

---

## 11. V2 Route Mapping (Legacy → V2)

| Legacy Route | V2 Route | V2 Component | Mode |
|---|---|---|---|
| `/stockin/list` | `/stock-in` | `StockInListPage` | `standard` |
| `/stockin/create` | `/stock-in/create` | `AddStockInPage` | — |
| `/stockin/:id/edit` | `/stock-in/:id/edit` | `EditStockInPage` | `standard` |
| `/stockin/unapprovedqty/list` | `/stock-in/confirm-qty` | `StockInListPage` | `confirm-qty` |
| `/stockin/:id/confirmQty` | `/stock-in/:id/confirm-qty` | `ConfirmQuantityPage` | — |
| `/stockin/stockadjustment` | `/stock-in/adjustment` | `StockAdjustmentPage` | — |
| `/stockin/priceupdatelist` | `/stock-in/price-update` | `StockInListPage` | `price-update` |
| `/stockin/:id/updateprice` | `/stock-in/:id/price-edit` | `EditStockInPage` | `price-edit` |
| `/stockinadminaction` | `/stock-in/admin/approved` | `StockInListPage` | `admin-approved` |
| `/stockin/:id/stockinadminrevert` | `/stock-in/admin/:id/revert` | `EditStockInPage` | `admin-revert` |
| `/stockin/stockininvoicelist` | `/stock-in/invoices` | `StockInInvoiceListPage` | — |
| `/stockin/invoicereport` | `/stock-in/invoice-report` | `StockInInvoiceReportPage` | — |

### menuMapper.ts Additions

```typescript
// Add to legacyToV2 mapping
'/stockin': '/stock-in',
'/stockin/list': '/stock-in',
'/stockinlist': '/stock-in',
'/stockin/create': '/stock-in/create',
'/stockin/unapprovedqty/list': '/stock-in/confirm-qty',
'/stockin/stockadjustment': '/stock-in/adjustment',
'/stockin/priceupdatelist': '/stock-in/price-update',
'/stockinadminaction': '/stock-in/admin/approved',
'/stockin/stockininvoicelist': '/stock-in/invoices',
'/stockin/invoicereport': '/stock-in/invoice-report',
```

---

## 12. V2 Module Layout (Files to Create)

### 12.1 Type Definitions (`types/stockIn.ts`)

```typescript
// === Modes ===
export type StockInListMode = 'standard' | 'confirm-qty' | 'admin-approved' | 'price-update';
export type StockInEditMode = 'standard' | 'price-edit' | 'admin-revert';

// === Entities ===
export interface StockInGeneralData { /* See Section 4.1 */ }
export interface StockInItemData { /* See Section 4.2 */ }
export interface StockInBatch { /* See Section 4.3 */ }
export interface StockInPack { /* See Section 4.4 */ }
export interface StockInBillData { /* See Section 4.5 */ }
export interface StockInOrderDetail { /* See Section 4.6 */ }
export interface StockInListRow { /* See Section 4.7 */ }

// === Payloads ===
export interface CreateStockInPayload { /* Header + Items + Bill */ }
export interface UpdateStockInPayload { /* Header + Items + Bill */ }
export interface EscalationPayload { /* Item array */ }
export interface QuantityConfirmationPayload { /* Item array with confirmed qty */ }
export interface RevertPayload { /* Item array with revert qty */ }
export interface StockAdjustmentPayload { /* See Section 4.8 */ }

// === Filters ===
export interface StockInListFilters {
  status?: number;
  searchTerm?: string;
}
export interface StockInInvoiceFilters { /* See Section 4.9 */ }

// === Order Type Enum ===
export type StockInOrderType =
  | 'Sample_Receive'
  | 'Regular_Purchase'
  | 'Excess_From_Intact'
  | 'Exchange_Inward'
  | 'Sales_Return'
  | 'Loan_Receive'
  | 'Mixing_Received'
  | 'Internal_Transfer';
```

### 12.2 Hook File (`hooks/useStockIn.ts`)

```typescript
// === Query Key Factory ===
export const stockInKeys = {
  all: ['stockIn'] as const,
  lists: () => [...stockInKeys.all, 'list'] as const,
  list: (mode: StockInListMode, filters: object) => [...stockInKeys.lists(), mode, filters] as const,
  details: () => [...stockInKeys.all, 'detail'] as const,
  detail: (id: number) => [...stockInKeys.details(), id] as const,
  invoices: () => [...stockInKeys.all, 'invoices'] as const,
  invoiceList: (filters: object) => [...stockInKeys.invoices(), filters] as const,
  challan: (id: number) => [...stockInKeys.all, 'challan', id] as const,
  adjustment: () => [...stockInKeys.all, 'adjustment'] as const,
};

// === Query Hooks ===
export function useStockInList(mode: StockInListMode, filters: StockInListFilters)
export function useStockInDetail(id: number)
export function useStockInInvoiceList(filters: StockInInvoiceFilters)
export function useStockInChallan(id: number)

// === Mutation Hooks ===
export function useCreateStockIn()
export function useUpdateStockIn()
export function useEscalateStockIn()
export function useConfirmStockInQty()
export function useRevertStockIn()
export function useAdjustStock()
```

### 12.3 Mutation → Cache Invalidation Matrix

| Mutation | Invalidates |
|---|---|
| `useCreateStockIn` | `stockInKeys.lists()` |
| `useUpdateStockIn` | `stockInKeys.lists()`, `stockInKeys.detail(id)` |
| `useEscalateStockIn` | `stockInKeys.lists()` (all list modes affected) |
| `useConfirmStockInQty` | `stockInKeys.lists()`, `stockInKeys.detail(id)` |
| `useRevertStockIn` | `stockInKeys.lists()`, `stockInKeys.detail(id)` |
| `useAdjustStock` | `stockInKeys.adjustment()` |

---

## 13. Query Strategy & Cache Invalidation

### 13.1 List Query URL Builder

```typescript
function buildStockInListUrl(mode: StockInListMode): string {
  switch (mode) {
    case 'standard':
      return '/StockIn/StockInOrderGridData/50';       // Pending
    case 'confirm-qty':
      return '/StockIn/StockInOrderGridData/51';       // Escalated (verify actual status code)
    case 'admin-approved':
      return '/StockIn/StockInOrderGridData/52';       // Approved
    case 'price-update':
      return '/StockIn/StockInOrderGridData/53';       // Price update eligible (verify actual code)
    default:
      return '/StockIn/StockInOrderGridData/50';
  }
}
```

> **NOTE**: The exact status codes for `confirm-qty` and `price-update` list modes need verification from the legacy code/API. The legacy code passes `order` parameter which may be status-based but the actual values for escalated and price-update states need to be confirmed.

### 13.2 Cache Timing

```typescript
// Queries
staleTime: 60_000,           // 1 minute
gcTime: 10 * 60_000,         // 10 minutes
refetchOnWindowFocus: false,
retry: 1,

// Mutations
retry: false,
```

---

## 14. Mode System Design

### 14.1 List Modes

| Mode | Status Filter | Visible Columns | Actions |
|---|---|---|---|
| `standard` | 50 (pending) | ID, Product, UnitPrice, DeclaredQty, ConfirmQty | Add, Edit, Escalate |
| `confirm-qty` | escalated | ID, Product, MappedProduct*, UnitPrice, DeclaredQty, ConfirmQty | Confirm Qty |
| `admin-approved` | 52 (approved) | ID, Product, UnitPrice, DeclaredQty, ConfirmQty | Edit, Revert |
| `price-update` | eligible | ID, Product, OriginalPrice, CurrentPrice | Edit Price |

*MappedProduct column only shown for Loan_Receive orders.

### 14.2 Edit Modes

| Mode | Editable Fields | Submit API |
|---|---|---|
| `standard` | All header fields, all item fields, batch/pack | `PUT /UpdateStockInOrder` |
| `price-edit` | Unit prices only, batch/pack | `PUT /UpdateStockInOrder` |
| `admin-revert` | None (all disabled) — displays confirmation | `PUT /RevertReceivedStock/{id}` |

### 14.3 Field Editability Rules (`features/stock-in/fieldRules.ts`)

```typescript
export function getFieldEditability(mode: StockInEditMode) {
  switch (mode) {
    case 'standard':
      return {
        customerInvoice: true,
        supplier: true,
        customer: true,
        channel: true,
        destinationChannel: true,
        orderType: true,
        orderFrom: true,
        packType: true,
        dateOfIssue: true,
        product: true,
        declaredQty: true,
        declaredUnitPrice: true,
        batches: true,
        packs: true,
        notes: true,
      };
    case 'price-edit':
      return {
        customerInvoice: false,
        supplier: false,
        customer: false,
        channel: false,
        destinationChannel: false,
        orderType: false,
        orderFrom: false,
        packType: false,
        dateOfIssue: false,
        product: false,
        declaredQty: false,
        declaredUnitPrice: true,  // Only prices editable
        batches: true,
        packs: true,
        notes: false,
      };
    case 'admin-revert':
      return {
        // All false — read-only display before revert action
        customerInvoice: false,
        supplier: false,
        customer: false,
        channel: false,
        destinationChannel: false,
        orderType: false,
        orderFrom: false,
        packType: false,
        dateOfIssue: false,
        product: false,
        declaredQty: false,
        declaredUnitPrice: false,
        batches: false,
        packs: false,
        notes: false,
      };
  }
}
```

---

## 15. Form Schema Design (Zod)

### 15.1 Create/Edit Stock-In Schema

```typescript
import { z } from 'zod';

export const stockInItemSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  productName: z.string(),
  sidDeclaredQty: z.number().min(0.01, 'Quantity must be positive'),
  sidDeclaredUnitPrice: z.number().min(0, 'Price cannot be negative'),
  sidConfirmedQty: z.number().nullable(),
  sidConfirmedUnitPrice: z.number().nullable(),
  sidProductStrength: z.string().nullable(),
  sidBatches: z.array(z.object({
    batchNumber: z.string(),
    expiryDate: z.string(),
    quantity: z.number(),
  })),
  sidPacks: z.array(z.object({
    packDetails: z.string(),
  })),
  sidMappedProductId: z.number().nullable(),
  sidMappedProductName: z.string().nullable(),
});

export const stockInSchema = z.object({
  customerInvoice: z.string().min(1, 'Reference number is required'),
  supplierId: z.number().nullable(),
  customerId: z.number().nullable(),
  channelId: z.number().min(1, 'Source channel is required'),
  destinationChannelId: z.number().min(1, 'Destination channel is required'),
  orderTypeId: z.number().min(1, 'Order type is required'),
  orderFromId: z.number().min(1, 'Order from is required'),
  packTypeId: z.number().nullable(),
  dateOfIssue: z.string().min(1, 'Date is required'),
  notes: z.string().nullable(),
  items: z.array(stockInItemSchema).min(1, 'At least one item is required'),
}).refine(
  (data) => data.channelId !== data.destinationChannelId,
  { message: 'Source and destination channels must be different', path: ['destinationChannelId'] }
);

export type StockInFormData = z.infer<typeof stockInSchema>;
```

### 15.2 Quantity Confirmation Schema

```typescript
export const confirmQtyItemSchema = z.object({
  productId: z.number(),
  sidConfirmedQty: z.number().min(0, 'Confirmed qty cannot be negative'),
  sidConfirmedUnitPrice: z.number().min(0, 'Confirmed price cannot be negative'),
});

export const confirmQtySchema = z.object({
  items: z.array(confirmQtyItemSchema).min(1),
});

export type ConfirmQtyFormData = z.infer<typeof confirmQtySchema>;
```

### 15.3 Stock Adjustment Schema

```typescript
export const stockAdjustmentItemSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  productName: z.string(),
  quantity: z.number().refine(val => val !== 0, 'Quantity cannot be zero'),
  currentStock: z.number(),
});

export const stockAdjustmentSchema = z.object({
  soCustomerReferance: z.string().min(1, 'Reference number is required'),
  channelId: z.number().min(1, 'Channel is required'),
  dateOfIssue: z.string().min(1, 'Date is required'),
  notes: z.string().nullable(),
  items: z.array(stockAdjustmentItemSchema).min(1, 'At least one item is required'),
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;
```

---

## 16. Component Breakdown

### 16.1 Page Components

| Component | File | Props | Description |
|---|---|---|---|
| `StockInListPage` | `StockInListPage.tsx` | `mode: StockInListMode` | Shared list with mode-driven columns, actions, filters |
| `AddStockInPage` | `AddStockInPage.tsx` | — | Renders `StockInForm` in create mode |
| `EditStockInPage` | `EditStockInPage.tsx` | `mode: StockInEditMode` | Loads detail, renders `StockInForm` with defaults |
| `ConfirmQuantityPage` | `ConfirmQuantityPage.tsx` | — | Specialized form for qty confirmation |
| `StockAdjustmentPage` | `StockAdjustmentPage.tsx` | — | Independent adjustment form |
| `StockInInvoiceListPage` | `StockInInvoiceListPage.tsx` | — | Invoice search with supplier/customer filters |
| `StockInInvoiceReportPage` | `StockInInvoiceReportPage.tsx` | — | Enter system ID, view details, export PDF |

### 16.2 Shared Components

| Component | File | Props | Description |
|---|---|---|---|
| `StockInForm` | `StockInForm.tsx` | `mode, defaultValues?, onSubmit` | React Hook Form + Zod, conditional supplier/customer, item management |
| `StockInItemTable` | `StockInItemTable.tsx` | `items, mode, onItemChange, onRemove, onAddBatch, onAddPack` | Editable item table with mode-driven columns |
| `BatchModal` | `BatchModal.tsx` | `open, batch?, onSave, onClose` | Add/edit batch (handles both modes) |
| `PackModal` | `PackModal.tsx` | `open, pack?, onSave, onClose` | Add/edit pack (handles both modes) |
| `ChallanModal` | `ChallanModal.tsx` | `open, challanId, onClose` | Displays challan/invoice details |
| `StockInItemDetailModal` | `StockInItemDetailModal.tsx` | `open, item, onClose` | Single item detail view |

### 16.3 Component Hierarchy

```
StockInListPage
├── Filter Bar (date range, search, customer/supplier dropdowns)
├── Action Bar (Add New, Escalate selected)
├── Data Table (Tailwind table with gray styling)
│   ├── Column headers (mode-driven)
│   └── Row actions (Edit, Confirm, Revert — mode-driven)
└── Empty/Loading states

AddStockInPage / EditStockInPage
├── Back button + Page header
└── StockInForm
    ├── Header Fields (invoice ref, order type, supplier/customer, channels, date)
    ├── StockInItemTable
    │   ├── Item rows (product, qty, price, strength, actions)
    │   ├── Batch/Pack action buttons per row
    │   └── Add item button
    ├── Bill Summary (subtotal, VAT, AIT, discount, total)
    ├── Notes field
    ├── BatchModal (triggered from item row)
    ├── PackModal (triggered from item row)
    └── Submit button

ConfirmQuantityPage
├── Back button + Page header
├── Order header info (read-only)
├── Item table with confirmed qty/price inputs
└── Submit confirmation button
```

---

## 17. Dropdown Integration

### 17.1 Existing Dropdown Types (Already in V2)

These dropdowns are already configured in the centralized dropdown system:

| Dropdown | Type Key | Strategy | Component |
|---|---|---|---|
| Supplier | `supplier` | Load All | `<DropdownSelect type="supplier">` |
| Customer | `customer` | Paginated | `<PaginatedCombobox type="customer">` |
| Product | `product` | Paginated | `<PaginatedCombobox type="product">` |
| Channel | `channel` | Load All | `<DropdownSelect type="channel">` |
| Pack Type | `packType` | Load All | `<DropdownSelect type="packType">` |
| Product Category | `productCategory` | Load All | `<DropdownSelect type="productCategory">` |

### 17.2 New Dropdown Types Needed

Check if these exist in the backend or need to be added:

| Dropdown | Type Key | Data Source |
|---|---|---|
| Order Type (Stock-In) | `stockInOrderType` | May need new endpoint or hard-coded enum |
| Order From | `stockInOrderFrom` | May need new endpoint or existing `orderFrom` |

> **Action**: Verify with API team whether `GET /KeyValue/GetDropdown?type=stockInOrderType` and `type=stockInOrderFrom` exist. If not, hard-code the enum values.

### 17.3 Hard-Coded Fallback (Order Types)

If no API endpoint exists, define as constants:

```typescript
export const STOCK_IN_ORDER_TYPES = [
  { id: 1, label: 'Sample Receive' },
  { id: 2, label: 'Regular Purchase' },
  { id: 3, label: 'Excess From Intact' },
  { id: 4, label: 'Exchange Inward' },
  { id: 5, label: 'Sales Return' },
  { id: 6, label: 'Loan Receive' },
  { id: 7, label: 'Mixing Received' },
  { id: 8, label: 'Internal Transfer' },
] as const;
```

> **NOTE**: Verify exact IDs from legacy code or API response.

---

## 18. Excel & PDF Export

### 18.1 Excel Export (Invoice List / Reports)

Use the shared V2 `exportExcel` utility:

```typescript
import { exportExcel } from '@/utils/exportExcel';

exportExcel({
  fileName: `StockIn_Invoice_${dateRange}`,
  title: 'Stock-In Invoice Report',
  sheetName: 'Invoices',
  columns: [
    { key: 'siSystemId', header: 'System ID' },
    { key: 'siSystemNo', header: 'Invoice No' },
    { key: 'supplierName', header: 'Supplier' },
    { key: 'customerName', header: 'Customer' },
    { key: 'orderType', header: 'Order Type' },
    { key: 'declaredQty', header: 'Declared Qty', format: 'number' },
    { key: 'confirmedQty', header: 'Confirmed Qty', format: 'number' },
    { key: 'unitPrice', header: 'Unit Price', format: 'number' },
    { key: 'total', header: 'Total', format: 'number' },
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Created', format: 'date' },
  ],
  data: filteredData,
});
```

### 18.2 PDF Export (Invoice Report)

Legacy uses `html2canvas` + `jsPDF`. For V2, options:

**Option A: Keep html2canvas approach** (simplest migration)
```typescript
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

async function exportToPdf(elementRef: HTMLElement, filename: string) {
  const canvas = await html2canvas(elementRef);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, width, height);
  pdf.save(`${filename}.pdf`);
}
```

**Option B: Structured PDF** (better quality, more effort)
- Use `jsPDF` with `autoTable` plugin for structured table rendering
- Plan for post-MVP enhancement

---

## 19. Execution Plan (Phases)

### Phase 1: Foundation (Types, Hooks, Schemas)
**Files to create:**
1. `types/stockIn.ts` — All interfaces, types, enums
2. `hooks/useStockIn.ts` — Query key factory + all query/mutation hooks
3. `schemas/stockInSchema.ts` — All Zod schemas
4. `features/stock-in/calculations.ts` — Financial calculation functions
5. `features/stock-in/modes.ts` — Mode types and mode config
6. `features/stock-in/fieldRules.ts` — Field editability per mode

**Verification:** Types compile, hooks return expected shapes, schemas validate sample data.

### Phase 2: Core Components
**Files to create:**
1. `pages/stock-in/StockInForm.tsx` — Shared form with conditional fields
2. `pages/stock-in/StockInItemTable.tsx` — Shared item table
3. `pages/stock-in/BatchModal.tsx` — Batch add/edit modal
4. `pages/stock-in/PackModal.tsx` — Pack add/edit modal

**Verification:** Components render in isolation, form validation works.

### Phase 3: Standard CRUD Pages
**Files to create:**
1. `pages/stock-in/StockInListPage.tsx` — List page (standard mode)
2. `pages/stock-in/AddStockInPage.tsx` — Create page
3. `pages/stock-in/EditStockInPage.tsx` — Edit page (standard mode)

**Updates:**
- `router/AppRouter.tsx` — Add routes
- `layout/Sidebar.tsx` — Add navigation items
- `auth/menuMapper.ts` — Add legacy route mappings

**Verification:** Full CRUD flow works: list → create → edit → list.

### Phase 4: Workflow Pages (Escalation, Confirmation)
**Files to create/update:**
1. Update `StockInListPage.tsx` — Add `confirm-qty` mode
2. `pages/stock-in/ConfirmQuantityPage.tsx` — Quantity confirmation form
3. Add escalation action to standard list mode

**Verification:** Full workflow: create → escalate → confirm qty.

### Phase 5: Admin Pages
**Files to create/update:**
1. Update `StockInListPage.tsx` — Add `admin-approved` mode
2. Update `EditStockInPage.tsx` — Add `admin-revert` mode
3. Add admin routes to `AppRouter.tsx`

**Verification:** Admin can view approved orders and revert them.

### Phase 6: Price Update & Stock Adjustment
**Files to create/update:**
1. Update `StockInListPage.tsx` — Add `price-update` mode
2. Update `EditStockInPage.tsx` — Add `price-edit` mode
3. `pages/stock-in/StockAdjustmentPage.tsx` — Stock adjustment form

**Verification:** Price update flow works. Stock adjustment creates adjustment records.

### Phase 7: Invoice & Reporting
**Files to create:**
1. `pages/stock-in/StockInInvoiceListPage.tsx` — Invoice search
2. `pages/stock-in/StockInInvoiceReportPage.tsx` — Invoice report + PDF
3. `pages/stock-in/ChallanModal.tsx` — Challan details modal
4. `pages/stock-in/StockInItemDetailModal.tsx` — Item detail modal

**Verification:** Invoice search returns results. PDF export works.

### Phase 8: Polish & Integration
- Add legacy redirect routes in `AppRouter.tsx`
- Verify all `menuMapper.ts` entries work
- Test all dropdown integrations
- Test Excel export on all applicable pages
- Cross-browser testing
- Error state handling for all API failures

---

## 20. Migration Checklist

### Pre-Migration
- [ ] Verify all API endpoints exist and return expected shapes
- [ ] Confirm status codes (50, 52, and intermediate states)
- [ ] Check if `stockInOrderType` and `stockInOrderFrom` dropdown types exist in backend
- [ ] Test API authentication with V2 auth bridge token
- [ ] Document any API differences between legacy and V2 base URLs

### Foundation (Phase 1)
- [ ] Create `types/stockIn.ts` with all interfaces
- [ ] Create `schemas/stockInSchema.ts` with all Zod schemas
- [ ] Create `hooks/useStockIn.ts` with query key factory and all hooks
- [ ] Create `features/stock-in/calculations.ts`
- [ ] Create `features/stock-in/modes.ts`
- [ ] Create `features/stock-in/fieldRules.ts`

### Core Components (Phase 2)
- [ ] Create `StockInForm.tsx` with conditional supplier/customer fields
- [ ] Create `StockInItemTable.tsx` with mode-driven columns
- [ ] Create `BatchModal.tsx` (add/edit)
- [ ] Create `PackModal.tsx` (add/edit)
- [ ] Verify order type conditional logic works
- [ ] Verify channel validation (source ≠ destination)
- [ ] Verify Loan_Receive mapped product flow

### CRUD Pages (Phase 3)
- [ ] Create `StockInListPage.tsx` (standard mode)
- [ ] Create `AddStockInPage.tsx`
- [ ] Create `EditStockInPage.tsx` (standard mode)
- [ ] Add routes to `AppRouter.tsx`
- [ ] Add navigation to `Sidebar.tsx`
- [ ] Add mappings to `menuMapper.ts`
- [ ] Add legacy redirects to `AppRouter.tsx`
- [ ] Test full CRUD flow

### Workflow (Phase 4)
- [ ] Add `confirm-qty` list mode
- [ ] Create `ConfirmQuantityPage.tsx`
- [ ] Implement escalation action on standard list
- [ ] Test escalation → confirmation flow

### Admin (Phase 5)
- [ ] Add `admin-approved` list mode
- [ ] Add `admin-revert` edit mode
- [ ] Test admin view and revert flow

### Price & Adjustment (Phase 6)
- [ ] Add `price-update` list mode
- [ ] Add `price-edit` edit mode
- [ ] Create `StockAdjustmentPage.tsx`
- [ ] Test price update flow
- [ ] Test stock adjustment (positive and negative)

### Invoice & Reporting (Phase 7)
- [ ] Create `StockInInvoiceListPage.tsx`
- [ ] Create `StockInInvoiceReportPage.tsx`
- [ ] Create `ChallanModal.tsx`
- [ ] Create `StockInItemDetailModal.tsx`
- [ ] Test invoice search
- [ ] Test PDF export

### Final Verification
- [ ] All 12 legacy routes have working V2 equivalents
- [ ] All legacy redirects work
- [ ] Menu mapper has all entries
- [ ] Sidebar shows stock-in navigation
- [ ] Excel export works on applicable pages
- [ ] PDF export works on invoice report
- [ ] Error states handled for all API calls
- [ ] Loading states shown during data fetches
- [ ] Empty states shown when no data
- [ ] Form validations match business rules
- [ ] Batch/pack modals work in all edit modes
- [ ] Loan_Receive mapped product flow works end-to-end

---

## Appendix A: Legacy Route Definitions (from `routes.js`)

```javascript
// Stock-In Routes (extracted from legacy routes.js)
{ path: '/stockin/list', component: Stockin }
{ path: '/stockin/create', component: CreateStockIn }
{ path: '/stockin/:id/edit', component: EditStockin }
{ path: '/stockin/unapprovedqty/list', component: StockinForConfirmation }
{ path: '/stockin/:id/confirmQty', component: UpdateStockinQuantity }
{ path: '/stockin/stockadjustment', component: CreatestockAdjustment }
{ path: '/stockinadminaction', component: ListStockInApproved }
{ path: '/stockin/:id/stockinadminrevert', component: StockInAdminRevert }
{ path: '/stockin/priceupdatelist', component: StockInPriceEditList }
{ path: '/stockin/:id/updateprice', component: StockInPriceUpdate }
{ path: '/stockin/stockininvoicelist', component: StockInInvoiceList }
{ path: '/stockin/invoicereport', component: ProdctInReport }
```

## Appendix B: Legacy Redux Constants (Complete)

```javascript
// List
STOCKIN_LIST_REQUEST / STOCKIN_LIST_SUCCESS / STOCKIN_LIST_FAIL

// Create
STOCKIN_CREATE_REQUEST / STOCKIN_CREATE_SUCCESS / STOCKIN_CREATE_FAIL / STOCKIN_CREATE_RESET

// Escalation
STOCKIN_ESCALATION_REQUEST / STOCKIN_ESCALATION_SUCCESS / STOCKIN_ESCALATION_FAIL / STOCKIN_ESCALATION_RESET

// Details
STOCKIN_DETAILS_REQUEST / STOCKIN_DETAILS_SUCCESS / STOCKIN_DETAILS_FAIL / STOCKIN_DETAILS_RESET

// Update
STOCKIN_UPDATE_REQUEST / STOCKIN_UPDATE_SUCCESS / STOCKIN_UPDATE_FAIL / STOCKIN_UPDATE_RESET

// Quantity Confirmation
STOCKIN_QUANTITY_UPDATE_REQUEST / STOCKIN_QUANTITY_UPDATE_SUCCESS / STOCKIN_QUANTITY_UPDATE_FAIL / STOCKIN_QUANTITY_UPDATE_RESET

// Stock Adjustment
STOCKIN_ADJUST_REQUEST / STOCKIN_ADJUST_SUCCESS / STOCKIN_ADJUST_FAIL / STOCKIN_ADJUST_RESET

// Invoice/Challan
STOCKIN_CHALLAN_REQUEST / STOCKIN_CHALLAN_SUCCESS / STOCKIN_CHALLAN_FAIL / STOCKIN_CHALLAN_RESET
STOCKIN_DATABYID_REQUEST / STOCKIN_DATABYID_SUCCESS / STOCKIN_DATABYID_FAIL / STOCKIN_DATABYID_RESET

// Admin Revert
STOCK_IN_ADMIN_REVERT_REQUEST / STOCK_IN_ADMIN_REVERT_SUCCESS / STOCK_IN_ADMIN_REVERT_FAIL / STOCK_IN_ADMIN_REVERT_RESET
```

## Appendix C: V2 Tech Stack Quick Reference

| Concern | V2 Technology | Pattern |
|---|---|---|
| Language | TypeScript (strict) | All files `.ts` / `.tsx` |
| Framework | React 19 | Functional components + hooks |
| Build | Vite 7 | `@/` path alias |
| Styling | Tailwind CSS v4 | `gray-*` palette only |
| Server State | TanStack Query 5 | `useQuery`, `useMutation`, query key factory |
| Client State | Zustand | Only for UI state (sidebar) |
| Forms | React Hook Form + Zod | `zodResolver`, `setValueAs` for type conversion |
| Routing | React Router v7 | `lazy()` loading, `ProtectedRoute` |
| API Client | Custom fetch wrapper | `apiClient.get/post/put/delete` with JWT auto-injection |
| Dropdowns | Centralized system | `<DropdownSelect>` (load all) / `<PaginatedCombobox>` (paginated) |
| Icons | Lucide React | Named imports |
| Excel | ExcelJS via `exportExcel()` | Shared utility |
| Colors | Gray-only palette | NO blue, slate, indigo |

## Appendix D: Styling Reference

```
Primary Button: bg-gray-800 hover:bg-gray-700 text-white
Card:           rounded-xl border border-gray-200 bg-white shadow-sm
Input:          rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:ring-2 focus:ring-gray-200
Table Header:   bg-gray-50 text-xs uppercase text-gray-500
Table Row:      hover:bg-gray-50 divide-y divide-gray-100
Section Label:  text-sm font-semibold text-gray-700 uppercase tracking-wider
```
