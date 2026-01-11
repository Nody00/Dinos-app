import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['src/**/*.integration.test.ts'],
      exclude: ['node_modules', 'dist', 'test/e2e'],
    },
  }),
);
