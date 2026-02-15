# Plan de Correccion de Regresion E2E (Playwright)

Fecha: 2026-02-15

## Resultado de la regresion completa
- Estado: `PASSED`
- Fuente: `/Users/moisesmenendez/Dropbox/DESARROLLO/LIQUIDA360/test-results/.last-run.json`
- Suite inventariada: `273 tests` en `39` archivos (`npx playwright test --list`)

## Errores corregidos en esta ronda
- Textos de UI desactualizados en assertions (`Ingesta` -> `Subidas`, labels de columnas y estados vacios).
- Selectores fragiles de botones/exportacion ajustados para variaciones actuales de copy.
- Colisiones de strict mode en Playwright eliminadas usando `getByRole`/`exact` donde aplica.
- Selectores de campos de formulario alineados con ids actuales (`#intake-reference-number`).

## Archivos actualizados
- `/Users/moisesmenendez/Dropbox/DESARROLLO/LIQUIDA360/e2e/ginvoice/auth-access.spec.ts`
- `/Users/moisesmenendez/Dropbox/DESARROLLO/LIQUIDA360/e2e/ginvoice/intake.spec.ts`
- `/Users/moisesmenendez/Dropbox/DESARROLLO/LIQUIDA360/e2e/pages/ginv-accounting.page.ts`
- `/Users/moisesmenendez/Dropbox/DESARROLLO/LIQUIDA360/e2e/pages/ginv-intake.page.ts`
- `/Users/moisesmenendez/Dropbox/DESARROLLO/LIQUIDA360/e2e/pages/portal-certificates.page.ts`
- `/Users/moisesmenendez/Dropbox/DESARROLLO/LIQUIDA360/e2e/pages/portal-dashboard.page.ts`

## Plan de prevencion (siguiente iteracion)
1. Estandarizar selectores con `data-testid` en pantallas clave de G-Invoice y Portal.
2. Limitar assertions de copy a regex tolerantes cuando el texto comercial pueda variar.
3. Ejecutar smoke en cada PR y regresion completa en nightly.
4. Mantener pagina-objeto como unica capa de selectores para evitar drift en specs.
5. Revisar trimestralmente placeholders/labels de formularios y sincronizar POM.
