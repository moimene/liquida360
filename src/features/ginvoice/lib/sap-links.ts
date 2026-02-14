const SETTINGS_STORAGE_KEY = 'liquida360:ginvoice:settings:v1'

interface SapSettings {
  sapDeepLinkTemplate?: unknown
}

function normalizeTemplate(template: string): string {
  return template.trim()
}

export function readSapDeepLinkTemplate(): string {
  if (typeof window === 'undefined') return ''

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return ''
    const parsed = JSON.parse(raw) as SapSettings
    return typeof parsed.sapDeepLinkTemplate === 'string'
      ? normalizeTemplate(parsed.sapDeepLinkTemplate)
      : ''
  } catch {
    return ''
  }
}

export function buildSapDeepLink(reference: string, explicitTemplate?: string): string | null {
  const cleanedReference = reference.trim()
  if (!cleanedReference) return null

  const template = normalizeTemplate(explicitTemplate ?? readSapDeepLinkTemplate())
  if (!template) return null

  const encoded = encodeURIComponent(cleanedReference)
  if (template.includes('{ref}')) {
    return template.replaceAll('{ref}', encoded)
  }

  const separator = template.includes('?') ? '&' : '?'
  return `${template}${separator}ref=${encoded}`
}
