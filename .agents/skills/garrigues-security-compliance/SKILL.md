---
name: garrigues-security-compliance
description: Skill de cumplimiento de seguridad para prototipos y PoCs en el contexto Garrigues. Genera manifiesto de seguridad, analisis de GAP ISO 27001, clasificacion de datos, roadmap de migracion a Azure y documentacion para comites de seguridad. Usar al disenar cualquier demostrador o prueba de concepto que deba integrarse en el entorno corporativo Garrigues.
---

# Garrigues Security Compliance para Prototipos y PoCs

Skill para industrializar la integracion de aplicaciones prototipo en el contexto de seguridad corporativo de Garrigues. Genera automaticamente la documentacion de cumplimiento, analisis de GAP y plan de migracion al entorno Azure de Garrigues.

## Cuando usar esta skill

- Al iniciar el desarrollo de cualquier **demostrador, prototipo o PoC** para Garrigues
- Cuando se disenan **arquitecturas agiles** que usan servicios cloud no corporativos (Supabase, Firebase, Vercel, Netlify, etc.)
- Para generar el **manifiesto de seguridad** requerido por los comites de seguridad
- Al planificar la **migracion** de un prototipo validado al entorno Azure corporativo
- Cuando se necesita documentar el **analisis de GAP ISO 27001** de proveedores
- Para clasificar datos y evaluar si la arquitectura es viable para el nivel de sensibilidad

## Contexto corporativo Garrigues

### Certificaciones y normativa

| Marco | Estado | Detalle |
|:------|:-------|:--------|
| ISO/IEC 27001:2022 | Certificado | Certificado IS 685586 (BSI) |
| Esquema Nacional de Seguridad (ENS) | Cumple | Nivel Alto |
| RGPD / LOPD-GDD | Cumple | DPO designado |
| Microsoft Azure | Proveedor estrategico | ISO 27001, ENS Alto, SOC 2 |

### Principios del SGSI Garrigues

1. Cumplimiento normativo (RGPD/LOPD-GDD)
2. Gestion del riesgo
3. Concienciacion y formacion
4. Confidencialidad, integridad, disponibilidad, trazabilidad y autenticidad
5. Proporcionalidad
6. Responsabilidad
7. Mejora continua

### Entorno tecnologico corporativo

- **Cloud corporativo**: Microsoft Azure (Spain Central)
- **Identidad**: Microsoft Entra ID (Azure AD) con SSO y MFA
- **DMS**: iManage (NO interviene en apps de gestion interna)
- **Seguridad**: Microsoft Defender for Cloud, Azure Key Vault, Azure Policy
- **Monitorizacion**: Azure Monitor + Application Insights

## Proceso de compliance para prototipos

### Paso 1: Clasificacion de datos

Antes de disenar la arquitectura, clasificar los datos que manejara la aplicacion:

| Nivel | Descripcion | Ejemplos | Arquitectura permitida |
|:------|:------------|:---------|:----------------------|
| **Baja** | Datos publicos o internos no sensibles | Configuraciones, catalogos, datos de referencia | Cualquier proveedor con SOC 2 minimo |
| **Baja-Media** | Datos operativos internos con PII basica | Emails corporativos, NIF empresas, importes | Proveedor con SOC 2 + medidas compensatorias |
| **Media** | Datos confidenciales no criticos | Informacion comercial, contratos rutinarios | Proveedor ISO 27001 o Azure corporativo |
| **Alta** | Secreto profesional, datos de clientes | Comunicaciones abogado-cliente, estrategias legales | **Solo Azure corporativo o datacenter Garrigues** |
| **Muy Alta** | Datos especiales Art. 9 RGPD | Datos penales, salud, orientacion sexual | **Solo datacenter Garrigues con cifrado E2EE** |

**Regla de oro**: Si hay duda sobre el nivel, clasificar al nivel superior.

### Paso 2: Evaluacion de proveedores

Para cada proveedor cloud del prototipo, evaluar:

```
┌─────────────────────────────────────────────────────────┐
│  CHECKLIST DE EVALUACION DE PROVEEDOR CLOUD             │
├─────────────────────────────────────────────────────────┤
│  [ ] ISO 27001:2022 certificado                         │
│  [ ] SOC 2 Type II vigente                              │
│  [ ] ENS (si datos de AAPP)                             │
│  [ ] Cumplimiento RGPD declarado                        │
│  [ ] Region de datos en UE (preferible Spain Central)   │
│  [ ] DPA disponible                                     │
│  [ ] Jurisdiccion legal identificada                    │
│  [ ] Notificacion de brechas < 72h                      │
│  [ ] Derecho de auditoria                               │
│  [ ] Procedimiento de eliminacion de datos              │
│  [ ] Cifrado en transito (TLS 1.2+)                     │
│  [ ] Cifrado en reposo (AES-256)                        │
└─────────────────────────────────────────────────────────┘
```

### Paso 3: Generar manifiesto de seguridad

Todo prototipo/PoC DEBE incluir un manifiesto de seguridad en la aplicacion con:

1. **Resumen ejecutivo**: Que es, para que sirve, clasificacion de datos
2. **Arquitectura y proveedores**: Tabla comparativa de certificaciones
3. **Inventario de datos**: Que datos maneja, donde se almacenan, sensibilidad
4. **Controles implementados**: Autenticacion, autorizacion, auditoria, validacion
5. **Cumplimiento ISO 27001**: Evaluacion de controles Anexo A relevantes
6. **Matriz de riesgos**: Riesgos identificados con probabilidad, impacto, mitigacion
7. **Escenarios de decision**: Viable / Condicionado / No recomendado
8. **Roadmap de migracion**: Plan de evolucion hacia Azure corporativo

### Paso 4: Disenar con migracion en mente

Al disenar prototipos, aplicar estos principios para facilitar la futura migracion:

#### 4.1 Base de datos

- **USAR**: PostgreSQL estandar (compatible con Azure Database for PostgreSQL)
- **USAR**: Row-Level Security (RLS) para control de acceso a nivel de fila
- **USAR**: Triggers SQL para integridad de datos y auditoria
- **EVITAR**: Funciones propietarias del proveedor BaaS
- **EVITAR**: Dependencias en APIs auto-generadas que no sean replicables

```sql
-- PATRON RECOMENDADO: RLS con variables de sesion (portable)
-- Funciona tanto en Supabase como en Azure PostgreSQL

-- Funcion helper para obtener el usuario actual
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    -- Primero intenta Supabase Auth (prototipo)
    auth.uid(),
    -- Fallback a variable de sesion (Azure)
    current_setting('app.current_user_id', true)::uuid
  );
$$ LANGUAGE SQL STABLE;

-- Funcion helper para obtener el rol actual
CREATE OR REPLACE FUNCTION app.current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    -- Primero intenta Supabase JWT (prototipo)
    auth.jwt() -> 'app_metadata' ->> 'role',
    -- Fallback a variable de sesion (Azure)
    current_setting('app.current_user_role', true),
    -- Default: minimo privilegio
    'viewer'
  );
$$ LANGUAGE SQL STABLE;
```

#### 4.2 Autenticacion

- **USAR**: Abstraccion de autenticacion (no acoplar al proveedor)
- **USAR**: JWT con claims de rol en el token
- **USAR**: Roles basados en grupos (mapeables a Entra ID)
- **PREPARAR**: Estructura de roles compatible con grupos de seguridad Entra ID

```typescript
// PATRON RECOMENDADO: Abstraccion de auth (portable)
// auth-provider.ts

interface AuthProvider {
  signIn(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
  getSession(): Promise<Session | null>
  onAuthStateChange(callback: (session: Session | null) => void): () => void
  getUserRole(): string
}

// Implementacion actual (prototipo)
class SupabaseAuthProvider implements AuthProvider { ... }

// Implementacion futura (Azure)
class EntraIdAuthProvider implements AuthProvider { ... }
```

#### 4.3 API Backend

- **USAR**: Capa de servicio separada (no llamar a Supabase directamente desde componentes)
- **USAR**: TypeScript para funciones de backend (compatible con Azure Functions)
- **USAR**: Validacion con Zod (reutilizable en Azure Functions)
- **EVITAR**: Dependencia directa en PostgREST o APIs auto-generadas

```typescript
// PATRON RECOMENDADO: Capa de servicio abstraida
// services/liquidation-service.ts

interface LiquidationService {
  getAll(filters?: LiquidationFilters): Promise<Liquidation[]>
  getById(id: string): Promise<Liquidation>
  create(data: CreateLiquidationInput): Promise<Liquidation>
  updateStatus(id: string, status: LiquidationStatus): Promise<Liquidation>
}

// Implementacion actual (prototipo)
class SupabaseLiquidationService implements LiquidationService { ... }

// Implementacion futura (Azure)
class AzureLiquidationService implements LiquidationService { ... }
```

#### 4.4 Almacenamiento de ficheros

- **USAR**: Abstraccion de storage
- **USAR**: URLs firmadas con expiracion para descarga
- **EVITAR**: URLs publicas permanentes

#### 4.5 Frontend

- **USAR**: React + TypeScript (compatible con Azure Static Web Apps)
- **USAR**: Design System Garrigues (CSS tokens --g-*)
- **USAR**: Code splitting con lazy loading
- **INCLUIR**: Manifiesto de seguridad accesible en la aplicacion
- **INCLUIR**: Tests E2E con Playwright (independientes del backend)

### Paso 5: Documentar roadmap de migracion

Todo prototipo debe incluir un documento `docs/azure-migration-roadmap.md` con:

1. Mapeo componente a componente (actual → Azure)
2. Estimacion de esfuerzo por componente
3. Plan de fases con timeline
4. Lo que NO cambia (para dimensionar correctamente)
5. Componentes corporativos que NO intervienen (ej: iManage para apps de gestion)
6. Estimacion de costes Azure

## Arquitectura de referencia Azure para apps de gestion interna

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO GARRIGUES                         │
│                  (Navegador Web)                             │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              AZURE STATIC WEB APPS                          │
│         React SPA + Design System Garrigues                 │
│              (Spain Central)                                │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS + Bearer Token (Entra ID)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              AZURE FUNCTIONS                                │
│         API REST (TypeScript/Node.js)                       │
│    ┌─────────────────────────────────┐                      │
│    │ Middleware: Validar token Entra  │                      │
│    │ Middleware: SET session vars RLS │                      │
│    │ Middleware: Validacion Zod       │                      │
│    └──────────────┬──────────────────┘                      │
│              (Spain Central)                                │
└─────────────────────┬───────────┬───────────────────────────┘
                      │           │
          ┌───────────▼──┐  ┌────▼──────────────┐
          │ Azure DB for │  │ Azure Blob Storage │
          │ PostgreSQL   │  │ (Certificados PDF) │
          │ (RLS activo) │  │                    │
          │              │  │ (Spain Central)    │
          │ (Spain Centr)│  └────────────────────┘
          └──────────────┘
                      │
          ┌───────────▼──────────────────────────┐
          │         SERVICIOS AUXILIARES          │
          │  ┌──────────┐  ┌──────────────────┐  │
          │  │ Key Vault│  │ Azure SignalR     │  │
          │  │ (secretos│  │ (notificaciones)  │  │
          │  │          │  │                   │  │
          │  └──────────┘  └──────────────────┘  │
          └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              MICROSOFT ENTRA ID                             │
│         SSO + MFA + Grupos de seguridad                     │
│         (Infraestructura corporativa Garrigues)             │
└─────────────────────────────────────────────────────────────┘
```

## Controles ISO 27001 que todo prototipo debe implementar

### Minimos obligatorios (cualquier clasificacion de datos)

| Control | Requisito | Implementacion recomendada |
|:--------|:----------|:--------------------------|
| A.5.15 | Control de acceso | RBAC con roles definidos |
| A.5.17 | Autenticacion | JWT con expiracion, passwords hasheados |
| A.8.3 | Restriccion de acceso a datos | RLS o filtros equivalentes |
| A.8.5 | Autenticacion segura | No almacenar passwords en cliente |
| A.8.9 | Gestion de configuracion | Secretos en .env (gitignored), nunca en codigo |
| A.8.25 | Desarrollo seguro | TypeScript strict, validacion dual (client+server) |
| A.8.28 | Codificacion segura | Sin eval, sin innerHTML, parametros SQL escapados |

### Recomendados (sensibilidad media+)

| Control | Requisito | Implementacion recomendada |
|:--------|:----------|:--------------------------|
| A.5.33 | Auditoria | Audit log con trigger en tablas criticas |
| A.5.24 | Gestion de incidentes | Procedimiento documentado + DPA con proveedor |
| A.8.10 | Eliminacion de datos | Politica de retencion + procedimiento de purga |
| A.8.24 | Criptografia | TLS en transito + cifrado en reposo |
| A.8.29 | Testing de seguridad | Tests E2E + pentesting antes de produccion |

### Obligatorios antes de migrar a Azure (produccion)

| Control | Requisito | Implementacion en Azure |
|:--------|:----------|:------------------------|
| A.5.1 | Politica de seguridad | Heredar politica corporativa SGSI |
| A.5.7 | Threat intelligence | Microsoft Defender for Cloud |
| A.5.19 | Seguridad con proveedores | Azure: ISO 27001 + ENS (cumple) |
| A.8.12 | DLP | Microsoft Purview (si datos sensibles) |
| MFA | Autenticacion multifactor | Entra ID MFA corporativo |

## Checklist de entregables de compliance

Todo prototipo para Garrigues debe incluir estos entregables antes de presentar al comite:

```
[ ] Manifiesto de seguridad en la aplicacion (ruta /security accesible a todos los usuarios)
[ ] Clasificacion de datos documentada (nivel de sensibilidad por categoria)
[ ] Inventario de proveedores cloud con certificaciones
[ ] Analisis de GAP ISO 27001 (controles Anexo A relevantes)
[ ] Matriz de riesgos con mitigaciones
[ ] Escenarios de decision (viable/condicionado/no recomendado)
[ ] Roadmap de migracion a Azure (docs/azure-migration-roadmap.md)
[ ] Security review del codigo (sin eval, sin innerHTML, validacion dual)
[ ] Tests (minimo: unitarios + E2E para flujos criticos)
[ ] .env.example (sin secretos reales, solo placeholders)
[ ] .gitignore configurado (excluye .env, secrets, dist)
```

## Ejemplo de uso

```
Usuario: "Quiero crear un prototipo para gestionar reservas de salas de reunion"
Skill: → Clasificar datos como BAJA sensibilidad (horarios, nombres de salas, emails corporativos)
       → Arquitectura agil permitida (Supabase/Firebase/etc. con SOC 2)
       → Generar manifiesto de seguridad con controles minimos
       → Incluir roadmap de migracion a Azure si se valida el prototipo
       → No interviene iManage (app de gestion interna)

Usuario: "Quiero crear un prototipo para gestionar expedientes legales de clientes"
Skill: → Clasificar datos como ALTA sensibilidad (secreto profesional)
       → Arquitectura agil NO permitida para datos reales
       → Recomendar: usar datos sinteticos para el prototipo
       → Si se valida: migracion directa a Azure corporativo
       → Evaluar si interviene iManage para documentos del expediente
```
