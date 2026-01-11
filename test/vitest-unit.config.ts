import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.ts'],
      exclude: [
        'node_modules',
        'dist',
        'test/e2e',
        '**/*.integration.test.ts',
        '**/*.e2e-test.ts',
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/__tests__/**',
          'src/main.ts',
          'src/**/*.module.ts',
          'src/seed/**',
        ],
        thresholds: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  }),
);
