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
    // Subtitle shows unread count or "Todas las notificaciones leidas"
    const subtitle = page.getByText(/sin leer|Todas las notificaciones le/i)
    await expect(subtitle).toBeVisible()
  })

  test('should have mark all as read button when unread exist', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/notifications')
    // Button text is "Marcar todo como leido" (with accent)
    const markAllButton = page.getByRole('button', { name: /Marcar todo como le/i })
    // Button only shows when there are unread notifications
    const hasUnread = await markAllButton.isVisible().catch(() => false)
    if (hasUnread) {
      await expect(markAllButton).toBeVisible()
    } else {
      // If no unread notifications, verify "Todas las notificaciones leidas" text instead
      await expect(page.getByText(/Todas las notificaciones le/i)).toBeVisible()
    }
  })

  test('should navigate to related entity on click', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    await page.goto('/notifications')
    // Notification items are button elements
    const notificationItem = page.locator('button').filter({ hasText: /liquidaci|certificado|pago|Solicitud/i }).first()
    const hasNotification = await notificationItem.isVisible().catch(() => false)
    test.skip(!hasNotification, 'No notifications with entity links')
    await notificationItem.click()
    // Should navigate away from notifications
    await expect(page).not.toHaveURL(/\/notifications$/)
  })

  test('portal corresponsal can view notifications', async ({ page, loginAsCorresponsal }) => {
    await loginAsCorresponsal()
    await page.goto('/portal/notifications')
    await expect(page).toHaveURL(/\/portal\/notifications/)
  })
})
