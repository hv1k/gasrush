# GasRush Full Audit Results

**Date:** 2026-02-21  
**Auditor:** Automated Code Audit  
**Pages Checked:** 29 HTML files + app.js + mobile.js

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 5 |
| 🟡 Medium | 12 |
| 🟢 Low | 8 |

---

## 🔴 CRITICAL Issues

### 1. `rental-dashboard.html` — Undefined variable `user` in loadData()
- **File:** rental-dashboard.html, **Line:** 100
- **Issue:** `loadData()` references `user.role` and `user.id`, but `user` is a `const` scoped inside the `async ()` IIFE. When `loadData()` is called from the Refresh button (line 30), `user` is undefined → runtime crash.
- **Fix:** Store user in a module-level variable like other pages do (`currentUser`).

### 2. `field-workers.html` — References `users.phone` column that doesn't exist
- **File:** field-workers.html, **Lines:** 112, 131, 187, 260-268
- **Issue:** Displays `w.phone` from users table (line 112, 131), has edit field for phone (line 187), and inserts phone value when adding workers (line 267 — note: `addWorker()` collects phone but doesn't include it in the insert object, so the insert itself is fine, but the edit `saveWorker()` on line 198-210 doesn't save phone either). The **display** of `w.phone` will always show `—` since the column doesn't exist. The edit form has a phone field that does nothing.
- **Impact:** Confusing UX — phone field appears editable but data is never saved/loaded.

### 3. `job-site-detail.html` — References non-existent `siteStats` element
- **File:** job-site-detail.html, **Line:** 164
- **Issue:** `renderStats()` function sets `document.getElementById('siteStats').innerHTML` but there is NO element with id `siteStats` in the HTML. The `renderStats()` function is defined (lines 156-172) but never called from `loadData()`, so it won't crash — but it's dead code with a broken reference.
- **Severity downgraded:** Dead code, won't crash at runtime.

### 4. `create-job.html` — Job type dropdown includes invalid types
- **File:** create-job.html, **Lines:** 129-131
- **Issue:** Dropdown includes `swap` and `pickup` options, but only `fuel-delivery` and `equipment-delivery` are valid job types per the schema. Creating jobs with invalid types may cause filtering/display issues elsewhere.

### 5. `invoices.html` — Orphaned page still exists, not in any sidebar
- **File:** invoices.html (entire file)
- **Issue:** invoices.html still exists as a full functional page (128 lines) but is not linked from ANY sidebar in NAV_CONFIG. It's accessible only by direct URL. Should be deleted or redirected.

---

## 🟡 MEDIUM Issues

### 6. `field-worker.html` — Still creates invoice records on delivery submit
- **File:** field-worker.html, **Lines:** 336-348
- **Issue:** `submitDelivery()` inserts into the `invoices` table after submitting a delivery. If invoices feature was removed, this insert is either unnecessary or will fail silently (caught by try/catch). Inconsistent with "invoices removed" decision.

### 7. `data-export.html` — Still lists "Invoices" as export option
- **File:** data-export.html, **Line:** 35
- **Issue:** Export data type dropdown includes `<option value="invoices">Invoices</option>`. If invoices feature is removed/deprecated, this option is misleading.

### 8. `reports.html` — Reports include "Invoice Report" option
- **File:** reports.html, **Line:** 34
- **Issue:** Report type dropdown includes "Invoice Report" which references removed feature.

### 9. `login.html` — Missing `mobile.js` include
- **File:** login.html
- **Issue:** Does not include `mobile.js`. This is probably intentional (login has no sidebar), so LOW impact — but noted for completeness.

### 10. `index.html` — Missing `mobile.js` include
- **File:** index.html
- **Issue:** Just a redirect page, no mobile.js needed. Not really an issue.

### 11. `vendor-dashboard.html` — Has "Create Work Order" button but vendors might not have permission
- **File:** vendor-dashboard.html, **Line:** 27
- **Issue:** Links to `create-job.html` which has `roles: ['rental', 'vendor', 'admin']` so vendors CAN create — this is fine. However, `create-job.html` is NOT in the vendor NAV_CONFIG sidebar, so there's a discrepancy: button exists on dashboard but no sidebar link.

### 12. `routes.html` — Fieldworker role included but no sidebar link
- **File:** routes.html, **Line:** 65
- **Issue:** `roles: ['vendor', 'fieldworker', 'admin']` allows fieldworkers, but routes is NOT in the fieldworker NAV_CONFIG. Fieldworkers can only reach this page via direct URL.

### 13. `daily-log.html` — Rental role excluded but has sidebar link for rental
- **File:** daily-log.html, **Line:** 64
- **Issue:** `roles: ['fieldworker', 'vendor', 'admin']` — rental role is excluded. BUT rental NAV_CONFIG includes Daily Log (app.js line ~113). Rental users clicking Daily Log in sidebar will be redirected away. **Inconsistency.**

### 14. `work-orders.html` — Fieldworker has full access including status editing
- **File:** work-orders.html, **Line:** 78
- **Issue:** Fieldworkers can access work-orders.html (`roles: ['rental', 'vendor', 'fieldworker', 'admin']`), but work-orders is NOT in fieldworker's NAV_CONFIG. Fieldworkers shouldn't need this page — they use field-worker.html. Low risk since no sidebar link, but the page allows viewing all orders.

### 15. `alerts.html` — Fieldworker role excluded
- **File:** alerts.html, **Line:** 65
- **Issue:** `roles: ['rental', 'vendor', 'admin']` excludes fieldworkers. Fieldworker NAV_CONFIG has no alerts link, so this is consistent. Just noting.

### 16. `vendor-comparison.html` — Uses `r.gallons` and `r.vendor_name` which may not exist on jobs table
- **File:** vendor-comparison.html, **Lines:** 55-59
- **Issue:** References `r.vendor_name || r.vendor` and `r.gallons || r.quantity` — jobs table likely uses `billable_services.fuelGallons` for gallons (as used elsewhere), not a top-level `gallons` column. This will likely show 0 gallons for all vendors.

### 17. `reports.html` — Same gallons issue
- **File:** reports.html, **Lines:** 88, 101
- **Issue:** Uses `r.gallons||r.quantity` but jobs table uses `billable_services.fuelGallons`. Also references `r.name||r.title` but jobs use `job_site_name`. Stats will be wrong.

---

## 🟢 LOW Issues

### 18. `GasRush.toast` not defined in app.js
- **Files:** alerts.html:86, companies.html:95,99, data-export.html:110,116,119, routes.html:87, users.html:147,152,156
- **Issue:** Multiple pages call `GasRush.toast()` but it's not defined in app.js. All calls are guarded with `typeof GasRush.toast === 'function'` check, so no crash — just silent failure. No user feedback on these actions.

### 19. `companies.html` — Listed in admin sidebar but not in audit scope
- **File:** companies.html
- **Issue:** Page exists, works fine, admin-only. Just noting it wasn't in the original audit list.

### 20. `bulk-import.html` — Contacts template references `phone` column
- **File:** bulk-import.html, **Line:** 97
- **Issue:** CSV template for Contacts includes `phone` field: `'name,email,phone,company,role'`. If this maps to users table, phone column doesn't exist.

### 21. `job-site-detail.html` — `renderStats()` is dead code
- **File:** job-site-detail.html, **Lines:** 156-172
- **Issue:** Function defined but never called. References non-existent `siteStats` element. Should be removed.

### 22. `contracts.html` — Fuel type includes non-standard options
- **File:** contracts.html, **Lines:** 63-67
- **Issue:** Includes Unleaded, Premium, Propane — but system only handles fuel-delivery and equipment-delivery. Minor UX inconsistency.

### 23. `create-job.html` — `payment_terms` referenced in job-site-detail but never set
- **File:** job-site-detail.html, **Line:** 221 / create-job.html
- **Issue:** `job-site-detail.html` displays `j.payment_terms` but create-job.html never sets this field. Will always show empty.

### 24. `admin-dashboard.html` — `created_by` displayed as raw ID
- **File:** admin-dashboard.html, **Line:** 139
- **Issue:** Shows `job.created_by` which is likely a UUID, not a human-readable name. Should join with users table.

### 25. `field-workers.html` — `saveWorker()` doesn't save phone field
- **File:** field-workers.html, **Lines:** 198-210
- **Issue:** Edit form has phone input (line 187) but `saveWorker()` constructs update object without phone. Even if column existed, edits wouldn't persist.

---

## Sidebar / NAV_CONFIG Consistency Matrix

| Page | rental | vendor | fieldworker | admin | In Sidebar? | roles: check |
|------|--------|--------|-------------|-------|-------------|-------------|
| rental-dashboard | ✅ | — | — | — | rental:main | rental,admin |
| vendor-dashboard | — | ✅ | — | — | vendor:main | vendor,admin |
| field-worker | — | — | ✅ | — | fw:main | fw,admin |
| admin-dashboard | — | — | — | ✅ | admin:main | admin |
| create-job | ✅ | ❌ no link | — | ✅ | rental,admin | rental,vendor,admin |
| work-orders | — | ✅ | ❌ no link | — | vendor:main | all 4 roles |
| job-sites | ✅ | ✅ | ✅ | ✅ | all | all 4 |
| job-site-detail | — | — | — | — | no (linked from job-sites) | all 4 |
| field-workers | — | ✅ | — | ✅ | vendor,admin | vendor,admin ✅ |
| contracts | ✅ | ✅ | — | ✅ | rental,vendor,admin | rental,vendor,admin ✅ |
| equipment | ✅ | ✅ | — | ✅ | rental,vendor,admin | rental,vendor,admin ✅ |
| reports | ✅ | ✅ | — | ✅ | rental,vendor,admin | rental,vendor,admin ✅ |
| daily-log | ✅⚠️ | ✅ | ✅ | ✅ | all 4 sidebar | ⚠️ excludes rental |
| chat | — | ✅ | ✅ | ✅ | vendor,fw,admin | vendor,fw,admin ✅ |
| settings | ✅ | ✅ | ✅ | ✅ | all | all ✅ |
| documents | ✅ | ✅ | — | ✅ | rental,vendor,admin | rental,vendor,admin ✅ |
| routes | — | ✅ | — | ✅ | vendor,admin | ⚠️ also allows fw |
| alerts | ✅ | ✅ | — | ✅ | rental,vendor,admin | rental,vendor,admin ✅ |
| data-export | — | — | — | ✅ | admin | admin,rental ⚠️ |
| system-health | — | — | — | ✅ | admin | admin ✅ |
| feature-flags | — | — | — | ✅ | admin | admin ✅ |
| users | — | — | — | ✅ | admin | admin ✅ |
| bulk-import | ✅ | — | — | ✅ | rental,admin | rental,admin ✅ |
| recurring-jobs | ✅ | — | — | ✅ | rental,admin | rental,admin ✅ |
| vendor-comparison | ✅ | — | — | — | rental | rental,admin ✅ |
| companies | — | — | — | ✅ | admin | admin ✅ |
| invoices | ❌ | ❌ | ❌ | ❌ | NONE | rental,vendor,admin |

**Key discrepancies:**
- `daily-log.html` in rental sidebar but role check excludes rental → **broken link**
- `create-job.html` allows vendor role but no vendor sidebar link
- `invoices.html` not in any sidebar but file still exists
- `data-export.html` allows rental but only in admin sidebar

---

## Mobile Responsiveness Check

| Page | Has `mobile.js`? | Has viewport meta? |
|------|------------------|--------------------|
| login.html | ❌ (intentional - no sidebar) | ✅ |
| index.html | ❌ (redirect only) | ❌ (redirect only) |
| All other pages | ✅ | ✅ |

All pages with sidebars correctly include `mobile.js`. ✅

---

## Dead Sidebar Links

None found. All pages referenced in NAV_CONFIG exist as files. The `daily-log.html` role mismatch is a **permission issue**, not a missing file.

---

## Top Priority Fixes

1. **🔴 rental-dashboard.html** — Fix `user` scoping bug in `loadData()` (will crash on Refresh)
2. **🔴 create-job.html** — Remove `swap` and `pickup` job types from dropdown
3. **🟡 daily-log.html** — Add `'rental'` to allowed roles, or remove from rental sidebar
4. **🟡 field-workers.html** — Remove phone field references (column doesn't exist)
5. **🟡 vendor-comparison.html / reports.html** — Fix gallons query to use `billable_services.fuelGallons`
6. **🟡 field-worker.html** — Remove invoice creation from `submitDelivery()`
7. **🟡 invoices.html** — Delete or redirect the orphaned file
8. **🟡 data-export.html / reports.html** — Remove invoice-related options
