# LIQUIDA360 - Documentos de Prueba

Este paquete contiene **25 documentos PDF** para recrear el entorno de prueba de la aplicación LIQUIDA360, una plataforma de gestión de liquidaciones de pagos para despachos de abogados que gestiona pagos a corresponsales internacionales y certificados de residencia fiscal.

## 📋 Contenido

### 📁 Certificados de Residencia Fiscal (5 archivos)

Los certificados representan diferentes escenarios de verificación electrónica según el país emisor:

#### 1. **C01_MX_CERT_RES_2025.pdf** - México
- **Corresponsal:** Bufete Rodríguez & Asociados S.C.
- **RFC:** ROAM850312QX7
- **Vigencia:** 15/03/2025 - 15/03/2026
- **Estado:** VÁLIDO
- **Verificación:** ❌ No disponible públicamente
- **Características:** Sin código QR verificable. Requiere e.firma o validación notarial.

#### 2. **C02_CL_CERT_RES_2025_SIGNED.pdf** - Chile
- **Corresponsal:** Estudio Jurídico Pacífico SpA
- **RUT:** 76.543.210-K
- **Vigencia:** 20/06/2025 - 20/06/2026
- **Estado:** VÁLIDO
- **Verificación:** ⚠️ Parcial mediante firma electrónica avanzada (FEA)
- **Código de Verificación:** 7K9X-M2PL-4QRW
- **Características:** Firmado digitalmente por el SII. Verificable en portal oficial.

#### 3. **C03_CN_CERT_RES_2025_QR.pdf** - China
- **Corresponsal:** Zhu & Partners Law Firm (朱律师事务所)
- **Tax ID:** 91310000MA1K4LXX3J
- **Vigencia:** 01/09/2025 - 01/09/2026
- **Estado:** VÁLIDO
- **Verificación:** ✅ Verificación en tiempo real mediante QR
- **Número de Certificado:** CNTR-2025-SH-00234891
- **URL de Verificación:** https://etax.chinatax.gov.cn/verify/CNTR2025SH00234891
- **Características:** Código QR funcional que redirige a la plataforma oficial de la STA.

#### 4. **C04_US_FORM6166_2025_APOSTILLE.pdf** - Estados Unidos
- **Corresponsal:** Thompson & Reed LLP
- **EIN:** 84-3456789
- **Vigencia:** 10/01/2025 - 10/01/2026
- **Estado:** ⚠️ PRÓXIMO A VENCER (< 60 días)
- **Verificación:** ⚠️ Indirecta mediante apostilla del Departamento de Estado
- **Apostilla No.:** APO-2025-NY-0012847
- **URL de Verificación:** https://travel.state.gov/verify/APO2025NY0012847
- **Características:** Form 6166 con apostilla adjunta. Alerta amarilla en sistema.

#### 5. **C05_CO_CERT_RES_2024_EXPIRED.pdf** - Colombia
- **Corresponsal:** Mendoza Arias & Cía. S.A.S.
- **NIT:** 900.876.543-1
- **Vigencia:** 15/11/2024 - 15/11/2025
- **Estado:** ❌ VENCIDO
- **Verificación:** ⚠️ Parcial mediante CSV y portal DIAN
- **Número de Acto:** 2024-DIAN-RES-0087654
- **CSV:** DIAN-8K2M-P9LX-3QRT
- **URL de Verificación:** https://www.dian.gov.co/verificacion-actos
- **Características:** Certificado vencido con código QR y CSV. Bloquea solicitudes de pago.

---

### 📁 Facturas (20 archivos)

Cada corresponsal tiene **4 facturas** con diferentes estados en el flujo de aprobación:

#### 🇲🇽 México - Bufete Rodríguez & Asociados (4 facturas)

| ID | Referencia | Concepto | Importe | Divisa | Estado |
|---|---|---|---|---|---|
| LIQ-MX-001 | BRAR-2025-0089 | Due diligence adquisición inmobiliaria Querétaro | 45,000.00 | MXN | ✅ APPROVED |
| LIQ-MX-002 | BRAR-2025-0102 | Asesoría fiscal - Reestructuración corporativa | 78,500.00 | MXN | ⏳ PENDING APPROVAL |
| LIQ-MX-003 | BRAR-2025-0118 | Litigio mercantil - Honorarios Q4 2025 | 125,000.00 | MXN | 📝 DRAFT |
| LIQ-MX-004 | BRAR-2026-0003 | Constitución de sociedad - Fintech México | 32,000.00 | USD | ✅ PAID |

#### 🇨🇱 Chile - Estudio Jurídico Pacífico (4 facturas)

| ID | Referencia | Concepto | Importe | Divisa | Estado |
|---|---|---|---|---|---|
| LIQ-CL-001 | EJP-2025-ARB-044 | Arbitraje internacional - Caso minero Atacama | 18,500.00 | USD | ✅ PAID |
| LIQ-CL-002 | EJP-2025-MA-007 | Asesoría M&A - Fusión cadena retail | 42,000,000 | CLP | 💰 PAYMENT REQUESTED |
| LIQ-CL-003 | EJP-2025-COMP-012 | Compliance y gobierno corporativo 2025 | 15,750,000 | CLP | ✅ APPROVED |
| LIQ-CL-004 | EJP-2026-LAB-001 | Defensa laboral colectiva - Sector salmonero | 8,200,000 | CLP | ⏳ PENDING APPROVAL |

#### 🇨🇳 China - Zhu & Partners Law Firm (4 facturas)

| ID | Referencia | Concepto | Importe | Divisa | Estado |
|---|---|---|---|---|---|
| LIQ-CN-001 | ZP-2025-INTL-0034 | Cross-border M&A - German automotive supplier | 85,000.00 | USD | ✅ PAID |
| LIQ-CN-002 | ZP-2025-IP-0089 | IP registration - 47 trademarks Greater China | 38,000.00 | USD | ✅ APPROVED |
| LIQ-CN-003 | ZP-2026-FDI-0002 | Foreign investment compliance - WFOE Suzhou | 52,000.00 | USD | 💰 PAYMENT REQUESTED |
| LIQ-CN-004 | ZP-2026-ARB-0001 | Dispute resolution - CIETAC Beijing | 120,000.00 | USD | 📝 DRAFT |

#### 🇺🇸 Estados Unidos - Thompson & Reed LLP (4 facturas)

| ID | Referencia | Concepto | Importe | Divisa | Estado |
|---|---|---|---|---|---|
| LIQ-US-001 | TR-2025-LIT-0456 | Securities litigation - Biotech sector | 175,000.00 | USD | ✅ PAID |
| LIQ-US-002 | TR-2025-REST-0078 | Corporate restructuring - Chapter 11 advisory | 95,000.00 | USD | ✅ APPROVED |
| LIQ-US-003 | TR-2026-IMM-0012 | Immigration - H-1B and L-1 visa processing Q1 | 28,500.00 | USD | ⏳ PENDING APPROVAL |
| LIQ-US-004 | TR-2026-RE-0004 | Real estate - Commercial lease Manhattan | 45,000.00 | USD | 📝 DRAFT |

**⚠️ NOTA:** Las facturas LIQ-US-003 y LIQ-US-004 no pueden avanzar a `payment_requested` porque el certificado CERT-US-001 está próximo a vencer (< 60 días).

#### 🇨🇴 Colombia - Mendoza Arias & Cía. (4 facturas)

| ID | Referencia | Concepto | Importe | Divisa | Estado |
|---|---|---|---|---|---|
| LIQ-CO-001 | MAC-2025-ADM-0234 | Litigio administrativo - Superintendencia | 45,000,000 | COP | ✅ PAID |
| LIQ-CO-002 | MAC-2025-DD-0067 | Due diligence - Planta manufacturera Medellín | 72,000,000 | COP | ❌ REJECTED |
| LIQ-CO-003 | MAC-2026-TAX-0001 | Asesoría tributaria - Planeación fiscal 2026 | 38,500,000 | COP | 📝 DRAFT |
| LIQ-CO-004 | MAC-2026-PI-0003 | Propiedad intelectual - Registro marcas Andina | 22,000,000 | COP | 📝 DRAFT |

**⚠️ BLOQUEO:** Las facturas LIQ-CO-003 y LIQ-CO-004 están en draft y no pueden solicitar pago porque el certificado CERT-CO-001 está vencido.

---

## 🎯 Escenarios de Prueba Cubiertos

### Estados de Certificados
- ✅ **VÁLIDO** (México, Chile, China)
- ⚠️ **PRÓXIMO A VENCER** (Estados Unidos - < 60 días)
- ❌ **VENCIDO** (Colombia)

### Métodos de Verificación Electrónica
- ❌ **Sin verificación pública** (México)
- ⚠️ **Verificación parcial** (Chile, Colombia)
- ✅ **Verificación completa en tiempo real** (China)
- ⚠️ **Verificación indirecta por apostilla** (Estados Unidos)

### Estados de Facturas
- 📝 **DRAFT** - Borrador inicial
- ⏳ **PENDING_APPROVAL** - Pendiente de aprobación por supervisor
- ✅ **APPROVED** - Aprobada, lista para solicitar pago
- 💰 **PAYMENT_REQUESTED** - Pago solicitado al departamento financiero
- ✅ **PAID** - Pagada completamente
- ❌ **REJECTED** - Rechazada

### Reglas de Negocio Implementadas
1. **Certificado próximo a vencer** (< 60 días) → Alerta amarilla, bloquea nuevas solicitudes de pago
2. **Certificado vencido** → Alerta roja, bloquea todas las operaciones de pago
3. **Múltiples divisas:** MXN, CLP, USD, COP
4. **Diferentes regiones:** LATAM (México, Chile, Colombia), Asia (China), Norteamérica (EE.UU.)

---

## 📂 Estructura de Archivos

```
liquida360_docs/
├── certificates/
│   ├── C01_MX_CERT_RES_2025.pdf
│   ├── C02_CL_CERT_RES_2025_SIGNED.pdf
│   ├── C03_CN_CERT_RES_2025_QR.pdf
│   ├── C04_US_FORM6166_2025_APOSTILLE.pdf
│   └── C05_CO_CERT_RES_2024_EXPIRED.pdf
│
├── invoices/
│   ├── LIQ-MX-001_factura.pdf
│   ├── LIQ-MX-002_factura.pdf
│   ├── LIQ-MX-003_factura.pdf
│   ├── LIQ-MX-004_factura.pdf
│   ├── LIQ-CL-001_factura.pdf
│   ├── LIQ-CL-002_factura.pdf
│   ├── LIQ-CL-003_factura.pdf
│   ├── LIQ-CL-004_factura.pdf
│   ├── LIQ-CN-001_factura.pdf
│   ├── LIQ-CN-002_factura.pdf
│   ├── LIQ-CN-003_factura.pdf
│   ├── LIQ-CN-004_factura.pdf
│   ├── LIQ-US-001_factura.pdf
│   ├── LIQ-US-002_factura.pdf
│   ├── LIQ-US-003_factura.pdf
│   ├── LIQ-US-004_factura.pdf
│   ├── LIQ-CO-001_factura.pdf
│   ├── LIQ-CO-002_factura.pdf
│   ├── LIQ-CO-003_factura.pdf
│   └── LIQ-CO-004_factura.pdf
│
├── qr_codes/
│   ├── china_cert_qr.png
│   └── colombia_cert_qr.png
│
└── README.md (este archivo)
```

---

## 🚀 Uso en la Aplicación

### 1. Importar Corresponsales
Crear los 5 corresponsales en el sistema con los datos del documento original.

### 2. Subir Certificados
Subir cada certificado PDF al corresponsal correspondiente:
- C01 → Bufete Rodríguez & Asociados (México)
- C02 → Estudio Jurídico Pacífico (Chile)
- C03 → Zhu & Partners (China)
- C04 → Thompson & Reed (Estados Unidos)
- C05 → Mendoza Arias & Cía. (Colombia)

### 3. Crear Liquidaciones
Crear las 20 facturas asociadas a cada corresponsal, utilizando los PDFs de la carpeta `invoices/`.

### 4. Verificar Flujos
- **Dashboard:** Visualizar alertas de certificados próximos a vencer y vencidos
- **Aprobaciones:** Probar el flujo de aprobación de facturas según roles
- **Bloqueos:** Verificar que las facturas de EE.UU. y Colombia se bloquean correctamente
- **Pagos:** Simular el proceso de solicitud y procesamiento de pagos

---

## 🛠️ Tecnologías Utilizadas para Generación

- **Python 3.11** con ReportLab para generación de PDFs
- **qrcode** para generación de códigos QR funcionales
- Diseño profesional con colores institucionales de cada país
- Elementos de seguridad: marcas de agua, códigos de verificación, sellos oficiales

---

## 📝 Notas Importantes

1. Los **códigos QR** son funcionales pero las URLs son simuladas (no apuntan a portales reales).
2. Los **números de certificado, NIF/Tax ID, y referencias** son ficticios pero siguen formatos realistas.
3. Los **importes y fechas** están diseñados para cubrir todos los escenarios de prueba.
4. Las **alertas de vencimiento** están configuradas para activarse automáticamente en el sistema.

---

## 📧 Contacto

Para más información sobre LIQUIDA360, consulte la documentación del proyecto o contacte al equipo de desarrollo.

**Generado el:** 8 de febrero de 2026  
**Versión:** 1.0  
**Entorno:** Prueba/Testing
