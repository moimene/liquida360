export const LIQUIDATIONS_HELP = {
  pageInfoPanel:
    'El flujo de una liquidación: Borrador → Pendiente de aprobación → Aprobada → Pago solicitado → Pagada. Cada paso requiere acción de un rol diferente.',
  wizardStep1:
    'Solo se muestran corresponsales activos. El sistema verificará si tiene certificado vigente.',
  wizardStep2Concept:
    'Describe el servicio prestado. Este texto aparecerá en la solicitud al departamento financiero.',
  wizardStep2Currency: 'Selecciona la divisa del pago. Por defecto EUR.',
  wizardStep2Reference: 'Número de factura o referencia interna. Campo opcional.',
  wizardStep2Invoice: 'Adjunta la factura del corresponsal (PDF o imagen). Podrás descargarla desde el detalle de la liquidación.',
  wizardStep3:
    'Se creará como borrador. Podrás enviarla a aprobación desde el detalle.',
  timelineHeader:
    '5 etapas: Borrador, Pendiente de aprobación, Aprobada, Pago solicitado, Pagada. Si es rechazada, deberás crear una nueva.',
  actionSubmit:
    'Envía la liquidación para que un supervisor la revise y apruebe.',
  actionApprove:
    'Aprueba la liquidación para que se pueda solicitar el pago al departamento financiero.',
  actionReject:
    'Rechaza la liquidación. El pagador deberá crear una nueva liquidación si es necesario.',
  actionRequestPayment:
    'Genera una solicitud de pago que se enviará al departamento financiero para su procesamiento.',
} as const
