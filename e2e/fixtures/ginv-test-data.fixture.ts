import { test as authTest } from './auth.fixture'

export type TestGInvJob = {
  job_code: string
  client_code: string
  client_name: string
}

export type TestGInvVendor = {
  name: string
  tax_id: string
  country: string
}

export type TestGInvIntake = {
  type: 'vendor_invoice' | 'official_fee'
  amount: string
  currency: string
  invoice_number: string
  concept_text: string
}

export const test = authTest.extend<{
  testGInvJob: TestGInvJob
  testGInvVendor: TestGInvVendor
  testGInvIntake: TestGInvIntake
}>({
  testGInvJob: async ({ page: _page }, fixtureApply) => {
    const ts = Date.now()
    await fixtureApply({
      job_code: `J-E2E-${ts}`,
      client_code: `CLI-E2E-${ts}`,
      client_name: `E2E Test Client ${ts}`,
    })
  },

  testGInvVendor: async ({ page: _page }, fixtureApply) => {
    const ts = Date.now()
    await fixtureApply({
      name: `E2E Test Vendor ${ts}`,
      tax_id: `B${ts.toString().slice(-8)}`,
      country: 'ES',
    })
  },

  testGInvIntake: async ({ page: _page }, fixtureApply) => {
    const ts = Date.now()
    await fixtureApply({
      type: 'vendor_invoice',
      amount: '1500.00',
      currency: 'EUR',
      invoice_number: `FV-E2E-${ts}`,
      concept_text: `E2E Test Intake ${ts}`,
    })
  },
})

export { expect } from '@playwright/test'
