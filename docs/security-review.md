# LIQUIDA360 - Security Review

## Date: 2026-02-07
## Status: PASSED (with recommendations applied)

---

## 1. Authentication & Authorization

### Supabase Auth
- [x] Email/password authentication via Supabase Auth
- [x] JWT tokens with `app_metadata.role` for role-based access
- [x] Session management via `supabase.auth.getSession()` + `onAuthStateChange`
- [x] Protected routes redirect unauthenticated users to `/login`
- [x] Role-based route protection (`ProtectedRoute` component with `allowedRoles`)

### Roles
| Role | Access Level |
|------|-------------|
| `pagador` | Create/view own liquidations, view correspondents/certificates |
| `supervisor` | All of pagador + approve/reject liquidations |
| `financiero` | View approved+ liquidations, manage payment requests |
| `admin` | Full access to all resources |

### Findings
- **OK**: Default role fallback to `pagador` prevents privilege escalation
- **OK**: Role extracted from `app_metadata` (server-set, not user-modifiable)
- **FIXED** (migration 002): Added status transition validation triggers to prevent invalid state changes

---

## 2. Row Level Security (RLS)

### All tables have RLS enabled:
| Table | RLS | Policies |
|-------|-----|----------|
| `correspondents` | YES | SELECT (all auth), ALL (admin) |
| `certificates` | YES | SELECT (all auth), INSERT (pagador/supervisor/admin), UPDATE/DELETE (admin) |
| `liquidations` | YES | SELECT (own + supervisor + financiero for approved+), INSERT (pagador/supervisor/admin), UPDATE (own draft + supervisor/admin), DELETE (admin) |
| `payment_requests` | YES | SELECT (financiero/admin + related creators), UPDATE (financiero/admin), INSERT (pagador/supervisor/admin) |
| `notifications` | YES | SELECT/UPDATE (own only), INSERT (own or service_role) |
| `alert_configs` | YES | SELECT (all auth), ALL (admin) |

### Findings
- **FIXED** (migration 002): Replaced overly permissive notification INSERT policy (`WITH CHECK (true)`) with user-scoped policy
- **OK**: Financiero can only see approved+ liquidations (not drafts)
- **OK**: Pagador can only update own draft liquidations
- **OK**: Notifications strictly scoped to user_id = auth.uid()

---

## 3. Data Validation

### Client-side (Zod schemas)
| Schema | Validations |
|--------|------------|
| `correspondentSchema` | name (2-200 chars), country (min 2), tax_id (3-50), address (5-500), email (valid format), phone (max 30), status (enum) |
| `certificateSchema` | correspondent_id (UUID), issuing_country (min 2), dates (required), expiry > issue (refine) |
| `liquidationSchema` | correspondent_id (UUID), amount (positive number), currency (required), concept (3-500), reference (max 100) |
| `processPaymentSchema` | notes (max 500, nullable) |

### Server-side (PostgreSQL)
| Table | Constraints |
|-------|------------|
| `liquidations` | `CHECK (amount > 0)`, NOT NULL on required fields |
| `correspondents` | NOT NULL on name, country, tax_id, address |
| `certificates` | NOT NULL on dates, FK to correspondents (CASCADE) |
| `payment_requests` | FK to liquidations (RESTRICT), status enum |
| `alert_configs` | `CHECK (days_before_expiry > 0)` |

### Findings
- **OK**: Double validation (client + server) prevents bypass
- **OK**: Foreign keys with appropriate delete behaviors (CASCADE, RESTRICT, SET NULL)
- **ADDED** (migration 002): Status transition triggers prevent invalid workflows

---

## 4. Status Transition Security

### Liquidation Workflow (enforced by trigger)
```
draft → pending_approval → approved → payment_requested → paid
                         ↘ rejected → draft (re-submit)
```
- **FIXED**: Database trigger prevents skipping steps (e.g., draft → paid)
- **FIXED**: Service role can bypass for Edge Functions

### Payment Request Workflow (enforced by trigger)
```
pending → in_progress → paid
                      ↘ rejected
pending → rejected
```
- **FIXED**: Auto-sets `processed_at` and `processed_by` on terminal states

---

## 5. API Security

- [x] Supabase Anon Key is public (intended for client-side, scoped by RLS)
- [x] Service Role Key is server-only (Edge Functions only, not exposed to client)
- [x] `.env` contains secrets but is `.gitignore`-excluded
- [x] `.env.example` has placeholder values only

### Recommendations
- [ ] Enable Supabase Rate Limiting on API endpoints
- [ ] Add CORS configuration to restrict origins in production
- [ ] Consider enabling Supabase Audit Logging

---

## 6. Frontend Security

- [x] No `dangerouslySetInnerHTML` usage
- [x] No direct DOM manipulation
- [x] All user inputs go through Zod validation
- [x] React's built-in XSS protection (JSX escaping)
- [x] No inline `eval()` or `Function()` constructors

---

## 7. File Upload Security

- [x] Certificate document uploads go to Supabase Storage
- [x] File types restricted in form (PDF, JPG, PNG)
- [ ] **Recommendation**: Add server-side file type validation in Storage policies
- [ ] **Recommendation**: Add file size limits in Storage bucket configuration

---

## 8. Environment & Dependencies

- [x] TypeScript strict mode enabled
- [x] `noUnusedLocals` and `noUnusedParameters` enabled
- [x] All dependencies from npm (no CDN scripts)
- [x] No known critical vulnerabilities in current dependency versions

---

## Applied Fixes (Migration 002)

1. **Status transition validation triggers** - Prevent invalid liquidation/payment status changes
2. **Notification INSERT policy hardened** - Users can only create notifications for themselves
3. **Helper function for Edge Functions** - `get_users_by_role()` with restricted access
4. **Additional performance indexes** - created_at DESC for recent queries
