# Stock-Out V2 Signoff Sheet

> Purpose: provide a short execution sheet for manual testers validating the migrated stock-out module in V2.
>
> Use this together with `docs/stockout-v2-manual-qa-checklist.md` when deeper detail is needed.

---

## Release Context

- Module: Stock-Out V2
- App: `v2-octopi`
- Validation Type: Manual signoff
- Blocking known gap: CSV upload remains blocked until a verified backend API contract exists

---

## Tester Info

| Field | Value |
|---|---|
| Tester name | |
| Test date | |
| Environment | |
| Build/version | |
| User role tested | |

---

## Preconditions

Confirm before starting:

| Check | Yes/No | Notes |
|---|---|---|
| API environment is reachable | | |
| Standard user account is available | | |
| Admin/pricing account is available | | |
| Warehouse/admin account is available | | |
| Customer/product/pack-type data exists | | |
| At least one order can move through the workflow | | |

---

## Core Flow Signoff

| Flow | Route | Pass/Fail/Blocked | Notes |
|---|---|---|---|
| Create stock-out order | `/sales-orders/create` | | |
| Standard edit | `/sales-orders/:id/edit` | | |
| Escalate order | `/sales-orders/:id/escalate` | | |
| Escalation queue reflects move | `/sales-orders/escalations` | | |
| Submit packaging | `/sales-orders/:id/package` | | |
| Packaging queue reflects move | `/sales-orders/packages` | | |
| Complete packaging | `/sales-orders/packages` | | |
| Package-done edit | `/sales-orders/packages/done/:id/edit` | | |

Acceptance notes:
- No browser refresh should be required after successful mutations.
- Totals and packaging validations should behave consistently with the edited values.

---

## Admin Overlay Signoff

| Flow | Route | Pass/Fail/Blocked | Notes |
|---|---|---|---|
| Admin general list | `/sales-orders/admin/general` | | |
| Admin full edit | `/sales-orders/admin/:id/edit` | | |
| Pending-price list | `/sales-orders/admin/pending-price` | | |
| Admin price edit | `/sales-orders/admin/:id/price-edit` | | |
| Limited-edit list | `/sales-orders/admin/limited-edit` | | |
| Admin invoice-limited edit | `/sales-orders/admin/:id/invoice-edit` | | |
| Admin pack edit | `/sales-orders/admin/:id/pack-edit` | | |

Acceptance notes:
- Locked vs editable fields must follow the intended mode.
- Admin saves must propagate to the related standard/admin lists.

---

## Operational Page Signoff

| Flow | Route | Pass/Fail/Blocked | Notes |
|---|---|---|---|
| Status monitoring | `/sales-orders/status` | | |
| Pending status management | `/sales-orders/pending` | | |
| Delivery return / restore inventory | `/sales-orders/delivery-return` | | |
| Packing print hub | `/sales-orders/packing-print` | | |
| CSV upload | `/sales-orders/status` | BLOCKED | Awaiting verified backend API contract |

Acceptance notes:
- Status changes should refresh downstream views without reload.
- Delivery return should refresh detail/packaging/operational views after success.

---

## Print And View Signoff

| Surface | Entry Point | Pass/Fail/Blocked | Notes |
|---|---|---|---|
| Detail/view modal | list or package-done | | |
| Invoice/internal print | list or packing print | | |
| Packing list / Karjadesh | packing print | | |
| Chalaan print | packing print | | |
| Sticker print | packing print | | |

Acceptance notes:
- Printed data must match the selected order and packaging state.
- No runtime/modal rendering errors should occur.

---

## Access Control Signoff

| Scenario | Expected Result | Pass/Fail/Blocked | Notes |
|---|---|---|---|
| Standard user opens admin routes | Redirected / denied | | |
| Pricing/admin user opens pending-price routes | Allowed | | |
| Warehouse/admin user opens packaging print/edit routes | Allowed | | |
| Menu token path mapping matches visible access | Allowed routes align with menu | | |

---

## Defect Summary

| Severity | Area | Description | Repro Route | Status |
|---|---|---|---|---|
| Critical | | | | |
| Major | | | | |
| Minor | | | | |

---

## Latest Live QA Notes

Execution date: 2026-03-20

Validated in a live authenticated session against the V2 stock-out module:

| Area | Result | Notes |
|---|---|---|
| Create flow shell | PASS | `/sales-orders/create` loaded full customer, bill, item, and submit UI without runtime failure. |
| Standard edit load | PASS | `/sales-orders/4455/edit` loaded live order `CAS0004455` with expected product and bill values. |
| Admin general list | PASS | `/sales-orders/admin/general` returned live rows after widening the date window to `2023-11-01` through `2023-12-31`; sampled rows included `CAS0003521`, `CAS0003520`, and `LCL0003519`. |
| Admin limited-edit list | PASS | `/sales-orders/admin/limited-edit` returned live rows for the same historical window and exposed invoice-limited actions for the same sampled records. |
| Admin full edit page | PASS | `/sales-orders/admin/3521/edit` loaded `CAS0003521` with editable customer, supplier, order metadata, product line, bill adjustments, and save-oriented actions visible. |
| Admin invoice-limited edit page | PASS | `/sales-orders/admin/3521/invoice-edit` loaded `CAS0003521` with customer, supplier, order type, order source, currency, and product selector locked as expected while invoice-limited bill fields remained available. |
| Pending page list | PASS | `/sales-orders/pending` returned live rows for the same historical window; sampled rows included `LCL0003519`, `LNS0003514`, and `CSL0003512`. |
| Pending update modal | PASS | Opened non-destructively for `LCL0003519`; modal hydrated invoice date, customer, sales type, work pending, pending-status dropdown, remarks field, and cancel/update actions. |
| Status page list | PASS | `/sales-orders/status` showed live current rows including `CSL0004548`, `CAS0004547`, and `CSL0004538`. |
| Status update modal | PASS | Opened non-destructively for `CSL0004548`; modal hydrated correctly with the same field set as the pending page. |
| Controlled status mutation | PASS | On `/sales-orders/status`, live row `CAS0004547` was updated to `Stock not available` with remarks `QA status validation 2026-03-20`; the grid refreshed immediately and authenticated popup verification showed `soAssociateCurrentStatus: 11`, `soDecesionPending: Stock not available`, and matching remarks. The same row was then reset with `Resume` plus remarks `QA status reset 2026-03-20`, and authenticated popup verification confirmed `soAssociateCurrentStatus: null` and cleared remarks. |
| Delivery return shell | PASS | `/sales-orders/delivery-return` still loaded cleanly with SO System ID input, disabled `Check Data` action before lookup, reset action, and token-derived channel indicator. |
| Delivery return lookup guard | PASS | Looking up SO system ID `3485` returned a user-facing rule message instead of a runtime failure: `This order is not at delivery status. Returns are only allowed for orders at delivery.` |
| Delivery return preview load | PASS | Looking up SO system ID `3495` loaded delivered order `CAS0003495` and rendered a restoration preview with stock-impact rows for `ABK 200` and `ACTIVANTE MNF`, plus a visible `Restore Inventory` action. No restore submission was performed. |
| Package-done edit | PASS | `/sales-orders/packages/done/3485/edit` showed valid pack-type options such as `POLY PACK`, `DRUM`, and `BAG`; prior `NaN`/blank-option issue was not reproduced. |
| Packing print deep link | PASS | `/sales-orders/packing-print?orderId=3485` hydrated the preview pane with order metadata, packaging rows, and print action buttons. |

Mutation scope note:

- This pass included one controlled and cleaned-up live status mutation on `CAS0004547`; no delivery-return restore submission was performed.
- A follow-up safety scan across nearby live records (`4525` through `4555`) did not find a clearly synthetic delivered order; the only delivered record in that recent range was `CSL0004548` for `Al-Madina Washing Plant Ltd`, so the destructive restore action remains intentionally deferred.
- Admin general and limited-edit were rechecked using a historical date window because the default current-day window produced valid but empty states.

---

## Final Signoff

| Item | Value |
|---|---|
| Overall result | PASS / FAIL / BLOCKED |
| Ready for release | YES / NO |
| Signoff owner | |
| Signoff date | |

### Release recommendation

- Mark `PASS` only when core flow, admin overlays, operational pages, print surfaces, and access control all pass.
- Mark `BLOCKED` if a release-critical dependency outside V2 prevents verification.
- CSV upload alone should remain a documented blocked item, not an automatic module failure, unless product/API owners confirm it as release-critical.
