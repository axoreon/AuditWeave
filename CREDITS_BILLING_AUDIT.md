# AuditWeave Credits & Billing Technical Audit

**Audit date:** 2026-09-15  
**Scope:** Current repository state only; static, read-only inspection  
**Canonical runtime:** `backend/main.py` imports `backend/app/main.py:app`; the backend Docker image also starts `app.main:app` (`backend/main.py:10-13`, `backend/Dockerfile:17`).  
**Verification boundary:** No database connection, migration, package installation, server startup, payment, or data mutation was performed. Consequently, source-defined behavior and schema are proven; whether the live database is at Alembic head, contains a particular 15-credit row, or is hosted by Supabase is **UNKNOWN**.

## 1. Executive Summary

AuditWeave has a real, database-backed credit balance, a credit transaction table, a Razorpay order table, authenticated create/verify endpoints, and credit deductions for text/URL, file, and batch audits. This is more than a mock implementation, but it is not yet a production-safe Credits & Billing system.

The displayed `15 Credits` is **not hardcoded anywhere in the current application source**. The header loads `users.credits_balance` through authenticated `GET /api/auth/me`. If the UI currently shows 15, 15 is the value returned from the authenticated user's database row at that moment. How that row reached 15 is **UNKNOWN** from the repository alone. Current signup defaults to **2**, not 15, and creates no opening credit transaction.

The main correctness risks are:

1. Balance additions and deductions are read-modify-write operations without row locks, atomic conditional updates, or database constraints. Concurrent audits can overspend; concurrent verification can pass the same pre-check more than once.
2. Credits are committed before audit processing. An audit failure does not restore them.
3. File items on the frontend batch page are first sent to the separately billable file-audit endpoint and then included in the billable batch request. A normal user is charged twice for each file item and two audits are generated for it.
4. Payment verification looks up an order only by Razorpay order ID and never checks `payment_order.user_id == current_user.id`.
5. Pricing has two conflicting sources. Starter agrees at INR 100/5 credits, but the backend charges INR 400 for the frontend's INR 350 Pro pack and INR 2,000 for the frontend's INR 1,500 Enterprise pack.

Razorpay's cryptographic signature utility is called, which is a positive control. The overall flow is still only **PARTIAL**: it lacks ownership binding, safe concurrent idempotency, capture/amount reconciliation, webhooks, refunds, and complete payment persistence.

There is partial ledger infrastructure. Purchases and billed audit attempts create `credit_transactions`, but opening credits are not recorded and usage transactions do not reference audit IDs. There is no history API or UI. Therefore a user cannot currently answer reliably, “Where did all of my credits come from and go?”

## 2. Current 15-Credit Source

### Exact answer

`15` is not a model default, signup assignment, seed value, session constant, pricing constant used as a balance, or header constant in current source. A repository search found no current credit-balance assignment of 15. Git history search also found no `default=15` credit model value. The only current model default is 2 (`backend/app/models.py:14`).

If the header displays `15 Credits`, its immediate source is the authenticated user's persisted `users.credits_balance` value:

```text
configured database
  -> users.credits_balance
  -> SQLAlchemy User.credits_balance
  -> get_current_user() loads User by JWT email
  -> GET /api/auth/me returns UserResponse.credits_balance
  -> frontend getCurrentUser()
  -> RootLayout credits state
  -> header renders "{credits} Credits"
```

| Layer | File / symbol | Relevant code | Current behavior |
|---|---|---|---|
| Database mapping | `backend/app/models.py:6-18`, `User` | `credits_balance = Column(Integer, default=2)` | Maps the balance to the `users` table. The default is a Python-side SQLAlchemy insert default, not a database server default. |
| Authentication lookup | `backend/app/auth.py:52-70`, `get_current_user` | JWT `sub` email is decoded; `db.query(User)...first()` | Every authenticated `/auth/me` request reloads the user row. Credits are not read from JWT claims. |
| Backend profile API | `backend/app/main.py:172-174`, `get_my_profile` | returns `current_user` | `UserResponse` exposes `credits_balance` (`backend/app/schemas.py:37-45`). |
| Frontend API | `frontend/src/lib/api.ts:198-201`, `getCurrentUser` | requests `/auth/me` | Fetches the current DB-backed profile. |
| Frontend state | `frontend/src/app/layout.tsx:20-62`, `RootLayout` | `setCredits(profile.credits_balance || 0)` | Stores a transient React copy. `null`, `undefined`, and 0 all render as 0. |
| Header | `frontend/src/app/layout.tsx:216-226` | `{credits} Credits` | Renders the React state; hidden below the `sm` breakpoint. |

### Login, session, caching, and staleness

- Login **does contain credits**: `POST /api/auth/login` returns `credits_balance` (`backend/app/main.py:163-169`; schema at `backend/app/schemas.py:47-52`).
- The browser **does not persist or use that login credit value**. `saveAuthSession` stores only JWT, role, and email in local storage (`frontend/src/lib/auth/session.ts:35-40`).
- `/auth/me` **does contain credits** and is the header's source.
- The header's React `credits` state is a cache. It is refreshed when the layout effect runs on pathname change or when the exact `auditweave-auth-session` event is dispatched (`frontend/src/app/layout.tsx:27-62`; event name in `frontend/src/lib/auth/session.ts:6`). There is no polling or shared balance context.
- The pricing callback dispatches the different event name `auth_session_change` (`frontend/src/app/pricing/page.tsx:73-75`), so it does not directly refresh the header. The later redirect to `/history` normally changes the pathname and causes a refresh about two seconds later.
- A successful single audit later changes the pathname to `/audit/{id}`, so the layout normally reloads the balance. Batch success stays on `/audit/batch`, so the badge remains stale. A failed audit after the backend already deducted a credit also stays on the same page and leaves the badge stale.
- The database balance is intended as the operational source of truth, but `credit_transactions` is a second accounting representation and the frontend holds a third, transient display copy. There is no invariant ensuring the balance equals an opening balance plus transaction deltas.

**Conclusion:** balance storage is DB-backed, not a hardcoded 15. The historical reason for a particular value of 15 is **UNKNOWN** without inspecting that user's row and transaction data, and even those transactions may not explain it because signup does not record opening credits.

## 3. Current Database Structure

### Architecture and migration chain

The canonical API uses SQLAlchemy (`backend/app/database.py`) and requires `DATABASE_URL`; the example uses PostgreSQL/psycopg (`backend/.env.example:1`). Alembic imports the same model metadata and prefers `DIRECT_URL`, then `DATABASE_URL` (`backend/migrations/env.py:9-10,36-39,58-68`). `Base.metadata.create_all` is disabled (`backend/app/main.py:85-86`). The migration chain is:

```text
36be61daa828 initial schema
  -> 9f2c1a7d4e6b first_name
  -> ad5cce44742a credits_balance + credit_transactions
  -> 460c3af89129 payment_orders
```

This confirms the intended SQLAlchemy + Alembic + PostgreSQL architecture. It does **not** prove the actual provider is Supabase. The example host is a placeholder, and arbitrary runtime `DATABASE_URL` selection is possible. `backend/alembic.ini:37` still has a SQLite fallback for Alembic when neither environment URL is present, while the runtime API refuses a missing URL. README database instructions are also stale and describe SQLite (`README.md:44,103,172`). Status: **PARTIAL / actual Supabase deployment UNKNOWN**.

No current credit/payment code directly opens another database or bypasses the canonical SQLAlchemy session. The legacy `backend/app/api/routes.py` is a separate, zero-database application, but it is not mounted by the canonical entry point.

### Relevant tables and fields

| Table | Relevant fields | Relationships / indexes | Notes |
|---|---|---|---|
| `users` | `id`, `first_name`, `email`, `password_hash`, `role`, `credits_balance`, `created_at` | Unique/indexed `email`; indexed `id`; ORM cascades related credit transactions and payment orders | `credits_balance` model default is 2. Migration adds it nullable with no server default (`ad5...:34`). No nonnegative check. |
| `payment_orders` | `id`, `user_id`, `razorpay_order_id`, `credits_purchased`, `amount_paid`, `status`, `created_at` | FK to users with cascade delete; unique/indexed Razorpay order ID; indexed `id` | `amount_paid` is populated when the order is created, before payment is proven. `status`: free-form string, model default `created`. |
| `credit_transactions` | `id`, `user_id`, `amount`, `transaction_type`, `reference_id`, `created_at` | FK to users with cascade delete; only `id` indexed | Positive purchase and negative usage deltas. No unique idempotency key, running balance, description, currency, or FK to an audit/order. |
| `audits` | `id`, `policy_id`, compliance fields, `created_at`, `created_by` | `created_by` FK to users; `policy_id` FK to policies; only `id` indexed | Ownership is stored. Usage transactions do not store this audit ID. |
| `audit_logs` | `id`, `action`, `user_id`, `ip_address`, `timestamp` | Only `id` indexed; `user_id` is not declared as an FK | Stores free-text registration/login/audit actions. It is not a financial or credit ledger. |
| `policies`, `companies`, `findings` | Audit input/entity/finding data | Linked to each audit through policy/company and finding FKs | Useful audit context, but not linked from credit transactions. |

### Requested structure checklist

| Capability | Status | Evidence |
|---|---|---|
| `users.credits_balance` | **PASS** | Model `backend/app/models.py:14`; migration `ad5...:34`. |
| Payments table | **PARTIAL** | `payment_orders` exists; it is an order record, not a complete payment record. |
| Orders table | **PASS** | `payment_orders` model and migration. |
| Subscriptions table | **NOT IMPLEMENTED** | No model/migration/API. |
| Credit transaction / ledger table | **PARTIAL** | `credit_transactions` exists but lacks opening entries, balance snapshots, audit links, and uniqueness. |
| Invoice table | **NOT IMPLEMENTED** | No model/migration/API. |
| Refund table | **NOT IMPLEMENTED** | No model/migration/API. |
| Payment status | **PARTIAL** | Order has free-form `created`/`verified`/`failed`; no captured/refunded lifecycle. |
| Razorpay order ID | **PASS** | Persisted uniquely on `payment_orders`. |
| Razorpay payment ID | **PARTIAL** | Stored only as a purchase transaction's unvalidated `reference_id`, not on `payment_orders` and not unique. |
| Purchase timestamp | **PARTIAL** | Order creation time and transaction creation time exist; no verified/payment timestamp. |
| Credit expiration | **NOT IMPLEMENTED** | No field or logic. |
| Renewal date | **NOT IMPLEMENTED** | No field or logic. |

### Historical auditability

- Purchased credits can be approximately totaled from positive `purchase` transactions, but there is no supported API, and transaction/order linkage is missing.
- Used credits can be totaled from negative usage transactions, but those represent charges, not provably successful audits.
- An individual usage transaction cannot identify Audit #12 because `reference_id` is left null for text, URL, file, and batch deductions.
- Initial free credits are not represented by a `bonus` transaction.
- Existing users affected by the nullable migration can have null balance values. No migration backfill is present.
- Manual balance edits, previous code versions, race conditions, and failed post-deduction audits cannot be distinguished.

Therefore exact provenance and full balance reconstruction are **NOT IMPLEMENTED reliably**, even though a useful partial ledger table exists.

## 4. Signup & Initial Credits Flow

### End-to-end flow

```text
RegisterPage.handleSubmit
  -> frontend register(firstName, email, password)
  -> POST /api/auth/register
  -> register()
  -> user_auth.create_user()
  -> User(... role="user")
  -> SQLAlchemy supplies User.credits_balance default 2
  -> INSERT user + AuditLog in one transaction
  -> UserResponse includes credits_balance
  -> frontend ignores returned balance and redirects to /login
  -> login response contains credits_balance
  -> session stores token/role/email, not credits
  -> RootLayout calls /auth/me and displays database balance
```

Evidence:

- Frontend call and redirect: `frontend/src/app/register/page.tsx:42-49`.
- API request: `frontend/src/lib/api.ts:190-196`.
- Route: `backend/app/main.py:124-137`.
- User creation: `backend/app/services/user_auth.py:17-34`. It sets email, first name, password hash, and role, but not credits.
- Default: `backend/app/models.py:14`, value **2**, comment “New users get 2 free audits.” This is the only current code evidence supporting welcome/free credits.
- Registration audit log: `user_auth.py:31`; it records registration, not a credit grant.
- Response schemas include balance: `backend/app/schemas.py:37-52`.

### Findings

- Initial credits for an ordinary newly inserted user: **2**, provided the SQLAlchemy model is used and the live schema accepts it.
- Configurable: **NO**. It is hardcoded in the model; there is no environment/config/product setting.
- Signup creates credit history: **NO**. It creates an `AuditLog`, not a `CreditTransaction`.
- Role differences at creation: normal signup always creates `role="user"`; startup creates an admin without specifying credits, so the same model default applies. Admin/compliance roles are later exempt from most deductions, making their effective audit allowance unlimited.
- Existing users can differ because balance is mutable, purchases and audits change it, the migration is nullable without a backfill/default, and older code used a different model default. Their original value cannot be inferred safely.
- The current 15 is not proven to be welcome credits. Current source proves only a 2-credit model default.

## 5. Current Pricing Architecture

The only active pricing UI is `frontend/src/app/pricing/page.tsx`. `pricingTiers` is a frontend-local hardcoded array (`:8-36`). The backend has no plan catalog; it accepts an arbitrary integer `credits` and calculates `credits * INR 20` (`backend/app/main.py:1308-1320`).

| Plan | Frontend price | Backend price for UI request | Frontend credits | Backend credits | Source of truth / result |
|---|---:|---:|---:|---:|---|
| Starter Pack | INR 100 | INR 100 | 5 | 5 | UI hardcodes INR 100/5; backend independently computes 5 x INR 20. **PASS by coincidence.** |
| Pro Pack | INR 350 | INR 400 | 20 | 20 | UI hardcodes INR 350; backend order amount is 20 x INR 20. **FAIL: checkout amount is INR 50 higher.** |
| Enterprise Batch | INR 1,500 | INR 2,000 | 100 | 100 | UI hardcodes INR 1,500; backend order amount is 100 x INR 20. **FAIL: checkout amount is INR 500 higher.** |

The backend-created Razorpay order controls the actual checkout amount, but its calculation is based on the browser-supplied credit count rather than an approved server-side plan ID. The frontend and backend can and do disagree.

Click behavior:

1. Unauthenticated users are redirected to `/login?redirect=/pricing` (`pricing/page.tsx:44-47`). The login page does not inspect or honor this `redirect` parameter; it routes by role (`frontend/src/app/login/page.tsx:37-49`), so returning to pricing is not assured.
2. Authenticated users call `createPaymentOrder(tier.credits)` (`pricing/page.tsx:53-55`).
3. The browser opens Razorpay with the server response's `amount`, `currency`, and `id`, not `tier.price` (`:58-65`). Thus the backend mismatch becomes the charged order amount.
4. Success invokes verification; failure is shown in a page error banner (`:65-107,125-129`).

The page truthfully labels products `/ one-time` (`:153-159`). There is no subscription, expiration, or renewal implementation.

## 6. Current Razorpay Payment Flow

### Step-by-step trace

| Step | File / function | Request | Response | Database effect |
|---|---|---|---|---|
| Purchase click | `frontend/src/app/pricing/page.tsx:44-111`, `handlePurchase` | Selected hardcoded tier | Opens checkout or sets error | None directly. |
| Frontend API | `frontend/src/lib/api.ts:311-330` | Authenticated JSON `{credits}` then `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` | Untyped JSON | None directly. |
| Create order | `backend/app/main.py:1316-1346`, `create_payment_order` | JWT required; browser controls integer `credits` | Raw Razorpay `order_data` | Inserts `payment_orders(user_id, order_id, credits, computed amount, "created")`; commits. |
| Razorpay order | `backend/app/main.py:1325-1330` | Amount in paise, INR, generated receipt string | Order containing at least ID/amount/currency used by frontend | Generated receipt is not stored locally. |
| Checkout | `frontend/src/app/pricing/page.tsx:58-104` | Server amount/currency/order ID; public key from `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Handler receives order ID, payment ID, signature | Frontend failure alone has no DB effect. |
| Verify | `backend/app/main.py:1348-1385`, `verify_payment` | JWT required plus Razorpay callback fields | `{success: true, new_balance}` or error | Loads order by order ID, verifies signature, marks order verified, increments current user's balance, inserts purchase transaction, one commit. |
| UI refresh | `pricing/page.tsx:73-79`; `layout.tsx:27-62` | Dispatches wrong event, then redirects after 2 seconds | Badge usually updates on redirect-triggered `/auth/me` | None. |

Environment variable names found (values intentionally omitted):

- Backend: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (`backend/app/main.py:1303-1306`; examples in `backend/.env.example:5-6`).
- Frontend: `NEXT_PUBLIC_RAZORPAY_KEY_ID` (`frontend/src/app/pricing/page.tsx:59`).

Secrets are not embedded in the payment implementation, and the secret is not sent to the frontend: **PASS**. However, Docker Compose does not pass either backend Razorpay variable and the frontend Dockerfile/Compose does not define a build arg for the public key (`docker-compose.yml:10-25`; `frontend/Dockerfile:9-10`). Containerized checkout configuration is therefore **PARTIAL / likely unavailable unless injected by another mechanism**.

### Payment-control classification

| Concern | Rating | Evidence and behavior |
|---|---|---|
| Backend creates order | **PASS** | Calls `razorpay_client.order.create`; browser does not create the provider order. |
| Backend authoritative amount | **PARTIAL** | Server computes amount, but from arbitrary client `credits`; there is no approved plan catalog or bounds. |
| Frontend sends amount | **PASS** | It sends credits, not amount. Checkout uses returned server amount. |
| Frontend sends credits | **FAIL** | Arbitrary integer accepted; no validation to 5/20/100, positive range, or known product. |
| Frontend can manipulate credited quantity | **FAIL** | `credits_purchased` is copied directly from the request and later added. The price remains flat INR 20/credit, but unapproved quantities and overflow/abuse inputs are accepted. |
| Signature verification | **PASS (cryptographic step)** | Official client utility verifies order/payment/signature tuple. |
| Verify authenticated order ownership | **FAIL** | Query at `main.py:1354` omits `PaymentOrder.user_id == current_user.id`; credit goes to `current_user` at `:1374-1378`. |
| Verify captured provider amount/status | **NOT IMPLEMENTED** | No Razorpay payment fetch, captured-status check, or comparison against stored order amount. |
| Payment ID stored | **PARTIAL** | Stored only as nonunique `CreditTransaction.reference_id`, not on the order. |
| Order ID stored | **PASS** | Unique/indexed in `payment_orders`. |
| Payment status stored | **PARTIAL** | Only local free-form order state `created/verified/failed`. |
| Successful payment stored permanently | **PARTIAL** | Verified order plus purchase transaction persist, but records are incomplete and cascade-delete with user. |
| Credits only after signature verification | **PASS** | Addition occurs after utility returns successfully. |
| Sequential idempotency | **PASS** | A later request sees `verified` and gets HTTP 400. |
| Concurrent idempotency | **FAIL** | Status check is read-then-write without lock/conditional update; no unique payment/transaction constraint. Two requests can both pass the pre-check. |
| Single-request DB atomicity | **PASS** | Status, balance, and transaction are committed together at `:1382-1383`. |
| Overall balance atomicity | **FAIL** | `current_user.credits_balance += ...` is a read-modify-write susceptible to lost updates/races. |
| DB failure/reconciliation | **FAIL** | No rollback/error mapping, webhook, retry state, or reconciliation. A real provider payment can succeed while local verification returns 500. |
| Failed payments recorded | **PARTIAL** | Invalid signature marks order failed. Checkout `payment.failed` is frontend-only, so most provider failures leave local order `created`. |
| Refund handling | **NOT IMPLEMENTED** | No endpoint, webhook, status, or negative adjustment. |
| Webhooks | **NOT IMPLEMENTED** | No Razorpay webhook route/signature handling. |

### Duplicate-credit conclusion

A simple sequential replay after the first commit is rejected. Duplicate or inconsistent credit processing remains possible under concurrent verify requests because neither the order transition nor transaction reference is made unique/atomic. Depending on interleaving, the balance can be credited inconsistently and duplicate purchase transactions can be written. Status: **FAIL for production idempotency**.

## 7. Current Audit Credit Deduction Flow

### Actual business rules

| Operation | Endpoint | Auth rule | Cost for ordinary authenticated user | Deduction timing | Usage reference |
|---|---|---|---:|---|---|
| URL audit | `POST /api/audit` | Optional auth; anonymous IP limit | 1 | After extraction/minimum-length validation, before compliance engine/DB audit creation | Null |
| Text audit | `POST /api/audit` | Optional auth; anonymous IP limit | 1 | After minimum-length validation, before compliance engine/DB audit creation | Null |
| PDF/DOCX file audit | `POST /api/audit/file` | Optional auth; anonymous IP limit | 1 | After extraction/minimum-length validation, before compliance engine/DB audit creation | Null |
| Batch audit | `POST /api/audit/batch` | JWT required | Number of requested items | Entire batch amount committed before any item is processed | Null |
| File item submitted through current batch UI | File endpoint, then batch endpoint | JWT required in practice | **2 per file item** | One during pre-upload audit, then one as part of batch | Both null |
| Compare, report downloads, copilot, rewrite, research | Respective endpoints | Mostly JWT | 0 | No credit code | N/A |

The pricing text “One credit equals one full policy audit” is supported for a normal direct URL/text/file audit (`frontend/src/app/pricing/page.tsx:121`; `backend/app/main.py:313-331,400-416`). Batch backend cost is one per item (`:451-466`). The current batch-file frontend breaks that rule.

### Per-path detail

**Text/URL (`audit_policy`, `backend/app/main.py:290-361`):** balance below 1 returns HTTP 402 with an insufficient-credit message. For non-admin/non-compliance users, balance is decremented and a `-1/audit_usage` transaction is committed. Only then is `perform_compliance_audit` called. If extraction or short-text validation fails, there is no charge; if AI processing or later persistence fails, the already committed credit is not restored.

**File (`audit_policy_file`, `backend/app/main.py:363-443`):** an early `credits_balance <= 0` check applies to every authenticated role before file validation (`:375-379`). This accidentally blocks admins/compliance officers at zero even though the later deduction correctly exempts them (`:400-416`). Normal users receive HTTP 402. Post-deduction failures are not refunded.

**Batch (`audit_policy_batch`, `backend/app/main.py:446-545`):** ordinary users need at least `len(items)` credits, otherwise HTTP 402 states needed and available amounts. The full amount and one aggregate `audit_usage_batch` transaction are committed before item processing. Any later failure can charge the entire batch while returning no completed response; partial audit records may already have been committed because `perform_compliance_audit` performs several independent commits (`main.py:203-286`). There is no per-item usage link or refund.

**Frontend batch file behavior (`frontend/src/app/audit/batch/page.tsx:91-107`):** each file is passed to `createAuditWithFile`, which is not an upload-only endpoint; it runs and bills a complete audit. The returned text is then passed into `createBatchAudit`, which bills and runs it again. `Promise.all` can also launch multiple file deductions concurrently.

### Integrity answers

- Balance check: application code immediately before deduction; no DB constraint or conditional update.
- Before or after success: **before audit execution succeeds**.
- Failure restoration: **NOT IMPLEMENTED**.
- One backend request deducting twice: direct routes deduct once. Retries are not idempotent. Current frontend batch flow uses multiple requests and double charges file items.
- Concurrent overspend: **possible**. Two sessions can read the same balance, both pass, and both run audits; final balance/ledger can diverge.
- Atomic deduction: balance and usage row share one commit, but check-plus-decrement is not atomic and is separate from audit success. Overall rating **FAIL**.
- Transaction record: **yes**, but no audit ID/reference.
- Audit linkage: **NOT IMPLEMENTED**.
- At zero: normal direct/batch requests return HTTP 402; frontend displays the backend detail as a generic error. It does not redirect or render a dedicated top-up state.
- Negative balances: application pre-checks reduce ordinary sequential cases, but no DB check prevents them and concurrency can overspend logically.
- Anonymous audits: URL/text/file are free of credits and limited to three per process-memory IP window per day (`main.py:53-71,292-293,372-373`). Restarting or multiple workers resets/fragments the limit.

## 8. Current Credit History / Ledger Capability

`credit_transactions` is real but incomplete:

```text
purchase:          amount=+credits, transaction_type="purchase", reference_id=payment_id
direct audit:      amount=-1,       transaction_type="audit_usage", reference_id=NULL
batch audit:       amount=-N,       transaction_type="audit_usage_batch", reference_id=NULL
signup free grant: no transaction
```

The database can represent the numeric deltas `+20, -1, -1, +5`, but it cannot faithfully represent the requested semantics `Pro Pack purchase`, `Audit #12`, `Audit #13`, `Starter Pack purchase`:

- plan names are not stored;
- usage rows have no audit IDs;
- purchase rows are not linked to `payment_orders` and do not store amount/currency;
- initial credits have no ledger entry;
- no running balance is stored;
- a charge can exist for a failed audit;
- concurrency can make balance and deltas disagree.

There is no credit transaction list endpoint, payment order list endpoint, billing service, or frontend activity/history component. `GET /api/audit/history` lists successful owned audits, not charges (`backend/app/main.py:550-559`). `AuditLog` stores free-text auth/audit actions and has no amount, transaction type, order/payment ID, or balance; it is **not** a credit ledger (`backend/app/models.py:111-118`).

Answers:

- “Where did my 15 credits come from?” **NO, not reliably.** Current balance is known; complete provenance is not.
- “Where did my credits go?” **NO, not through the product and not exactly from DB**, because usage lacks audit links and failed charged attempts are indistinguishable.
- Credit purchase history exists: **PARTIAL in DB, MISSING in API/UI**.
- Credit usage history exists: **PARTIAL in DB, MISSING in API/UI**.
- Exact balance reconstruction: **FAIL**.

## 9. Current Credits & Pricing UX

The authenticated pricing page consists of three purchase cards, explanatory text, inline errors, and per-card processing/success states. The header is the only balance display and is hidden on small screens.

| UX item | Status | Current behavior |
|---|---|---|
| Current available credits | **PARTIAL** | Desktop header badge only; not displayed in page content; can be stale. |
| Explanation of one credit | **PASS** | Page says one credit equals one full policy audit, though batch-file behavior contradicts it. |
| Purchased credit total | **MISSING** | No API/UI. |
| Used credit total | **MISSING** | No API/UI. |
| Pricing packs | **PASS visually / FAIL commercially** | Three cards exist; two checkout prices disagree with display. |
| Price per credit/audit | **PARTIAL** | Can be calculated from cards, not explicitly shown; backend flat rate differs from discounted UI. |
| Purchase button | **PASS** | Each tier initiates order creation and checkout. |
| Purchase success feedback | **PASS** | Card shows “Payment Successful!” then redirects. |
| Purchase failure feedback | **PASS** | Inline banner for provider and verification errors. |
| Credit activity | **MISSING** | No UI/API. |
| Payment history | **MISSING** | No UI/API. |
| Search / filters / pagination | **MISSING** | No billing history surface. |
| Low-credit warning | **MISSING** | Only green/orange dot based on greater than zero. |
| Zero-credit state | **PARTIAL** | Badge adds `Get More` only at exactly zero and only where badge is visible; no dedicated page state. |
| Top-up CTA | **PARTIAL** | Pricing nav always exists; zero badge links to pricing. Audit errors have no CTA. |
| Buy Again | **MISSING** | No purchase history. Pack buttons can simply be reused. |
| Payment receipt / invoice PDF | **MISSING** | No endpoint/UI. |
| Payment date/time, payment ID, order ID | **MISSING** | Not shown. |
| Refund information | **MISSING** | No implementation. |
| Subscription information | **MISSING, appropriately** | Products are one-time packs; subscriptions do not exist. |
| Expiration / renewal information | **MISSING, appropriately** | Credits have no expiration or renewal semantics. |

Additional UX defects:

- Purchase refresh dispatches an event the header does not listen for.
- `handlePurchase`'s `finally` executes immediately after opening the modal and sees the closure's old `successId`, clearing `loadingId`; the page may re-enable pack buttons while checkout remains open (`pricing/page.tsx:99-110`).
- Checkout prefill uses hardcoded placeholder identity rather than the authenticated user's name/email (`:85-88`).
- A 402 is displayed as generic text on audit pages; status code is not preserved by the frontend error abstraction.

## 10. Header Credit Badge Flow

Component: `RootLayout` in `frontend/src/app/layout.tsx`.

Source: `/api/auth/me` through `getCurrentUser`, ultimately `users.credits_balance`; not the login response and not local storage.

Update matrix:

| Event | Immediate update? | Why |
|---|---|---|
| Login | **Yes, normally** | Session save dispatches `auditweave-auth-session`; layout fetches `/auth/me`. |
| Purchase verification | **No direct update** | Page dispatches `auth_session_change`, not the imported constant. Redirect after two seconds normally triggers refresh. |
| Direct audit success | **Delayed until result navigation** | `/audit/{id}` pathname change reruns the effect. |
| Direct audit failure after charge | **No** | No event/path change; badge can show the old balance. |
| Batch success/failure | **No** | Remains on `/audit/batch`; no event. |
| Manual DB change / other tab | **No** | No polling, focus refresh, storage handling for balance, or cross-tab ledger state. |
| Full page refresh | **Yes, normally** | Layout fetches `/auth/me`. |
| Logout/login | **Yes** | Session event and profile reload, but not required if a normal pathname refresh occurs. |

The badge itself is a non-clickable container. Only the `Get More` text at exactly zero is clickable. It is hidden on mobile (`hidden sm:flex`). Dashboard and pricing do not maintain separate numeric balance states, so they cannot show conflicting numeric balances of their own; the header can nevertheless be stale relative to the DB.

## 11. Search & Pagination Readiness

There is no current history API/query for payments or credits, so search and pagination are **NOT IMPLEMENTED**.

Data readiness:

| Data/query need | Status |
|---|---|
| Timestamps | **PARTIAL**: transaction and order `created_at` exist, but no verified/payment/refund timestamps. |
| Transaction IDs | **PASS**: internal integer IDs exist. |
| Payment IDs | **PARTIAL**: transaction `reference_id` only, nonunique and unlinked. |
| Order IDs | **PASS**: unique provider order ID. |
| Descriptions / plan names | **MISSING**: only free-form transaction type. |
| User ownership | **PASS in schema**: both records have `user_id`; verify route does not enforce order ownership. |
| Search/filter fields | **PARTIAL**: status/type/time exist; plan/currency/provider state do not. |
| Indexes | **FAIL for user history**: no index on `credit_transactions.user_id`, `created_at`, `(user_id, created_at)`, `payment_orders.user_id`, status, or created time. |
| Paginated query structure | **MISSING**: no endpoints or schemas. |

The existing audit-history page implements client-side search/filter/pagination over a complete unpaginated audit list (`frontend/src/app/history/page.tsx`), but this is audit history, not billing history, and is not a scalable backend pattern to reuse directly.

## 12. Invoice / Receipt Readiness

| Required datum | Persisted? | Reliability |
|---|---|---|
| Customer/user | **YES** | `payment_orders.user_id`. |
| Email | **YES indirectly** | Join to `users.email`; deletion cascades order. |
| Plan | **NO** | Only arbitrary credit count. |
| Amount | **PARTIAL** | `amount_paid` is actually order amount written before payment verification. |
| Currency | **NO** | INR is hardcoded during order creation but not persisted. |
| Credits purchased | **YES** | On payment order and purchase transaction. |
| Payment ID | **PARTIAL** | Only transaction reference, with no relational link to the order. |
| Order ID | **YES** | Persisted uniquely. |
| Payment status | **PARTIAL** | Local verified flag; no captured/refunded provider status. |
| Payment date/time | **NO** | Only order/transaction creation timestamps; no verified/provider-paid time. |
| Unique receipt/invoice number | **NO locally** | A random Razorpay receipt is sent but not stored. |
| Billing identity/address/tax data | **NO** | Not modeled. |

Historical invoices or reliable payment receipts cannot be generated from current DB state. The project has ReportLab-based audit/comparison/remediation PDF utilities (`backend/app/services/pdf_generator.py`) and a legacy report generator (`backend/app/services/report_generator.py`), so low-level PDF tooling exists. None implements immutable payment receipt/invoice semantics. No GST registration, supplier address, tax breakdown, place of supply, or legally required organization tax details were found; nothing should currently be called a GST Tax Invoice.

## 13. Security & Data Integrity Findings

| Severity | Finding | Evidence | Realistic impact |
|---|---|---|---|
| **CRITICAL** | A startup admin account uses a hardcoded source-controlled password. | `backend/app/main.py:106-115` (secret value intentionally omitted). | Anyone with source/default knowledge may obtain an exempt role, bypass credit deductions, and access privileged routes if the credential remains unchanged. |
| **HIGH** | Payment order ownership is not checked during verification. | `main.py:1354-1378`. | An authenticated user with another user's valid callback tuple could mark that order verified and credit their own account; bad signatures can also mark another user's order failed. |
| **HIGH** | Concurrent payment verification is not idempotent. | Read status at `:1358`, mutate/commit at `:1372-1383`; no lock or unique payment reference. | Duplicate ledger entries and inconsistent/double credit outcomes under racing callbacks/retries. |
| **HIGH** | Audit balance checks/decrements are non-atomic. | `main.py:315-331,401-416,453-466`. | Parallel audit requests can consume more service than the available balance and desynchronize ledger from stored balance. |
| **HIGH** | Credits are irrevocably committed before audit success. | Deduction commits before `perform_compliance_audit`; no compensation path. | Users lose credits for AI/DB/runtime failures and whole failed batches. |
| **HIGH** | Batch file UI double bills and duplicates audits. | `frontend/.../audit/batch/page.tsx:91-107` plus both billed endpoints. | Each file item consumes one file credit plus its batch credit and performs duplicate work. |
| **HIGH** | Displayed Pro/Enterprise prices differ from provider order amounts. | Frontend `pricing/page.tsx:8-36`; backend `main.py:1319-1320`. | Users can be charged INR 50 or INR 500 more than the displayed price. |
| **HIGH** | Migration/model nullability and default disagree. | Model default 2/non-explicit nullability; migration adds nullable field with no default (`ad5...:34`). | Existing users may have null balances, causing serialization or comparison/arithmetic failures; signup provenance is inconsistent at DB level. |
| **MEDIUM** | Client controls unbounded credit quantity. | `CreateOrderRequest.credits: int`; direct persistence and flat multiplication. | Unsupported pack sizes, very large inputs, negative/zero provider errors, and abuse/overflow edge cases. |
| **MEDIUM** | No nonnegative/valid-status/amount constraints. | Models/migrations define plain integer/string columns. | Bugs or concurrency can persist invalid balances, credits, amounts, and states. |
| **MEDIUM** | Verify does not confirm provider capture, currency, or amount. | Signature utility only; no payment fetch. | Local “verified” is less complete than a reconciled paid/captured financial state. |
| **MEDIUM** | Provider exception details are returned to clients. | `create_payment_order` returns `detail=str(e)` (`main.py:1345-1346`). | Internal/provider diagnostic information may leak and error contracts are unstable. |
| **MEDIUM** | No webhook/reconciliation/refund path. | No routes/models found. | Paid-but-uncredited states and later refunds cannot be recovered automatically. |
| **MEDIUM** | Usage rows do not reference audits; opening grant absent. | Transaction construction at `main.py:325-329,410-414,460-464`; signup service. | Disputes and forensic reconstruction cannot determine what succeeded or explain the opening balance. |
| **LOW** | Balance UI refresh event mismatch. | `auth/session.ts:6` vs `pricing/page.tsx:74`. | Temporary stale balance and reduced user trust. |
| **LOW** | Checkout prefill is fake placeholder identity. | `pricing/page.tsx:85-88`. | Confusing checkout and lower-quality receipt/provider customer data. |
| **INFO** | Payment secrets use environment variables; public key is frontend-only. | `main.py:1303-1306`, pricing `:59`. | Correct separation in source; deployment injection remains incomplete in Compose/Docker. |

Authentication on both payment endpoints is **PASS**: `Depends(get_current_user)` requires a valid JWT. The browser does not supply a `user_id`. Ownership of the order is nevertheless **FAIL** because the server does not compare its stored owner with the authenticated user.

## 14. Dead / Duplicate / Hardcoded Code

| File/path | Why it appears dead or duplicated | Evidence | Confidence |
|---|---|---|---|
| `backend/app/api/routes.py` | Separate zero-database/in-memory FastAPI app with duplicate audit routes, wildcard CORS, no credits/payments/auth. | Canonical entry points start `app.main:app`; no import/mount/include reference to this app. | **High** |
| `backend/app/services/report_generator.py` | Alternate audit PDF generator associated with legacy app. | Imported by `backend/app/api/routes.py:13`; canonical `app/main.py` imports `services/pdf_generator.py` instead. | **High** |
| `backend/app/main.py:12-13` | Duplicate identical database import. | Same import appears twice consecutively. | **Certain** |
| Frontend login credit response | `credits_balance` is parsed as an optional field but not stored or used. | Types `frontend/src/lib/auth/types.ts:1-7`; session stores only token/role/email. | **High** |
| Pricing plan definitions vs backend formula | Duplicated hardcoded commercial logic. | Frontend array and backend INR 20/credit formula; proven mismatch. | **Certain** |
| Startup admin credential | Hardcoded credential and account seed. | `backend/app/main.py:106-115`; actual value intentionally not reproduced. | **Certain** |
| Old/readme database instructions | Describes SQLite and `AuditWeave.db`, unlike required runtime URL/PostgreSQL example. | `README.md:44,103,172`; `database.py:15-26`; `.env.example:1`. | **High** |

No second current pricing page or second Razorpay implementation was found. `frontend/src/types/razorpay.d.ts` only declares `window.Razorpay` and is not a duplicate flow.

The current initial balance, product values, flat backend rate, “one credit” copy, role exemptions, anonymous limit, provider currency, placeholder checkout identity, and payment status strings are all hardcoded rather than centrally configured.

## 15. Current End-to-End User Flow

```text
NEW USER
  -> submits first name/email/password
  -> backend creates role=user
  -> SQLAlchemy model supplies 2 credits
  -> no opening credit transaction is created
  -> registration response includes 2, but frontend ignores it
  -> user logs in
  -> login returns DB balance, but session stores only token/role/email
  -> layout calls /api/auth/me
  -> desktop header displays users.credits_balance

RUNS URL/TEXT/FILE AUDIT
  -> valid input/extraction occurs
  -> backend checks at least 1 credit
  -> commits balance -1 and an unlinked usage transaction
  -> runs audit afterward
  -> success creates owned audit records
  -> result navigation normally causes header profile refresh
  -> failure does not refund; header can remain stale
  -> user-visible credit history: NO

RUNS BATCH
  -> backend requires credits equal to item count
  -> deducts/commits full amount before processing any item
  -> a file item in current UI was already run and charged once
  -> batch runs/charges that file item again
  -> success remains on same page; header is stale

BUYS PRO PACK
  -> page displays INR 350 / 20 credits
  -> browser requests 20 credits
  -> backend creates INR 400 Razorpay order
  -> checkout uses INR 400 server amount
  -> Razorpay success callback returns order/payment/signature
  -> authenticated verify endpoint checks signature
  -> endpoint does not verify order ownership or provider capture
  -> one commit marks order verified, adds 20, and writes purchase delta
  -> payment order persists: YES, partially
  -> payment ID persists: only in unlinked credit transaction
  -> badge direct refresh event fails; /history redirect normally refreshes it
  -> payment/credit history visible: NO
  -> downloadable receipt/invoice: NO
```

At zero, ordinary direct and batch audit endpoints return HTTP 402. The frontend shows an error string. The desktop header provides a pricing link only when the cached value equals exactly zero.

Major production gaps: atomic balance service, successful-work charging semantics, correct batch behavior, authoritative server products, order ownership, robust idempotency/reconciliation, complete immutable financial records, history APIs/UI, and invoice-ready fields.

## 16. Gap Analysis

| Area | Status | Summary |
|---|---|---|
| DB-backed current balance | **PASS** | `users.credits_balance` is used end to end. |
| Exact provenance of 15 | **FAIL** | Opening grants and some causes are unlogged; current 15 origin is UNKNOWN. |
| New-user grant | **PARTIAL** | Model supplies 2, but it is hardcoded, client-side default only, and unledgered. |
| Pricing display | **FAIL** | Two of three pack prices disagree with checkout orders. |
| Server-side product authority | **FAIL** | No plan catalog; browser supplies arbitrary credits. |
| Razorpay signature check | **PASS** | Official verification utility is called before crediting. |
| Payment ownership | **FAIL** | Verify does not bind order to authenticated user. |
| Sequential replay protection | **PASS** | Verified status blocks later sequential replay. |
| Concurrent payment idempotency | **FAIL** | No lock/conditional transition/unique payment ID. |
| Payment persistence | **PARTIAL** | Orders and purchase deltas exist; key fields/lifecycle are missing. |
| Refunds/webhooks/subscriptions | **NOT IMPLEMENTED** | No relevant infrastructure. |
| Direct audit charging rule | **PARTIAL** | One credit per direct audit, but charged before success. |
| Batch charging | **FAIL** | Upfront nonrefundable charge; frontend file double billing. |
| Concurrent deduction safety | **FAIL** | Non-atomic check/read-modify-write. |
| Credit ledger | **PARTIAL** | Delta table exists but incomplete and inaccessible to users. |
| Payment/credit history UX | **NOT IMPLEMENTED** | No endpoints or pages. |
| Balance freshness | **PARTIAL** | `/auth/me` is live when called; refresh triggers are incomplete. |
| Search/pagination | **NOT IMPLEMENTED** | Missing APIs and supporting indexes. |
| Invoice/receipt | **NOT IMPLEMENTED** | Current persisted data is insufficient for reliable history. |
| Subscription/expiration/renewal | **NOT IMPLEMENTED** | Correctly absent for current one-time packs; no implied recurring model. |
| PostgreSQL/Supabase architecture | **PARTIAL** | PostgreSQL is intended and Alembic is canonical; live DB/provider/head are UNKNOWN and SQLite docs/fallback remain. |

## 17. Recommended Phase-1 Scope

Recommendations only; none are implemented by this audit.

1. Establish one server-side product catalog keyed by immutable pack ID; validate allowed purchases and return display data from the backend so UI and charged amount cannot diverge.
2. Centralize credit mutation in a transactional service. Use database-level atomic conditional deductions/row locking, nonnegative constraints, and unique idempotency keys.
3. Make payment verification owner-bound and concurrency-safe. Persist payment ID on the order, enforce uniqueness, atomically transition one order once, verify provider amount/currency/captured state, and add signed webhooks/reconciliation.
4. Decide and implement charging semantics tied to successful audit creation. Make audit result, balance mutation, and ledger reference coherent; define failure/refund behavior. Remove the batch file pre-audit/double charge.
5. Turn `credit_transactions` into an auditable ledger: record initial grant, pack/order/payment, audit ID, reason, timestamps, and resulting balance or otherwise provide a provable reconstruction rule.
6. Add authenticated, owner-scoped, server-paginated credit activity and payment history endpoints, then expose current/purchased/used totals and clear zero/low-credit states.
7. Persist invoice-ready verified payment facts before offering receipts. Treat current products as one-time packs; do not add renewal/subscription concepts unless the business model changes.
8. Remove/rotate the hardcoded startup admin credential through a separate security release process.
9. Align runtime/migration configuration and documentation around the intended PostgreSQL/Supabase environment, and verify Alembic head in a controlled non-production check.

## 18. Files That Would Likely Need Changes Later

These are planning targets only; no changes were made.

| File | Why it would likely change |
|---|---|
| `backend/app/models.py` | Strengthen order/payment/ledger fields, relationships, constraints, timestamps, and idempotency data. |
| `backend/migrations/versions/<new_revision>.py` | Apply any approved schema changes and deliberate legacy balance/history backfill. Existing migrations should not be edited after deployment. |
| `backend/app/schemas.py` | Add typed product, order, history, totals, and pagination contracts; validate pack IDs rather than arbitrary credits. |
| `backend/app/main.py` | Replace inline pricing/payment/deduction logic, enforce ownership, integrate reconciliation/webhooks, correct charging timing, and remove insecure seed behavior. |
| `backend/app/services/` new billing/credit modules | Keep transactional billing rules centralized rather than duplicating them across route handlers. |
| `backend/app/auth.py` / deployment bootstrap | Support safe privileged-account provisioning and retain authenticated ownership boundaries. |
| `backend/.env.example` | Document webhook/config variable names without secrets. |
| `docker-compose.yml` | Pass required backend Razorpay and frontend public-key configuration explicitly. |
| `frontend/Dockerfile` | Accept/build in the public Razorpay key where required by Next.js. |
| `frontend/src/lib/api.ts` | Add typed products/history endpoints, preserve status-aware errors, and expose a canonical balance refresh mechanism. |
| `frontend/src/lib/auth/session.ts` | Provide/reuse the single correct session/balance event contract or separate billing-state mechanism. |
| `frontend/src/lib/auth/types.ts` | Replace optional/unvalidated credit fields and `any` payment responses with exact types. |
| `frontend/src/app/layout.tsx` | Subscribe to canonical balance updates, improve mobile/click/low-credit behavior, and avoid stale state. |
| `frontend/src/app/pricing/page.tsx` | Consume backend products, show current totals/history, use real customer prefill, and fix checkout state/refresh. |
| `frontend/src/app/audit/new/page.tsx` | Refresh balance on charge/failure outcomes and provide a specific 402 top-up experience. |
| `frontend/src/app/audit/batch/page.tsx` | Stop calling the billable file-audit endpoint as preprocessing; show true batch cost and partial/failure behavior. |
| `backend/app/services/pdf_generator.py` or a dedicated receipt generator | Reuse low-level ReportLab patterns only after immutable payment facts exist. |
| `README.md`, `backend/alembic.ini` | Align database documentation/fallbacks with the intended PostgreSQL/Supabase deployment. |
| `backend/app/api/routes.py`, `backend/app/services/report_generator.py` | Review/remove or clearly quarantine legacy duplicate application/report code after confirming no external launcher depends on it. |

## 19. Final Priority Table

| Priority | Problem | Current State | User Impact | Recommended Direction |
|---|---|---|---|---|
| **P0** | Hardcoded startup admin credential | Source-controlled default privileged access | Credit bypass and wider account/data compromise | Remove seed credential, rotate affected credentials, provision securely. |
| **P0** | Payment verify ownership missing | Order queried globally by provider order ID | Misapplied credits/order sabotage if callback tuple leaks | Require order owner to equal current user in every transition. |
| **P0** | Payment concurrent idempotency missing | Read-check-write; no unique payment ID | Duplicate/inconsistent crediting and ledger corruption | Atomic one-time transition plus unique provider payment/idempotency key. |
| **P0** | Non-atomic deductions | Concurrent read-modify-write | Overspending and irreconcilable balances | Conditional DB update/locking and constraints. |
| **P1** | Credits charged before successful audit | Separate early commit; no refund | Users pay for failed work | Tie ledger/deduction to defined successful outcome or compensate transactionally. |
| **P1** | Batch file double charge | File audit then batch audit | Two credits and duplicated work per file | Add upload/extraction path or send file content once through one billed operation. |
| **P1** | Pricing mismatch | INR 350/1,500 displayed; INR 400/2,000 ordered | Direct overcharge relative to advertised price | Single server product catalog and frontend rendering from it. |
| **P1** | Nullable legacy balance and no opening ledger | Migration has no default/backfill | Broken accounts and unknowable provenance | Define migration/backfill policy and record explicit opening grants. |
| **P1** | Incomplete payment record/reconciliation | Missing owner check, capture verification, payment fields, webhook | Paid-but-uncredited and disputed payments | Persist provider facts and implement signed reconciliation/webhooks. |
| **P1** | Ledger not linked to audits/orders | Null usage references; purchase link informal | Cannot explain where credits went | Strong references and immutable transaction semantics. |
| **P2** | No billing/activity history | DB fragments only; no API/UI | Users cannot self-serve disputes/history | Owner-scoped paginated APIs and Credits & Billing UI. |
| **P2** | Stale badge/event mismatch | Refresh only on some navigation/events | Wrong balance shown after batch/failure/purchase interval | Canonical global refresh/update mechanism. |
| **P2** | Weak zero/low-credit UX | Generic 402 and desktop-only exact-zero CTA | Confusing block at depletion | Status-aware error, low-credit warning, direct top-up CTA. |
| **P2** | No receipt-ready data | Missing verified timestamp, linked payment ID, plan/currency/receipt | Cannot issue reliable historical receipt | Persist immutable verified payment record first. |
| **P3** | Search/filter/pagination absent | No billing endpoints/indexes | History will not scale when added | Query-oriented indexes and cursor/page contract. |
| **P3** | Dead duplicate backend/PDF path | Legacy app remains in tree | Maintenance and launch ambiguity | Confirm consumers, then quarantine/remove in a later implementation phase. |

---

### Final factual conclusions

- **Exact source of displayed 15:** the authenticated user's `users.credits_balance` via `/api/auth/me`; why it equals 15 is **UNKNOWN**.
- **Hardcoded or DB-backed:** displayed balance is DB-backed; new-user default is hardcoded at 2 in the SQLAlchemy model.
- **Purchase history:** partial records exist in DB; no usable history API/UI.
- **Usage history:** partial unlinked ledger rows exist in DB; no usable history API/UI and no audit IDs.
- **Razorpay verification:** signature check passes, but the overall verification design is not safe because ownership, concurrent idempotency, and provider-state reconciliation fail.
- **Duplicate purchase crediting:** sequential replay is blocked; concurrent duplicate/inconsistent processing remains possible.
- **Audit deductions:** not safe; they are early, non-atomic with the check/work, nonrefundable on failure, and batch file UI double charges.
- **Invoice data:** insufficiently persisted for reliable historical receipts/invoices.
