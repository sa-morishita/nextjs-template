import type { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');

  // Perform any necessary cleanup
  console.log('✅ E2E test environment cleanup complete');
}

export default globalTeardown;
