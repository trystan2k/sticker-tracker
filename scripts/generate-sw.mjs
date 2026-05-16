import { generateSW } from 'workbox-build';
import { readFileSync } from 'fs';

// oxlint-disable-next-line no-console
const log = console.log;
// oxlint-disable-next-line no-console
const error = console.error;

// Verify dist/client exists before generating
try {
  readFileSync('dist/client/index.html');
} catch {
  error('dist/client/index.html not found. Run pnpm build first.');
  process.exit(1);
}

generateSW({
  globDirectory: 'dist/client',
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,wasm,gz}'],
  maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
  globIgnores: ['sw.js', 'server/**', 'ocr-core/**', 'ocr-lang/**'],
  swDest: 'dist/client/sw.js',
  navigateFallback: '/index.html',
  runtimeCaching: [
    {
      urlPattern: /^\/(assets|images|fonts)\//i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-assets-v1',
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }
      }
    },
    {
      urlPattern: /^\/ocr-core\//i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'ocr-core-v1',
        expiration: { maxEntries: 32, maxAgeSeconds: 365 * 24 * 60 * 60 }
      }
    },
    {
      urlPattern: /^\/ocr-lang\//i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'ocr-lang-v1',
        expiration: { maxEntries: 16, maxAgeSeconds: 365 * 24 * 60 * 60 }
      }
    },
    {
      urlPattern: ({ request }) =>
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'font',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources-v1',
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }
      }
    },
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-v1',
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }
      }
    }
  ],
  skipWaiting: false,
  clientsClaim: false,
  cleanupOutdatedCaches: true
})
  .then(({ count, size }) => {
    log(`Generated service worker: ${count} files, ${size} bytes`);
    return { count, size };
  })
  .catch((err) => {
    error('SW generation failed:', err);
    process.exit(1);
  });
