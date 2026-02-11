import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Options {
  bucketId: string
  path: string | null
  expiresIn?: number
}

export function useSignedUrl() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getUrl = useCallback(async ({ bucketId, path, expiresIn = 300 }: Options) => {
    if (!path) return { url: null, error: 'No hay archivo disponible' }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.storage.from(bucketId).createSignedUrl(path, expiresIn)
    setLoading(false)
    if (error) {
      setError(error.message)
      return { url: null, error: error.message }
    }

    return { url: data?.signedUrl ?? null, error: null }
  }, [])

  return { getUrl, loading, error }
}
