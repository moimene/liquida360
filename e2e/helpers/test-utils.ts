import { Page, expect } from '@playwright/test'

export async function waitForToast(page: Page, text: string | RegExp) {
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: text })
  await expect(toast.first()).toBeVisible({ timeout: 10_000 })
  return toast.first()
}

export async function waitForTableLoaded(page: Page) {
  // Wait for skeleton/loading to disappear
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.skeleton')).toHaveCount(0, { timeout: 10_000 }).catch(() => {})
}

export async function getTableRowCount(page: Page) {
  await waitForTableLoaded(page)
  return page.locator('tbody tr').count()
}

export async function hasTableData(page: Page) {
  await waitForTableLoaded(page)
  const emptyState = page.getByText(/No se encontraron|No hay .* registrad|No hay solicitudes/i)
  const isEmpty = await emptyState.isVisible().catch(() => false)
  if (isEmpty) return false
  const rowCount = await page.locator('tbody tr').count()
  return rowCount > 0
}

export async function expectBreadcrumbs(page: Page, items: string[]) {
  const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
  await expect(breadcrumbs).toBeVisible()
  for (const item of items) {
    await expect(breadcrumbs.getByText(item)).toBeVisible()
  }
}

export function generateTestId(prefix: string) {
  return `${prefix}-e2e-${Date.now()}`
}
