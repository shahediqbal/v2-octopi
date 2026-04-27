# Payment Module — V2 Migration: Understanding & Execution Plan

> **Purpose**: Complete technical reference for migrating the legacy Payment module to V2-Octopi ERP.
> **Audience**: AI agents, developers performing the migration.
> **Last Updated**: 2026-04-15

---

## Table of Contents

1. [Module Scope & Route Inventory](#1-module-scope--route-inventory)
2. [Legacy File Inventory](#2-legacy-file-inventory)
3. [Complete API Endpoint Inventory](#3-complete-api-endpoint-inventory)
4. [Data Models & TypeScript Interfaces](#4-data-models--typescript-interfaces)
5. [Payment Type System & Conditional Fields](#5-payment-type-system--conditional-fields)
6. [Business Rules & Validation](#6-business-rules--validation)
7. [Legacy Redux State Management](#7-legacy-redux-state-management)
8. [LC Payment Redirection Rule](#8-lc-payment-redirection-rule)
9. [Key Technical Findings from Legacy](#9-key-technical-findings-from-legacy)
10. [V2 Architecture & File Organization](#10-v2-architecture--file-organization)
11. [V2 Route Mapping (Legacy → V2)](#11-v2-route-mapping-legacy--v2)
12. [V2 Module Layout (Files to Create)](#12-v2-module-layout-files-to-create)
13. [Query Strategy & Cache Invalidation](#13-query-strategy--cache-invalidation)
14. [Form Schema Design (Zod)](#14-form-schema-design-zod)
15. [Dropdown Integration](#15-dropdown-integration)
16. [Component Breakdown](#16-component-breakdown)
17. [Server-Side API Requirements](#17-server-side-api-requirements)
18. [Execution Plan (Phases)](#18-execution-plan-phases)
19. [Migration Checklist](#19-migration-checklist)

---

## 1. Module Scope & Route Inventory

The Payment module handles **customer payment recording** — accepting payments against invoices, cheques, open payments, bank transfers, AIT, VAT, credit adjustments, and LC payments. It includes list view, create, and edit.

### 1.1 Core Routes (3 routes)

| # | Legacy Route | Purpose | Legacy Component | Legacy File |
|---|---|---|---|---|
| 1 | `/payment/list` | List all payments with date/customer filters | `Payments` | `src/pages/Payment/Payments.js` |
| 2 | `/payment/create` | Create a new payment entry | `AddPayment` | `src/pages/Payment/AddPayment.js` |
| 3 | `/payment/:id/edit` | Edit an existing payment | `EditPayment` | `src/pages/Payment/EditPayment.js` |

### 1.2 Related Routes (separate module — NOT part of this migration)

These are in the **LetterOfCredit** module and should NOT be built as part of the Payment module:

| # | Legacy Route | Purpose | Note |
|---|---|---|---|
| 1 | `/lc/payment/list` | LC Payment list | Separate module |
| 2 | `/lc/payment/create` | LC Payment entry | Separate module |
| 3 | `/lc/payment/:id/edit` | LC Payment edit | Separate module |
| 4 | `/lc/payment/edit/list` | LC Payment edit list | Separate module |
| 5 | `/lc/document/list` | LC Doc & Payment list | Separate module |
| 6 | `/lc/document/create` | LC Doc & Payment create | Separate module |

**Total for this module: 3 pages/routes**

---

## 2. Legacy File Inventory

### 2.1 Page Components

| File | Path | Purpose |
|---|---|---|
| `Payments.js` | `src/pages/Payment/Payments.js` | Payment list page — DataGrid with date range + customer filter |
| `AddPayment.js` | `src/pages/Payment/AddPayment.js` | Create payment form — 8 payment types with conditional fields |
| `EditPayment.js` | `src/pages/Payment/EditPayment.js` | Edit payment form — pre-populated from API, same 8 types |
| `PaymentsStyle.js` | `src/pages/Payment/PaymentsStyle.js` | MUI `makeStyles` for list page DataGrid styling |

### 2.2 Redux Files

| File | Path | Purpose |
|---|---|---|
| `paymentActions.js` | `src/redux/actions/paymentActions.js` | All payment-related Axios API calls (list, create, update, details, etc.) |
| `paymentConstants.js` | `src/redux/constants/paymentConstants.js` | Action type string constants |
| `paymentReducers.js` | `src/redux/reducers/paymentReducers.js` | Redux reducers for payment state |

### 2.3 Core/Shared Components Used

| File | Path | Purpose |
|---|---|---|
| `PaymentHistoryView.js` | `src/core/PaymentHistoryView.js` | Modal showing payment history (invoice line items, PDF export) |
| `Menu.js` | `src/core/Menu.js` | Main navigation — replaced by v2 Sidebar |
| `PageHeader.js` | `src/core/PageHeader.js` | Page title — replaced by v2 page header pattern |

### 2.4 Schema

| File | Path | Purpose |
|---|---|---|
| `index.jsx` | `src/schemas/index.jsx` | `PaymentSchema` — currently commented out (Yup-based). Validation is minimal in legacy. |

---

## 3. Complete API Endpoint Inventory

### 3.1 List / Query Endpoints

| # | Method | Endpoint | Purpose | Used In |
|---|---|---|---|---|
| 1 | `GET` | `/CustomerPayment/GetPaymentInfoGrid` | Get all payments (no filters) | `Payments.js` (unused, replaced by #2) |
| 2 | `GET` | `/CustomerPayment/GetPaymentInfoGridByParam?startDate={}&endDate={}&customerId={}&paymentMethodId={}` | Get payments by date range, customer, optional payment method | `Payments.js` |
| 3 | `GET` | `/CustomerPayment/GetPaymentRelatedDetailsById/{id}` | Get single payment details for edit | `EditPayment.js` |
| 4 | `GET` | `/CustomerPayment/GetPaymentInvoiceMetaDataById/{id}` | Get invoice metadata (amount, balance, etc.) when selecting an invoice | `AddPayment.js`, `EditPayment.js` |
| 5 | `GET` | `/CustomerPayment/GetPaymentCustomerInvoice/{customerId}` | Get customer's invoices (for Invoice dropdown) | `AddPayment.js` |
| 6 | `GET` | `/CustomerPayment/GetPaymentCustomerCheque/{customerId}` | Get customer's cheques (for Cheque dropdown) | `AddPayment.js` |

### 3.2 Create / Update Endpoints

| # | Method | Endpoint | Purpose | Payload Shape |
|---|---|---|---|---|
| 7 | `POST` | `/CustomerPayment/AddPaymentInfo` | Create new payment | `CreatePaymentPayload` |
| 8 | `PUT` | `/CustomerPayment/UpdatePaymentInfo` | Update existing payment | `UpdatePaymentPayload` |

### 3.3 Dropdown / KeyValue Endpoints

| # | Method | Endpoint | Purpose | Used In |
|---|---|---|---|---|
| 9 | `GET` | `/KeyValue/GetPaymentMethodKeyValue/{value}` | Get payment modes (Cash, Transfer, etc.) | `AddPayment.js`, `EditPayment.js` — called with value=`2` |
| 10 | `GET` | `/KeyValue/GetInvoiceAndChequeIdKeyValue/{value}` | Get all invoices or cheques as key/value | `AddPayment.js`, `EditPayment.js` |
| 11 | `GET` | `/KeyValue/GetDropdown?type=bank` | Get bank list | via v2 dropdown system (already exists) |
| 12 | `GET` | `/KeyValue/GetDropdown?type=chequeStatus` | Get cheque status list | via v2 dropdown system (already exists) |
| 13 | `GET` | `/KeyValue/GetDropdown?type=customer` | Get customer list (paginated) | via v2 dropdown system (already exists) |
| 14 | `GET` | `/KeyValue/GetDropdown?type=employee` | Get employee list (paginated) | via v2 dropdown system (already exists) |

### 3.4 Report Endpoint (Already Implemented in V2)

| # | Method | Endpoint | Purpose | Status |
|---|---|---|---|---|
| 15 | `GET` | `/Report/GetPaymentReport?startDate={}&endDate={}&partnerId={}` | Payment report data | ✅ Already in v2 |

### 3.5 Cheque Detail Endpoint (from cheque module)

| # | Method | Endpoint | Purpose |
|---|---|---|---|
| 16 | `GET` | `/ChequeInfo/GetChequeDetailById/{id}` | Get cheque details when selecting a cheque in payment form |

---

## 4. Data Models & TypeScript Interfaces

### 4.1 Payment List Item (from `GetPaymentInfoGridByParam`)

```typescript
export interface PaymentListItem {
  paymentSystemId: number
  paymentDate: string                    // ISO date
  moenyRecepitNo: string | null          // Note: API uses "moeny" (typo in backend)
  customerName: string | null
  customerAddress: string | null
  paymentAmount: number | null           // For non-cheque payments
  chequeAmount: number | null            // For cheque payments
  paymentAdjustedAmount: number | null
  paymentMethodName: string | null
}
```

### 4.2 Payment Detail (from `GetPaymentRelatedDetailsById`)

```typescript
export interface PaymentDetail {
  paymentSystemId: number
  paymentCustomerId: number
  customerName: string
  paymentDate: string
  paymentAmount: number | null
  chequeAmount: number | null
  paymentAdjustedAmount: number | null
  paymentMethodId: number
  paymentMethodName: string
  paymentNote: string | null
  moenyRecepitNo: string | null
  paymentRelatedJobId: number | null     // Invoice SO system ID (null if not invoice payment)
  paymentChequeId: number | null         // Cheque ID (null if not cheque payment)
  paymentCollectedBy: number | null
  empFirstName: string | null
  empLastName: string | null
  employeeCode: string | null
  soSystemNo: string | null              // Invoice number
  chequeNumber: string | null
  chequeDate: string | null
  chequeActionDate: string | null
  chequeBeneficiaryBankId: number | null
  beneficiaryBankName: string | null
  chequeStatusId: number | null
  chequeStatusName: string | null
}
```

### 4.3 Invoice Metadata (from `GetPaymentInvoiceMetaDataById`)

```typescript
export interface InvoiceMetadata {
  soSystemNo: string
  sobFinalBill: number                   // Total invoice amount
  paidAmount: number                     // Amount already paid
  balance: number                        // Remaining balance
  adjustedAmount: number                 // Previously adjusted amount
  customerId: number
  customerName: string
}
```

### 4.4 Create Payment Payload (POST `AddPaymentInfo`)

```typescript
export interface CreatePaymentPayload {
  paymentCustomerId: number
  chequeAmount: number | null            // null for AIT/VAT/CreditAdj types
  paymentAmount: number | null           // null for AIT/VAT/CreditAdj types
  paymentRelatedJobId: number | null     // Invoice ID — only for Invoice type
  paymentAdjustedAmount: number | null   // only for Invoice/AIT/VAT/CreditAdj
  paymentMethodId: number               // Payment mode ID, or fixed ID for special types
  paymentDate: string                    // ISO date string "YYYY-MM-DD"
  paymentCollectedBy: number             // Employee ID
  moenyRecepitNo: string                 // Money receipt number (empty string for certain types)
  paymentChequeId: number | null         // Cheque ID — only for Cheque type
  paymentNote: string
  modifiedBy: null                       // Always null on create
  modifiedDate: null                     // Always null on create
  chequeBeneficiaryBankId: number | null // Bank ID — only for Cheque/Transfer types
  chequeStatusId: number | null          // Status ID — only for Cheque type
  chequeActionDate: string | null        // Only for Cheque type
}
```

### 4.5 Update Payment Payload (PUT `UpdatePaymentInfo`)

```typescript
export interface UpdatePaymentPayload extends CreatePaymentPayload {
  paymentSystemId: number                // Payment ID to update
}
```

### 4.6 Dropdown Option Types (customer invoices, cheques)

```typescript
/** Returned by GetPaymentCustomerInvoice/{customerId} */
export interface InvoiceDropdownOption {
  soSystemId: number        // mapped to { id, label } → key: soSystemId, value: soSystemNo
  soSystemNo: string
}

/** Returned by GetPaymentCustomerCheque/{customerId} */
export interface ChequeDropdownOption {
  chequeInfoId: number      // mapped to { id, label } → key: chequeInfoId, value: chequeNumber
  chequeNumber: string
}

/** Payment mode — from GetPaymentMethodKeyValue/{value} */
export interface PaymentModeOption {
  key: number
  value: string             // e.g., "Cash", "Online Transfer", "Bank Transfer"
}
```

---

## 5. Payment Type System & Conditional Fields

The payment form uses a **Payment Type** dropdown that controls which fields are visible. There are **8 payment types** with numeric string IDs:

### 5.1 Payment Type Enum

```typescript
export const PAYMENT_TYPES = {
  INVOICE: '0',
  CHEQUE: '1',
  OPEN: '2',
  TRANSFER: '3',
  AIT: '4',
  VAT: '5',
  CREDIT_ADJUSTMENT: '6',
  LC_PAYMENT: '7',               // ⚠️ SPECIAL: Must show redirect popup (see Section 8)
} as const

export type PaymentType = typeof PAYMENT_TYPES[keyof typeof PAYMENT_TYPES]
```

### 5.2 Payment Type Options Array

```typescript
export const PAYMENT_TYPE_OPTIONS = [
  { id: '0', title: 'Invoice' },
  { id: '1', title: 'Cheque' },
  { id: '2', title: 'Open' },
  { id: '3', title: 'Transfer' },
  { id: '4', title: 'AIT' },
  { id: '5', title: 'VAT' },
  { id: '6', title: 'Credit Adjustment' },
  { id: '7', title: 'LC Payment' },       // ⚠️ See Section 8 for redirect behavior
]
```

### 5.3 Conditional Field Visibility Matrix

| Field | Invoice (0) | Cheque (1) | Open (2) | Transfer (3) | AIT (4) | VAT (5) | Credit Adj (6) | LC Payment (7) |
|---|---|---|---|---|---|---|---|---|
| **Payment Mode dropdown** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Invoice/Cheque No dropdown** | ✅ (Invoice) | ✅ (Cheque) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Receive Amount** | ✅ | ✅ (disabled) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Money Receipt No** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Beneficiary Bank dropdown** | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Adjusted Amount** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Cheque Action Date** | ❌ | ✅ (if cheque loaded) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Invoice Details (readonly)** | ✅ (if invoice loaded) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Cheque Details (readonly)** | ❌ | ✅ (if cheque loaded) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Payment History btn** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 5.4 Always-Visible Fields (regardless of payment type)

- **Collected By** — Employee dropdown (paginated)
- **Customer Name** — Customer dropdown (paginated)
- **Payment Date** — Date picker
- **Payment Note** — Text area

### 5.5 Payment Method ID Mapping (for special types)

When payment type is AIT/VAT/CreditAdj/LC, the `paymentMethodId` is hardcoded:

```typescript
const PAYMENT_METHOD_MAP: Record<string, number> = {
  '4': 9,    // AIT → paymentMethodId = 9
  '5': 10,   // VAT → paymentMethodId = 10
  '6': 11,   // Credit Adjustment → paymentMethodId = 11
  '7': 12,   // LC Payment → paymentMethodId = 12
}
// For types 0-3, paymentMethodId comes from the Payment Mode dropdown selection
```

### 5.6 Payload Field Rules by Payment Type

**`chequeAmount`** — set to `receiveAmount` ONLY for: Invoice, Cheque, Open, Transfer. NULL for: AIT, VAT, Credit Adj, LC Payment.

**`paymentAmount`** — set to `receiveAmount` ONLY for: Invoice, Cheque, Open, Transfer, LC Payment. NULL for: AIT, VAT, Credit Adj.

**`paymentRelatedJobId`** — set ONLY for: Invoice (= invoice SO system ID). NULL for all others.

**`paymentChequeId`** — set ONLY for: Cheque (= cheque info ID). NULL for all others.

**`paymentAdjustedAmount`** — set for: Invoice, AIT, VAT, Credit Adj. NULL for all others.

**`moenyRecepitNo`** — empty string for: Transfer, AIT, VAT, Credit Adj, LC Payment. User-entered for: Invoice, Open. N/A for Cheque.

**`chequeBeneficiaryBankId`** — set for: Cheque, Transfer. NULL for all others.

**`chequeStatusId`** — set for: Cheque only (default: 2 = "Cleared"). NULL for all others.

**`chequeActionDate`** — set for: Cheque only. NULL for all others.

---

## 6. Business Rules & Validation

### 6.1 Invoice Payment Flow
1. User selects Payment Type = "Invoice"
2. User selects Customer → triggers `GetPaymentCustomerInvoice/{customerId}` to load that customer's invoices
3. User selects Invoice from dropdown → triggers `GetPaymentInvoiceMetaDataById/{invoiceId}` to load invoice details
4. Invoice Number, Invoice Amount, Paid Amount, Adjusted Amount, Balance Amount are displayed as **readonly fields**
5. User enters Receive Amount + optional Adjusted Amount
6. Customer name auto-populates from invoice data

### 6.2 Cheque Payment Flow
1. User selects Payment Type = "Cheque"
2. User selects Customer → triggers `GetPaymentCustomerCheque/{customerId}` to load that customer's cheques
3. User selects Cheque from dropdown → triggers `GetChequeDetailById/{chequeId}` to load cheque details
4. Cheque Number, Cheque Amount, Cheque Date are displayed as **readonly fields**
5. Receive Amount = Cheque Amount (auto-filled, disabled)
6. Cheque Action Date is editable
7. User selects Beneficiary Bank
8. Cheque Status defaults to "Cleared" (id: 2)

### 6.3 Open Payment Flow
1. User selects Payment Type = "Open"
2. User selects Customer, Payment Mode, enters Receive Amount and Money Receipt No

### 6.4 Transfer Payment Flow
1. User selects Payment Type = "Transfer"
2. User selects Customer, Payment Mode, Beneficiary Bank, enters Receive Amount

### 6.5 AIT / VAT / Credit Adjustment Payment Flow
1. User selects Payment Type = AIT/VAT/Credit Adjustment
2. User selects Customer, enters Adjusted Amount only
3. No Payment Mode dropdown — `paymentMethodId` is hardcoded (9/10/11)
4. No Receive Amount, no Money Receipt

### 6.6 Money Receipt Uniqueness
- The API validates `moenyRecepitNo` uniqueness
- Returns `errMsg: "Money Receipt Number Already Existed"` on duplicate
- Must display as a field-level error on `moneyReceiptNo` field

### 6.7 Edit Page: Determining Payment Type from Existing Data
When loading a payment for edit, the payment type is **reverse-engineered** from the stored data:

```typescript
function determinePaymentReference(paymentMethodId: number, paymentChequeId: number | null, paymentRelatedJobId: number | null): PaymentType {
  // Check hardcoded method IDs first
  if ([4, 7, 8].includes(paymentMethodId)) return 'TRANSFER'  // Transfer method IDs
  if (paymentMethodId === 9) return 'AIT'
  if (paymentMethodId === 10) return 'VAT'
  if (paymentMethodId === 11) return 'CREDIT_ADJUSTMENT'
  if (paymentMethodId === 12) return 'LC_PAYMENT'

  // Check relationships
  if (paymentChequeId !== null) return 'CHEQUE'
  if (paymentRelatedJobId !== null) return 'INVOICE'

  return 'OPEN'
}
```

---

## 7. Legacy Redux State Management

### 7.1 Redux State Shape

```
state.paymentList         → { loading, payments: PaymentListItem[], error }
state.paymentModeList     → { loading, paymentmodes: {id, label}[], error }
state.invoiceChequeList   → { loading, invoicecheques: {id, label}[], error }
state.invoiceDetailsReducer → { loading, invoiceSingle: InvoiceMetadata, error }
state.chequeDetails       → { loading, chequeSingle: ChequeDetail, error }
state.paymentDetails      → { loading, paymentSingle: PaymentDetail, error }
state.paymentCreate       → { loading, success, error }
state.paymentUpdate       → { loading, success, error }
state.paymentHistoryDetails → { loading, paymentHistoryList: any[], error }
```

### 7.2 V2 Replacement Strategy

| Legacy Redux | V2 Replacement |
|---|---|
| `paymentList` | `usePaymentList()` — TanStack Query |
| `paymentModeList` | `useDropdown('paymentMode')` — existing dropdown system |
| `invoiceChequeList` | `useCustomerInvoices(customerId)` / `useCustomerCheques(customerId)` — new hooks |
| `invoiceDetailsReducer` | `useInvoiceMetadata(invoiceId)` — new query hook |
| `chequeDetails` | `useChequeDetail(chequeId)` — from existing `useCheques` hook |
| `paymentDetails` | `usePaymentDetail(paymentId)` — new query hook |
| `paymentCreate` | `useCreatePayment()` — TanStack mutation |
| `paymentUpdate` | `useUpdatePayment()` — TanStack mutation |
| `paymentHistoryDetails` | `usePaymentHistory(invoiceId)` — new query hook |

---

## 8. LC Payment Redirection Rule

### CRITICAL BUSINESS RULE

When the user selects **"LC Payment"** (id: `'7'`) from the Payment Type dropdown, the system **MUST NOT** allow the user to proceed with the payment form. Instead, it must show a **warning/info popup** that redirects the user to the LC Payment module.

### Implementation Details

```
TRIGGER: User selects "LC Payment" in Payment Type dropdown
ACTION:  Show a modal/alert with the message:
         "For LC operations, please use the LC Payment module."
         with a button/link to navigate to the LC Payment page.
BEHAVIOR:
  - Do NOT show any payment form fields for this type
  - Show a dismissible alert/dialog
  - Provide a navigation link to the LC Payment list page
  - After dismissal, reset Payment Type back to "Invoice" (default)
```

### Suggested V2 UI Implementation

```tsx
// In PaymentForm.tsx — when payment type changes to LC_PAYMENT
if (selectedType === PAYMENT_TYPES.LC_PAYMENT) {
  setShowLcRedirectModal(true)
  // Reset to default payment type after modal shown
  return
}

// Modal content
<LcRedirectModal
  open={showLcRedirectModal}
  onClose={() => {
    setShowLcRedirectModal(false)
    form.setValue('paymentReference', PAYMENT_TYPES.INVOICE)
  }}
  onNavigate={() => {
    navigate('/lc/payment/list')  // or appropriate v2 LC route
  }}
/>
```

### LC Payment Module Routes (for navigation target)

| Legacy Route | V2 Route (Proposed) |
|---|---|
| `/lc/payment/list` | `/lc-payments` |
| `/lc/payment/create` | `/lc-payments/add` |
| `/lc/payment/:id/edit` | `/lc-payments/:id/edit` |

> **Note**: The LC Payment module is a separate migration effort. For now, the redirect can point to the legacy route or show a "Coming Soon" message if the LC module hasn't been migrated yet.

---

## 9. Key Technical Findings from Legacy

### 9.1 API Quirks
1. **Typo in field name**: The API uses `moenyRecepitNo` (not `moneyReceiptNo`). All payloads must use this exact spelling.
2. **Payment Mode value**: `listPaymentMode(2)` — the legacy always passes `2` as the value parameter to `GetPaymentMethodKeyValue/2`.
3. **Customer list**: Uses `listCustomersForSignup()` (a generic customer list endpoint) — in v2, use the existing `customer` paginated dropdown.
4. **Employee list**: Uses `listEmployeesForDropdown()` — in v2, use the existing `employee` paginated dropdown.
5. **Random row IDs**: Legacy generates random string IDs for DataGrid rows because `paymentSystemId` is not unique in the grid. In v2, use `paymentSystemId` as the row key.

### 9.2 Legacy Form Library
- Legacy uses **Formik + Yup** (though Yup schema is commented out in production)
- V2 must use **React Hook Form + Zod** (per project standards)

### 9.3 Payment History Modal
- Shows invoice line items with PDF export capability
- Used `html2canvas` + `jsPDF` for PDF generation
- **V2 Decision**: Implement as a simple modal/drawer showing payment history. PDF export is optional for Phase 1.

### 9.4 "Stay in this Page" Checkbox (Create only)
- Legacy has a checkbox on AddPayment: "Stay in this Page"
- When checked: after successful create, form resets but user stays on create page
- When unchecked: after successful create, navigates to list page
- **V2**: Implement this behavior with a toggle

### 9.5 Customer-Dependent Dropdowns
- Invoice dropdown: loads when customer is selected AND payment type = Invoice
- Cheque dropdown: loads when customer is selected AND payment type = Cheque
- These are **not part of the centralized dropdown system** — they require dedicated hooks

---

## 10. V2 Architecture & File Organization

Follow the patterns from `AI_DEVELOPER_GUIDE.md` and `V2_IMPLEMENTATION_GUIDE.md` exactly.

### 10.1 Data Flow

```
API Response → apiClient (JWT injected) → TanStack Query Hook → Page Component → Form → Submit → Mutation
```

### 10.2 Files Follow ONE-per-Domain Rule

```
types/payment.ts          → All interfaces for this module
hooks/usePayments.ts      → All TanStack Query hooks for this module
schemas/paymentSchema.ts  → Zod validation schema
pages/payments/           → All page components
```

---

## 11. V2 Route Mapping (Legacy → V2)

| Legacy Route | V2 Route | Component |
|---|---|---|
| `/payment/list` | `/payments` | `PaymentListPage` |
| `/payment/create` | `/payments/add` | `AddPaymentPage` |
| `/payment/:id/edit` | `/payments/:id/edit` | `EditPaymentPage` |

### Legacy Redirects to Add in `AppRouter.tsx`

```typescript
<Route path="/payment/list" element={<Navigate to="/payments" replace />} />
<Route path="/payment/create" element={<Navigate to="/payments/add" replace />} />
<Route path="/payment/:id/edit" element={<Navigate to="/payments/:id/edit" replace />} />
```

### Sidebar Entry

```typescript
{ id: 'payments', label: 'Payments', path: '/payments', icon: Wallet }
```

### Menu Mapper Entry (in `auth/menuMapper.ts`)

```typescript
'/payment/list': '/payments',
'/payment/create': '/payments/add',
```

---

## 12. V2 Module Layout (Files to Create)

```
v2-octopi/src/
├── types/
│   └── payment.ts                    # All payment interfaces, enums, payload types
├── hooks/
│   └── usePayments.ts                # All payment TanStack Query hooks
├── schemas/
│   └── paymentSchema.ts              # Zod validation schema
└── pages/
    └── payments/
        ├── PaymentListPage.tsx        # List with date/customer filters + DataGrid-like table
        ├── AddPaymentPage.tsx         # Create form wrapper
        ├── EditPaymentPage.tsx        # Edit form wrapper (loads data by ID)
        ├── PaymentForm.tsx            # Shared form component (Add + Edit)
        └── LcRedirectModal.tsx        # LC Payment redirect warning modal
```

---

## 13. Query Strategy & Cache Invalidation

### 13.1 Query Keys

```typescript
export const paymentKeys = {
  all: ['payments'] as const,
  list: (filters: PaymentListFilters) => [...paymentKeys.all, 'list', filters] as const,
  detail: (id: number) => [...paymentKeys.all, 'detail', id] as const,
  customerInvoices: (customerId: number) => [...paymentKeys.all, 'customer-invoices', customerId] as const,
  customerCheques: (customerId: number) => [...paymentKeys.all, 'customer-cheques', customerId] as const,
  invoiceMetadata: (invoiceId: number) => [...paymentKeys.all, 'invoice-metadata', invoiceId] as const,
  paymentHistory: (id: number) => [...paymentKeys.all, 'history', id] as const,
}
```

### 13.2 Hooks to Implement

```typescript
// List with filters (startDate, endDate, customerId)
export function usePaymentList(filters: PaymentListFilters, enabled: boolean)

// Single payment detail
export function usePaymentDetail(id: number)

// Customer-specific invoice/cheque dropdowns (dependent queries)
export function useCustomerInvoices(customerId: number | null)
export function useCustomerCheques(customerId: number | null)

// Invoice metadata (when an invoice is selected in form)
export function useInvoiceMetadata(invoiceId: number | null)

// Payment history (for modal)
export function usePaymentHistory(id: number | null)

// Mutations
export function useCreatePayment()   // invalidates paymentKeys.all on success
export function useUpdatePayment()   // invalidates paymentKeys.all on success
```

### 13.3 Cache Settings

| Hook | Stale Time | GC Time | Notes |
|---|---|---|---|
| `usePaymentList` | 0 | 5 min | Always refetch on filter change |
| `usePaymentDetail` | 30s | 5 min | Short stale for edit page |
| `useCustomerInvoices` | 1 min | 5 min | Refetch when customer changes |
| `useCustomerCheques` | 1 min | 5 min | Refetch when customer changes |
| `useInvoiceMetadata` | 30s | 5 min | Short stale for form accuracy |
| `usePaymentHistory` | 1 min | 5 min | On-demand fetch |

---

## 14. Form Schema Design (Zod)

```typescript
import { z } from 'zod'

export const PAYMENT_TYPES = {
  INVOICE: '0',
  CHEQUE: '1',
  OPEN: '2',
  TRANSFER: '3',
  AIT: '4',
  VAT: '5',
  CREDIT_ADJUSTMENT: '6',
  LC_PAYMENT: '7',
} as const

export const paymentFormSchema = z.object({
  paymentReference: z.string().min(1, 'Please select Payment Type'),
  customerId: z.number().min(1, 'Please select Customer'),
  employeeId: z.number().min(1, 'Please select Employee'),
  paymentDate: z.string().min(1, 'Please select Payment Date'),

  // Payment mode — required for Invoice/Cheque/Open/Transfer types
  paymentModeId: z.number().nullable(),

  // Invoice/Cheque selection — required for Invoice/Cheque types
  invoiceChequeId: z.number().nullable(),

  // Amounts
  receiveAmount: z.number().nullable(),
  adjustedAmount: z.number().nullable(),

  // Money receipt — required for Invoice/Open types
  moneyReceiptNo: z.string(),

  // Bank — required for Cheque/Transfer types
  bankId: z.number().nullable(),

  // Cheque related
  chequeStatusId: z.number().nullable(),
  chequeActionDate: z.string(),

  // Note
  paymentNote: z.string(),
})

export type PaymentFormData = z.infer<typeof paymentFormSchema>
```

> **Note**: Conditional validation (e.g., receiveAmount required only for certain types) should be handled with Zod's `.refine()` or `.superRefine()` methods, or validated at submission time in the form component.

---

## 15. Dropdown Integration

### 15.1 Existing V2 Dropdowns (reuse as-is)

| Field | Dropdown Type | Component | Already Exists |
|---|---|---|---|
| Customer | `customer` | `<PaginatedCombobox type="customer" />` | ✅ Yes |
| Employee (Collected By) | `employee` | `<PaginatedCombobox type="employee" />` | ✅ Yes |
| Payment Mode | `paymentMode` | `<DropdownSelect type="paymentMode" />` | ✅ Yes |
| Beneficiary Bank | `bank` | `<DropdownSelect type="bank" />` | ✅ Yes |
| Cheque Status | `chequeStatus` | `<DropdownSelect type="chequeStatus" />` | ✅ Yes |

### 15.2 New Custom Dropdowns Needed (NOT in centralized system)

These are **payment-specific, customer-dependent** dropdowns. They do NOT go through the centralized dropdown system because they require a `customerId` parameter.

| Field | API Endpoint | Hook | Component |
|---|---|---|---|
| Invoice No | `GET /CustomerPayment/GetPaymentCustomerInvoice/{customerId}` | `useCustomerInvoices(customerId)` | Custom `<select>` or combobox in form |
| Cheque No | `GET /CustomerPayment/GetPaymentCustomerCheque/{customerId}` | `useCustomerCheques(customerId)` | Custom `<select>` or combobox in form |

### 15.3 Payment Type Dropdown

This is a **static local array**, not an API-driven dropdown:

```typescript
const PAYMENT_TYPE_OPTIONS = [
  { id: '0', title: 'Invoice' },
  { id: '1', title: 'Cheque' },
  { id: '2', title: 'Open' },
  { id: '3', title: 'Transfer' },
  { id: '4', title: 'AIT' },
  { id: '5', title: 'VAT' },
  { id: '6', title: 'Credit Adjustment' },
  { id: '7', title: 'LC Payment' },       // ⚠️ Triggers redirect modal
]
```

Render as a native `<select>` styled with the v2 gray palette.

---

## 16. Component Breakdown

### 16.1 PaymentListPage.tsx

**Purpose**: Display a filterable, searchable table of payments.

**UI Elements**:
- Filter bar: Start Date, End Date, Customer (PaginatedCombobox), Search button
- Action buttons: Add New, Edit (selected row)
- Table columns: ID, Payment Date, Receipt No, Customer Name, Customer Address, Received Amount, Adjustment, Payment Method
- Row click → navigate to edit page

**Data Source**: `usePaymentList(filters, loadRequested)`

**Behavior**:
- Default date range: today minus 3 days → today
- Payments load on "Search" button click (not on mount)
- Client-side text search across all visible columns

### 16.2 AddPaymentPage.tsx

**Purpose**: Wrapper for create mode.

**Behavior**:
- Renders `<PaymentForm mode="create" />`
- On success: show notification, navigate to `/payments` (or stay if "Stay in Page" is checked)

### 16.3 EditPaymentPage.tsx

**Purpose**: Wrapper for edit mode.

**Behavior**:
- Gets `:id` from URL params
- Fetches payment detail via `usePaymentDetail(id)`
- Maps API data → form `defaultValues`
- Renders `<PaymentForm mode="edit" defaultValues={...} paymentId={id} />`
- On success: show notification, navigate to `/payments`

### 16.4 PaymentForm.tsx (Shared)

**Purpose**: The core form component used by both Add and Edit pages.

**Props**:
```typescript
interface PaymentFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<PaymentFormData>
  paymentId?: number
}
```

**Key Features**:
- Payment Type dropdown with conditional field rendering (Section 5.3 matrix)
- LC Payment redirect modal trigger (Section 8)
- Customer-dependent invoice/cheque dropdown loading
- Invoice metadata readonly display panel
- Cheque details readonly display panel
- Payment History modal button
- "Stay in Page" checkbox (create mode only)
- Submit/Reset buttons

### 16.5 LcRedirectModal.tsx

**Purpose**: Warning modal when user selects "LC Payment" type.

**Content**:
- Icon: Info/Warning icon
- Title: "LC Payment Module"
- Message: "For LC payment operations, please use the dedicated LC Payment module."
- Buttons: "Go to LC Payments" (navigates), "Cancel" (closes modal, resets type to Invoice)

---

## 17. Server-Side API Requirements

### 17.1 Existing APIs That Work (No Changes Needed)

All payment APIs are already available and need **no server-side changes** for the v2 migration:

| Endpoint | Status | Notes |
|---|---|---|
| `GET /CustomerPayment/GetPaymentInfoGridByParam` | ✅ Ready | Supports date range + customer + payment method filters |
| `GET /CustomerPayment/GetPaymentRelatedDetailsById/{id}` | ✅ Ready | Returns full payment detail for edit |
| `POST /CustomerPayment/AddPaymentInfo` | ✅ Ready | Create payment with validation |
| `PUT /CustomerPayment/UpdatePaymentInfo` | ✅ Ready | Update payment |
| `GET /CustomerPayment/GetPaymentInvoiceMetaDataById/{id}` | ✅ Ready | Invoice metadata |
| `GET /CustomerPayment/GetPaymentCustomerInvoice/{id}` | ✅ Ready | Customer invoices dropdown |
| `GET /CustomerPayment/GetPaymentCustomerCheque/{id}` | ✅ Ready | Customer cheques dropdown |
| `GET /KeyValue/GetPaymentMethodKeyValue/2` | ✅ Ready | Payment modes |
| `GET /KeyValue/GetDropdown?type=bank` | ✅ Ready | via v2 dropdown system |
| `GET /KeyValue/GetDropdown?type=chequeStatus` | ✅ Ready | via v2 dropdown system |
| `GET /KeyValue/GetDropdown?type=customer` | ✅ Ready | via v2 dropdown system |
| `GET /KeyValue/GetDropdown?type=employee` | ✅ Ready | via v2 dropdown system |
| `GET /ChequeInfo/GetChequeDetailById/{id}` | ✅ Ready | Cheque details |

### 17.2 Potential Server-Side Improvements (Optional / Nice-to-Have)

These are NOT blockers but would improve the v2 experience:

| # | Improvement | Description | Priority |
|---|---|---|---|
| 1 | **Paginated payment list** | `GetPaymentInfoGridByParam` returns all results. For large datasets, a paginated version (`pageNumber`, `pageSize`, `totalRecords`) would be better for v2's infinite scroll pattern. | Medium |
| 2 | **Payment mode via unified dropdown** | Currently uses a separate endpoint `GetPaymentMethodKeyValue/2`. Could be served via `GetDropdown?type=paymentMode` (already in dropdown registry). Need to verify if they return the same data. | Low |
| 3 | **Fix typo `moenyRecepitNo`** | The field name `moenyRecepitNo` is a typo of `moneyReceiptNo`. Fixing this across the entire backend would be nice but requires coordinated migration. | Low |
| 4 | **Unified invoice/cheque dropdown via GetDropdown** | Customer invoices/cheques use dedicated endpoints. These could be integrated into the dropdown system with `type=customerInvoice&customerId={id}`. | Low |
| 5 | **Delete payment endpoint** | Legacy has no delete payment feature. If needed in v2, a `DELETE /CustomerPayment/{id}` endpoint would be required. | Low |

### 17.3 API Base URL Configuration

| Environment | Legacy Base URL | V2 Base URL |
|---|---|---|
| Legacy | `process.env.REACT_APP_API_BASE_URL` | N/A |
| V2 | N/A | `https://api-v2.algologix.com.bd/api` (via `VITE_API_BASE_URL`) |

Both point to the **same backend** — the payment APIs are shared.

---

## 18. Execution Plan (Phases)

### Phase 1: Types & Infrastructure (Est. ~30 min)

- [ ] Create `types/payment.ts` with all interfaces from Section 4
- [ ] Create `schemas/paymentSchema.ts` with Zod schema from Section 14
- [ ] Create `hooks/usePayments.ts` with all query hooks from Section 13.2
- [ ] Add routes in `router/AppRouter.tsx` from Section 11
- [ ] Add legacy redirects in `router/AppRouter.tsx`
- [ ] Add sidebar entry in `layout/Sidebar.tsx`
- [ ] Add menu mapper entries in `auth/menuMapper.ts`

### Phase 2: Payment List Page (Est. ~1 hr)

- [ ] Create `pages/payments/PaymentListPage.tsx`
- [ ] Implement date range + customer filter bar
- [ ] Implement styled table with columns from Section 16.1
- [ ] Implement row click → navigate to edit
- [ ] Implement "Add New" → navigate to create
- [ ] Client-side search within loaded results

### Phase 3: Payment Form & Create Page (Est. ~2 hr)

- [ ] Create `pages/payments/LcRedirectModal.tsx`
- [ ] Create `pages/payments/PaymentForm.tsx` with all conditional fields
- [ ] Implement Payment Type dropdown with field visibility matrix
- [ ] Implement LC Payment redirect popup (Section 8)
- [ ] Implement customer-dependent invoice/cheque dropdowns
- [ ] Implement invoice metadata readonly panel
- [ ] Implement cheque details readonly panel
- [ ] Implement payload building logic (Section 5.6)
- [ ] Create `pages/payments/AddPaymentPage.tsx` wrapper
- [ ] Implement "Stay in Page" toggle
- [ ] Handle API errors (money receipt duplicate, etc.)

### Phase 4: Edit Page (Est. ~1 hr)

- [ ] Create `pages/payments/EditPaymentPage.tsx`
- [ ] Implement payment type detection from existing data (Section 6.7)
- [ ] Map payment detail → form default values
- [ ] Handle update success/error flows

### Phase 5: Payment History Modal (Est. ~30 min)

- [ ] Implement payment history query hook
- [ ] Create payment history modal/drawer component
- [ ] Wire into PaymentForm for Invoice/Cheque types

### Phase 6: Testing & Polish (Est. ~30 min)

- [ ] Test all 8 payment types create flow
- [ ] Test edit flow for each payment type
- [ ] Test LC Payment redirect behavior
- [ ] Test filter and search on list page
- [ ] Verify all API error handling
- [ ] Cross-check payload shapes against legacy

---

## 19. Migration Checklist

### Infrastructure
- [ ] `types/payment.ts` — All interfaces created
- [ ] `schemas/paymentSchema.ts` — Zod schema created
- [ ] `hooks/usePayments.ts` — All query/mutation hooks created
- [ ] `AppRouter.tsx` — Routes added + legacy redirects
- [ ] `Sidebar.tsx` — Payments nav entry added
- [ ] `menuMapper.ts` — Legacy → v2 mapping added

### List Page
- [ ] `PaymentListPage.tsx` — Created and functional
- [ ] Date range filter works
- [ ] Customer filter works (PaginatedCombobox)
- [ ] Search filtering works
- [ ] Row click navigates to edit
- [ ] "Add New" button works
- [ ] Loading/error states handled

### Create Page
- [ ] `AddPaymentPage.tsx` — Created and functional
- [ ] `PaymentForm.tsx` — All 8 payment types render correctly
- [ ] Invoice type: invoice dropdown loads by customer → metadata displays
- [ ] Cheque type: cheque dropdown loads by customer → details display
- [ ] Open type: simple form works
- [ ] Transfer type: bank dropdown appears
- [ ] AIT/VAT/Credit Adj: only adjusted amount field
- [ ] LC Payment: redirect modal shows (Section 8)
- [ ] Payment submission works for all types
- [ ] Money receipt duplicate error handled
- [ ] "Stay in Page" checkbox works
- [ ] Success notification shows

### Edit Page
- [ ] `EditPaymentPage.tsx` — Created and functional
- [ ] Payment type correctly detected from stored data
- [ ] All fields pre-populated from API
- [ ] Update submission works
- [ ] Success notification + redirect to list

### LC Redirect
- [ ] `LcRedirectModal.tsx` — Created
- [ ] Modal shows when "LC Payment" selected
- [ ] "Go to LC Payments" button navigates correctly
- [ ] "Cancel" resets type to Invoice

### Payment History
- [ ] History modal implemented for Invoice/Cheque types
- [ ] Shows payment-related invoice details

---

## Appendix A: Quick Reference — API Field Name Mapping

| V2 Form Field | API Payload Key | Notes |
|---|---|---|
| Customer | `paymentCustomerId` | From PaginatedCombobox value |
| Collected By | `paymentCollectedBy` | Employee ID from PaginatedCombobox |
| Payment Date | `paymentDate` | "YYYY-MM-DD" string |
| Payment Mode | `paymentMethodId` | From DropdownSelect or hardcoded |
| Invoice No | `paymentRelatedJobId` | SO system ID from invoice dropdown |
| Cheque No | `paymentChequeId` | Cheque info ID from cheque dropdown |
| Receive Amount | `paymentAmount` / `chequeAmount` | See Section 5.6 for rules |
| Adjusted Amount | `paymentAdjustedAmount` | |
| Money Receipt No | `moenyRecepitNo` | ⚠️ Typo in API — MUST use this spelling |
| Beneficiary Bank | `chequeBeneficiaryBankId` | |
| Cheque Status | `chequeStatusId` | |
| Cheque Action Date | `chequeActionDate` | |
| Payment Note | `paymentNote` | |

## Appendix B: Payment Method ID Reference

| Payment Method | ID | Used For |
|---|---|---|
| Cash | 1 | Invoice, Cheque, Open |
| Online Transfer | 2 | Invoice, Cheque, Open |
| Bank Deposit | 3 | Invoice, Cheque, Open |
| Bank Transfer | 4 | Transfer |
| bKash / Mobile | 5-6 | Invoice, Cheque, Open |
| RTGS | 7 | Transfer |
| BEFTN | 8 | Transfer |
| AIT | 9 | AIT (hardcoded) |
| VAT | 10 | VAT (hardcoded) |
| Credit Adjustment | 11 | Credit Adjustment (hardcoded) |
| LC Payment | 12 | LC Payment (hardcoded) |

> **Note**: IDs 1-8 come from the `GetPaymentMethodKeyValue/2` API. IDs 9-12 are hardcoded by payment type and never shown in the Payment Mode dropdown.
