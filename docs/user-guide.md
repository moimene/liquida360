# LIQUIDA360 - Guia de Usuario

## Introduccion

LIQUIDA360 es una plataforma de liquidacion de pagos a corresponsales para despachos de abogados. Permite gestionar corresponsales, certificados de residencia fiscal, liquidaciones de pago y solicitudes al departamento financiero.

---

## Roles de Usuario

| Rol | Descripcion |
|-----|------------|
| **Pagador** | Crea y gestiona liquidaciones de pago |
| **Supervisor** | Aprueba o rechaza liquidaciones |
| **Financiero** | Procesa solicitudes de pago |
| **Admin** | Acceso completo a toda la plataforma |

---

## Modulos

### 1. Dashboard

La pagina principal muestra:
- **KPIs**: Liquidaciones pendientes, certificados vigentes, alertas de vencimiento, pagos en cola
- **Liquidaciones recientes**: Las ultimas liquidaciones con su estado
- **Alertas de certificados**: Certificados vencidos o proximos a vencer

> Los KPIs se adaptan segun el rol del usuario.

---

### 2. Corresponsales

**Ruta**: `/correspondents`

Gestion completa de corresponsales (despachos asociados en otros paises).

#### Listado
- Tabla con busqueda global, ordenamiento por columnas y paginacion
- Filtro por estado (activo/inactivo)

#### Crear/Editar Corresponsal
- Nombre, pais, NIF/Tax ID, direccion
- Email y telefono (opcionales)
- Estado: activo o inactivo

#### Detalle de Corresponsal
Tres pestanas:
1. **Datos generales**: Informacion fiscal y de contacto
2. **Certificados**: Certificados de residencia fiscal vinculados
3. **Historico de pagos**: Liquidaciones realizadas con estadisticas

---

### 3. Certificados de Residencia Fiscal

**Ruta**: `/certificates`

Control del ciclo de vida de certificados de residencia fiscal.

#### Estados
| Estado | Descripcion |
|--------|------------|
| Vigente (verde) | Certificado valido, mas de 120 dias para vencer |
| Por vencer (rojo) | Menos de 120 dias para vencer |
| Vencido (rojo) | Fecha de vencimiento superada |

#### Crear Certificado
1. Seleccionar corresponsal
2. Indicar pais emisor (se valida coincidencia con pais del corresponsal)
3. Fecha de emision (la fecha de vencimiento se calcula automaticamente a 1 ano)
4. Opcionalmente adjuntar documento (PDF, JPG, PNG)

#### Panel de Alertas
Muestra certificados vencidos y proximos a vencer con acceso rapido.

---

### 4. Liquidaciones

**Ruta**: `/liquidations`

Flujo completo de liquidacion de pagos a corresponsales.

#### Flujo de Estados
```
Borrador → Pendiente aprobacion → Aceptada → Fecha de pago → Pagada
                                ↘ Rechazada (puede reenviarse)
```

#### Crear Liquidacion (Wizard de 3 pasos)
1. **Paso 1**: Seleccionar corresponsal (se verifica si tiene certificado vigente)
2. **Paso 2**: Importe, divisa (10 divisas disponibles), concepto, referencia
3. **Paso 3**: Confirmar datos y crear

#### Acciones por Rol
| Accion | Quien puede |
|--------|------------|
| Crear liquidacion | Pagador, Supervisor, Admin |
| Enviar a aprobacion | Pagador (solo sus borradores) |
| Aprobar / Rechazar | Supervisor, Admin |
| Solicitar pago | Supervisor, Admin (solo liquidaciones aprobadas con certificado) |

#### Detalle de Liquidacion
- Timeline visual de estados (5 pasos)
- Datos del corresponsal y la liquidacion
- Boton de accion contextual segun rol y estado

---

### 5. Cola de Pagos

**Ruta**: `/payments` (solo Financiero y Admin)

Gestion de solicitudes de pago al departamento financiero.

#### Panel de Estadisticas
- Pendientes, En proceso, Pagadas, Rechazadas

#### Acciones
| Estado actual | Acciones disponibles |
|--------------|---------------------|
| Pendiente | Iniciar proceso |
| En proceso | Marcar como pagada (con notas), Rechazar (con motivo) |
| Pagada | - (estado final) |
| Rechazada | - (estado final) |

#### Detalle de Solicitud
- Datos de la liquidacion asociada
- Informacion de procesamiento (quien, cuando, notas)
- Link directo a la liquidacion original

---

### 6. Notificaciones

**Ruta**: `/notifications`

Sistema de notificaciones en tiempo real.

#### Campana de Notificaciones (Header)
- Badge con contador de no leidas
- Panel desplegable con las 8 mas recientes
- Click en una notificacion navega a la entidad relacionada

#### Pagina de Notificaciones
- Lista completa con indicador de lectura
- Tipo de entidad (Liquidacion, Pago, Certificado, Corresponsal)
- Tiempo relativo (hace X min, ayer, etc.)
- Boton "Marcar todo como leido"

#### Tipos de Notificacion
| Tipo | Cuando se genera |
|------|-----------------|
| Certificado por vencer | 120 dias antes del vencimiento |
| Certificado vencido | Al dia siguiente del vencimiento |
| Liquidacion aprobada | Cuando un supervisor aprueba |
| Liquidacion rechazada | Cuando un supervisor rechaza |
| Pago solicitado | Cuando se crea una solicitud de pago |
| Pago completado | Cuando financiero marca como pagada |

---

## Divisas Soportadas

| Codigo | Nombre |
|--------|--------|
| EUR | Euro |
| USD | Dolar USA |
| GBP | Libra esterlina |
| CHF | Franco suizo |
| BRL | Real brasileno |
| MXN | Peso mexicano |
| CLP | Peso chileno |
| COP | Peso colombiano |
| PEN | Sol peruano |
| ARS | Peso argentino |

---

## Atajos de Teclado

- `Tab`: Navegar entre elementos interactivos
- `Enter/Space`: Activar botones y links
- `Escape`: Cerrar dialogos y paneles

---

## Accesibilidad

LIQUIDA360 cumple con WCAG AA:
- Contraste minimo 4.5:1
- Navegacion por teclado completa
- Link "Ir al contenido principal" (skip-to-content)
- Etiquetas ARIA en todos los elementos interactivos
- Indicadores de foco visibles
