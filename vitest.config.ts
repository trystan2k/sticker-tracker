import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

import appViteConfig from './vite.config';

export default defineConfig({
  ...appViteConfig,
  test: {
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/routeTree.gen.ts',
        'src/start.ts',
        'src/routes/__root.tsx',
        'src/routes/index.tsx'
      ],
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80
      }
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
          exclude: ['test/**/*.browser.test.ts', 'test/**/*.browser.test.tsx'],
          setupFiles: ['./test/setup/shared.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['test/**/*.browser.test.ts', 'test/**/*.browser.test.tsx'],
          setupFiles: ['./test/setup/browser.ts'],
          browser: {
            enabled: true,
            // @ts-ignore
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false
          },
          testTimeout: 60000,
          hookTimeout: 30000
        }
      }
    ]
  }
});
