import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';

import viteReact from '@vitejs/plugin-react';

import mkcert from 'vite-plugin-mkcert';

import killerInstincts from 'vite-plugin-killer-instincts';

const config = defineConfig({
  server: {
    port: 4000,
    strictPort: true
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    ...tanstackStart({
      router: {
        routesDirectory: './routes',
        generatedRouteTree: './routeTree.gen.ts',
        enableRouteGeneration: true,
        quoteStyle: 'single'
      },
      spa: {
        enabled: true,
        prerender: {
          outputPath: '/index'
        }
      }
    }),
    viteReact(),
    killerInstincts({ autoKill: true }),
    mkcert()
  ]
});

export default config;
