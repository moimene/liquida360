export const PAYMENTS_HELP = {
  pageInfoPanel:
    'Las solicitudes de pago NO se ejecutan automáticamente. Cada solicitud debe ser procesada manualmente por el equipo financiero.',
  statPending: 'Solicitudes recibidas que aún no han sido revisadas.',
  statInProgress:
    'Solicitudes que un miembro del equipo financiero ha comenzado a procesar.',
  statPaid:
    'Pagos completados. La liquidación asociada también se marca como pagada.',
  statRejected:
    'Solicitudes rechazadas. La liquidación permanece en estado aprobado.',
  actionStart:
    'Indica que estás trabajando en esta solicitud. Evita procesamiento simultáneo.',
  actionPaid:
    'Confirma el pago e incluye la referencia de transferencia en las notas.',
  actionReject:
    'Rechaza la solicitud de pago. La liquidación permanecerá en estado aprobado y podrá volver a solicitarse.',
  notesField:
    'Incluye referencia bancaria o número de transferencia. Ej: «Transferencia SEPA ref. 2024-1234».',
} as const
