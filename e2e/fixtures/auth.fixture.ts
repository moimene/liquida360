import { test as base, expect } from '@playwright/test'

type AuthFixtures = {
  loginAsAdmin: () => Promise<void>
  loginAsPagador: () => Promise<void>
  loginAsSupervisor: () => Promise<void>
  loginAsFinanciero: () => Promise<void>
  loginAsCorresponsal: () => Promise<void>
}

async function loginInternal(page: import('@playwright/test').Page, email: string, password: string) {
  const maxRetries = 5
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await page.waitForTimeout(3000 * attempt)
    }
    await page.goto('/login')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: /Acceder/i }).click()
    try {
      await page.waitForURL('/', { timeout: 15_000 })
      return
    } catch {
      const rateLimited = await page.getByText(/rate limit/i).isVisible().catch(() => false)
      if (rateLimited && attempt < maxRetries - 1) {
        continue
      }
      throw new Error(`Login failed for ${email} after ${attempt + 1} attempts`)
    }
  }
}

export const test = base.extend<AuthFixtures>({
  loginAsAdmin: async ({ page }, use) => {
    await use(async () => {
      await loginInternal(page, process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!)
    })
  },

  loginAsPagador: async ({ page }, use) => {
    await use(async () => {
      await loginInternal(page, process.env.TEST_PAGADOR_EMAIL!, process.env.TEST_PAGADOR_PASSWORD!)
    })
  },

  loginAsSupervisor: async ({ page }, use) => {
    await use(async () => {
      await loginInternal(page, process.env.TEST_SUPERVISOR_EMAIL!, process.env.TEST_SUPERVISOR_PASSWORD!)
    })
  },

  loginAsFinanciero: async ({ page }, use) => {
    await use(async () => {
      await loginInternal(page, process.env.TEST_FINANCIERO_EMAIL!, process.env.TEST_FINANCIERO_PASSWORD!)
    })
  },

  loginAsCorresponsal: async ({ page }, use) => {
    await use(async () => {
      const maxRetries = 5
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          await page.waitForTimeout(3000 * attempt)
        }
        await page.goto('/login')
        await page.getByRole('tab', { name: 'Corresponsal' }).click()
        await page.locator('#email').fill(process.env.TEST_CORRESPONSAL_EMAIL!)
        await page.locator('#password').fill(process.env.TEST_CORRESPONSAL_PASSWORD!)
        await page.getByRole('button', { name: /Acceder al portal/i }).click()
        try {
          await page.waitForURL('/portal', { timeout: 15_000 })
          return
        } catch {
          const rateLimited = await page.getByText(/rate limit/i).isVisible().catch(() => false)
          if (rateLimited && attempt < maxRetries - 1) {
            continue
          }
          throw new Error(`Corresponsal login failed after ${attempt + 1} attempts`)
        }
      }
    })
  },
})

export { expect } from '@playwright/test'
