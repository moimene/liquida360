import { useRef, useMemo, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Upload, FileText, X, Stamp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { HelpText } from '@/components/ui/help-text'
import { CERTIFICATES_HELP } from '../constants/help-texts'
import {
  certificateSchema,
  certificateDefaultValues,
  type CertificateFormData,
} from '../schemas/certificate-schema'
import { getDefaultExpiryDate, validateCountryMatch } from '@/lib/certificate-utils'
import { COUNTRIES } from '@/lib/countries'
import { COUNTRY_VERIFICATIONS, APOSTILLE_INFO } from '../constants/verification-guide-data'
import type { Correspondent } from '@/types'

interface CertificateFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CertificateFormData) => Promise<void>
  correspondents: Correspondent[]
  loading?: boolean
  preselectedCorrespondentId?: string
  onFileSelect: (file: File | undefined) => void
}

export function CertificateForm({
  open,
  onClose,
  onSubmit,
  correspondents,
  loading,
  preselectedCorrespondentId,
  onFileSelect,
}: CertificateFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
    defaultValues: preselectedCorrespondentId
      ? { ...certificateDefaultValues, correspondent_id: preselectedCorrespondentId }
      : certificateDefaultValues,
  })

  const selectedCorrespondentId = watch('correspondent_id')
  const selectedIssuingCountry = watch('issuing_country')
  const issueDate = watch('issue_date')

  const selectedCorrespondent = useMemo(
    () => correspondents.find((c) => c.id === selectedCorrespondentId),
    [correspondents, selectedCorrespondentId],
  )

  const countryValidation = useMemo(() => {
    if (!selectedCorrespondent || !selectedIssuingCountry) return null
    return validateCountryMatch(selectedIssuingCountry, selectedCorrespondent.country)
  }, [selectedCorrespondent, selectedIssuingCountry])

  const apostilleHint = useMemo(() => {
    if (!selectedIssuingCountry) return null
    const countryInfo = COUNTRY_VERIFICATIONS.find((c) => c.countryCode === selectedIssuingCountry)
    if (!countryInfo) return null
    return APOSTILLE_INFO[countryInfo.apostilleRequirement]
  }, [selectedIssuingCountry])

  const handleIssueDateChange = useCallback(
    (value: string) => {
      if (value) {
        const defaultExpiry = getDefaultExpiryDate(value)
        setValue('expiry_date', defaultExpiry)
      }
    },
    [setValue],
  )

  async function handleFormSubmit(data: CertificateFormData) {
    await onSubmit(data)
    reset()
    onClose()
  }

  function handleClose() {
    reset()
    setSelectedFileName(null)
    onFileSelect(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  function handleRemoveFile() {
    setSelectedFileName(null)
    onFileSelect(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nuevo certificado de residencia fiscal"
      description="Registra un certificado emitido por la autoridad fiscal del país de origen"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <div className="flex flex-col gap-4">
          {/* Correspondent */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="correspondent_id">
              Corresponsal <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Select
              id="correspondent_id"
              {...register('correspondent_id')}
              error={!!errors.correspondent_id}
              disabled={!!preselectedCorrespondentId}
            >
              <option value="">Seleccionar corresponsal</option>
              {correspondents
                .filter((c) => c.status === 'active')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.country})
                  </option>
                ))}
            </Select>
            {errors.correspondent_id && (
              <span className="text-xs" style={{ color: 'var(--status-error)' }}>
                {errors.correspondent_id.message}
              </span>
            )}
          </div>

          {/* Issuing country */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="issuing_country">
              País emisor del certificado <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Select
              id="issuing_country"
              {...register('issuing_country')}
              error={!!errors.issuing_country}
            >
              <option value="">Seleccionar país</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
            {errors.issuing_country && (
              <span className="text-xs" style={{ color: 'var(--status-error)' }}>
                {errors.issuing_country.message}
              </span>
            )}

            {/* Country mismatch warning (cotejo) */}
            {countryValidation && !countryValidation.valid && (
              <div
                className="flex items-start gap-2 p-3 text-xs mt-1"
                style={{
                  backgroundColor: 'hsl(0, 84%, 60%, 0.08)',
                  borderRadius: 'var(--g-radius-sm)',
                  color: 'var(--status-error)',
                }}
                role="alert"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{countryValidation.message}</span>
              </div>
            )}
            <HelpText>{CERTIFICATES_HELP.formIssuingCountry}</HelpText>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="issue_date">
                Fecha de emisión <span style={{ color: 'var(--status-error)' }}>*</span>
              </Label>
              <Input
                id="issue_date"
                type="date"
                {...register('issue_date', {
                  onChange: (e) => handleIssueDateChange(e.target.value),
                })}
                error={!!errors.issue_date}
              />
              {errors.issue_date && (
                <span className="text-xs" style={{ color: 'var(--status-error)' }}>
                  {errors.issue_date.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expiry_date">
                Fecha de vencimiento <span style={{ color: 'var(--status-error)' }}>*</span>
              </Label>
              <Input
                id="expiry_date"
                type="date"
                {...register('expiry_date')}
                error={!!errors.expiry_date}
              />
              {errors.expiry_date && (
                <span className="text-xs" style={{ color: 'var(--status-error)' }}>
                  {errors.expiry_date.message}
                </span>
              )}
              {issueDate && (
                <HelpText>{CERTIFICATES_HELP.formDates}</HelpText>
              )}
            </div>
          </div>

          {/* File upload */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="document">Documento (PDF, imagen)</Label>
            {selectedFileName ? (
              <div
                className="flex items-center gap-3 p-3"
                style={{
                  border: '1px solid var(--g-border-default)',
                  borderRadius: 'var(--g-radius-md)',
                  backgroundColor: 'var(--g-surface-secondary)',
                }}
              >
                <FileText className="h-5 w-5 shrink-0" style={{ color: 'var(--g-brand-3308)' }} />
                <span
                  className="text-sm flex-1 truncate"
                  style={{ color: 'var(--g-text-primary)' }}
                  title={selectedFileName}
                >
                  {selectedFileName}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="shrink-0 p-1 rounded transition-colors"
                  style={{ color: 'var(--g-text-secondary)' }}
                  aria-label="Eliminar archivo seleccionado"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
                style={{
                  border: '1px dashed var(--g-border-subtle)',
                  borderRadius: 'var(--g-radius-md)',
                }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Subir documento del certificado"
              >
                <Upload className="h-5 w-5" style={{ color: 'var(--g-text-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                  Haz clic para seleccionar archivo
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              id="document"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                setSelectedFileName(file?.name ?? null)
                onFileSelect(file)
              }}
            />
            <HelpText>{CERTIFICATES_HELP.formFileUpload}</HelpText>
          </div>

          {/* Apostille */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <label
                htmlFor="apostilled"
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  id="apostilled"
                  type="checkbox"
                  {...register('apostilled')}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: 'var(--g-brand-3308)' }}
                />
                <Stamp className="h-4 w-4" style={{ color: 'var(--g-text-secondary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--g-text-primary)' }}>
                  Certificado apostillado
                </span>
              </label>
            </div>
            {apostilleHint && (
              <div
                className="flex items-start gap-2 p-2.5 text-xs"
                style={{
                  backgroundColor: apostilleHint.colorBg,
                  borderRadius: 'var(--g-radius-sm)',
                  color: apostilleHint.colorFg,
                }}
              >
                <Stamp className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>{apostilleHint.label}:</strong> {apostilleHint.description}
                </span>
              </div>
            )}
            <HelpText>
              Marca si el certificado cuenta con apostilla del Convenio de La Haya. La necesidad de apostilla depende del pais emisor.
            </HelpText>
          </div>
        </div>

        <DialogFooter className="mt-6 -mx-6 -mb-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Registrar certificado
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
