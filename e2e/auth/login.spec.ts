import { test, expect } from '../fixtures/auth.fixture'
import { LoginPage } from '../pages/login.page'

test.describe('Login', () => {
  test('should display login page with access mode selector', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await expect(loginPage.internalTab).toBeVisible()
    await expect(loginPage.corresponsalTab).toBeVisible()
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
  })

  test('should login as internal user and redirect to dashboard', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('should login as corresponsal and redirect to portal', async ({ page, loginAsCorresponsal }) => {
    await loginAsCorresponsal()
    await expect(page).toHaveURL(/\/portal/)
    await expect(page.getByText(/Bienvenido/i)).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAsInternal('invalid@test.com', 'wrongpassword')
    await expect(loginPage.errorAlert).toBeVisible()
  })

  test('should show error or redirect when internal user tries portal mode', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAsCorresponsal(
      process.env.TEST_ADMIN_EMAIL!,
      process.env.TEST_ADMIN_PASSWORD!,
    )
    // The app may show an error alert or redirect the admin back to internal dashboard
    await page.waitForTimeout(3_000)
    const url = page.url()
    const hasError = await loginPage.errorAlert.isVisible().catch(() => false)
    // Either we get an error, or we get redirected away from /portal
    expect(hasError || !url.includes('/portal')).toBeTruthy()
  })

  test('should switch between internal and portal mode', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await loginPage.corresponsalTab.click()
    await expect(loginPage.page.getByRole('button', { name: /Acceder al portal/i })).toBeVisible()
    await expect(loginPage.registerLink).toBeVisible()

    await loginPage.internalTab.click()
    await expect(loginPage.submitButton).toBeVisible()
    await expect(loginPage.registerLink).not.toBeVisible()
  })

  test('should persist session after page refresh', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.reload()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('should require email and password fields', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.submitButton.click()
    // HTML5 validation prevents submission
    await expect(page).toHaveURL(/\/login/)
  })
})
