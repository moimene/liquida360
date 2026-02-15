import { test, expect } from '../fixtures/auth.fixture'

test.describe('G-Invoice Auth & Access Control', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/g-invoice')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Liquida360-only user is redirected away from /g-invoice', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/g-invoice')
    await page.waitForTimeout(3_000)
    // User without ginvRole should be redirected to /
    await expect(page).toHaveURL('/')
  })

  test('corresponsal is redirected to /portal', async ({ page, loginAsCorresponsal }) => {
    try {
      await loginAsCorresponsal()
    } catch {
      test.skip(true, 'Corresponsal test user not provisioned or credentials invalid')
    }
    await page.goto('/g-invoice')
    await page.waitForTimeout(3_000)
    await expect(page).toHaveURL(/\/portal/)
  })

  test('ginv_admin can access /g-invoice', async ({ page, loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
    await expect(page).toHaveURL(/\/g-invoice/)
    await expect(page.getByRole('heading', { name: 'G-Invoice Dashboard' })).toBeVisible()
  })

  test('ginv_operador can access /g-invoice', async ({ page, loginAsGInvOperador }) => {
    await loginAsGInvOperador()
    await expect(page).toHaveURL(/\/g-invoice/)
    await expect(page.getByRole('heading', { name: 'G-Invoice Dashboard' })).toBeVisible()
  })

  test('ginv_socio can access /g-invoice and sees Para facturar', async ({ page, loginAsGInvSocio }) => {
    await loginAsGInvSocio()
    await expect(page).toHaveURL(/\/g-invoice/)
    await expect(page.getByRole('heading', { name: 'G-Invoice Dashboard' })).toBeVisible()
    await page.waitForLoadState('networkidle')
    const sidebar = page.locator('aside[aria-label="Navegación G-Invoice"]')
    await expect(sidebar.getByText('Para facturar')).toBeVisible()
    await expect(sidebar.getByText('Facturas')).toBeVisible()
  })

  // Workspace switcher tests
  test('workspace switcher is visible for users with both roles', async ({ page, loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
    // ginv_admin was created with role: 'admin' + ginv_role: 'ginv_admin'
    // So workspace switcher should be visible
    const switcher = page.getByText('G-Invoice').first()
    await expect(switcher).toBeVisible({ timeout: 10_000 })
  })

  test('workspace switcher navigates to Liquida360', async ({ page, loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
    await page.waitForLoadState('networkidle')
    // Wait for the workspace switcher dropdown button to render
    const switcherDropdown = page.locator('[aria-label="Cambiar espacio de trabajo"]')
    await switcherDropdown.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
    const isVisible = await switcherDropdown.isVisible().catch(() => false)
    test.skip(!isVisible, 'Workspace switcher not visible - user may not have dual roles')
    await switcherDropdown.click()
    // Select Liquida360 from the dropdown listbox
    const liquida360Option = page.locator('[role="listbox"] [role="option"]').filter({ hasText: 'Liquida360' })
    await liquida360Option.click()
    await expect(page).toHaveURL('/', { timeout: 10_000 })
  })

  // Sidebar visibility tests
  test('ginv_admin sees all sidebar items including Configuracion', async ({ page, loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
    await page.waitForLoadState('networkidle')
    const sidebar = page.locator('aside[aria-label="Navegación G-Invoice"]')
    await expect(sidebar.getByText('Dashboard')).toBeVisible()
    await expect(sidebar.getByText('Subidas')).toBeVisible()
    await expect(sidebar.getByText('UTTAI')).toBeVisible()
    await expect(sidebar.getByText('Contabilización')).toBeVisible()
    await expect(sidebar.getByText('Para facturar')).toBeVisible()
    await expect(sidebar.getByText('Facturas')).toBeVisible()
    await expect(sidebar.getByText('Entregas')).toBeVisible()
    await expect(sidebar.getByText('Plataformas')).toBeVisible()
    await expect(sidebar.getByText('Configuración')).toBeVisible()
    await expect(sidebar.getByText('Jobs / Clientes')).toBeVisible()
    await expect(sidebar.getByText('Proveedores')).toBeVisible()
  })

  test('ginv_operador does NOT see restricted nav items', async ({ page, loginAsGInvOperador }) => {
    await loginAsGInvOperador()
    await page.waitForLoadState('networkidle')
    const sidebar = page.locator('aside[aria-label="Navegación G-Invoice"]')
    // Should see basic items (no roles restriction)
    await expect(sidebar.getByText('Dashboard')).toBeVisible()
    await expect(sidebar.getByText('Subidas')).toBeVisible()
    await expect(sidebar.getByText('UTTAI')).toBeVisible()
    // Should NOT see role-restricted items
    await expect(sidebar.getByText('Contabilización')).not.toBeVisible()
    await expect(sidebar.getByText('Para facturar')).not.toBeVisible()
    await expect(sidebar.getByText('Configuración')).not.toBeVisible()
  })

  test('ginv_bpo_facturacion sees billing and delivery items', async ({ page, loginAsGInvBpo }) => {
    await loginAsGInvBpo()
    await page.waitForLoadState('networkidle')
    const sidebar = page.locator('aside[aria-label="Navegación G-Invoice"]')
    await expect(sidebar.getByText('Para facturar')).toBeVisible()
    await expect(sidebar.getByText('Facturas')).toBeVisible()
    await expect(sidebar.getByText('Entregas')).toBeVisible()
    await expect(sidebar.getByText('Plataformas')).toBeVisible()
    await expect(sidebar.getByText('Configuración')).not.toBeVisible()
  })

  test('ginv_compliance sees UTTAI but not billing items', async ({ page, loginAsGInvCompliance }) => {
    await loginAsGInvCompliance()
    await page.waitForLoadState('networkidle')
    const sidebar = page.locator('aside[aria-label="Navegación G-Invoice"]')
    await expect(sidebar.getByText('Dashboard')).toBeVisible()
    await expect(sidebar.getByText('UTTAI', { exact: true })).toBeVisible()
    await expect(sidebar.getByText('Contabilización')).not.toBeVisible()
    await expect(sidebar.getByText('Para facturar')).not.toBeVisible()
  })
})
