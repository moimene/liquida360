import { test, expect } from '../fixtures/auth.fixture'

test.describe('Logout', () => {
  test('should logout and redirect to login page', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    // Click user menu/logout button
    await page.getByRole('button', { name: /Cerrar sesi/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('should not access protected routes after logout', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.getByRole('button', { name: /Cerrar sesi/i }).click()
    await expect(page).toHaveURL(/\/login/)
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })
})
