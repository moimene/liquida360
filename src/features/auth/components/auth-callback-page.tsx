import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      // Supabase appends tokens as hash fragments (#access_token=...&type=signup)
      // or as query params (?token_hash=...&type=signup) depending on email template version.
      // supabase.auth.getSession() / onAuthStateChange automatically picks up the tokens
      // from the URL and exchanges them for a session.

      const { error } = await supabase.auth.getSession()

      if (error) {
        setError(error.message)
        return
      }

      // After email confirmation, the user has no role yet → redirect to /pending
      navigate('/pending', { replace: true })
    }

    handleCallback()
  }, [navigate])

  if (error) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{ backgroundColor: 'var(--g-surface-page)' }}
      >
        <div className="text-center">
          <h1
            className="font-bold mb-4"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--status-error)' }}
          >
            Error de confirmacion
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: 'var(--g-surface-page)' }}
    >
      <p style={{ color: 'var(--g-text-secondary)' }}>Verificando tu cuenta...</p>
    </div>
  )
}
