/**
 * Playwright global setup — runs once before ALL tests.
 * Seeds G-Invoice tables with realistic data so skipped tests get unlocked.
 */
import { seedGInvTestData } from './helpers/ginv-seed'

async function globalSetup() {
  try {
    await seedGInvTestData()
  } catch (err) {
    console.warn('⚠ G-Invoice seed failed (tables may not exist):', err)
    // Don't throw — existing Liquida360 tests should still run
  }
}

export default globalSetup
