import { resolve } from 'path';
import { defineConfig, defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'addons/*/vitest.config.ts',
  'frameworks/*/vitest.config.ts',
  'lib/*/vitest.config.ts',
  'deprecated/*/vitest.config.ts',
  'builders/*/vitest.config.ts',
  'ui/*/vitest.config.ts',
  'presets/*/vitest.config.ts',
  'renderers/*/vitest.config.ts',
]);

export const vitestCommonConfig = defineConfig({
  test: {
    clearMocks: true,
    setupFiles: [resolve(__dirname, './vitest-setup.ts')],
    globals: true,
  },
});
