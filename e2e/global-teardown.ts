/**
 * Playwright global teardown — runs once after ALL tests.
 * Cleans up G-Invoice seed data so the next run starts fresh.
 */
import { cleanupGInvSeedData } from './helpers/ginv-seed'

async function globalTeardown() {
  try {
    await cleanupGInvSeedData()
  } catch (err) {
    console.warn('⚠ G-Invoice cleanup failed:', err)
  }
}

export default globalTeardown
