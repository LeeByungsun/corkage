/* eslint-env node */

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const WEB_DIR = process.cwd();
const TEMP_ROOT = path.join(WEB_DIR, '.omx', 'tmp');
const PORT = process.env.STORE_QA_PORT ?? '3005';
const HOST = process.env.STORE_QA_HOST ?? 'localhost';

async function main() {
  const clientId = await resolveNaverClientId();

  if (!clientId) {
    throw new Error(
      'NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID is missing. Set it in web/.env.local before running qa:store-live-markers.',
    );
  }

  console.log(`Running store detail location map QA at http://${HOST}:${PORT}`);

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

test.describe('store detail location map QA harness', () => {
  test('renders a NAVER marker on a real store detail page', async ({ page }) => {
    test.slow();

    const response = await page.request.get('/api/stores?status=available');
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    const store = payload.stores.find((item) =>
      Number.isFinite(item.lat) && Number.isFinite(item.lng)
    );

    expect(store, 'expected at least one available store with coordinates').toBeTruthy();

    await page.goto('/store/' + store.placeId);

    await expect(page.getByRole('heading', { name: store.name })).toBeVisible();
    await expect(page.getByText('콜키지 정책은 방문 전 매장에 다시 확인하세요.')).toBeVisible();
    await expect(page.getByLabel(store.name + ' 위치 지도')).toHaveAttribute(
      'data-location-map-state',
      'ready',
      { timeout: 20_000 },
    );
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
