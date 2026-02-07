import { test as authTest } from './auth.fixture'

export type TestCorrespondent = {
  name: string
  country: string
  tax_id: string
  email: string
  phone: string
  address: string
}

export type TestLiquidation = {
  amount: string
  currency: string
  concept: string
  reference: string
}

export const test = authTest.extend<{
  testCorrespondent: TestCorrespondent
  testLiquidation: TestLiquidation
}>({
  testCorrespondent: async ({}, use) => {
    const ts = Date.now()
    await use({
      name: `E2E Test Firm ${ts}`,
      country: 'ES',
      tax_id: `B${ts.toString().slice(-8)}`,
      email: `e2e-firm-${ts}@test.com`,
      phone: '+34600000000',
      address: 'Calle Test 123, Madrid',
    })
  },

  testLiquidation: async ({}, use) => {
    const ts = Date.now()
    await use({
      amount: '15000.50',
      currency: 'EUR',
      concept: `E2E Test Liquidation ${ts}`,
      reference: `REF-E2E-${ts}`,
    })
  },
})

export { expect } from '@playwright/test'
