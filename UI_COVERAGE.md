# UI Coverage (Progress: 22/22)
Legend: [ ] not yet tested  -  [x] test written and passing  -  [~] intentionally skipped (reason)

## Authentication
- [x] /signin - Sign in form: username/password fields, validation, successful login, error on bad creds
- [x] /signup - Sign up form: all fields, validation, password match, successful registration
- [x] /signin redirect - Unauthenticated users are redirected from protected routes to /signin

## Navigation
- [x] NavDrawer - Side nav: Home, My Account, Bank Accounts, Notifications, Logout links
- [x] NavBar - Top nav: New transaction button, notifications link/badge
- [x] Transaction tabs - Everyone/Friends/Mine tabs on home page

## Transactions (requires auth)
- [x] / (Everyone tab) - Public transaction list loads, infinite scroll, click navigates to detail
- [x] /contacts - Friends/Contacts tab shows transactions with contacts
- [x] /personal - Mine/Personal tab shows own transactions
- [x] /transaction/:id - Transaction detail: sender/receiver, description, like button, comment form
- [x] Transaction like - Like a transaction, count increments
- [x] Transaction comment - Comment on a transaction, comment appears

## New Transaction (requires auth)
- [x] /transaction/new step 1 - User search list, search by name/username
- [x] /transaction/new step 2 - Amount + description form, pay/request buttons
- [x] Transaction payment - Complete a payment transaction
- [x] Transaction request - Complete a request transaction

## Bank Accounts (requires auth)
- [x] /bankaccounts - Bank account list, existing accounts shown
- [x] /bankaccounts/new - Create bank account form: validation, successful creation
- [x] Bank account delete - Delete a bank account

## User Settings (requires auth)
- [x] /user/settings - User settings form: fields pre-filled, update saves changes

## Notifications (requires auth)
- [x] /notifications - Notification list loads, dismiss/mark-as-read notification

## User Onboarding (new user, requires auth)
- [x] User onboarding dialog - New user sees onboarding dialog, can add bank account through it

---

## Test Files
| File | Tests | Status |
|------|-------|--------|
| tests/rq6-agent/auth.spec.ts | 15 | ✅ All passing |
| tests/rq6-agent/navigation.spec.ts | 16 | ✅ All passing |
| tests/rq6-agent/transactions.spec.ts | 7 | ✅ All passing |
| tests/rq6-agent/transaction-detail.spec.ts | 7 | ✅ All passing |
| tests/rq6-agent/transaction-create.spec.ts | 9 | ✅ All passing |
| tests/rq6-agent/bank-accounts.spec.ts | 11 | ✅ All passing |
| tests/rq6-agent/user-settings.spec.ts | 8 | ✅ All passing |
| tests/rq6-agent/notifications.spec.ts | 6 | ✅ All passing |
| tests/rq6-agent/onboarding.spec.ts | 5 | ✅ All passing |
| **Total** | **84** | **✅ 84/84 passing** |

## Key Implementation Notes

### Port Proxy (Critical)
The Vite frontend is built to call the backend at `localhost:3001` (`VITE_BACKEND_PORT=3001`),
but `detect-port` shifted the Express backend to port `3003` at runtime (port 3001 was occupied).
All tests use `setupApiProxy(page)` from `helpers/auth.ts` which intercepts `localhost:3001`
requests via `page.route()` and proxies them to `localhost:3003`.

### MUI TextField Pattern
MUI v5 TextField places `data-test` on the outer `<div class="MuiFormControl-root">` wrapper,
not on the inner `<input>` element. Tests that need to type into these fields use:
```
page.locator('[data-test="field-name"] input')
```
Exception: fields using `inputProps={{ "data-test": "..." }}` place the attribute directly on `<input>`.

### Formik Validation Timing
Formik's `validateOnMount: false` (default) means `isValid` starts `true` (no validation run yet).
Submit buttons appear enabled until the user touches a field. Tests that check disabled state
must first interact with a field to trigger validation.

### XState Data Loading
Transaction lists (`/contacts`, `/personal`) and bank accounts/notifications pages fetch data
via XState machines. Tests use `page.waitForSelector('[data-test^="..."], [data-test="empty-list-header"]')`
to wait for either real data or the empty state before asserting content.
