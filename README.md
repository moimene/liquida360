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
| **Graficos** | Recharts 3 |
| **Notificaciones** | Sonner |
| **Fechas** | date-fns |
| **Iconos** | Lucide React |
| **Tests unitarios** | Vitest + Testing Library |
| **Tests E2E** | Playwright (26 specs, 146 tests) |
| **Lint/Format** | ESLint 9 + Prettier |

---

## Arquitectura

```
src/
  app/                    # App shell, providers
  assets/                 # Recursos estaticos
  components/
    layout/               # AppLayout, PortalLayout, Sidebar, PortalHeader
    ui/                   # 14 componentes (Button, Input, Dialog, SortButton, EmptyState,
                          #   DateRangeFilter, TableToolbar, Breadcrumbs, CommandPalette...)
  features/
    auth/                 # Login, registro, guards (ProtectedRoute, PortalRoute)
    certificates/         # Certificados de residencia fiscal
    correspondents/       # Gestion de corresponsales
    dashboard/            # Dashboard con KPIs + 3 graficos (Recharts)
      components/charts/  # LiquidationTrendChart, LiquidationStatusChart, CertificateExpiryChart
    liquidations/         # Liquidaciones, flujo de aprobacion, realtime
    notifications/        # Centro de notificaciones (Realtime)
    payments/             # Solicitudes de pago al Dpto. Financiero, realtime
    portal/               # Portal de autoservicio para corresponsales
    settings/             # Configuracion (admin): alertas, usuarios, general
  lib/                    # Utilidades, Supabase client, csv-export, search-index
  styles/                 # Tokens CSS del Design System
  types/                  # Tipos globales (UserRole, Database, entidades)
  __tests__/              # 120 unit tests

e2e/
  auth/                   # Login, logout, registro, acceso por roles
  certificates/           # CRUD y filtros de certificados
  correspondents/         # CRUD y detalle de corresponsales
  cross-cutting/          # Accesibilidad, breadcrumbs, command palette, CSV, notificaciones
  dashboard/              # KPIs, graficos, alertas
  liquidations/           # Wizard, detalle, workflow de aprobacion
  payments/               # Cola y procesamiento de pagos
  portal/                 # Dashboard, facturas, certificados, perfil del corresponsal
  settings/               # Panel de administracion
  workflows/              # Flujos E2E completos (ciclo liquidacion, alertas certificados)
  fixtures/               # Auth fixture con retry para rate-limiting
  helpers/                # Utilidades (waitForToast, hasTableData, etc.)
  pages/                  # Page Object Models (15 POMs)

supabase/
  migrations/             # 6 migraciones SQL (schema + RLS + portal + audit + registro + storage)
  functions/              # 5 Edge Functions
    manage-users/         # CRUD de usuarios internos (admin only)
    check-certificates/   # Verificacion de vencimiento de certificados
    generate-notifications/ # Generacion automatica de notificaciones
    invite-correspondent/ # Invitacion de corresponsal al portal
    approve-correspondent/ # Aprobacion de registro de corresponsal
```

### Principios

- **Domain-driven**: Cada feature agrupa components, hooks, schemas
- **Row-Level Security (RLS)**: Todas las tablas protegidas por rol
- **Code splitting**: `React.lazy()` en todas las rutas
- **Realtime**: Suscripciones Supabase en liquidaciones y pagos (actualizacion instantanea)
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
| `/login` | Inicio de sesion (selector Interno / Corresponsal) |
| `/register` | Auto-registro de corresponsales |
| `/pending` | Registro pendiente de aprobacion |

---

## Descripcion de pantallas

### Pantallas publicas

#### Login (`/login`)

Pantalla de inicio de sesion con **selector de tipo de acceso** (tabs):
- **Interno**: Para pagador, supervisor, financiero y admin. Placeholder "usuario@empresa.com".
- **Corresponsal**: Para despachos externos. Placeholder "email@despacho.com". Muestra link a registro.

Tras hacer login, valida que el rol del usuario coincida con el modo seleccionado. Si un corresponsal intenta entrar por "Interno" (o viceversa), se muestra un error descriptivo y se cierra la sesion.

#### Registro (`/register`)

Formulario para que despachos corresponsales se auto-registren:
- Campos: nombre del despacho, pais (dropdown ~190 paises), NIF/Tax ID, email, contrasena
- Al enviar: crea usuario + corresponsal con estado `pending_approval`
- Redirige a la pantalla de aprobacion pendiente

#### Aprobacion pendiente (`/pending`)

Pantalla de espera con icono de reloj, texto informativo y el email del usuario registrado. Unica accion: cerrar sesion. El usuario sera redirigido automaticamente al portal cuando un admin apruebe su registro.

---

### App interna

#### Dashboard (`/`)

Panel principal con 4 tarjetas KPI:
- **Liquidaciones pendientes**: Total en estados intermedios (amarillo si > 0)
- **Certificados vigentes**: Total activos (verde)
- **Certificados por vencer**: Vencidos + proximos a vencer (rojo si > 0)
- **KPI contextual por rol**:
  - Financiero/Admin: "Pagos pendientes" en cola
  - Pagador/Supervisor: "En aprobacion/pago"

Debajo, dos paneles:
- **Liquidaciones recientes** (2/3): Lista de las 5 ultimas con corresponsal, fecha, estado y monto. Clic navega al detalle.
- **Alertas de certificados** (1/3): Si hay certificados vencidos o proximos a vencer, muestra alertas con colores rojo/amarillo y link a gestion.

Seccion de graficos interactivos (Recharts):
- **Tendencia mensual** (barras): Importe total de liquidaciones por mes, tooltips con formato moneda.
- **Distribucion por estado** (donut): Desglose visual de liquidaciones por estado (borrador, pendiente, aprobada, pagada, rechazada) con leyenda y colores por status.
- **Certificados por vencer** (barras horizontales): Los 8 certificados con vencimiento mas proximo en los proximos 90 dias. Color por urgencia: verde >60d, amarillo 30-60d, rojo <30d. Si no hay vencimientos, muestra estado vacio positivo.

#### Corresponsales — Lista (`/correspondents`)

Tabla con toolbar avanzado (buscador, filtro por estado, exportar CSV, contador de registros) y paginacion. Columnas: nombre, pais, NIF, email, estado (badge color), acciones. Boton "Nuevo corresponsal" abre un dialog modal con formulario completo (nombre, pais, NIF, direccion, email, telefono).

#### Corresponsales — Detalle (`/correspondents/:id`)

Breadcrumbs de navegacion: Inicio > Corresponsales > nombre. Cabecera con nombre, badge de estado y badge de vinculacion al portal. Tres pestanas:
- **Datos**: Ficha readonly con todos los campos del corresponsal
- **Certificados**: Lista de certificados de residencia fiscal con fechas y estados
- **Pagos**: Historico de liquidaciones asociadas

Acciones contextuales (solo admin):
- **Aprobar**: Si el corresponsal esta en `pending_approval`
- **Invitar al portal**: Si el corresponsal no tiene usuario vinculado. Solicita email y envia invitacion.
- **Editar**: Abre dialog de edicion de datos

#### Certificados (`/certificates`)

Panel de alertas en la parte superior (rojo: vencidos, amarillo: por vencer). Tabla con toolbar avanzado (buscador, filtro por estado, exportar CSV) y columnas: corresponsal, pais emisor, fecha vencimiento, estado (badge). Boton "Nuevo certificado" abre un wizard:
1. Seleccionar corresponsal (dropdown)
2. Pais emisor (dropdown)
3. Fecha de emision (datepicker)
4. Fecha de vencimiento (auto-calculada a 1 ano, editable)
5. Subir documento (PDF/JPG/PNG, opcional)

#### Liquidaciones — Lista (`/liquidations`)

Tabla con toolbar avanzado (buscador, filtro por estado, filtro por rango de fechas, exportar CSV, contador de registros) y actualizacion en tiempo real via Supabase Realtime. Columnas: corresponsal, concepto, importe, divisa, estado, fecha. Boton "Nueva liquidacion" abre un wizard de 3 pasos:

**Paso 1 — Corresponsal**: Dropdown de corresponsales activos. Al seleccionar, muestra tarjeta con estado del certificado (vigente con dias restantes, vencido, o sin certificado).

**Paso 2 — Datos**: Campos de importe, divisa (10 monedas: EUR, USD, GBP, CHF, BRL, MXN, CLP, COP, PEN, ARS), concepto (textarea) y referencia (opcional).

**Paso 3 — Confirmacion**: Resumen visual con todos los datos. Si no hay certificado vigente, muestra advertencia amarilla indicando que se creara como borrador pero no se podra solicitar pago hasta tener certificado.

#### Liquidaciones — Detalle (`/liquidations/:id`)

Breadcrumbs de navegacion: Inicio > Liquidaciones > #referencia. Cabecera con importe formateado, badge de estado, nombre del corresponsal. **Timeline visual de 5 pasos**: Borrador → Pendiente aprobacion → Aprobada → Pago solicitado → Pagada. Circulos numerados con lineas conectoras. Si rechazada, muestra X roja.

Botones de accion segun rol y estado:
- Borrador + Pagador/Admin → "Enviar a aprobacion"
- Pendiente + Supervisor/Admin → "Aprobar" / "Rechazar"
- Aprobada + certificado vigente → "Solicitar pago"

Dos tarjetas de detalle: datos de la liquidacion (izquierda) e informacion de procesamiento con textos guia contextuales (derecha).

#### Pagos — Cola (`/payments`)

Accesible solo para financiero y admin. Actualizacion en tiempo real via Supabase Realtime. Cuatro tarjetas de estadisticas: pendientes, en proceso, pagadas, rechazadas. Tabla con toolbar avanzado (buscador, filtro por estado, rango de fechas, exportar CSV) y columnas: corresponsal, liquidacion, importe, estado, fecha solicitud, fecha procesamiento.

#### Pagos — Detalle (`/payments/:id`)

Breadcrumbs de navegacion: Inicio > Pagos > Solicitud #id. Cabecera con titulo, badge de estado y corresponsal. Botones contextuales:
- Pendiente → "Iniciar proceso"
- En proceso → "Marcar como pagada" / "Rechazar"

Al confirmar pago: dialog con resumen + campo de notas (numero de transferencia, referencia bancaria). Al rechazar: dialog con campo obligatorio de motivo. Tarjetas con datos de la liquidacion asociada y detalles del procesamiento.

#### Notificaciones (`/notifications`)

Lista de notificaciones con indicador de no leidas (punto azul), titulo, mensaje, tipo de entidad (badge: Liquidacion, Pago, Certificado, Corresponsal) y tiempo relativo. Clic marca como leida y navega a la entidad relacionada. Boton "Marcar todo como leido" en la cabecera.

**Campana de notificaciones** (header): Badge rojo con contador de no leidas. Dropdown con las 8 mas recientes y link a la pagina completa.

---

### Portal de corresponsales

#### Portal Dashboard (`/portal`)

Saludo personalizado: "Bienvenido, [nombre del despacho]". Cuatro KPIs: borradores, en proceso, pagadas, certificados vigentes (formato X/Y). Alerta condicional si hay certificados vencidos o proximos a vencer (amarillo con link). Panel de facturas recientes (5 ultimas) con concepto, fecha, importe y estado.

#### Portal Facturas (`/portal/invoices`)

Tabla con buscador y paginacion. Columnas: concepto, importe, estado, fecha, acciones. Boton "Nueva factura" abre dialog con: concepto (textarea), importe, divisa, referencia (opcional) y subida de PDF de factura. Crea liquidacion en estado `draft`.

#### Portal Detalle de Factura (`/portal/invoices/:id`)

Cabecera con importe y estado. Timeline readonly de 5 pasos (mismo diseno que la app interna pero sin botones de accion de supervisor/financiero). Unica accion: "Enviar a aprobacion" (visible solo en estado borrador). Tarjetas de detalle con datos de la factura y textos de guia contextuales segun el estado actual ("Tu factura esta en borrador...", "Pendiente de aprobacion...", "Pago completado...").

#### Portal Certificados (`/portal/certificates`)

Tres tarjetas de estadisticas: vigentes (verde), proximos a vencer (amarillo), vencidos (rojo). Grid de tarjetas de certificados con pais, estado (badge), fechas de emision/vencimiento y link de descarga. Boton "Nuevo certificado" abre dialog con: pais (pre-rellenado con el pais del corresponsal), fecha emision, fecha vencimiento (auto-calculada) y subida de documento.

#### Portal Perfil (`/portal/profile`)

Dos secciones:
- **Datos del despacho** (readonly): Nombre, pais, NIF. Nota: "Estos datos solo pueden ser modificados por un administrador."
- **Datos de contacto** (editable): Direccion (textarea), email de contacto, telefono. Boton "Guardar cambios".

#### Portal Notificaciones (`/portal/notifications`)

Misma interfaz que las notificaciones internas, pero la navegacion al clicar se resuelve dentro del portal (`/portal/invoices/:id`, `/portal/certificates`, `/portal/profile`).

---

## Flujos de trabajo

### 1. Ciclo de vida de una liquidacion

```
PAGADOR                    SUPERVISOR              FINANCIERO
  |                            |                       |
  |  Crear liquidacion         |                       |
  |  (wizard 3 pasos)          |                       |
  v                            |                       |
[DRAFT] ----Enviar---->  [PENDING_APPROVAL]             |
                               |                       |
                         Aprobar / Rechazar             |
                               |                       |
                    [APPROVED] o [REJECTED]              |
                         |                              |
                   Solicitar pago                       |
                   (requiere cert. vigente)             |
                         v                              |
                  [PAYMENT_REQUESTED] ---------> Cola de pagos
                                                       |
                                                 Procesar pago
                                                       |
                                              Pagar / Rechazar
                                                       v
                                                [PAID] o [REJECTED]
```

### 2. Gestion de certificados

```
PAGADOR/ADMIN                        EDGE FUNCTION (cron)
  |                                        |
  |  Registrar certificado                 |  check-certificates
  |  (pais, fechas, documento)             |  (ejecuta periodicamente)
  v                                        v
[VALID] ─────(tiempo)──────> [EXPIRING_SOON] ──(tiempo)──> [EXPIRED]
  |                               |                           |
  |                         Notificacion                 Notificacion
  |                         pre-alerta (90d, 30d)        "Certificado vencido"
  |                               |                           |
  |                         Renovar: subir nuevo              |
  |                         certificado                       |
  v                               v                           v
Dashboard muestra          Alerta amarilla             Alerta roja
"Vigentes: X"              en dashboard                Bloquea solicitud de pago
```

### 3. Onboarding de corresponsales

```
VIA INVITACION (admin)                  VIA AUTO-REGISTRO (corresponsal)
  |                                        |
  |  Admin abre detalle del                |  Corresponsal accede a /register
  |  corresponsal                          |  Rellena: nombre, pais, NIF,
  |  Clic "Invitar al portal"             |  email, contrasena
  |  Introduce email                       |
  v                                        v
Edge Function:                        supabase.auth.signUp()
invite-correspondent                  + INSERT correspondents
  |                                   (status: pending_approval)
  |  Crea usuario con                      |
  |  role: corresponsal                    v
  |  Vincula user_id                  Pantalla /pending
  |                                   "Tu registro esta pendiente"
  v                                        |
Corresponsal recibe email             Admin ve corresponsal con
con link de acceso                    estado "Pendiente" en la tabla
  |                                        |
  v                                   Admin clic "Aprobar"
Acceso directo al portal                   |
/portal                                    v
                                      Edge Function:
                                      approve-correspondent
                                        |
                                        |  Activa corresponsal
                                        |  Asigna role: corresponsal
                                        v
                                      Corresponsal puede
                                      acceder a /portal
```

### 4. Flujo de pago completo

```
CORRESPONSAL (portal)          PAGADOR (interno)         FINANCIERO
  |                               |                          |
  |  Crear factura                |                          |
  |  (concepto, importe, PDF)     |                          |
  |  Estado: draft                |                          |
  |                               |                          |
  |  Enviar a aprobacion          |                          |
  v                               |                          |
[PENDING_APPROVAL] ──────> Notificacion al supervisor        |
                                  |                          |
                            Supervisor aprueba               |
                                  v                          |
                            [APPROVED]                       |
                                  |                          |
                            Pagador solicita pago            |
                            (verifica certificado)           |
                                  v                          |
                            [PAYMENT_REQUESTED] ──────> Aparece en cola
                                                             |
                                                       Financiero procesa
                                                       (notas, referencia)
                                                             v
                                                       [PAID]
                                                             |
                                                       Notificacion al
                                                       corresponsal
                                                             v
                                                  Corresponsal ve
                                                  "Pagada" en su portal
```

---

## Historias de usuario

### Pagador

| ID | Historia | Criterio de aceptacion |
|----|----------|----------------------|
| P1 | Como pagador, quiero crear una liquidacion seleccionando corresponsal, importe, divisa y concepto, para iniciar el proceso de pago. | Wizard de 3 pasos. Al finalizar, la liquidacion se crea en estado `draft`. Se muestra el estado del certificado del corresponsal en el paso 1. |
| P2 | Como pagador, quiero enviar una liquidacion borrador a aprobacion, para que un supervisor la revise. | Boton "Enviar a aprobacion" visible solo en estado `draft`. Cambia estado a `pending_approval`. |
| P3 | Como pagador, quiero solicitar el pago de una liquidacion aprobada, para que el departamento financiero la procese. | Boton "Solicitar pago" visible solo si estado = `approved` y existe certificado vigente. Crea solicitud de pago automaticamente. |
| P4 | Como pagador, quiero ver un dashboard con KPIs de liquidaciones y alertas de certificados, para tener una vision general del estado actual. | Dashboard muestra 4 KPIs + liquidaciones recientes + alertas de certificados vencidos/por vencer. |
| P5 | Como pagador, quiero registrar certificados de residencia fiscal de los corresponsales, para cumplir con requisitos legales. | Formulario con corresponsal, pais emisor, fechas y documento opcional. Status se calcula automaticamente. |
| P6 | Como pagador, quiero dar de alta nuevos corresponsales con sus datos fiscales, para poder crear liquidaciones a su nombre. | Formulario con nombre, pais, NIF, direccion, email, telefono. Se crea en estado `active`. |

### Supervisor

| ID | Historia | Criterio de aceptacion |
|----|----------|----------------------|
| S1 | Como supervisor, quiero aprobar o rechazar liquidaciones pendientes, para validar que los datos y montos son correctos. | Botones "Aprobar" y "Rechazar" visibles en estado `pending_approval`. Al aprobar, cambia a `approved`. Al rechazar, cambia a `rejected`. |
| S2 | Como supervisor, quiero ver la timeline completa de una liquidacion, para entender en que paso del flujo se encuentra. | Timeline visual de 5 pasos con estados coloreados y paso actual destacado. |
| S3 | Como supervisor, quiero recibir notificaciones cuando se envian liquidaciones a aprobacion, para actuar sin demora. | Notificacion en campana (header) y en pagina de notificaciones al crearse una `pending_approval`. |

### Financiero

| ID | Historia | Criterio de aceptacion |
|----|----------|----------------------|
| F1 | Como financiero, quiero ver la cola de pagos pendientes con estadisticas, para priorizar mi trabajo. | Pagina `/payments` con 4 KPIs (pendientes, en proceso, pagadas, rechazadas) y tabla de solicitudes. |
| F2 | Como financiero, quiero iniciar el proceso de una solicitud de pago, para indicar que la estoy gestionando. | Boton "Iniciar proceso" en estado `pending`. Cambia a `in_progress`. |
| F3 | Como financiero, quiero marcar una solicitud como pagada con notas de referencia bancaria, para cerrar el ciclo. | Dialog de confirmacion con campo de notas (numero de transferencia). Cambia estado a `paid`. Se notifica al corresponsal. |
| F4 | Como financiero, quiero rechazar una solicitud de pago indicando el motivo, para que se pueda corregir. | Dialog con campo obligatorio de motivo. Cambia estado a `rejected`. |

### Admin

| ID | Historia | Criterio de aceptacion |
|----|----------|----------------------|
| A1 | Como admin, quiero invitar a un corresponsal existente al portal, para que pueda gestionar sus facturas de forma autonoma. | Boton "Invitar al portal" en detalle del corresponsal. Introduce email. Edge Function crea usuario con rol `corresponsal` y envia email. |
| A2 | Como admin, quiero aprobar el auto-registro de un corresponsal, para activar su acceso al portal. | Corresponsal con estado `pending_approval` muestra boton "Aprobar". Edge Function activa el corresponsal y asigna rol. |
| A3 | Como admin, tengo acceso completo a todas las funcionalidades (pagador + supervisor + financiero), para poder gestionar cualquier situacion. | Acceso a todas las rutas internas incluidos pagos y configuracion. |

### Corresponsal (portal)

| ID | Historia | Criterio de aceptacion |
|----|----------|----------------------|
| C1 | Como corresponsal, quiero registrarme en el portal con los datos de mi despacho, para solicitar acceso. | Formulario en `/register`. Crea corresponsal + usuario. Estado `pending_approval`. Redirige a pantalla de espera. |
| C2 | Como corresponsal, quiero crear facturas (borradores) subiendo el PDF de la factura, para iniciar el proceso de cobro. | Formulario con concepto, importe, divisa, referencia y upload de PDF. Se crea liquidacion en estado `draft`. |
| C3 | Como corresponsal, quiero enviar mis facturas borrador a aprobacion, para que sean revisadas por el equipo interno. | Boton "Enviar a aprobacion" en detalle de factura (solo si estado = `draft`). |
| C4 | Como corresponsal, quiero ver el estado de procesamiento de mis facturas en una timeline visual, para saber en que punto esta cada una. | Timeline readonly de 5 pasos. Textos guia contextuales segun el estado actual. |
| C5 | Como corresponsal, quiero subir y gestionar mis certificados de residencia fiscal, para mantenerlos actualizados. | Pagina de certificados con estadisticas, lista de certificados y boton de subida. |
| C6 | Como corresponsal, quiero recibir alertas cuando mis certificados esten proximos a vencer, para renovarlos a tiempo. | Alerta en el dashboard del portal con conteo de certificados vencidos/por vencer y link a gestion. |
| C7 | Como corresponsal, quiero actualizar mis datos de contacto (direccion, email, telefono), para mantener mi informacion al dia. | Pagina de perfil con seccion editable. Los datos del despacho (nombre, pais, NIF) son readonly. |
| C8 | Como corresponsal, quiero ver un dashboard con KPIs de mis facturas y certificados, para tener una vision rapida de mi actividad. | 4 KPIs (borradores, en proceso, pagadas, certificados vigentes) + facturas recientes + alertas. |
| C9 | Como corresponsal, quiero recibir notificaciones cuando mis facturas cambien de estado, para estar informado del progreso. | Notificaciones vinculadas al corresponsal. Clic navega al detalle de factura en el portal. |

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

## UX Avanzada

### Busqueda global (Command Palette)

Atajo `Cmd+K` / `Ctrl+K` abre una paleta de busqueda global que permite buscar corresponsales, liquidaciones, certificados y pagos desde cualquier pantalla. Navegacion con flechas y Enter. Resultados agrupados por tipo con iconos y subtitulos.

### Exportacion CSV

Todas las tablas principales (liquidaciones, pagos, certificados, corresponsales) incluyen boton de exportacion CSV. El archivo generado:
- Incluye BOM para compatibilidad con Excel y acentos
- Escapa correctamente comillas y comas
- Headers en espanol con accessors formateados

### Toolbar estandarizado

Todas las tablas usan un `TableToolbar` compartido que integra: buscador con icono, filtro por estado (select), filtro por rango de fechas (2 date inputs), boton de exportar CSV y contador de registros.

### Componentes compartidos

| Componente | Uso |
|------------|-----|
| `SortButton` | Boton de ordenacion extraido y reutilizado en las 4 tablas principales |
| `EmptyState` | Estado vacio reutilizable con icono, titulo, descripcion y CTA opcional |
| `DateRangeFilter` | Filtro de rango de fechas con validacion (`to >= from`) |
| `TableToolbar` | Barra de herramientas completa para tablas |
| `Breadcrumbs` | Navegacion breadcrumb accesible (`aria-label`, `aria-current`) |
| `CommandPalette` | Paleta de busqueda global con `<dialog>` nativo |

### Realtime

Las tablas de liquidaciones y pagos se actualizan automaticamente via suscripciones Supabase Realtime (`postgres_changes`). Cualquier INSERT, UPDATE o DELETE en la base de datos se refleja instantaneamente sin recargar la pagina.

---

## Comandos

```bash
# Desarrollo
npm run dev

# Build (TypeScript + Vite)
npm run build

# Tests unitarios (120 tests)
npm test

# Tests unitarios con watch
npm run test:watch

# Tests unitarios con coverage
npm run test:coverage

# Tests E2E (146 tests, requiere .env.test en e2e/)
npx playwright test

# Tests E2E con UI interactiva
npx playwright test --ui

# Tests E2E - un spec concreto
npx playwright test e2e/auth/login.spec.ts

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
# Frontend (requerido)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# Backend (solo para deploy de Edge Functions y migraciones)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### Variables E2E (`e2e/.env.test`)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
TEST_ADMIN_EMAIL=admin@liquida360.demo
TEST_ADMIN_PASSWORD=Demo2026!
TEST_PAGADOR_EMAIL=pagador@liquida360.demo
TEST_PAGADOR_PASSWORD=Demo2026!
TEST_SUPERVISOR_EMAIL=supervisor@liquida360.demo
TEST_SUPERVISOR_PASSWORD=Demo2026!
TEST_FINANCIERO_EMAIL=financiero@liquida360.demo
TEST_FINANCIERO_PASSWORD=Demo2026!
TEST_CORRESPONSAL_EMAIL=corresponsal1@liquida360.demo
TEST_CORRESPONSAL_PASSWORD=Demo2026!
```

---

## Tests E2E (Playwright)

Suite completa de tests end-to-end con **146 tests en 26 specs**, usando Page Object Model pattern.

### Estructura

| Directorio | Tests | Cobertura |
|------------|-------|-----------|
| `e2e/auth/` | 4 specs | Login, logout, registro, acceso por roles |
| `e2e/certificates/` | 2 specs | CRUD, filtros por estado, vencimiento |
| `e2e/correspondents/` | 2 specs | CRUD, detalle con tabs |
| `e2e/cross-cutting/` | 5 specs | Accesibilidad (WCAG), breadcrumbs, command palette, CSV, notificaciones |
| `e2e/dashboard/` | 1 spec | KPIs, graficos, alertas |
| `e2e/liquidations/` | 3 specs | Wizard 3 pasos, detalle, workflow aprobacion |
| `e2e/payments/` | 2 specs | Cola de pagos, procesamiento |
| `e2e/portal/` | 4 specs | Dashboard, facturas, certificados, perfil del corresponsal |
| `e2e/settings/` | 1 spec | Panel de administracion |
| `e2e/workflows/` | 2 specs | Ciclo completo liquidacion, alertas certificados |

### Configuracion

- **Workers**: 3 en local, 1 en CI (evita rate-limiting de Supabase Auth)
- **Retries**: 0 en local, 2 en CI
- **Auth fixture**: Login con retry automatico (5 intentos, backoff exponencial) para manejar rate-limiting
- **Proyectos**: Desktop (Chromium), Mobile (Pixel 7)
- **CI**: GitHub Actions workflow (`.github/workflows/e2e.yml`)

---

## Base de datos

### Migraciones

| Archivo | Contenido |
|---------|-----------|
| `001_initial_schema.sql` | Enums, tablas (correspondents, certificates, liquidations, payment_requests, notifications), RLS, triggers |
| `002_helper_functions.sql` | `get_user_role()`, `handle_payment_request()`, notificacion automatica |
| `003_correspondent_portal.sql` | `user_id` en correspondents, `invoice_url` en liquidations, RLS para corresponsales, bucket `invoices` |
| `004_audit_and_cron.sql` | Audit log, cron jobs para certificados y notificaciones |
| `005_allow_self_registration.sql` | Permite auto-registro de corresponsales |
| `006_create_documents_bucket.sql` | Bucket `documents` para ficheros de certificados + RLS policies |

### Storage Buckets

| Bucket | Uso | Publico |
|--------|-----|---------|
| `documents` | Ficheros de certificados de residencia fiscal (PDF, JPG, PNG) | Si |
| `invoices` | Facturas PDF subidas por corresponsales | Si |

### Edge Functions

Todas las Edge Functions se despliegan con `--no-verify-jwt` porque Supabase Auth emite tokens ES256 que el gateway de Edge Functions no valida correctamente. Cada funcion implementa su propia verificacion de autenticacion internamente.

| Funcion | Trigger | Descripcion |
|---------|---------|-------------|
| `manage-users` | Admin UI | CRUD de usuarios internos (list, invite, update_role) |
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

# Deploy Edge Functions (--no-verify-jwt requerido por tokens ES256)
supabase functions deploy manage-users --no-verify-jwt
supabase functions deploy check-certificates --no-verify-jwt
supabase functions deploy generate-notifications --no-verify-jwt
supabase functions deploy invite-correspondent --no-verify-jwt
supabase functions deploy approve-correspondent --no-verify-jwt
```

---

## Metricas del proyecto

| Metrica | Valor |
|---------|-------|
| Archivos TS/TSX | 120+ |
| Feature modules | 9 |
| Componentes UI compartidos | 14 |
| Graficos dashboard (Recharts) | 3 |
| Unit tests (Vitest) | 120 |
| E2E tests (Playwright) | 146 (26 specs, 15 POMs) |
| Edge Functions | 5 |
| Migraciones SQL | 6 |
| Storage Buckets | 2 (documents, invoices) |
| Roles de usuario | 5 |
| Rutas totales | 17 |
| Suscripciones Realtime | 2 (liquidaciones, pagos) |
| Build time | ~2.2s |
