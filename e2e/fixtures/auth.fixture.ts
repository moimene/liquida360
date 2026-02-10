import { test as base, expect } from '@playwright/test'

type AuthFixtures = {
  loginAsAdmin: () => Promise<void>
  loginAsPagador: () => Promise<void>
  loginAsSupervisor: () => Promise<void>
  loginAsFinanciero: () => Promise<void>
  loginAsCorresponsal: () => Promise<void>
  loginAsGInvAdmin: () => Promise<void>
  loginAsGInvOperador: () => Promise<void>
  loginAsGInvSocio: () => Promise<void>
  loginAsGInvBpo: () => Promise<void>
  loginAsGInvCompliance: () => Promise<void>
}

async function loginInternal(page: import('@playwright/test').Page, email: string, password: string) {
  const maxRetries = 5
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await page.waitForTimeout(2000 + 2000 * attempt)
    }
    await page.goto('/login')
    await page.locator('#email').waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: /Acceder/i }).click()
    try {
      await page.waitForURL('/', { timeout: 25_000 })
      return
    } catch {
      const rateLimited = await page.getByText(/rate limit/i).isVisible().catch(() => false)
      if (rateLimited && attempt < maxRetries - 1) {
        continue
      }
      if (attempt < maxRetries - 1) {
        continue
      }
      throw new Error(`Login failed for ${email} after ${attempt + 1} attempts`)
    }
  }
}

async function loginGInvoice(page: import('@playwright/test').Page, email: string, password: string) {
  const maxRetries = 5
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await page.waitForTimeout(2000 + 2000 * attempt)
    }
    // Clear any existing session to avoid redirect race conditions
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    // Remove Supabase auth tokens from localStorage to prevent auto-redirect
    await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key)
        }
      }
    })
    // If we got redirected away from login, navigate back now that session is cleared
    if (!page.url().includes('/login')) {
      await page.goto('/login')
      await page.waitForLoadState('domcontentloaded')
    }
    await page.locator('#email').waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: /Acceder/i }).click()
    try {
      // G-Invoice users land on / first (login page redirects internal users to /)
      await page.waitForURL('/', { timeout: 25_000 })
      // Navigate explicitly to G-Invoice workspace
      await page.goto('/g-invoice')
      await page.waitForURL(/\/g-invoice/, { timeout: 15_000 })
      return
    } catch {
      const rateLimited = await page.getByText(/rate limit/i).isVisible().catch(() => false)
      if (rateLimited && attempt < maxRetries - 1) {
        continue
      }
      if (attempt < maxRetries - 1) {
        continue
      }
      throw new Error(`G-Invoice login failed for ${email} after ${attempt + 1} attempts`)
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

  loginAsGInvAdmin: async ({ page }, use) => {
    await use(async () => {
      await loginGInvoice(page, process.env.TEST_GINV_ADMIN_EMAIL!, process.env.TEST_GINV_ADMIN_PASSWORD!)
    })
  },

  loginAsGInvOperador: async ({ page }, use) => {
    await use(async () => {
      await loginGInvoice(page, process.env.TEST_GINV_OPERADOR_EMAIL!, process.env.TEST_GINV_OPERADOR_PASSWORD!)
    })
  },

  loginAsGInvSocio: async ({ page }, use) => {
    await use(async () => {
      await loginGInvoice(page, process.env.TEST_GINV_SOCIO_EMAIL!, process.env.TEST_GINV_SOCIO_PASSWORD!)
    })
  },

  loginAsGInvBpo: async ({ page }, use) => {
    await use(async () => {
      await loginGInvoice(page, process.env.TEST_GINV_BPO_EMAIL!, process.env.TEST_GINV_BPO_PASSWORD!)
    })
  },

  loginAsGInvCompliance: async ({ page }, use) => {
    await use(async () => {
      await loginGInvoice(page, process.env.TEST_GINV_COMPLIANCE_EMAIL!, process.env.TEST_GINV_COMPLIANCE_PASSWORD!)
    })
  },
})

export { expect } from '@playwright/test'
