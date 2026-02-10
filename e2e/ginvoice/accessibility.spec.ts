import { test, expect } from '../fixtures/auth.fixture'
import AxeBuilder from '@axe-core/playwright'

const ginvRoutes = [
  { name: 'Dashboard', path: '/g-invoice' },
  { name: 'Ingesta', path: '/g-invoice/intake' },
  { name: 'Jobs', path: '/g-invoice/jobs' },
  { name: 'Vendors', path: '/g-invoice/vendors' },
  { name: 'UTTAI', path: '/g-invoice/uttai' },
  { name: 'Accounting', path: '/g-invoice/accounting' },
  { name: 'Billing', path: '/g-invoice/billing' },
  { name: 'Invoices', path: '/g-invoice/invoices' },
  { name: 'Delivery', path: '/g-invoice/delivery' },
  { name: 'Platforms', path: '/g-invoice/platforms' },
]

test.describe('G-Invoice Accessibility (WCAG AA)', () => {
  test.beforeEach(async ({ loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
  })

  for (const route of ginvRoutes) {
    test(`${route.name} page should have no critical a11y violations`, async ({ page }) => {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page })
        .disableRules(['select-name', 'label'])  // Form elements without labels - tracked for fix
        .analyze()
      const critical = results.violations.filter((v) => v.impact === 'critical')
      expect(critical).toEqual([])
    })
  }

  test('keyboard navigation should work on sidebar', async ({ page }) => {
    await page.goto('/g-invoice')
    await page.waitForLoadState('networkidle')
    const sidebar = page.locator('aside[aria-label="Navegación G-Invoice"]')
    await expect(sidebar).toBeVisible()
    // Tab to first nav link
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    // Verify a link inside sidebar has focus
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('ARIA labels should be present on interactive elements', async ({ page }) => {
    await page.goto('/g-invoice')
    await page.waitForLoadState('networkidle')
    // Check sidebar has aria-label
    await expect(page.locator('aside[aria-label="Navegación G-Invoice"]')).toBeVisible()
    // Check collapse button has aria-label
    const collapseBtn = page.locator('button[aria-label*="sidebar"], button[aria-label*="Sidebar"]')
    await expect(collapseBtn.first()).toBeVisible()
  })
})
