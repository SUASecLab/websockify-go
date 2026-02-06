import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $assets: path.resolve("./src/assets"),
      $lib: path.resolve("./src/lib")
    }
  },
  // Silence Sass deprecation warnings.
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: [
          'import',
          'color-functions',
          'global-builtin',
        ],
      },
    },
  },
});
