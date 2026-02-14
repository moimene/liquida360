import { describe, expect, test, beforeEach } from 'vitest'
import { buildSapDeepLink, readSapDeepLinkTemplate } from '@/features/ginvoice/lib/sap-links'

const SETTINGS_STORAGE_KEY = 'liquida360:ginvoice:settings:v1'

describe('sap-links', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('reads SAP template from local storage', () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ sapDeepLinkTemplate: 'https://sap.example/app?doc={ref}' }),
    )

    expect(readSapDeepLinkTemplate()).toBe('https://sap.example/app?doc={ref}')
  })

  test('builds deep link replacing {ref}', () => {
    const url = buildSapDeepLink('5000012345', 'https://sap.example/app?doc={ref}')
    expect(url).toBe('https://sap.example/app?doc=5000012345')
  })

  test('builds deep link appending ref query when {ref} is missing', () => {
    const url = buildSapDeepLink('AS-123 45', 'https://sap.example/launchpad')
    expect(url).toBe('https://sap.example/launchpad?ref=AS-123%2045')
  })

  test('returns null when template is not configured', () => {
    expect(buildSapDeepLink('5000012345')).toBeNull()
  })
})
