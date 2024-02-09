import { vi, describe, it, expect, afterEach } from 'vitest';
import type { StorybookConfig } from '@storybook/types';
import type { JsPackageManager } from '@storybook/core-common';
import { webpack5Migration } from './webpack5-compiler-setup';
import { beforeEach } from 'node:test';

const check = async ({
  packageManager,
  mainConfig,
  storybookVersion = '8.0.0',
}: {
  packageManager: Partial<JsPackageManager>;
  main?: Partial<StorybookConfig> & Record<string, unknown>;
  storybookVersion?: string;
  mainConfig?: Partial<StorybookConfig>;
}) => {
  return webpack5Migration.check({
    packageManager: packageManager as any,
    configDir: '',
    storybookVersion,
    mainConfig: mainConfig as any,
  });
};

describe('webpack5Migration check function', () => {
  // mock 'prompts' package. I am in a vitest environment.
  // Do not use jest

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('return null', () => {
    beforeEach(() => {
      vi.mock('prompts', () => {
        return {
          default: () => {
            return Promise.resolve({
              compiler: 'babel',
            });
          },
        };
      });
    });

    it('should return null if the builder is not webpack5', async () => {
      const result = check({
        packageManager: {
          getPackageVersion: (name) => {
            if (name === 'webpack') {
              return Promise.resolve(null);
            }

            return Promise.resolve(null);
          },
        },
        mainConfig: {
          framework: {
            name: '@storybook/react-vite',
            options: { builder: '@storybook/react-vite' },
          },
        },
      });

      await expect(result).resolves.toBeNull();
    });

    it('should return null if the framework is angular', async () => {
      const result = check({
        packageManager: {
          getPackageVersion: (name) => {
            if (name === 'webpack') {
              return Promise.resolve('5.0.0');
            }

            return Promise.resolve(null);
          },
        },
        mainConfig: {
          framework: {
            name: '@storybook/react-webpack5',
            options: { builder: '@storybook/react-vite' },
          },
        },
      });

      await expect(result).resolves.toBeNull();
      // ...
    });

    it('should return null if the framework is ember', () => {
      // ...
    });

    it('should return null if the framework is CRA based', () => {
      // ...
    });
  });

  describe('useSWC', () => {
    it('should return shouldRemoveSWCFlag: true when useSWC flag is set to true', () => {
      // ...
    });

    it('should return shouldRemoveSWCFlag: true when useSWC flag is set to false', () => {
      // ...
    });

    it('should return shouldRemoveSWCFlag: false when useSWC flag is not set', () => {
      // ...
    });
  });

  describe('Next.js', () => {
    it('should return isNextJs: true when the framework is nextjs', () => {
      // ...
    });

    it('should return isNextJs: false when the framework is not nextjs', () => {
      // ...
    });
  });

  describe('return options', () => {
    it('should return compiler: babel when useSWC flag is not set and the user manually selects babel', () => {
      // ...
    });

    it('should return compiler: swc when useSWC flag is not set and the user manually selects swc', () => {
      // ...
    });

    it('should return compiler: swc when useSWC flag is set', () => {
      // ...
    });
  });
});
