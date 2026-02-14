# LIQUIDA360 - Plan de Implantación

## Evolucion 2026-02-14
- [x] Incorporado plan de evolucion funcional en `docs/evolution-plan-2026-02-14.md`
- [x] Ejecutada primera ola de quick wins (portal + G-Invoice) en UI/modelo
- [x] Preparada migracion `011_portal_ginvoice_evolution.sql` para tipos de certificado, datos bancarios y campos de tasas
- [x] Completada fase operativa adicional en G-Invoice: ordenacion multi-criterio, exportacion XLSX y columnas Job/cliente/pais
- [x] Completada Fase 3: ciclo `Facturado/Archivado` sincronizado, deep-link SAP, anexado automatico de justificantes y auditoria FX
- [x] Preparada migracion `013_ginv_sap_payload_and_fx_guardrails.sql` para metadatos SAP y refuerzo de conversiones
- [x] Arrancada Fase 4 (CxC): vista operativa de facturas pendientes/vencidas de cobro y baseline de datos CxC
- [x] Preparada migracion `014_ginv_accounts_receivable_baseline.sql` para estado/saldos/vencimiento de factura cliente
- [x] Completados entregables Fase 4 restantes: exportes CxC deduplicados y flujo semiautomatico de reclamaciones
- [x] Preparada migracion `015_ginv_collections_claims.sql` para aprobacion/envio de reclamaciones con copia a responsables
- [x] Preparada migracion `016_ginv_collection_claims_hardening.sql` para hardening de permisos/transiciones en reclamaciones CxC

## Fase 0: Fundación (Sprint 0)
- [x] Crear CLAUDE.md con reglas del proyecto y skills activas
- [x] Crear PRD (docs/product-requirements.md)
- [x] Crear plan de implantación (PLAN.md)
- [x] Inicializar proyecto (Vite + React + TypeScript)
- [x] Configurar Tailwind CSS v4 + @tailwindcss/vite
- [x] Configurar ESLint 9 (flat config) + Prettier + eslint-config-prettier
- [x] Inyectar Design System tokens (CSS custom properties - official Garrigues tokens.css)
- [x] Configurar Supabase client
- [x] Crear estructura de carpetas por dominio
- [x] Inicializar repositorio git
- [x] Activar skill desarrollar-ux-garrigues
- [x] Instalar Montserrat font (@fontsource/montserrat)

## Fase 1: Autenticación y Layout (Sprint 1)
- [x] Configurar Supabase Auth (email/password) - store con Zustand
- [x] Página de Login (compliant con Design System)
- [x] Layout principal: Sidebar + Header + Content area
- [x] Navegación con React Router v6 (7 rutas)
- [x] Protección de rutas por rol (Pagador, Supervisor, Financiero, Admin)
- [x] Componente de usuario en header (avatar, nombre, rol, logout)
- [x] Componentes UI base: Button, Input, Card, Badge, Label
- [x] Dashboard con métricas placeholder
- [x] Build + TypeScript pass sin errores

## Fase 2: Gestión de Corresponsales (Sprint 2)
- [x] Schema SQL completo (6 tablas, 4 enums, RLS, triggers, índices) - ejecutado en Supabase
- [x] Tabla `correspondents` en Supabase + RLS policies
- [x] Zod schema + validación (correspondent-schema.ts)
- [x] Zustand store con CRUD Supabase (use-correspondents.ts)
- [x] Listado de corresponsales (TanStack Table con sorting, filtro global, paginación)
- [x] Formulario alta/edición corresponsal (React Hook Form + Zod + Dialog)
- [x] Detalle de corresponsal con tabs (datos, certificados, pagos)
- [x] Búsqueda global en tabla de corresponsales
- [x] Componentes UI nuevos: Dialog, Select, Textarea
- [x] Catálogo de 54 países (lib/countries.ts)
- [x] Build + TypeScript pass sin errores

## Fase 3: Certificados de Residencia Fiscal (Sprint 3)
- [x] Tabla `certificates` en Supabase + RLS policies (ya creada en migración 001)
- [x] Zod schema + validación con refine (fecha vencimiento > emisión)
- [x] Zustand store con CRUD Supabase + file upload (use-certificates.ts)
- [x] CRUD de certificados vinculados a corresponsal
- [x] Upload de documento a Supabase Storage (PDF, JPG, PNG)
- [x] Cálculo automático de estado (valid/expiring_soon/expired) con date-fns
- [x] Fecha vencimiento auto-calculada (1 año desde emisión por defecto)
- [x] Tabla `alert_configs` en Supabase (ya creada en migración 001)
- [x] Edge Function: check-certificates (cron diario para evaluar vencimientos) — código listo en supabase/functions/
- [x] Cotejo país certificado vs sede corresponsal (warning en formulario)
- [x] Panel de certificados próximos a vencer (ExpiryPanel: vencidos + por vencer)
- [x] Tab de certificados integrado en detalle de corresponsal
- [x] Listado global de certificados con TanStack Table
- [x] Utilidades: getCertificateStatus, formatDate, getDefaultExpiryDate, validateCountryMatch, filterExpiringCertificates
- [x] Build + TypeScript pass sin errores

## Fase 4: Flujo de Liquidación (Sprint 4)
- [x] Tabla `liquidations` en Supabase + RLS policies (ya creada en migración 001)
- [x] Zod schema + validación (liquidation-schema.ts) con 10 divisas
- [x] Zustand store con flujo de aprobación: create, submitForApproval, approve, reject (use-liquidations.ts)
- [x] Utilidades: STATUS_CONFIG, getStatusConfig, formatAmount (Intl.NumberFormat), STATUS_TIMELINE
- [x] Wizard de 3 pasos: Corresponsal → Datos → Confirmar (liquidation-wizard.tsx)
- [x] Validación: check de certificado vigente en paso 1, warning si no existe
- [x] Listado de liquidaciones con TanStack Table, filtro por estado, búsqueda global, paginación
- [x] Detalle de liquidación con timeline de estados visual (5 pasos + estado rechazada)
- [x] Acciones contextuales por rol: Enviar a aprobación (pagador), Aprobar/Rechazar (supervisor)
- [x] Tab "Histórico de pagos" integrado en detalle de corresponsal con estadísticas
- [x] Routing: /liquidations, /liquidations/:id
- [x] Barrel export (features/liquidations/index.ts)
- [x] Build + TypeScript pass sin errores

## Fase 5: Solicitudes de Pago (Sprint 5)
- [x] Tabla `payment_requests` en Supabase + RLS policies (ya creada en migración 001)
- [x] Zustand store con flujo completo: createRequest, markInProgress, markPaid, rejectRequest (use-payment-requests.ts)
- [x] Utilidades: PAYMENT_STATUS_CONFIG, getPaymentStatusConfig (payment-utils.ts)
- [x] Zod schema para notas de procesamiento (payment-request-schema.ts)
- [x] Botón "Solicitar pago" en detalle de liquidación aprobada → crea payment_request + actualiza liquidación a payment_requested
- [x] Vista "Cola de Pagos" para rol Financiero con TanStack Table, filtros por estado, stats cards (pendientes, en proceso, pagadas, rechazadas)
- [x] Detalle de solicitud de pago con acciones: Iniciar proceso, Marcar pagada (con notas), Rechazar (con motivo)
- [x] Dialog de confirmación con notas para marcar pagada/rechazar
- [x] Al marcar como pagada, se actualiza también la liquidación a estado 'paid'
- [x] Trazabilidad: processed_by, processed_at, notes en cada solicitud
- [x] Link directo a liquidación asociada desde detalle de solicitud
- [x] Routing: /payments (financiero, admin), /payments/:id (financiero, admin)
- [x] Barrel export (features/payments/index.ts)
- [x] Build + TypeScript pass sin errores

## Fase 6: Notificaciones y Dashboard (Sprint 6)
- [x] Tabla `notifications` en Supabase (ya creada en migración 001)
- [x] Zustand store con Supabase Realtime: fetch, markAsRead, markAllAsRead, subscribeRealtime (postgres_changes INSERT)
- [x] NotificationBell component en header: badge con contador unread, dropdown panel con 8 últimas, marca leídas, "Marcar todo leído"
- [x] Navegación contextual: click en notificación navega a la entidad relacionada (liquidation, payment, certificate, correspondent)
- [x] Página completa de notificaciones (/notifications): listado con indicador unread, tipo de entidad, tiempo relativo
- [x] Utilidades: formatRelativeTime (ahora, min, h, días, semanas, meses), getNotificationIcon
- [x] Dashboard con KPIs reales desde Supabase:
  - Liquidaciones pendientes (draft + pending_approval)
  - Certificados vigentes (con total)
  - Certificados por vencer/vencidos (con desglose)
  - Pagos pendientes (financiero/admin) ó En aprobación/pago (otros roles)
- [x] Card "Liquidaciones recientes" con lista clickable (corresponsal, fecha, estado, importe)
- [x] Card "Alertas de certificados" con resumen de vencidos y próximos a vencer
- [x] Edge Function: generate-notifications (automáticas por cambio de estado) — código listo en supabase/functions/
- [x] Barrel export (features/notifications/index.ts)
- [x] Routing: /notifications
- [x] Build + TypeScript pass sin errores

## Fase 7: Pulido y Lanzamiento (Sprint 7)
- [x] Accesibilidad WCAG AA: skip-to-content link, ARIA landmarks (role="main", aria-label), focus-visible styles
- [x] ErrorBoundary a nivel de app y ruta (class component con UI de error branded)
- [x] SuspenseLoader component (spinner con role="status" y aria-label)
- [x] Code splitting: React.lazy() para las 10 páginas de ruta
- [x] Vendor chunk splitting (Vite manualChunks): vendor-react (47KB), vendor-table (53KB), vendor-form (89KB), vendor-ui (91KB), vendor-supabase (171KB)
- [x] Build verificado: tsc 0 errores + vite build exitoso (1.62s)
- [x] Tests unitarios: 79 tests en 7 suites (Vitest) — schemas, utils, constantes
- [x] Revisión de seguridad: migration 002 (status transitions, RLS hardening, helper functions)
- [x] Documentación de usuario (docs/user-guide.md)
- [x] Informe de seguridad (docs/security-review.md)
- [x] ESLint 9 + Prettier configurados (eslint-config-prettier, .prettierrc, format scripts)
- [x] Database types corregidos (Insert/Update flattened + Relationships para tsc -b)
- [x] Deploy a producción: https://liquida360.vercel.app

---

## Estructura de Carpetas

```
src/
├── app/
│   ├── routes.tsx
│   └── providers.tsx
├── components/
│   └── ui/              # shadcn/ui components
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── correspondents/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   └── index.ts
│   ├── certificates/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   └── index.ts
│   ├── liquidations/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   └── index.ts
│   ├── payments/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   └── index.ts
│   ├── notifications/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   └── dashboard/
│       ├── components/
│       └── index.ts
├── lib/
│   ├── supabase.ts
│   ├── utils.ts
│   └── constants.ts
├── styles/
│   ├── tokens.css       # Design system CSS variables
│   └── globals.css
└── types/
    ├── database.ts       # Auto-generated Supabase types
    └── index.ts
```
