import { test, expect } from '../fixtures/auth.fixture'

test.describe('Role-based Access Control', () => {
  test('admin can access settings page', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: /Configuracion/i })).toBeVisible()
  })

  test('pagador cannot access settings page', async ({ page, loginAsPagador }) => {
    await loginAsPagador()
    await page.goto('/settings')
    // Should redirect away from settings
    await expect(page).not.toHaveURL(/\/settings/)
  })

  test('financiero can access payments page', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    await page.goto('/payments')
    await expect(page.getByRole('heading', { name: /Cola de Pagos/i })).toBeVisible()
  })

  test('supervisor cannot access payments page', async ({ page, loginAsSupervisor }) => {
    await loginAsSupervisor()
    await page.goto('/payments')
    // Should redirect away from payments
    await expect(page).not.toHaveURL(/\/payments/)
  })

  test('corresponsal is redirected to portal from internal routes', async ({ page, loginAsCorresponsal }) => {
    await loginAsCorresponsal()
    await page.goto('/')
    await expect(page).toHaveURL(/\/portal/)
  })

  test('internal user cannot access portal routes', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/portal')
    await expect(page).not.toHaveURL(/\/portal/)
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user cannot access portal', async ({ page }) => {
    await page.goto('/portal')
    await expect(page).toHaveURL(/\/login/)
  })
})
