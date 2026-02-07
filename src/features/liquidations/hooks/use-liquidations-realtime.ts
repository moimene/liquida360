import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLiquidations } from './use-liquidations'

export function useLiquidationsRealtime() {
  const fetchLiquidations = useLiquidations((s) => s.fetchLiquidations)

  useEffect(() => {
    const channel = supabase
      .channel('liquidations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'liquidations',
        },
        () => {
          // Re-fetch to get joined data (correspondent names, etc.)
          fetchLiquidations()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLiquidations])
}
