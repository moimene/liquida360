# LIQUIDA360 - Product Requirements Document

## Vision
Reducir el tiempo de pago a corresponsales y simplificar el proceso actual del pagador, gestionando de forma integral los certificados de residencia fiscal y las solicitudes al departamento financiero.

## Problem Statement
El proceso actual de pago a corresponsales presenta los siguientes problemas:
1. **Tiempo excesivo de pago**: El ciclo de liquidación es lento y manual
2. **Proceso complejo para el pagador**: Demasiados pasos manuales y pantallas
3. **Sin integración ERP**: No hay conexión directa con el sistema financiero, requiriendo peticiones manuales al departamento financiero
4. **Gestión manual de certificados**: Los certificados de residencia fiscal se gestionan de forma descontrolada, sin alertas de vencimiento

## Users & Roles

| Rol | Descripción | Permisos clave |
|---|---|---|
| **Pagador** | Gestiona liquidaciones de corresponsales | Crear/editar liquidaciones, solicitar pagos, gestionar certificados |
| **Supervisor** | Aprueba liquidaciones y revisa el estado | Aprobar/rechazar liquidaciones, ver dashboards |
| **Financiero** | Recibe y ejecuta peticiones de pago | Ver peticiones pendientes, marcar como pagado, adjuntar justificantes |
| **Admin** | Configura el sistema | Gestión de usuarios, configuración de alertas, parámetros del sistema |

## Core Features

### F1: Dashboard de Liquidaciones
- Vista resumida del estado de todas las liquidaciones
- Filtros por estado, corresponsal, fecha, importe
- KPIs: tiempo medio de pago, liquidaciones pendientes, certificados por vencer
- Acciones rápidas desde el dashboard

### F2: Gestión de Corresponsales
- Alta/edición de corresponsales
- Datos fiscales: país de origen, NIF/Tax ID, dirección fiscal
- Histórico de pagos por corresponsal
- Estado del certificado de residencia vinculado

### F3: Flujo de Liquidación Simplificado
- Wizard de 3 pasos máximo para crear liquidación
- Step 1: Seleccionar corresponsal (autocompletado)
- Step 2: Introducir datos de factura/liquidación (importe, concepto, referencia)
- Step 3: Revisar y confirmar → genera solicitud de pago
- Validación automática de certificado vigente antes de permitir pago

### F4: Solicitudes al Departamento Financiero
- Generación automática de solicitud de pago al confirmar liquidación
- Cola de solicitudes pendientes visible para Financiero
- Estados: Pendiente → En proceso → Pagado → Rechazado
- Adjuntar justificante de pago
- Notificaciones en tiempo real al pagador cuando cambia el estado
- Histórico de todas las solicitudes con trazabilidad completa

### F5: Gestión de Certificados de Residencia Fiscal
- Registro de certificados por corresponsal
- Campos: país emisor, fecha emisión, fecha vencimiento, documento adjunto
- **Vigencia configurable** (por defecto 1 año, ajustable por país)
- **Sistema de preavisos**:
  - Alerta a 120 días del vencimiento (configurable)
  - Alerta a 30 días del vencimiento (configurable)
  - Alerta de certificado vencido (bloquea nuevas liquidaciones)
- Panel de certificados próximos a vencer
- Cotejo del certificado: verificar que el país del certificado coincide con la sede del corresponsal
- Histórico de certificados por corresponsal

### F6: Notificaciones y Alertas
- Notificaciones in-app (bell icon + panel lateral)
- Tipos:
  - Certificado próximo a vencer (pre-alerta configurable)
  - Certificado vencido (urgente)
  - Solicitud de pago aprobada/rechazada
  - Pago ejecutado
- Marcado como leído/no leído
- Supabase Realtime para actualizaciones instantáneas

## Non-Functional Requirements
- **Performance**: Carga inicial < 2s, navegación < 500ms
- **Accessibility**: WCAG AA compliant
- **Responsive**: Desktop-first (uso principal en oficina), tablet compatible
- **Security**: RLS en Supabase, autenticación con Supabase Auth, roles vía claims
- **Audit**: Log de todas las acciones sobre liquidaciones y certificados

## Out of Scope (v1)
- Integración directa con ERP
- Pagos automáticos (siempre vía solicitud a Financiero)
- Multi-idioma (solo español en v1)
- App móvil nativa
- Firma digital de documentos
- OCR de certificados

## Data Model (High Level)

```
correspondents
├── id, name, country, tax_id, address, email, phone
├── created_at, updated_at
└── status (active/inactive)

certificates
├── id, correspondent_id (FK)
├── issuing_country, issue_date, expiry_date
├── document_url (Supabase Storage)
├── status (valid/expiring_soon/expired)
└── created_at, updated_at

liquidations
├── id, correspondent_id (FK), certificate_id (FK)
├── amount, currency, concept, reference
├── status (draft/pending_approval/approved/payment_requested/paid/rejected)
├── created_by (FK users), approved_by (FK users)
└── created_at, updated_at

payment_requests
├── id, liquidation_id (FK)
├── status (pending/in_progress/paid/rejected)
├── requested_at, processed_at
├── processed_by (FK users)
├── payment_proof_url (Supabase Storage)
└── notes

notifications
├── id, user_id (FK), type, title, message
├── related_entity_type, related_entity_id
├── read, read_at
└── created_at

alert_configs
├── id, alert_type, days_before_expiry
├── enabled, created_by
└── created_at, updated_at
```

## Success Metrics
- Reducción del tiempo medio de pago en un 40%
- Cero liquidaciones con certificados vencidos
- 100% de trazabilidad en solicitudes de pago
- Satisfacción del pagador > 4/5 en encuesta de usabilidad
