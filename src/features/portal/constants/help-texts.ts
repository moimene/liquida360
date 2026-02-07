export const PORTAL_HELP = {
  dashboardWelcome:
    'Desde tu portal puedes crear y enviar facturas, subir certificados de residencia fiscal, y consultar el estado de tus pagos.',
  kpiBorradores: 'Facturas creadas que aún no se han enviado a aprobación.',
  kpiEnProceso:
    'Facturas enviadas que están pendientes de aprobación o pago.',
  kpiPagadas: 'Facturas cuyo pago ha sido completado.',
  kpiCertificados:
    'Certificados vigentes respecto al total. Mantenlos actualizados para evitar retrasos.',
  invoicesPageInfo:
    'Crea facturas como borrador y envíalas a aprobación cuando estén listas. El equipo interno revisará y procesará el pago.',
  invoiceFormConcept:
    'Describe el servicio prestado. Sé claro para facilitar la aprobación.',
  invoiceFormAmount: 'Importe bruto en la divisa seleccionada.',
  invoiceFormReference:
    'Tu número de factura o referencia de expediente. Facilita la trazabilidad.',
  invoiceDetailWorkflow:
    'Tu factura seguirá este flujo: Borrador → Pendiente → Aprobada → Pago solicitado → Pagada. Recibirás notificaciones en cada cambio.',
  certificatesPageInfo:
    'Los certificados de residencia fiscal son necesarios para que el despacho procese tus pagos. Sube un certificado vigente emitido por la autoridad fiscal de tu país.',
  certificateFormDates:
    'Vencimiento calculado a 1 año desde emisión. Ajústalo si tu certificado tiene validez diferente.',
  certificateFormFile: 'Formatos: PDF, JPG, PNG. Tamaño máximo: 5 MB.',
  certificateStatsTip:
    'Los certificados vencidos pueden retrasar el procesamiento de tus pagos. Renueva antes del vencimiento.',
} as const
