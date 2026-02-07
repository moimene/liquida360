export const SETTINGS_HELP = {
  alertsInfoPanel:
    'Las alertas se procesan automáticamente mediante Edge Functions. Cuando un certificado se acerca a su vencimiento, el sistema genera notificaciones según los umbrales configurados aquí.',
  alertsDaysBefore:
    'Número de días antes del vencimiento en que se debe enviar la alerta.',
  usersInfoPanel:
    'Cada usuario tiene un rol que determina sus permisos en la plataforma.',
  roleAdmin:
    'Administrador: Acceso completo. Gestiona usuarios, corresponsales, configuración y todas las funcionalidades.',
  roleSupervisor:
    'Supervisor: Aprueba y rechaza liquidaciones. Ve todas las liquidaciones y certificados.',
  roleFinanciero:
    'Financiero: Gestiona la cola de pagos. Inicia, completa y rechaza solicitudes de pago.',
  rolePagador:
    'Pagador: Crea liquidaciones y las envía a aprobación. Solicita pagos para liquidaciones aprobadas.',
} as const
