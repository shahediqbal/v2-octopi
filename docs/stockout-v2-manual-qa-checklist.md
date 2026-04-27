# Stock-Out V2 Manual QA Checklist

> Purpose: verify the migrated stock-out workflow in V2 end to end without relying on browser refreshes or legacy pages.
>
> Scope: standard stock-out flow, admin overlays, operational support pages, and print surfaces implemented in `v2-octopi`.

---

## 1. Preconditions

- Environment is running against the intended API base URL.
- You have at least one account with access to standard stock-out pages.
- You have at least one account with admin/pricing/warehouse access for overlay routes.
- Product, customer, supplier, order type, order source, and pack type lookup data already exist in the backend.
- There is at least one order that can move through the full stock-out lifecycle if creating a fresh one is not practical.

### Recommended test accounts

| Access Type | Minimum Needed Routes |
|---|---|
| Standard user | `/sales-orders`, `/sales-orders/create`, edit, escalate, package |
| Pricing/admin user | `/sales-orders/admin/general`, `/sales-orders/admin/pending-price`, `/sales-orders/admin/limited-edit` |
| Warehouse/admin user | package-done edit, admin pack edit, delivery return, packing print |

### Recommended seed data

- One customer with valid address and credit/payment context.
- One supplier for admin-full edit validation.
- Two products with different prices so price-edit and item mapping behavior are visible.
- One pack type for packaging completion.
- One order that can be safely escalated and packaged in the target environment.

---

## 2. Route Coverage Map

| Area | V2 Route |
|---|---|
| Standard list | `/sales-orders` |
| Create | `/sales-orders/create` |
| Standard edit | `/sales-orders/:id/edit` |
| Escalate | `/sales-orders/:id/escalate` |
| Escalation list | `/sales-orders/escalations` |
| Package | `/sales-orders/:id/package` |
| Packaging list | `/sales-orders/packages` |
| Package done list | `/sales-orders/packages/done` |
| Package done edit | `/sales-orders/packages/done/:id/edit` |
| Admin general list | `/sales-orders/admin/general` |
| Admin pending-price list | `/sales-orders/admin/pending-price` |
| Admin limited-edit list | `/sales-orders/admin/limited-edit` |
| Admin full edit | `/sales-orders/admin/:id/edit` |
| Admin price edit | `/sales-orders/admin/:id/price-edit` |
| Admin invoice edit | `/sales-orders/admin/:id/invoice-edit` |
| Admin pack edit | `/sales-orders/admin/:id/pack-edit` |
| Status page | `/sales-orders/status` |
| Pending page | `/sales-orders/pending` |
| Delivery return | `/sales-orders/delivery-return` |
| Packing print | `/sales-orders/packing-print` |

---

## 3. Core Flow Checklist

### 3.1 Create stock-out order

Route: `/sales-orders/create`

Steps:
1. Open create page.
2. Select customer, order type, and order source.
3. Add at least one product line.
4. Enter quantity, unit price, discount, VAT, and AIT values.
5. Save the order.
6. Return to `/sales-orders`.

Expected results:
- Form loads without console/runtime errors.
- Totals update while editing product lines.
- Validation blocks empty required dropdowns and invalid numeric values.
- Save succeeds once and does not double-submit.
- The newly created order appears in `/sales-orders` without a full page refresh.

### 3.2 Standard edit flow

Route: `/sales-orders/:id/edit`

Steps:
1. Open the newly created or existing created-order record in standard edit mode.
2. Change reference, remarks, quantity, or bill fields.
3. Save.
4. Return to `/sales-orders`.

Expected results:
- Detail page loads the existing order correctly.
- Editable fields match standard mode rules.
- Updated totals and line values persist after save.
- List data reflects the changes without browser refresh.

### 3.3 Escalation flow

Route: `/sales-orders/:id/escalate`

Steps:
1. Open an order that is ready for escalation.
2. For each item, select mapped product and batch.
3. Submit escalation.
4. Open `/sales-orders/escalations`.

Expected results:
- Mapped product and batch lookups load correctly per item.
- Required batch/mapped product validation works.
- Successful submit removes the order from the main created queue and places it in escalation flow.
- Escalation list updates without manual refresh.

### 3.4 Packaging submit flow

Route: `/sales-orders/:id/package`

Steps:
1. Open a record from escalation that is ready for packaging.
2. Enter pack type, pack size, pack count, and pack quantity.
3. Submit packaging.
4. Open `/sales-orders/packages`.

Expected results:
- Packaging rows load with confirmed product quantities.
- Quantity validation prevents mismatched total packaged quantity.
- Successful submit moves the order into packaging-related list flow.
- Packaging list updates without browser refresh.

### 3.5 Complete packaging and done edit

Routes:
- `/sales-orders/packages`
- `/sales-orders/packages/done`
- `/sales-orders/packages/done/:id/edit`

Steps:
1. Complete packaging from the packaging queue.
2. Open `/sales-orders/packages/done`.
3. Open the completed record in package-done edit mode.
4. Adjust pack values and save.

Expected results:
- Completing packaging moves the order into the package-done list.
- Package-done detail loads from `GetPackagingInfo/{id}`.
- Editing completed packaging preserves confirmed quantity constraints.
- Updated packaging data is reflected in done and print flows without refresh.

---

## 4. Admin Overlay Checklist

### 4.1 Admin general list and full edit

Routes:
- `/sales-orders/admin/general`
- `/sales-orders/admin/:id/edit`

Steps:
1. Open admin general list.
2. Verify status tabs and row actions for the visible records.
3. Open a record in admin full edit mode.
4. Update customer/supplier or financial fields.
5. Save and return to the list.

Expected results:
- Admin list loads through the admin endpoint and shows admin-specific actions.
- Admin full edit exposes additional fields compared to standard edit.
- Save uses admin update behavior and all affected lists stay synchronized.

### 4.2 Admin pending-price and price edit

Routes:
- `/sales-orders/admin/pending-price`
- `/sales-orders/admin/:id/price-edit`

Steps:
1. Open pending-price list.
2. Open a pending-price record in price-edit mode.
3. Change unit price, discount, VAT, or AIT.
4. Save.

Expected results:
- List loads from the pending-price endpoint.
- Price edit only unlocks the fields intended by `fieldRules.ts`.
- Recalculated totals match the shared calculation module.
- Returning to admin list and standard list shows synchronized values.

### 4.3 Admin limited edit and invoice-limited edit

Routes:
- `/sales-orders/admin/limited-edit`
- `/sales-orders/admin/:id/invoice-edit`

Steps:
1. Open limited-edit list.
2. Open an eligible record in invoice-limited edit mode.
3. Update only the permitted quantity/reference fields.
4. Save.

Expected results:
- Non-editable financial and product fields remain locked.
- Save completes through the admin packaging submission path.
- List and detail state remain synchronized.

### 4.4 Admin pack edit

Route: `/sales-orders/admin/:id/pack-edit`

Steps:
1. Open a packaged-done record through admin pack edit.
2. Change pack size, pack count, or pack type.
3. Save.

Expected results:
- Packaging-only fields are editable.
- Hidden bill fields do not appear.
- Save updates package-done and packing-print views without refresh.

---

## 5. Operational Support Checklist

### 5.1 Status monitoring

Route: `/sales-orders/status`

Steps:
1. Open the status page.
2. Switch between status values.
3. Open the status modal for a record.
4. Change associate current status and add remarks.
5. Save.

Expected results:
- Status grid loads records for the selected current status.
- Shared status modal opens and submits correctly.
- After save, status list and related pending views refresh without browser reload.

### 5.2 Pending status management

Route: `/sales-orders/pending`

Steps:
1. Open the pending page.
2. Filter by date and customer when possible.
3. Open pending modal for a row.
4. Update the pending-related status and remarks.

Expected results:
- Pending grid loads through the pending endpoint.
- Shared status modal behavior matches the status page.
- Changes reflect immediately in pending/status-related views.

### 5.3 Delivery return / inventory restore

Route: `/sales-orders/delivery-return`

Steps:
1. Open the delivery return page.
2. Load an order eligible for restore.
3. Review current stock preview.
4. Execute restore.

Expected results:
- Current stock preview loads per effective product/channel.
- Restore action completes only once.
- Standard lists, packaging detail, and operational pages refresh after success.

### 5.4 Packing print hub

Route: `/sales-orders/packing-print`

Steps:
1. Open the packing print page directly.
2. Load a package-done order by selection or query parameter.
3. Open each print surface: invoice, packing list, chalaan, sticker.

Expected results:
- Selected order context persists across print actions.
- Each modal loads the expected order/packaging data.
- Print surfaces render without runtime errors.

### 5.5 CSV upload note

Status: not currently verifiable in V2.

Reason:
- The legacy plan mentions CSV upload for status operations, but no verified backend contract/endpoint was confirmed during migration.

QA handling:
- Mark CSV upload as blocked until a real backend API contract is provided.
- Do not fail the current V2 stock-out rollout on CSV upload alone unless it is confirmed as release-critical.

---

## 6. Print And View Checklist

### Detail and invoice modal

Entry points:
- Standard list
- Package-done list
- Packing print hub

Expected results:
- View modal opens with complete order detail.
- Invoice/internal modal renders correct customer, item, and bill data.

### Packing list / Karjadesh

Expected results:
- Packaging detail values match package-done data.
- Product, quantity, and packaging values are consistent with edit results.

### Chalaan and sticker

Expected results:
- Packaging-derived data renders correctly.
- No missing product or pack metadata when opened from package-done records.

---

## 7. Access Control Checklist

Steps:
1. Log in as a standard-only user.
2. Attempt access to admin stock-out routes directly.
3. Log in as a pricing/admin user.
4. Confirm access to pending-price and price-edit routes.
5. Log in as a warehouse/admin user.
6. Confirm access to packaging-related edit/print routes.

Expected results:
- Unauthorized users are redirected away from protected stock-out routes.
- Menu-aware access follows JWT/menu-token path mappings.
- Authorized users retain access to the expected route families.

---

## 8. Regression Summary Template

Use this after execution.

| Area | Status | Notes |
|---|---|---|
| Standard create/edit/escalate | PASS / FAIL / BLOCKED | |
| Packaging and package-done edit | PASS / FAIL / BLOCKED | |
| Admin overlays | PASS / FAIL / BLOCKED | |
| Status and pending operations | PASS / FAIL / BLOCKED | |
| Delivery return | PASS / FAIL / BLOCKED | |
| Print surfaces | PASS / FAIL / BLOCKED | |
| Route protections | PASS / FAIL / BLOCKED | |
| CSV upload | BLOCKED by missing API contract | |

---

## 9. Exit Criteria

The stock-out module can be treated as manually validated when all of the following are true:

- Core standard flow passes from create through package-done edit.
- Admin overlay routes pass in their intended permission contexts.
- Status and pending operations refresh downstream views without browser refresh.
- Delivery return completes and invalidates dependent views correctly.
- Print/view surfaces render expected data without runtime errors.
- No newly discovered stale-data gaps remain.
