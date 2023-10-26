import { hasDocsOrControls } from '@storybook/docs-tools';

import type { StorybookConfig } from './types';

export const webpackFinal: StorybookConfig['webpackFinal'] = async (config, options) => {
  if (!hasDocsOrControls(options)) return config;

  const typescriptOptions = await options.presets.apply<StorybookConfig['typescript']>(
    'typescript',
    {} as any
  );

  const { reactDocgen, reactDocgenTypescriptOptions } = typescriptOptions || {};

  if (reactDocgen !== 'react-docgen-typescript') {
    return config;
  }

  const { ReactDocgenTypeScriptPlugin } = await import('@storybook/react-docgen-typescript-plugin');

  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      new ReactDocgenTypeScriptPlugin({
        ...reactDocgenTypescriptOptions,
        // We *need* this set so that RDT returns default values in the same format as react-docgen
        savePropValueAsString: true,
      }),
    ],
  };
};
