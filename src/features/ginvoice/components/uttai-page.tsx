import { useEffect, useState } from 'react'
import { useGInvJobs } from '../hooks/use-ginv-jobs'
import { useGInvUttai } from '../hooks/use-ginv-uttai'
import { useAuth } from '@/features/auth'
import { UTTAI_STATUS_CONFIG } from '../constants/ginvoice-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const UTTAI_ICONS = {
  clear: ShieldCheck,
  blocked: ShieldAlert,
  pending_review: ShieldQuestion,
} as const

export function UttaiPage() {
  const { jobs, loading: loadingJobs, fetchJobs } = useGInvJobs()
  const { requests, loading: loadingRequests, fetchRequests, requestUnblock, resolveRequest, updateJobUttai } = useGInvUttai()
  const { user, ginvRole } = useAuth()
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchJobs()
    fetchRequests()
  }, [fetchJobs, fetchRequests])

  const isCompliance = ginvRole === 'ginv_compliance_uttai' || ginvRole === 'ginv_admin'
  const loading = loadingJobs || loadingRequests

  const filteredJobs = search
    ? jobs.filter(
        (j) =>
          j.job_code.toLowerCase().includes(search.toLowerCase()) ||
          j.client_name.toLowerCase().includes(search.toLowerCase()),
      )
    : jobs

  const blockedJobs = jobs.filter((j) => j.uttai_status === 'blocked')
  const pendingJobs = jobs.filter((j) => j.uttai_status === 'pending_review')

  async function handleRequestUnblock(jobId: string) {
    if (!user) return
    const { error } = await requestUnblock(jobId, user.id)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Solicitud de desbloqueo enviada')
    fetchJobs()
  }

  async function handleResolve(requestId: string, jobId: string) {
    if (!user) return
    const { error } = await resolveRequest(requestId, user.id)
    if (error) {
      toast.error(error)
      return
    }
    await updateJobUttai(jobId, 'clear')
    toast.success('Job desbloqueado')
    fetchJobs()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-bold"
          style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
        >
          UTTAI
        </h1>
        <p style={{ color: 'var(--g-text-secondary)' }}>
          Control de bloqueos y sujetos obligados
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-error)' }}>
            {blockedJobs.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Bloqueados</div>
        </div>
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-warning)' }}>
            {pendingJobs.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Pte. revisión</div>
        </div>
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-success)' }}>
            {requests.filter((r) => r.status === 'pending').length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Solicitudes ptes.</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--g-text-tertiary)' }} />
        <Input
          placeholder="Buscar job..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Jobs table with UTTAI status */}
      <div
        style={{
          backgroundColor: 'var(--g-surface-card)',
          borderRadius: 'var(--g-radius-lg)',
          border: '1px solid var(--g-border-default)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--g-brand-3308)' }} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Job</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Cliente</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado UTTAI</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Sujeto obligado</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const uttai = UTTAI_STATUS_CONFIG[job.uttai_status] ?? UTTAI_STATUS_CONFIG.clear
                const Icon = UTTAI_ICONS[job.uttai_status as keyof typeof UTTAI_ICONS] ?? ShieldCheck
                const pendingRequest = requests.find((r) => r.job_id === job.id && r.status === 'pending')

                return (
                  <tr key={job.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>
                      {job.job_code}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>
                      {job.client_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium"
                        style={{ color: uttai.color, backgroundColor: uttai.bg, borderRadius: 'var(--g-radius-full)' }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {uttai.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                      {job.uttai_subject_obliged === true && 'Sí'}
                      {job.uttai_subject_obliged === false && 'No'}
                      {job.uttai_subject_obliged === null && '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {job.uttai_status === 'blocked' && !pendingRequest && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestUnblock(job.id)}
                        >
                          Solicitar desbloqueo
                        </Button>
                      )}
                      {pendingRequest && isCompliance && (
                        <Button
                          size="sm"
                          onClick={() => handleResolve(pendingRequest.id, job.id)}
                        >
                          Desbloquear
                        </Button>
                      )}
                      {pendingRequest && !isCompliance && (
                        <span className="text-xs" style={{ color: 'var(--status-warning)' }}>
                          Solicitado {formatDistanceToNow(new Date(pendingRequest.created_at), { addSuffix: true, locale: es })}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
