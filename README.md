# LIQUIDA360

Plataforma de gestion de liquidaciones de pagos para despachos de abogados. Gestiona pagos a corresponsales internacionales, certificados de residencia fiscal y flujos de aprobacion del departamento financiero.

**Produccion**: [https://liquida360.vercel.app](https://liquida360.vercel.app)

---

## Stack tecnologico

| Capa | Tecnologia |
|------|-----------|
| **Frontend** | React 19 + TypeScript 5.9 + Vite 7 |
| **Estilos** | Tailwind CSS 4 (Garrigues Design System, tokens `--g-*`) |
| **Estado** | Zustand 5 |
| **Backend** | Supabase (Auth, PostgreSQL, Edge Functions, Storage, Realtime) |
| **Routing** | React Router 7 |
| **Formularios** | React Hook Form + Zod 4 |
| **Tablas** | TanStack Table 8 |
| **Notificaciones** | Sonner |
| **Fechas** | date-fns |
| **Iconos** | Lucide React |
| **Tests** | Vitest + Testing Library |
| **Lint/Format** | ESLint 9 + Prettier |

---

## Arquitectura

```
src/
  app/                    # App shell, providers
  assets/                 # Recursos estaticos
  components/
    layout/               # AppLayout, PortalLayout, Sidebar, PortalHeader
    ui/                   # Componentes base (Button, Input, Dialog, Badge, Card...)
  features/
    auth/                 # Login, registro, guards (ProtectedRoute, PortalRoute)
    certificates/         # Certificados de residencia fiscal
    correspondents/       # Gestion de corresponsales
    dashboard/            # Dashboard principal con KPIs
    liquidations/         # Liquidaciones y flujo de aprobacion
    notifications/        # Centro de notificaciones (Realtime)
    payments/             # Solicitudes de pago al Dpto. Financiero
    portal/               # Portal de autoservicio para corresponsales
  lib/                    # Utilidades, constantes, cliente Supabase
  styles/                 # Tokens CSS del Design System
  types/                  # Tipos globales (UserRole, Database, entidades)
  __tests__/              # 79 unit tests

supabase/
  migrations/             # 3 migraciones SQL (schema + RLS + portal)
  functions/              # 4 Edge Functions
    check-certificates/   # Verificacion de vencimiento de certificados
    generate-notifications/ # Generacion automatica de notificaciones
    invite-correspondent/ # Invitacion de corresponsal al portal
    approve-correspondent/ # Aprobacion de registro de corresponsal
```

### Principios

- **Domain-driven**: Cada feature agrupa components, hooks, schemas
- **Row-Level Security (RLS)**: Todas las tablas protegidas por rol
- **Code splitting**: `React.lazy()` en todas las rutas
- **WCAG AA**: Contraste 4.5:1, ARIA, skip-to-content
- **Zero `any`**: TypeScript estricto en todo el proyecto

---

## Roles y rutas

| Rol | Acceso | Layout |
|-----|--------|--------|
| `pagador` | App interna completa (sin pagos) | Sidebar |
| `supervisor` | App interna completa (sin pagos) | Sidebar |
| `financiero` | App interna + modulo de pagos | Sidebar |
| `admin` | App interna + pagos + settings + aprobar/invitar corresponsales | Sidebar |
| `corresponsal` | Portal de autoservicio (`/portal/*`) | Nav horizontal |

### Rutas internas (`/`)

| Ruta | Pagina | Roles |
|------|--------|-------|
| `/` | Dashboard con KPIs | pagador, supervisor, financiero, admin |
| `/correspondents` | Lista de corresponsales | pagador, supervisor, financiero, admin |
| `/correspondents/:id` | Detalle + certificados + historico pagos | pagador, supervisor, financiero, admin |
| `/certificates` | Gestion de certificados | pagador, supervisor, financiero, admin |
| `/liquidations` | Liquidaciones y flujo de aprobacion | pagador, supervisor, financiero, admin |
| `/liquidations/:id` | Detalle con timeline interactiva | pagador, supervisor, financiero, admin |
| `/payments` | Solicitudes al Dpto. Financiero | financiero, admin |
| `/payments/:id` | Detalle de solicitud de pago | financiero, admin |
| `/notifications` | Centro de notificaciones | todos |
| `/settings` | Configuracion | admin |

### Rutas del portal (`/portal`)

| Ruta | Pagina |
|------|--------|
| `/portal` | Dashboard: KPIs, alertas de certificados, facturas recientes |
| `/portal/invoices` | Mis facturas (crear borrador + subir PDF) |
| `/portal/invoices/:id` | Detalle factura + timeline readonly + enviar a aprobacion |
| `/portal/certificates` | Mis certificados (consultar + subir nuevos) |
| `/portal/profile` | Perfil del despacho (datos editables y readonly) |
| `/portal/notifications` | Notificaciones del corresponsal |

### Rutas publicas

| Ruta | Pagina |
|------|--------|
| `/login` | Inicio de sesion |
| `/register` | Auto-registro de corresponsales |
| `/pending` | Registro pendiente de aprobacion |

---

## Flujos de negocio

### Liquidaciones
`draft` → `pending_approval` → `approved` → `payment_requested` → `paid`
(o `rejected` en cualquier paso)

### Certificados de residencia fiscal
- Validez configurable (default: 1 ano)
- Pre-alertas a 90 y 30 dias antes de vencimiento
- Edge Function automatica para verificar vencimientos

### Onboarding de corresponsales
1. **Invitacion** (admin): Desde detalle del corresponsal → crea usuario con rol `corresponsal`
2. **Auto-registro**: `/register` → crea corresponsal con `pending_approval` → admin aprueba
3. **Aprobacion**: Admin activa el corresponsal → se asigna rol `corresponsal` al usuario

---

## Comandos

```bash
# Desarrollo
npm run dev

# Build (TypeScript + Vite)
npm run build

# Tests (79 tests)
npm test

# Lint
npm run lint
npm run lint:fix

# Formato
npm run format
npm run format:check

# Preview del build
npm run preview
```

---

## Variables de entorno

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

---

## Base de datos

### Migraciones

| Archivo | Contenido |
|---------|-----------|
| `001_initial_schema.sql` | Enums, tablas (correspondents, certificates, liquidations, payment_requests, notifications), RLS, triggers |
| `002_helper_functions.sql` | `get_user_role()`, `handle_payment_request()`, notificacion automatica |
| `003_correspondent_portal.sql` | `user_id` en correspondents, `invoice_url` en liquidations, RLS para corresponsales, bucket storage |

### Edge Functions

| Funcion | Trigger | Descripcion |
|---------|---------|-------------|
| `check-certificates` | Cron / manual | Verifica certificados proximos a vencer |
| `generate-notifications` | Cron / manual | Genera notificaciones automaticas |
| `invite-correspondent` | Admin UI | Crea usuario + vincula con corresponsal |
| `approve-correspondent` | Admin UI | Aprueba registro + asigna rol |

---

## Usuarios de prueba

### Roles internos

| Email | Password | Rol | Acceso |
|-------|----------|-----|--------|
| `pagador@liquida360.demo` | `Demo2026!` | pagador | App interna (sin pagos) |
| `supervisor@liquida360.demo` | `Demo2026!` | supervisor | App interna (sin pagos) |
| `financiero@liquida360.demo` | `Demo2026!` | financiero | App interna + pagos |
| `admin@liquida360.demo` | `Demo2026!` | admin | App interna + pagos + settings + aprobar/invitar |

### Corresponsales (Portal)

| Email | Password | Despacho | Pais |
|-------|----------|----------|------|
| `corresponsal1@liquida360.demo` | `Demo2026!` | Bufete Martinez & Asociados | Mexico |
| `corresponsal2@liquida360.demo` | `Demo2026!` | Costa Rica Legal Partners S.A. | Costa Rica |
| `corresponsal3@liquida360.demo` | `Demo2026!` | Estudio Juridico Andes SpA | Chile |

> Los corresponsales acceden al portal en `/portal` tras iniciar sesion.
> Los roles internos son redirigidos automaticamente a la app interna.

---

## Despliegue

### Vercel (Frontend)
```bash
npm_config_cache=/tmp/npm-cache npx vercel --prod --yes
```

### Supabase (Backend)
```bash
# Vincular proyecto
supabase link --project-ref <PROJECT_REF>

# Push migraciones
supabase db push

# Deploy Edge Functions
supabase functions deploy check-certificates --no-verify-jwt
supabase functions deploy generate-notifications --no-verify-jwt
supabase functions deploy invite-correspondent --no-verify-jwt
supabase functions deploy approve-correspondent --no-verify-jwt
```

---

## Metricas del proyecto

| Metrica | Valor |
|---------|-------|
| Archivos TS/TSX | 92 |
| Feature modules | 8 |
| Unit tests | 79 |
| Edge Functions | 4 |
| Migraciones SQL | 3 |
| Roles de usuario | 5 |
| Rutas totales | 17 |
| Build time | ~1.7s |
