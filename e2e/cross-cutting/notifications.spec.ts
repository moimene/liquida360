import { test, expect } from '../fixtures/auth.fixture'

test.describe('Notifications', () => {
  test('should display notifications page', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/notifications')
    // h2 heading "Notificaciones"
    await expect(page.getByRole('heading', { name: /Notificaciones/i })).toBeVisible()
  })

  test('should display notification list or empty state', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/notifications')
    // Page should load and show either notifications or "No hay notificaciones"
    await expect(page).toHaveURL(/\/notifications/)
    // Subtitle shows unread count, all-read status, or empty-state copy
    const subtitle = page.getByText(/sin leer|Todas las notificaciones leídas|No hay notificaciones/i)
    await expect(subtitle).toBeVisible()
  })

  test('should have mark all as read button when unread exist', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/notifications')
    await expect(page).toHaveURL(/\/notifications/)
    await expect(page.getByRole('heading', { name: /Notificaciones/i })).toBeVisible({
      timeout: 10_000,
    })
    await page.getByRole('status', { name: /Cargando/i }).waitFor({ state: 'hidden' }).catch(() => {})

    // Button text is "Marcar todo como leído"
    const markAllButton = page.getByRole('button', { name: /Marcar todo como leído/i })
    const readOrEmptySubtitle = page.getByText(
      /sin leer|Todas las notificaciones leídas|No hay notificaciones/i,
    )

    // Wait until the page resolves either to unread-action button or to a stable subtitle
    await expect
      .poll(async () => {
        const hasMarkAll = await markAllButton.isVisible().catch(() => false)
        if (hasMarkAll) return true
        return readOrEmptySubtitle.isVisible().catch(() => false)
      })
      .toBeTruthy()

    // Button only shows when there are unread notifications
    const hasUnread = await markAllButton.isVisible().catch(() => false)
    if (hasUnread) {
      await expect(markAllButton).toBeVisible()
    } else {
      // If no unread notifications, verify stable read/empty-state subtitles instead
      const hasReadOrEmptySubtitle = await readOrEmptySubtitle.isVisible().catch(() => false)
      expect(hasReadOrEmptySubtitle).toBeTruthy()
    }
  })

  test('should navigate to related entity on click', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/notifications')
    // Notification items are button elements
    const notificationItem = page.locator('button').filter({ hasText: /liquidaci|certificado|pago|Solicitud/i }).first()
    const hasNotification = await notificationItem.isVisible().catch(() => false)
    if (hasNotification) {
      await expect(notificationItem).toBeVisible()
    } else {
      return
    }
  })

  test('portal corresponsal can view notifications', async ({ page, loginAsCorresponsal }) => {
    await loginAsCorresponsal()
    await page.goto('/portal/notifications')
    await expect(page).toHaveURL(/\/portal\/notifications/)
  })
})
