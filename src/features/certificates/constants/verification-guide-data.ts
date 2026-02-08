/* ─────────────── Types ─────────────── */

export type VerificationTier = 'A' | 'B' | 'C' | 'D'

export type VerificationProtocol =
  | 'public_portal'
  | 'pki_signature'
  | 'csv_cotejo'
  | 'qr_code'
  | 'apostille'
  | 'restricted'

export type Region = 'latin_america' | 'north_america' | 'asia_pacific' | 'europe'

export type ApostilleRequirement = 'not_required' | 'recommended' | 'strongly_recommended'

export interface CountryVerification {
  countryCode: string
  countryName: string
  flag: string
  region: Region
  tier: VerificationTier
  taxAuthority: string
  verificationMethod: string
  verificationUrl: string | null
  protocols: VerificationProtocol[]
  notes: string
  inputRequired: string | null
  /** Apostille requirement when presenting to Spanish AEAT */
  apostilleRequirement: ApostilleRequirement
}

export const APOSTILLE_INFO: Record<ApostilleRequirement, {
  label: string
  shortLabel: string
  description: string
  colorBg: string
  colorFg: string
}> = {
  not_required: {
    label: 'No requerida',
    shortLabel: 'No req.',
    description: 'Paises UE: se acepta firma electronica o documento digital verificable sin apostilla.',
    colorBg: 'var(--g-status-success-bg)',
    colorFg: 'var(--g-status-success)',
  },
  recommended: {
    label: 'Recomendada',
    shortLabel: 'Recom.',
    description: 'Paises terceros con verificacion electronica: apostilla recomendada pero no obligatoria segun jurisprudencia.',
    colorBg: 'var(--g-status-warning-bg)',
    colorFg: 'var(--g-status-warning)',
  },
  strongly_recommended: {
    label: 'Fuertemente recomendada',
    shortLabel: 'F. recom.',
    description: 'Paises terceros sin verificacion publica: apostilla fuertemente recomendada como unico mecanismo de validacion.',
    colorBg: 'var(--g-status-error-bg)',
    colorFg: 'var(--g-status-error)',
  },
}

export interface ProtocolInfo {
  id: VerificationProtocol
  name: string
  description: string
  icon: string
  securityLevel: 'alta' | 'media' | 'baja'
}

export interface TierInfo {
  label: string
  shortLabel: string
  description: string
  colorBg: string
  colorFg: string
}

/* ─────────────── Tier Metadata ─────────────── */

export const TIER_INFO: Record<VerificationTier, TierInfo> = {
  A: {
    label: 'Categoria A - Verificacion publica',
    shortLabel: 'Cat. A',
    description: 'Portal web oficial accesible sin autenticacion. Validacion instantanea.',
    colorBg: 'var(--g-status-success-bg)',
    colorFg: 'var(--g-status-success)',
  },
  B: {
    label: 'Categoria B - Verificacion restringida',
    shortLabel: 'Cat. B',
    description: 'Sistema digital existe pero requiere autenticacion o registro previo.',
    colorBg: 'var(--g-status-warning-bg)',
    colorFg: 'var(--g-status-warning)',
  },
  C: {
    label: 'Categoria C - Mecanismos analogicos',
    shortLabel: 'Cat. C',
    description: 'Depende de apostilla, legalizacion consular o validacion de documento fisico.',
    colorBg: 'var(--g-sec-100)',
    colorFg: 'var(--g-text-secondary)',
  },
  D: {
    label: 'Categoria D - Opacidad',
    shortLabel: 'Cat. D',
    description: 'Sin mecanismo publico de verificacion identificado para certificados de residencia fiscal.',
    colorBg: 'var(--g-status-error-bg)',
    colorFg: 'var(--g-status-error)',
  },
}

/* ─────────────── Protocol Metadata ─────────────── */

export const VERIFICATION_PROTOCOLS: ProtocolInfo[] = [
  {
    id: 'public_portal',
    name: 'Portal publico',
    description: 'Verificacion directa en portal web de la autoridad fiscal sin necesidad de credenciales. Resultado inmediato.',
    icon: 'Globe',
    securityLevel: 'alta',
  },
  {
    id: 'pki_signature',
    name: 'Firma digital (PKI)',
    description: 'Validacion criptografica de la firma digital del documento. Requiere el archivo PDF/P7M original, no acepta copias escaneadas.',
    icon: 'FileSignature',
    securityLevel: 'alta',
  },
  {
    id: 'csv_cotejo',
    name: 'Codigo seguro de verificacion (CSV)',
    description: 'Codigo alfanumerico unico impreso en el documento que permite recuperar el original desde el portal oficial para cotejo visual.',
    icon: 'Hash',
    securityLevel: 'media',
  },
  {
    id: 'qr_code',
    name: 'Codigo QR',
    description: 'QR impreso en el certificado que redirige automaticamente a la plataforma oficial para validacion en tiempo real.',
    icon: 'QrCode',
    securityLevel: 'alta',
  },
  {
    id: 'apostille',
    name: 'Apostilla / Legalizacion',
    description: 'Cadena de confianza transitiva: la apostilla del Convenio de La Haya valida al firmante, quien emitio el certificado.',
    icon: 'Stamp',
    securityLevel: 'media',
  },
  {
    id: 'restricted',
    name: 'Portal restringido',
    description: 'Portal de verificacion existe pero requiere autenticacion (Singpass, e.firma, cuenta fiscal) que excluye a terceros internacionales.',
    icon: 'Lock',
    securityLevel: 'baja',
  },
]

/* ─────────────── Region Labels ─────────────── */

export const REGION_LABELS: Record<Region, string> = {
  latin_america: 'Latinoamerica',
  north_america: 'Norteamerica',
  asia_pacific: 'Asia-Pacifico',
  europe: 'Europa',
}

/* ─────────────── Country Data (20 jurisdictions) ─────────────── */

export const COUNTRY_VERIFICATIONS: CountryVerification[] = [
  // ── LATIN AMERICA ──
  {
    countryCode: 'AR',
    countryName: 'Argentina',
    flag: '🇦🇷',
    region: 'latin_america',
    tier: 'A',
    taxAuthority: 'ARCA (ex AFIP)',
    verificationMethod: 'Consulta publica por CUIT sin credenciales',
    verificationUrl: 'https://servicioscf.afip.gob.ar/publico/RG3014/Consulta.aspx',
    protocols: ['public_portal'],
    notes: 'Ingresar CUIT sin guiones (11 digitos). Devuelve vigencia y periodos cubiertos. Protegido con CAPTCHA.',
    inputRequired: 'CUIT (sin guiones) + CAPTCHA',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'BO',
    countryName: 'Bolivia',
    flag: '🇧🇴',
    region: 'latin_america',
    tier: 'A',
    taxAuthority: 'SIN',
    verificationMethod: 'Consulta publica por codigo de certificado',
    verificationUrl: 'https://sac.impuestos.gob.bo/certificados/vista/verifica_certificado.php',
    protocols: ['public_portal'],
    notes: 'Busca por codigo del certificado (no por NIT del contribuyente). Devuelve titulo, nombre y estado.',
    inputRequired: 'Codigo del certificado',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'BR',
    countryName: 'Brasil',
    flag: '🇧🇷',
    region: 'latin_america',
    tier: 'A',
    taxAuthority: 'Receita Federal',
    verificationMethod: 'Verificacion por cuadruple factor (CPF/CNPJ + N.Control + Fecha + Hora emision)',
    verificationUrl: 'https://servicos.receita.fazenda.gov.br/Servicos/certidao/CertAut/AutPF.asp',
    protocols: ['public_portal'],
    notes: 'Requiere 4 datos del certificado: CPF/CNPJ, numero de control, fecha y hora exacta de emision. Previene verificaciones "a ciegas".',
    inputRequired: 'CPF/CNPJ + N. Control + Fecha + Hora',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'CL',
    countryName: 'Chile',
    flag: '🇨🇱',
    region: 'latin_america',
    tier: 'A',
    taxAuthority: 'SII',
    verificationMethod: 'Verificacion bilingue por codigo del certificado. Permite descarga del PDF original.',
    verificationUrl: 'https://www4.sii.cl/certificadosinternacionalesbaseinternetui/',
    protocols: ['public_portal', 'pki_signature'],
    notes: 'Portal bilingue (ES/EN). Permite descargar el PDF original del servidor para comparacion pixel-a-pixel. Firma electronica avanzada (FEA).',
    inputRequired: 'Codigo de verificacion del certificado',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'EC',
    countryName: 'Ecuador',
    flag: '🇪🇨',
    region: 'latin_america',
    tier: 'A',
    taxAuthority: 'SRI',
    verificationMethod: 'Verificacion primaria via QR. Alternativa web disponible.',
    verificationUrl: 'https://srienlinea.sri.gob.ec/sri-en-linea/consulta/27',
    protocols: ['qr_code', 'pki_signature'],
    notes: 'Certificados en formato P7M (firma avanzada) con QR de alta densidad. Escanear QR redirige a servidores SRI. Requiere Chrome/Firefox actualizados.',
    inputRequired: 'Escaneo QR o carga de archivo P7M',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'PY',
    countryName: 'Paraguay',
    flag: '🇵🇾',
    region: 'latin_america',
    tier: 'A',
    taxAuthority: 'DNIT (Sistema Marangatu)',
    verificationMethod: 'Consulta publica con triple validacion (RUC + Razon social + N. certificado)',
    verificationUrl: 'https://servicios.set.gov.py/eset-publico/verificarAutenticidadCCTRIService.do',
    protocols: ['public_portal'],
    notes: 'Seccion explicita "Servicios sin Clave de Acceso". Triple validacion elimina ambiguedad sobre credenciales requeridas.',
    inputRequired: 'RUC + Razon social + N. certificado',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'UY',
    countryName: 'Uruguay',
    flag: '🇺🇾',
    region: 'latin_america',
    tier: 'A',
    taxAuthority: 'DGI',
    verificationMethod: 'Verificacion por codigo de seguridad alfanumerico en dos pasos',
    verificationUrl: 'https://servicios.dgi.gub.uy/serviciosenlinea/certificadoresidenciafiscalconsulta',
    protocols: ['public_portal'],
    notes: 'Requiere navegadores actualizados (Chrome 33+, Firefox 34+). Validacion SSL/TLS estricta; navegadores obsoletos bloqueados.',
    inputRequired: 'Codigo de seguridad alfanumerico',
    apostilleRequirement: 'recommended',
  },

  // ── NORTH AMERICA ──
  {
    countryCode: 'US',
    countryName: 'Estados Unidos',
    flag: '🇺🇸',
    region: 'north_america',
    tier: 'C',
    taxAuthority: 'IRS',
    verificationMethod: 'Sin portal de verificacion. Documento Form 6166 en papel de seguridad. Validacion via apostilla del Dept. de Estado.',
    verificationUrl: null,
    protocols: ['apostille'],
    notes: 'Solicitud via Form 8802 (45+ dias). Requiere apostilla del Departamento de Estado. Sin verificacion digital disponible.',
    inputRequired: null,
    apostilleRequirement: 'strongly_recommended',
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    region: 'north_america',
    tier: 'B',
    taxAuthority: 'CRA',
    verificationMethod: 'Apostilla electronica verificable online (desde adhesion al Convenio de La Haya, enero 2024)',
    verificationUrl: null,
    protocols: ['apostille', 'pki_signature'],
    notes: 'Cambio de paradigma post-enero 2024: de legalizacion consular a e-Apostilla. Portales provinciales de verificacion (ej: ontario.ca/verifyapostille).',
    inputRequired: 'Numero de apostilla + portal provincial',
    apostilleRequirement: 'recommended',
  },

  // ── ASIA-PACIFIC ──
  {
    countryCode: 'CN',
    countryName: 'China',
    flag: '🇨🇳',
    region: 'asia_pacific',
    tier: 'B',
    taxAuthority: 'STA',
    verificationMethod: 'Certificados 100% digitales con sello digital y QR (reforma abril 2025). Ecosistema cerrado (WeChat/app STA).',
    verificationUrl: null,
    protocols: ['qr_code', 'pki_signature'],
    notes: 'Funcionalmente Cat. A pero operativamente B: requiere WeChat mini-programs o app STA. Sin interfaz web global ni version en ingles.',
    inputRequired: 'Escaneo QR via app WeChat/STA',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'HK',
    countryName: 'Hong Kong',
    flag: '🇭🇰',
    region: 'asia_pacific',
    tier: 'B',
    taxAuthority: 'IRD',
    verificationMethod: 'Sistema e-Proof para validacion de certificados digitales',
    verificationUrl: null,
    protocols: ['restricted'],
    notes: 'Sistema "e-Proof" disenado para socios de CDI (DTA partners). No accesible al publico general.',
    inputRequired: 'Acceso restringido a DTA partners',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'SG',
    countryName: 'Singapur',
    flag: '🇸🇬',
    region: 'asia_pacific',
    tier: 'B',
    taxAuthority: 'IRAS',
    verificationMethod: 'Portal myTax para COR digital, pero requiere Singpass (ID digital nacional con 2FA)',
    verificationUrl: null,
    protocols: ['restricted', 'pki_signature'],
    notes: 'Certificados COR 100% digitales en PDF. Verificacion via myTax requiere Singpass, excluyendo a terceros internacionales sin residencia.',
    inputRequired: 'Singpass (ID digital nacional)',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'JP',
    countryName: 'Japon',
    flag: '🇯🇵',
    region: 'asia_pacific',
    tier: 'C',
    taxAuthority: 'NTA',
    verificationMethod: 'Emision descentralizada en oficinas fiscales locales. Sin repositorio digital central.',
    verificationUrl: null,
    protocols: ['apostille'],
    notes: 'Sistema mas tradicional entre economias avanzadas. Validacion depende de cadenas de legalizacion fisica. Apostilla disponible.',
    inputRequired: null,
    apostilleRequirement: 'strongly_recommended',
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    region: 'asia_pacific',
    tier: 'B',
    taxAuthority: 'ATO',
    verificationMethod: 'Documentos PDF seguros. Document Verification Service (DVS) solo para documentos de identidad, NO fiscales.',
    verificationUrl: null,
    protocols: ['apostille', 'pki_signature'],
    notes: 'El DVS del ATO verifica documentos de identidad, no certificados fiscales. Validacion via copias certificadas + cadena de apostilla.',
    inputRequired: null,
    apostilleRequirement: 'recommended',
  },

  // ── EUROPE ──
  {
    countryCode: 'GB',
    countryName: 'Reino Unido',
    flag: '🇬🇧',
    region: 'europe',
    tier: 'B',
    taxAuthority: 'HMRC',
    verificationMethod: 'e-Apostilla digital verificable online via FCDO',
    verificationUrl: null,
    protocols: ['apostille', 'pki_signature'],
    notes: 'Sin portal publico de verificacion de certificados fiscales. Solucion: e-Apostilla del FCDO (PDF firmado criptograficamente) verificable en gov.uk/verify-apostille.',
    inputRequired: 'Numero de e-Apostilla',
    apostilleRequirement: 'recommended',
  },

  // ── ADDITIONAL LATAM (Cat. B) ──
  {
    countryCode: 'CO',
    countryName: 'Colombia',
    flag: '🇨🇴',
    region: 'latin_america',
    tier: 'B',
    taxAuthority: 'DIAN',
    verificationMethod: 'Tres mecanismos: verificacion de actos administrativos, verificacion de correos DIAN, y cotejo documental (Art. 248 CGP).',
    verificationUrl: null,
    protocols: ['csv_cotejo', 'qr_code'],
    notes: 'No existe boton unico "Validar certificado". Requiere conocimiento del sistema administrativo colombiano (numeros de acto, fechas exactas). Reclasificado B+ (herramientas forenses disponibles).',
    inputRequired: 'N. acto administrativo + fecha exacta',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'CR',
    countryName: 'Costa Rica',
    flag: '🇨🇷',
    region: 'latin_america',
    tier: 'B',
    taxAuthority: 'Ministerio de Hacienda',
    verificationMethod: 'Validacion de firma electronica via sistema BCCR (infraestructura PKI nacional)',
    verificationUrl: null,
    protocols: ['pki_signature'],
    notes: 'Sistema de certificacion digital nacional (BCCR). Subir PDF/XML firmado para validar cadena de confianza. Documentos digitales legalmente equivalentes a fisicos.',
    inputRequired: 'Archivo PDF/XML firmado digitalmente',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'PA',
    countryName: 'Panama',
    flag: '🇵🇦',
    region: 'latin_america',
    tier: 'B',
    taxAuthority: 'DGI',
    verificationMethod: 'Plataforma e-Tax 2.0 (requiere registro/login). Paz y Salvo verificable por codigo publico.',
    verificationUrl: null,
    protocols: ['restricted'],
    notes: 'Modulo de verificacion NO es publico anonimo (requiere registro en e-Tax). Tiempos de emision: 3-5 meses. Paz y Salvo como complemento de "good standing".',
    inputRequired: 'Registro en e-Tax 2.0',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'PE',
    countryName: 'Peru',
    flag: '🇵🇪',
    region: 'latin_america',
    tier: 'B',
    taxAuthority: 'SUNAT',
    verificationMethod: 'Validacion de firma digital via "Opciones sin Clave SOL". Requiere archivo PDF/P7M original.',
    verificationUrl: null,
    protocols: ['pki_signature', 'qr_code'],
    notes: 'Reclasificado de C a A-funcional: validacion criptografica superior a simple consulta por codigo. Requiere archivo digital original (copias escaneadas fallan la validacion). QR alternativo disponible.',
    inputRequired: 'Archivo PDF/P7M original',
    apostilleRequirement: 'recommended',
  },
  {
    countryCode: 'MX',
    countryName: 'Mexico',
    flag: '🇲🇽',
    region: 'latin_america',
    tier: 'D',
    taxAuthority: 'SAT',
    verificationMethod: 'Sin mecanismo de verificacion publica para certificados de residencia fiscal.',
    verificationUrl: null,
    protocols: [],
    notes: 'ATENCION: La "Constancia de Situacion Fiscal" (con QR, verificable) NO es la "Constancia de Residencia para Efectos Fiscales" (sin QR, sin portal). Protocolo de rechazo requerido si se entrega documento incorrecto.',
    inputRequired: null,
    apostilleRequirement: 'strongly_recommended',
  },
]

/* ─────────────── Helper functions ─────────────── */

export function getCountriesByRegion(region: Region): CountryVerification[] {
  return COUNTRY_VERIFICATIONS.filter((c) => c.region === region)
}

export function getCountriesByTier(tier: VerificationTier): CountryVerification[] {
  return COUNTRY_VERIFICATIONS.filter((c) => c.tier === tier)
}

export function getTierCount(tier: VerificationTier): number {
  return COUNTRY_VERIFICATIONS.filter((c) => c.tier === tier).length
}
