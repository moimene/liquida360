# Plan de Evolucion UI/Operacion - Liquida360 y G-Invoice

Fecha: 14/02/2026
Fuente: comentarios de usuarios en `G Invoice comentarios.pdf`

## Objetivo
Convertir feedback funcional en una hoja de ruta ejecutable, priorizando:
- claridad de estados y nomenclatura,
- reduccion de friccion operativa en subidas/facturacion,
- preparacion de integraciones SAP y circuito CxC.

## Estado de Ejecucion

### Fase 0 - Definicion (cerrada)
- [x] Inventario de cambios por dominio (Liquida360 y G-Invoice).
- [x] Priorizacion por impacto operativo y dependencias tecnicas.
- [x] Backlog base para quick wins + mejoras estructurales.

### Fase 1 - Quick Wins UI/UX (en curso)
- [x] Renombre de menu y vistas G-Invoice: `Ingesta` -> `Subidas`.
- [x] Ajuste de etiquetas en flujo de liquidaciones portal: `Aceptada`, `Fecha de pago`.
- [x] Mensajeria portal orientada a contacto directo con BPO.
- [x] Alertas de certificados endurecidas a umbral de 120 dias con visual roja.
- [x] Seccion de certificados en portal por tipo:
  - certificado de residencia,
  - certificado de retenciones,
  - certificado cuenta bancaria.
- [x] Perfil portal con datos bancarios y regla de certificado obligatorio al cambiar cuenta.

### Fase 2 - Base operativa G-Invoice (parcial)
- [x] Campos de dominio para tasas oficiales:
  - `nrc_number`,
  - `official_organism`,
  - `tariff_type`,
  - `exchange_rate_to_eur`,
  - `amount_eur`.
- [x] UI de subidas/contabilizacion/facturacion preparada para NRC + organismo + tipo de tarifa.
- [x] Ordenacion avanzada multi-criterio en tablas de Subidas y Para Facturar.
- [x] Export Excel (XLSX real) en Subidas, Contabilizacion y Para Facturar.
- [x] Columnas completas Job/cliente/pais en Subidas, Contabilizacion y Para Facturar.

### Fase 3 - Facturacion avanzada e integraciones (cerrada)
- [x] Flujo operativo `Aprobado -> Contabilizado -> Facturado -> Archivado` con sincronizacion de estados de intake al emitir y entregar factura.
- [x] Deep-link operativo a SAP desde contabilizacion y facturas emitidas (plantilla configurable).
- [x] Anexado automatico de justificante de tasa en factura SAP.
- [x] Conversion de moneda visible y auditable en pipeline de facturacion.

### Fase 4 - CxC y recobro (cerrada)
- [x] Vista de facturas vencidas y pendientes de cobro.
- [x] Exportes CxC sin duplicidad de importes.
- [x] Envio semiautomatico de reclamaciones con aprobacion previa y copia a responsables.

## Cambios Tecnicos Introducidos en esta iteracion

### Migracion
- `supabase/migrations/011_portal_ginvoice_evolution.sql`
  - tipos de certificado en `certificates`,
  - datos bancarios en `correspondents`,
  - ampliacion de `ginv_jobs` y `ginv_intake_items` para tasas/subidas.
- `supabase/migrations/012_ginv_billing_lifecycle_rls.sql`
  - habilita update de ciclo de facturacion sobre `ginv_intake_items` para rol `ginv_bpo_facturacion`.
- `supabase/migrations/013_ginv_sap_payload_and_fx_guardrails.sql`
  - agrega `sap_payload` en facturas cliente para adjuntos automáticos + snapshot FX,
  - sanea y refuerza validaciones de conversion `exchange_rate_to_eur` / `amount_eur`.
- `supabase/migrations/014_ginv_accounts_receivable_baseline.sql`
  - agrega baseline CxC en `ginv_client_invoices` (`collection_status`, `due_date`, importes y fecha de cobro),
  - backfill de vencimiento y saldo desde datos SAP.
- `supabase/migrations/015_ginv_collections_claims.sql`
  - crea flujo de reclamaciones CxC (`pending_approval -> approved/rejected -> sent`) con trazabilidad y RLS.
- `supabase/migrations/016_ginv_collection_claims_hardening.sql`
  - refuerza separacion de funciones en reclamaciones CxC:
    - BPO solo gestiona borrador/envio,
    - Socio solo aprueba/rechaza,
    - trigger en BD bloquea transiciones fuera de flujo.

### Frontend/Modelo
- Tipado de base de datos actualizado en `src/types/database.ts`.
- Portal:
  - `src/features/portal/components/portal-certificates-page.tsx`
  - `src/features/portal/components/portal-profile-page.tsx`
  - `src/features/portal/components/portal-messages-page.tsx`
  - `src/features/portal/hooks/use-portal-certificates.ts`
  - `src/features/portal/hooks/use-portal-correspondent.ts`
- G-Invoice:
  - `src/components/layout/ginvoice-sidebar.tsx`
  - `src/features/ginvoice/components/intake-page.tsx`
  - `src/features/ginvoice/components/intake-form.tsx`
  - `src/features/ginvoice/components/accounting-page.tsx`
  - `src/features/ginvoice/components/billing-page.tsx`
  - `src/features/ginvoice/components/invoices-page.tsx`
  - `src/features/ginvoice/components/collections-page.tsx`
  - `src/features/ginvoice/components/delivery-page.tsx`
  - `src/features/ginvoice/components/settings-page.tsx`
  - `src/features/ginvoice/constants/ginvoice-utils.ts`
  - `src/features/ginvoice/hooks/use-ginv-intake.ts`
  - `src/features/ginvoice/hooks/use-ginv-accounting.ts`
  - `src/features/ginvoice/hooks/use-ginv-invoices.ts`
  - `src/features/ginvoice/hooks/use-ginv-collections.ts`
  - `src/features/ginvoice/hooks/use-ginv-deliveries.ts`
  - `src/features/ginvoice/lib/intake-lifecycle.ts`
  - `src/features/ginvoice/lib/fx-audit.ts`
  - `src/features/ginvoice/lib/collections.ts`
  - `src/features/ginvoice/lib/sap-links.ts`
  - `src/lib/xlsx-export.ts`

## Riesgos y Dependencias Abiertas
- Integracion SAP real (hoy solo base funcional/local).
- CxC requiere modelo de vencimientos y estados de recobro en datos de factura cliente.
- Export a Excel necesita libreria dedicada (ej. `xlsx`) y definicion de layout/plantilla.
- Para activar funcionalidades de evolucion G-Invoice en runtime es necesario ejecutar migraciones 011, 012, 013, 014, 015 y 016 en entorno Supabase.
