import path from 'node:path';
import type { FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  console.log('🔧 Setting up E2E test environment...');

  // Ensure auth directory exists
  const authDir = path.join(process.cwd(), 'playwright/.auth');
  const fs = await import('node:fs');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  console.log('✅ E2E test environment setup complete');
}

export default globalSetup;
