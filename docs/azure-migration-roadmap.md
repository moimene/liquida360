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

### Estimacion de esfuerzo: escenarios comparados

Las estimaciones anteriores por fase asumen un **desarrollo tradicional** sin herramientas de asistencia IA. Con el ecosistema actual de herramientas de desarrollo AI-assisted, los tiempos se reducen significativamente.

| Fase | Tradicional (2-3 devs) | AI-assisted (1-2 devs) | Factor de aceleracion |
|:-----|:-----------------------|:-----------------------|:----------------------|
| F1: Infraestructura | 1-2 semanas | 3-5 dias | ~2x (IaC generado, plantillas ARM/Bicep) |
| F2: Datos y frontend | 2-3 semanas | 1-2 semanas | ~2x (migracion auth automatizable) |
| F3: API Backend | 6-8 semanas | 2-3 semanas | **~3x** (generacion CRUD altamente repetitiva) |
| F4: Validacion | 2-4 semanas | 1-2 semanas | ~2x (suite E2E existente, ajustes menores) |
| **TOTAL** | **3-4 meses / 2-3 devs** | **5-8 semanas / 1-2 devs** | **~2.5x** |

#### Herramientas de desarrollo AI-assisted aplicables

| Herramienta | Aplicacion en la migracion |
|:------------|:---------------------------|
| **Claude Code** | Generacion de Azure Functions CRUD a partir del esquema SQL y patrones existentes. Adaptacion de RLS policies. Refactorizacion de imports supabase-js → Azure SDK. |
| **Codex / GitHub Copilot** | Scaffolding de funciones, autocompletado de middleware auth, generacion de tests. |
| **Antigravity** | Orquestacion de tareas de migracion complejas, analisis de dependencias. |
| **Skill garrigues-security-compliance** | Generacion automatica de manifiesto, clasificacion de datos, patrones de codigo portable y roadmap de migracion para cada nuevo prototipo. |

**Por que la Fase 3 (API Backend) se acelera x3**: La generacion de Azure Functions CRUD es una tarea **altamente repetitiva y patron-driven**. Cada funcion sigue el mismo patron: validar token Entra ID → establecer contexto RLS → ejecutar query PostgreSQL → devolver respuesta. Un agente AI con el esquema SQL y un ejemplo de funcion completada puede generar las ~30 funciones restantes con supervision humana minima.

#### Referencia: marcos existentes en iobuilders

**iobuilders** (empresa participada por Garrigues) dispone de marcos de referencia para desarrollo AI-assisted que podrian aplicarse directamente a esta migracion y a futuras:

- Metodologias de pair-programming con AI ya validadas en proyectos reales
- Experiencia en migraciones de arquitecturas BaaS a infraestructura corporativa
- Frameworks de generacion de codigo con validacion automatizada
- Pipelines CI/CD con testing integrado adaptados a entornos regulados

Estos marcos permitirian no solo acelerar la migracion de LIQUIDA360, sino **establecer un patron replicable** para todas las futuras aplicaciones que sigan el flujo prototipo → produccion.

---

## 7. Industrializacion: del prototipo al flujo corporativo

La migracion de LIQUIDA360 no es un esfuerzo aislado. Establece un **marco de referencia reutilizable** que factoriza e industrializa el proceso para todas las futuras soluciones internas de Garrigues.

### 7.1 Flujo estandarizado de prototipado → produccion

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   FASE 1: PROTOTIPO AGIL (2-4 semanas)                                      │
│   ────────────────────────────────────                                       │
│   · Arquitectura agil (Supabase/Firebase/Vercel)                             │
│   · Desarrollo AI-assisted (Claude Code + skills)                            │
│   · Skill garrigues-security-compliance activada desde el dia 1              │
│   · Manifiesto de seguridad generado automaticamente                         │
│   · Patrones de codigo portables (abstracciones de auth, servicios, RLS)     │
│                                                                              │
│                              ▼                                               │
│                                                                              │
│   FASE 2: VALIDACION CON USUARIOS (2-4 semanas)                             │
│   ──────────────────────────────────────────────                             │
│   · Pruebas con usuarios reales en entorno de demostracion                   │
│   · Recogida de feedback y ajustes funcionales                               │
│   · Security review y evaluacion de GAPs                                     │
│   · Decision: ¿Se confirma la utilidad?                                      │
│                                                                              │
│                     ▼ SI                         ▼ NO                        │
│                                                                              │
│   FASE 3: DECISION DEL COMITE                   Fin: lecciones aprendidas   │
│   ────────────────────────────                   documentadas               │
│   · Manifiesto presentado al Comite de Seguridad                             │
│   · Evaluacion de clasificacion de datos                                     │
│   · Aprobacion de migracion a Azure                                          │
│                                                                              │
│                              ▼                                               │
│                                                                              │
│   FASE 4: MIGRACION A AZURE (5-8 semanas con AI-assisted)                   │
│   ────────────────────────────────────────────────────────                   │
│   · Reutilizar arquitectura de referencia Azure documentada                  │
│   · Azure Functions generadas con AI a partir de esquema SQL                 │
│   · Entra ID (SSO + MFA ya existente)                                        │
│   · Suite de tests existente como red de seguridad                           │
│   · Pentesting + auditoria IT Garrigues                                      │
│                                                                              │
│                              ▼                                               │
│                                                                              │
│   FASE 5: PRODUCCION                                                         │
│   ──────────────────                                                         │
│   · Azure Spain Central (ISO 27001 + ENS Alto)                               │
│   · Integrado en SGSI Garrigues                                              │
│   · Monitorizacion via Azure Monitor / Defender                              │
│   · Mantenimiento con AI-assisted dev                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Activos reutilizables generados por LIQUIDA360

| Activo | Descripcion | Reutilizable en |
|:-------|:------------|:----------------|
| **Skill garrigues-security-compliance** | Genera automaticamente manifiesto, clasificacion de datos, evaluacion ISO 27001 y roadmap de migracion | Todo futuro prototipo |
| **Arquitectura de referencia Azure** | Static Web Apps + Functions + PostgreSQL + Entra ID, documentada con diagramas y codigo | Toda app de gestion interna |
| **Patrones de codigo portable** | Abstracciones de auth, servicios y RLS con fallback Supabase/Azure | Cualquier BaaS → Azure |
| **Plantillas de Azure Functions** | Middleware auth Entra ID, contexto RLS, patron CRUD | Toda API REST en Azure |
| **Pipeline CI/CD** | GitHub Actions con build, test, deploy a Azure Static Web Apps | Todo proyecto React |
| **Security review template** | Checklist de seguridad, evaluacion de controles, matriz de riesgos | Toda aplicacion |
| **Suite de tests E2E** | Patrones Playwright para flujos de negocio (independientes del backend) | Todo proyecto web |

### 7.3 Economia de la industrializacion

| Concepto | Primera migracion (LIQUIDA360) | Futuras migraciones |
|:---------|:-------------------------------|:--------------------|
| Arquitectura de referencia | Se crea | Se reutiliza |
| Skill de compliance | Se crea | Se reutiliza |
| Plantillas Azure Functions | Se crea | Se reutiliza (~60% del codigo) |
| Configuracion Entra ID | Se configura | Se replica (nuevo App Registration) |
| Pipeline CI/CD | Se crea | Se replica con minimos ajustes |
| **Esfuerzo estimado (AI-assisted)** | **5-8 semanas** | **3-5 semanas** |
| **Equipo necesario** | **1-2 devs** | **1 dev** |

**Conclusion**: Cada migracion posterior sera mas rapida y economica. El framework de migracion se amortiza desde la segunda aplicacion.

---

## 8. Matriz de riesgos de la migracion

| Riesgo | Probabilidad | Impacto | Mitigacion |
|:-------|:-------------|:--------|:-----------|
| Incompatibilidad PostgreSQL al migrar | Muy baja | Medio | Ambos usan PostgreSQL estandar. Verificar version. |
| Regresiones en API al reescribir | Media | Alto | Suite E2E de 146 tests como red de seguridad. |
| Perdida de datos en migracion | Muy baja | Muy alto | Doble backup antes de migrar. Periodo paralelo. |
| Retraso en desarrollo de Azure Functions | Media | Medio | Priorizacion por flujo critico (liquidations primero). |
| Resistencia de usuarios al cambio de login | Baja | Bajo | SSO mejora la experiencia (menos passwords). |

---

## 9. Estimacion de costes Azure (orientativa)

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

## 10. Conclusion

La migracion a Azure es **tecnicamente viable** y **estrategicamente recomendable**:

1. **El 70% del codigo se conserva intacto** (frontend, SQL, tests, design system)
2. **El esfuerzo principal** esta en la capa de API (Azure Functions) y adaptacion de RLS
3. **Con herramientas AI-assisted** (Claude Code, Codex, Antigravity) y la skill de compliance, el esfuerzo se reduce de 3-4 meses a **5-8 semanas con 1-2 desarrolladores**
4. **iobuilders** (empresa participada por Garrigues) dispone de marcos de referencia aplicables directamente
5. **Los beneficios superan la inversion**: cumplimiento pleno ISO 27001, ENS, soberania de datos, SSO corporativo
6. **iManage no interviene**: la aplicacion gestiona datos operativos, no documentos del DMS
7. **La suite de tests existente** (266 tests) garantiza la calidad durante la migracion
8. **La inversion se factoriza**: cada migracion posterior sera mas rapida (~3-5 semanas, 1 dev) al reutilizar los activos generados

**Vision estrategica**: LIQUIDA360 establece el **flujo estandarizado de prototipado → produccion** para Garrigues: prototipar rapido con arquitecturas agiles (2-4 semanas), validar con usuarios, y migrar a Azure corporativo con herramientas AI-assisted cuando se confirme la utilidad. Este flujo, una vez establecido, es replicable para todas las futuras soluciones internas del despacho.
