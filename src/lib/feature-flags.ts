import type { User } from '@supabase/supabase-js'

/**
 * Returns whether G-Invoice should be shown for the current user.
 * Rule: enabled unless env explicitly disables AND user metadata doesn't override to true.
 */
export function isGInvoiceEnabled(user?: User | null): boolean {
  const envFlag = import.meta.env.VITE_GINVOICE_ENABLED
  const globalEnabled = envFlag === undefined || envFlag === 'true'
  const userFlag = (user?.app_metadata as Record<string, unknown> | undefined)?.ginv_enabled
  if (typeof userFlag === 'boolean') {
    return userFlag
  }
  return globalEnabled
}
