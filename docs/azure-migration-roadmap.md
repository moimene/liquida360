# Plan de Migracion a Microsoft Azure - LIQUIDA360

> **Documento de referencia para el Comite de Seguridad de Garrigues**
> Version: 1.0 | Fecha: 2026-02-08 | Clasificacion: Interno

---

## 1. Contexto estrategico

Garrigues opera su infraestructura corporativa sobre **Microsoft Azure**, con certificaciones ISO 27001 y ENS de nivel Alto. La migracion de LIQUIDA360 desde la arquitectura actual (Supabase + Vercel) al entorno Azure corporativo es la evolucion natural para alcanzar conformidad plena con el SGSI.

**Nota importante:** El DMS corporativo basado en **iManage** no interviene en este tipo de aplicaciones de gestion interna. LIQUIDA360 gestiona datos operativos (liquidaciones, certificados fiscales, corresponsales) y no genera ni consume documentos del repositorio documental del despacho.

---

## 2. Mapeo de componentes: Arquitectura actual → Azure

| Componente | Actual (Supabase/Vercel) | Destino (Microsoft Azure) | Esfuerzo |
|:-----------|:-------------------------|:--------------------------|:---------|
| **Frontend Hosting** | Vercel (Edge Network) | **Azure Static Web Apps** | Bajo |
| **Base de Datos** | Supabase PostgreSQL (gestionado) | **Azure Database for PostgreSQL Flexible Server** | Bajo |
| **Autenticacion** | Supabase Auth (GoTrue, JWT) | **Microsoft Entra ID (Azure AD)** con SSO corporativo | Medio |
| **API Backend** | PostgREST (API autogenerada) | **Azure Functions** (API REST TypeScript) | Alto |
| **Almacenamiento** | Supabase Storage (S3) | **Azure Blob Storage** | Medio |
| **Notificaciones Realtime** | Supabase Realtime (WebSockets) | **Azure SignalR Service** | Medio |
| **Logica de BD** | Triggers + funciones PostgreSQL | Triggers + funciones PostgreSQL (sin cambios) | Ninguno |
| **Seguridad de BD** | Row-Level Security (RLS) | RLS con adaptacion a contexto Entra ID | Alto |
| **Gestion de secretos** | .env + Supabase Dashboard | **Azure Key Vault** | Bajo |
| **Monitorizacion** | Supabase Dashboard | **Azure Monitor + Application Insights** | Medio |
| **CI/CD** | GitHub Actions → Vercel | GitHub Actions → **Azure Static Web Apps** | Bajo |
| **Cron Jobs** | pg_cron (Supabase) | **Azure Functions Timer Trigger** | Bajo |

---

## 3. Beneficios de la migracion

### 3.1 Cumplimiento normativo

| Aspecto | Situacion actual | Tras migracion a Azure |
|:--------|:-----------------|:-----------------------|
| ISO 27001 backend | No (Supabase sin certificar) | **Si** (Azure certificado) |
| ENS | No aplica | **ENS nivel Alto** |
| Soberania de datos | EE.UU. (AWS, Cloud Act) | **Spain Central** (UE) |
| RGPD transferencias | Requiere SCC/DPF | **Sin transferencias internacionales** |
| SSO corporativo | No (email/password independiente) | **Entra ID con SSO Garrigues** |
| Gestion centralizada de secretos | .env en repositorio | **Azure Key Vault** |

### 3.2 Beneficios operativos

- **Consolidacion de proveedor**: Todo bajo el paraguas Azure de Garrigues
- **Identidad centralizada**: Los usuarios se autentican con sus credenciales corporativas
- **Monitorizacion unificada**: Application Insights integrado con el SOC de Garrigues
- **Escalabilidad enterprise**: SLAs de grado corporativo
- **Seguridad integrada**: Microsoft Defender for Cloud, Azure Policy, Azure Firewall

---

## 4. Analisis detallado por componente

### 4.1 Base de datos (Esfuerzo: BAJO)

**Tarea**: Migrar PostgreSQL de Supabase a Azure Database for PostgreSQL Flexible Server.

**Por que es facil**:
- Ambas plataformas usan PostgreSQL estandar
- Migracion via `pg_dump` / `pg_restore`
- Triggers, funciones, enums, constraints: **sin cambios**
- RLS policies: **sin cambios en la sintaxis SQL**
- Indexes: **sin cambios**

**Configuracion recomendada en Azure**:
- Region: **Spain Central** (soberania de datos)
- Tier: General Purpose (2-4 vCores para demostrador)
- Backup: Automatico con retencion de 35 dias
- SSL: Obligatorio
- Firewall: Solo IPs de Azure Static Web Apps y Azure Functions

```
Esquema actual (6 migraciones, 713 LOC SQL) → Transferencia directa
```

### 4.2 Frontend (Esfuerzo: BAJO)

**Tarea**: Migrar React SPA de Vercel a Azure Static Web Apps.

**Cambios necesarios**:
1. Crear recurso Azure Static Web Apps
2. Configurar GitHub Actions para despliegue automatico (reemplaza Vercel CI/CD)
3. Actualizar variables de entorno en Azure (ya no apuntan a Supabase)
4. Actualizar `vercel.json` → configuracion equivalente en `staticwebapp.config.json`

**Lo que NO cambia**:
- Codigo React/TypeScript (todo el frontend)
- Tailwind CSS, shadcn/ui, Design System Garrigues
- Code splitting, lazy loading
- Tests E2E y unitarios

### 4.3 Autenticacion (Esfuerzo: MEDIO)

**Tarea**: Reemplazar Supabase Auth por Microsoft Entra ID.

**Cambios clave**:

| Concepto | Actual (Supabase Auth) | Destino (Entra ID) |
|:---------|:-----------------------|:--------------------|
| Libreria frontend | `@supabase/supabase-js` | `@azure/msal-react` + `@azure/msal-browser` |
| Flujo de login | Email/password via GoTrue | OAuth 2.0 / OpenID Connect via Entra ID |
| Token | JWT con `app_metadata.role` | JWT con claims de grupos de seguridad |
| Roles | `app_metadata.role` en JWT | Grupos de seguridad Entra ID mapeados a roles |
| SSO | No disponible | **SSO corporativo Garrigues** |
| MFA | No implementado | **MFA corporativo (ya existente en Garrigues)** |

**Mapeo de roles a grupos Entra ID**:

```
Grupo Entra ID                    → Rol aplicacion
────────────────────────────────    ──────────────
SG-LIQUIDA360-Pagadores           → pagador
SG-LIQUIDA360-Supervisores        → supervisor
SG-LIQUIDA360-Financiero          → financiero
SG-LIQUIDA360-Admins              → admin
SG-LIQUIDA360-Corresponsales      → corresponsal
```

**Ventaja critica**: MFA, politicas de acceso condicional y gestion de identidades quedan cubiertas automaticamente por la infraestructura existente de Garrigues.

### 4.4 API Backend (Esfuerzo: ALTO)

**Tarea**: Reemplazar PostgREST (API autogenerada) por Azure Functions.

**Por que es el mayor esfuerzo**: Supabase genera automaticamente endpoints REST para cada tabla. En Azure, cada endpoint debe construirse explicitamente.

**Azure Functions necesarias**:

```
functions/
├── correspondents/
│   ├── get-correspondents.ts        # GET /api/correspondents
│   ├── get-correspondent.ts         # GET /api/correspondents/:id
│   ├── create-correspondent.ts      # POST /api/correspondents
│   ├── update-correspondent.ts      # PATCH /api/correspondents/:id
│   └── delete-correspondent.ts      # DELETE /api/correspondents/:id
├── certificates/
│   ├── get-certificates.ts
│   ├── create-certificate.ts
│   ├── update-certificate.ts
│   └── check-certificates.ts        # Timer trigger (reemplaza pg_cron)
├── liquidations/
│   ├── get-liquidations.ts
│   ├── get-liquidation.ts
│   ├── create-liquidation.ts
│   └── update-liquidation-status.ts
├── payments/
│   ├── get-payment-requests.ts
│   ├── create-payment-request.ts
│   └── process-payment.ts
├── notifications/
│   ├── get-notifications.ts
│   ├── mark-read.ts
│   └── generate-notifications.ts    # Timer trigger
├── users/
│   └── manage-users.ts              # Admin CRUD
└── shared/
    ├── db.ts                        # Pool de conexion PostgreSQL
    ├── auth-middleware.ts            # Validacion token Entra ID
    └── rls-context.ts               # SET session vars para RLS
```

**Estimacion**: ~25-30 Azure Functions, 4-6 semanas de desarrollo.

### 4.5 Row-Level Security adaptada (Esfuerzo: ALTO)

**Tarea**: Adaptar RLS para funcionar con identidad Entra ID en lugar de Supabase Auth.

**Mecanismo propuesto**:

1. Azure Function recibe peticion con token Entra ID
2. Valida token y extrae `user_id` y `roles` (grupos de seguridad)
3. Establece variables de sesion PostgreSQL:
   ```sql
   SET app.current_user_id = 'uuid-del-usuario';
   SET app.current_user_role = 'pagador';
   ```
4. Las politicas RLS leen estas variables en lugar de `auth.uid()` / `auth.jwt()`

**Cambio en politicas RLS** (ejemplo):

```sql
-- ANTES (Supabase)
CREATE POLICY "Users can view own liquidations"
  ON public.liquidations FOR SELECT
  USING (
    created_by = auth.uid()
    OR public.get_user_role() IN ('supervisor', 'admin')
  );

-- DESPUES (Azure)
CREATE POLICY "Users can view own liquidations"
  ON public.liquidations FOR SELECT
  USING (
    created_by = current_setting('app.current_user_id')::uuid
    OR current_setting('app.current_user_role') IN ('supervisor', 'admin')
  );
```

**Lo que se conserva intacto**:
- Logica de las politicas RLS (que rol ve que datos)
- Status transition triggers
- Audit log triggers
- Todas las constraints y checks de integridad

### 4.6 Almacenamiento (Esfuerzo: MEDIO)

**Tarea**: Migrar Supabase Storage a Azure Blob Storage.

**Cambios**:
- Crear container `certificates` en Blob Storage
- Migrar ficheros existentes (certificados PDF, justificantes)
- Reemplazar llamadas `supabase.storage.from('documents')` por SDK de Azure Blob
- Generar URLs temporales con SAS tokens (equivalente a signed URLs de Supabase)

---

## 5. Componentes que NO requieren migracion

| Componente | Motivo |
|:-----------|:-------|
| **iManage (DMS)** | No interviene. LIQUIDA360 no genera ni consume documentos del repositorio documental. |
| **Logica de negocio SQL** | Triggers, funciones, enums, constraints se transfieren directamente a Azure PostgreSQL. |
| **Esquema de base de datos** | PostgreSQL estandar, compatible 1:1. |
| **Tests E2E** | Playwright tests se ejecutan contra cualquier URL (Vercel o Azure). |
| **Tests unitarios** | Vitest no depende de la infraestructura. |
| **Design System** | CSS tokens, componentes shadcn/ui, Tailwind: 100% frontend, sin dependencia de backend. |

---

## 6. Plan de migracion por fases

### Fase 1: Infraestructura base (1-2 semanas)

- [ ] Crear Resource Group `rg-liquida360-prod` en Spain Central
- [ ] Provisionar Azure Database for PostgreSQL Flexible Server
- [ ] Crear Azure Static Web Apps (conectado a GitHub)
- [ ] Registrar aplicacion en Entra ID
- [ ] Crear grupos de seguridad para roles
- [ ] Provisionar Azure Blob Storage (container `certificates`)
- [ ] Crear Azure Key Vault y almacenar secretos
- [ ] Configurar Azure SignalR Service

### Fase 2: Datos y frontend (2-3 semanas)

- [ ] Exportar base de datos de Supabase (`pg_dump`)
- [ ] Importar en Azure PostgreSQL (`pg_restore`)
- [ ] Verificar integridad: triggers, funciones, RLS, indexes
- [ ] Migrar ficheros de Supabase Storage a Blob Storage
- [ ] Configurar CI/CD de Static Web Apps via GitHub Actions
- [ ] Implementar autenticacion MSAL en frontend (reemplazar supabase-js auth)
- [ ] Probar flujo de login con Entra ID

### Fase 3: API Backend (6-8 semanas)

- [ ] Crear proyecto Azure Functions (TypeScript, Node.js runtime)
- [ ] Implementar middleware de autenticacion (validacion token Entra ID)
- [ ] Implementar helper de contexto RLS (SET session vars)
- [ ] Desarrollar funciones CRUD: correspondents, certificates, liquidations, payments
- [ ] Desarrollar funciones de workflow: status transitions, approval
- [ ] Desarrollar timer triggers: check-certificates, generate-notifications
- [ ] Adaptar politicas RLS para leer variables de sesion
- [ ] Refactorizar frontend: reemplazar supabase client por fetch a Azure Functions
- [ ] Migrar almacenamiento: reemplazar supabase.storage por Azure Blob SDK

### Fase 4: Validacion y produccion (2-4 semanas)

- [ ] Ejecutar suite E2E completa (146 tests) contra entorno Azure
- [ ] Ejecutar suite unitaria (120 tests)
- [ ] Pentesting por tercero independiente
- [ ] Revision de seguridad por equipo de IT Garrigues
- [ ] Documentar arquitectura final para SGSI
- [ ] Cutover: redirigir DNS, desactivar Supabase/Vercel
- [ ] Periodo de validacion en paralelo (2 semanas)

**Estimacion total: 3-4 meses** con equipo de 2-3 desarrolladores.

---

## 7. Matriz de riesgos de la migracion

| Riesgo | Probabilidad | Impacto | Mitigacion |
|:-------|:-------------|:--------|:-----------|
| Incompatibilidad PostgreSQL al migrar | Muy baja | Medio | Ambos usan PostgreSQL estandar. Verificar version. |
| Regresiones en API al reescribir | Media | Alto | Suite E2E de 146 tests como red de seguridad. |
| Perdida de datos en migracion | Muy baja | Muy alto | Doble backup antes de migrar. Periodo paralelo. |
| Retraso en desarrollo de Azure Functions | Media | Medio | Priorizacion por flujo critico (liquidations primero). |
| Resistencia de usuarios al cambio de login | Baja | Bajo | SSO mejora la experiencia (menos passwords). |

---

## 8. Estimacion de costes Azure (orientativa)

| Servicio | Tier recomendado | Coste mensual estimado |
|:---------|:-----------------|:----------------------|
| Azure Database for PostgreSQL | General Purpose, 2 vCores | ~80-120 EUR |
| Azure Static Web Apps | Standard | ~8 EUR |
| Azure Functions | Consumption plan | ~5-20 EUR (segun uso) |
| Azure Blob Storage | Hot tier, < 10 GB | ~1-2 EUR |
| Azure SignalR Service | Free tier (20 conexiones) | 0 EUR |
| Azure Key Vault | Standard | ~1 EUR |
| Azure Monitor | Basic | ~5-10 EUR |
| **Total estimado** | | **~100-160 EUR/mes** |

*Nota: Costes orientativos para uso como demostrador/piloto interno. En produccion con mas usuarios, escalar segun demanda.*

---

## 9. Conclusion

La migracion a Azure es **tecnicamente viable** y **estrategicamente recomendable**:

1. **El 70% del codigo se conserva intacto** (frontend, SQL, tests, design system)
2. **El esfuerzo principal** esta en la capa de API (Azure Functions) y adaptacion de RLS
3. **Los beneficios superan la inversion**: cumplimiento pleno ISO 27001, ENS, soberania de datos, SSO corporativo
4. **iManage no interviene**: la aplicacion gestiona datos operativos, no documentos del DMS
5. **La suite de tests existente** (266 tests) garantiza la calidad durante la migracion

La decision de migrar deberia tomarse una vez confirmada la utilidad de LIQUIDA360 como herramienta de gestion interna, siguiendo el roadmap del Manifiesto de Seguridad (Fase 3).
