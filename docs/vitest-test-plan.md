# Plan de Testing Unitario/Integracion (Vitest)

## Objetivo
Ejecutar rapido la bateria de pruebas unitarias/integracion en `src/__tests__` para validar utilidades, schemas y componentes basados en React.

## Entorno
- Runner: `vitest@4.0.18` (script `npm test`)
- Environment: `jsdom`
- Setup: `src/__tests__/setup.ts` (carga `@testing-library/jest-dom`)
- Alias: `@` -> `./src` (segun `vitest.config.ts`)

## Alcance
- Patrón de inclusión: `src/**/*.{test,spec}.{ts,tsx}`
- Carpetas cubiertas: `src/__tests__` (utilidades, schemas, componentes ligeros)

## Comandos
- Full run: `npm test`
- Watch interactivo: `npm run test:watch`
- Cobertura: `npm run test:coverage` (reporter `text` y `lcov`, incluye `src/lib/**` y `src/features/**/schemas/**`)

## Criterios de salida
- 100% de archivos de test incluidos pasan.
- Cobertura `lcov` generada sin errores cuando se usa `--coverage`.

## Últimas ejecuciones (2026-02-15)
- Unit/IT: `npm test` → 17/17 archivos, 158/158 tests passed, duración ~1.85s.
- Cobertura: `npm run test:coverage` → mismo pase, cobertura v8 generada en `coverage/lcov.info` y `coverage/lcov-report/` (stmt 66.66%, branch 61.79%).
