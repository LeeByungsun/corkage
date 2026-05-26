/* eslint-env node */

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const WEB_DIR = process.cwd();
const TEMP_ROOT = path.join(WEB_DIR, '.omx', 'tmp');
const PORT = process.env.STORE_QA_PORT ?? '3005';
const HOST = process.env.STORE_QA_HOST ?? '127.0.0.1';

async function main() {
  const clientId = await resolveNaverClientId();

  if (!clientId) {
    throw new Error(
      'NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID is missing. Set it in web/.env.local before running qa:store-live-markers.',
    );
  }

  await mkdir(TEMP_ROOT, { recursive: true });
  const tempDir = await mkdtemp(path.join(TEMP_ROOT, 'store-live-marker-qa-'));

  try {
    const specPath = path.join(tempDir, 'store-live-marker.spec.mjs');
    const configPath = path.join(tempDir, 'playwright.config.mjs');

    await mkdir(tempDir, { recursive: true });
    await writeFile(specPath, buildSpec(), 'utf8');
    await writeFile(configPath, buildConfig(), 'utf8');

    await run(
      'npx',
      ['playwright', 'install', 'chromium'],
      { cwd: WEB_DIR },
    );

    await run(
      'npx',
      [
        'playwright',
        'test',
        '--config',
        configPath,
      ],
      { cwd: WEB_DIR },
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function resolveNaverClientId() {
  const envPath = path.join(WEB_DIR, '.env.local');

  try {
    const envText = await readFile(envPath, 'utf8');
    const line = envText
      .split('\n')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith('NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID='));

    if (!line) {
      return '';
    }

    return line.split('=', 2)[1]?.trim().replace(/^['"]|['"]$/g, '') ?? '';
  } catch {
    return '';
  }
}

function buildConfig() {
  return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: ${JSON.stringify('.')},
  testMatch: /store-live-marker\\.spec\\.mjs$/,
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  outputDir: ${JSON.stringify(path.join(WEB_DIR, '.omx', 'playwright-results', 'store-live-marker'))},
  reporter: 'list',
  use: {
    baseURL: 'http://${HOST}:${PORT}',
    permissions: ['geolocation'],
    geolocation: { latitude: 37.5252, longitude: 127.0482 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 1024 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --hostname ${HOST} --port ${PORT}',
    cwd: ${JSON.stringify(WEB_DIR)},
    port: ${Number(PORT)},
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
`;
}

function buildSpec() {
  return `import { expect, test } from '@playwright/test';

test.describe('store live marker QA harness', () => {
  test('renders selected and nearest NAVER marker states on real /store map', async ({ page }) => {
    test.slow();

    await page.goto('/store');

    await expect(
      page.getByRole('button', { name: '현재 위치 가져오기' }),
    ).toBeVisible();

    const cardButtons = page.getByRole('button', { name: /카드 선택$/ });
    const markerStates = page.locator('[data-marker-state]');

    await expect(markerStates.first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-marker-state="default"]').first()).toBeVisible();

    await cardButtons.first().click();
    await expect(
      page.locator('[data-marker-state="selected"], [data-marker-state="selected-nearest"]').first(),
    ).toBeVisible();

    await page.getByRole('button', { name: '현재 위치 가져오기' }).click();
    await expect(page.getByText(/현재 위치 기준 정렬/)).toBeVisible();
    await expect(
      page.locator('[data-marker-state="nearest"], [data-marker-state="selected-nearest"]').first(),
    ).toBeVisible({ timeout: 20_000 });

    await cardButtons.first().click();
    await expect(
      page.locator('[data-marker-state="selected-nearest"]').first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
`;
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
    });

    child.on('error', reject);
  });
}

await main();
