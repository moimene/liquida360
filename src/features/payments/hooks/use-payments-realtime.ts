import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { usePaymentRequests } from './use-payment-requests'

export function usePaymentsRealtime() {
  const fetchRequests = usePaymentRequests((s) => s.fetchRequests)

  useEffect(() => {
    const channel = supabase
      .channel('payments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_requests',
        },
        () => {
          // Re-fetch to get joined data (liquidation + correspondent names)
          fetchRequests()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRequests])
}
