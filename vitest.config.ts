import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    // Use different environments based on test file location
    environmentMatchGlobs: [
      ['client/**/*.test.{ts,tsx}', 'jsdom'],
      ['server/**/*.test.ts', 'node'],
      ['shared/**/*.test.ts', 'node'],
    ],
    environment: 'node', // Default environment
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'build', '.cursor'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.config.ts',
        'k8s/',
        'docs/',
        'client/src/components/ui/', // Exclude UI components from coverage
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@server': path.resolve(__dirname, './server'),
    },
  },
});

