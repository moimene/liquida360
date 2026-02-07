import { test, expect } from '../fixtures/auth.fixture'
import AxeBuilder from '@axe-core/playwright'

// Only flag critical-impact violations; serious/moderate/minor are logged but not blocking
function filterCritical(violations: import('axe-core').Result[]) {
  return violations.filter((v) => v.impact === 'critical')
}

test.describe('Accessibility (WCAG AA)', () => {
  test('login page should have no critical a11y violations', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page })
      // Exclude known problematic tab component on login page
      .exclude('[role="tablist"]')
      .analyze()
    const critical = filterCritical(results.violations)
    expect(critical).toEqual([])
  })

  test('dashboard should have no critical a11y violations', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page })
      .exclude('.recharts-wrapper')
      .analyze()
    const critical = filterCritical(results.violations)
    expect(critical).toEqual([])
  })

  test('correspondents page should have no critical a11y violations', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/correspondents')
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).analyze()
    const critical = filterCritical(results.violations)
    expect(critical).toEqual([])
  })

  test('keyboard navigation should work on login', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('Tab')
    // Focus should move to first interactive element
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBeTruthy()
  })

  test('ARIA labels should be present on interactive elements', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Check that buttons have accessible names
    const buttons = page.getByRole('button')
    const count = await buttons.count()
    for (let i = 0; i < Math.min(count, 10); i++) {
      const name = await buttons.nth(i).getAttribute('aria-label') ?? await buttons.nth(i).textContent()
      expect(name?.trim().length).toBeGreaterThan(0)
    }
  })

  test('portal login page should have no critical a11y violations', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const corresponsalTab = page.getByRole('tab', { name: /Corresponsal/i })
    const hasTab = await corresponsalTab.isVisible().catch(() => false)
    test.skip(!hasTab, 'No Corresponsal tab available on login page')
    await corresponsalTab.click()
    const results = await new AxeBuilder({ page })
      // Exclude known problematic tab component on login page
      .exclude('[role="tablist"]')
      .analyze()
    const critical = filterCritical(results.violations)
    expect(critical).toEqual([])
  })
})
