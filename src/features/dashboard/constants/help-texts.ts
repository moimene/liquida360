export const DASHBOARD_HELP = {
  kpiPendingLiquidations:
    'Liquidaciones en estado borrador o pendientes de aprobación. Requieren acción para avanzar en el flujo.',
  kpiValidCertificates:
    'Certificados de residencia fiscal actualmente vigentes. Un certificado vigente es necesario para solicitar pagos.',
  kpiExpiringCertificates:
    'Certificados vencidos o próximos a vencer en los próximos 120 días. Renueva los certificados antes de su vencimiento para evitar bloqueos en pagos.',
  kpiPendingPayments:
    'Solicitudes de pago en cola esperando procesamiento por el departamento financiero.',
  kpiInApproval:
    'Liquidaciones aprobadas o con pago solicitado que están en proceso activo.',
  chartsSection:
    'Los gráficos muestran tendencias de liquidaciones por mes, distribución por estado, y vencimientos de certificados. Usa esta información para anticipar picos de trabajo.',
  certificateAlerts:
    'Los certificados vencidos impiden solicitar nuevos pagos para el corresponsal afectado.',
} as const
