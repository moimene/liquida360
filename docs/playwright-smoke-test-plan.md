# Playwright Smoke Test Plan

## Objetivo
Validar rapidamente los flujos de mayor riesgo despues de cambios: autenticacion, dashboard principal y flujo operativo de liquidaciones.

## Alcance
- `e2e/auth/login.spec.ts`
- `e2e/dashboard/dashboard.spec.ts`
- `e2e/liquidations/liquidation-workflow.spec.ts`

## Entorno
- Navegador: `chromium`
- URL base: `http://127.0.0.1:4173` (desde `playwright.config.ts`)
- Configuracion de credenciales: `e2e/.env.test`

## Criterios de salida
- Smoke suite pasa al 100%.
- Si falla, clasificar fallo en:
  - datos/seed de pruebas
  - entorno (servicio externo, credenciales, red)
  - regresion funcional real

## Comando de ejecucion
```bash
npx playwright test --project=chromium e2e/auth/login.spec.ts e2e/dashboard/dashboard.spec.ts e2e/liquidations/liquidation-workflow.spec.ts
```

## Siguiente nivel (regresion completa)
```bash
npm run test:e2e
```
