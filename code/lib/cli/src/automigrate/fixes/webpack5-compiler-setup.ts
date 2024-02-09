import prompts from 'prompts';
import type { SupportedFrameworks } from '@storybook/types';
import { frameworkPackages } from '@storybook/core-common';
import type { Fix } from '../types';
import {
  getBuilderPackageName,
  getFrameworkOptions,
  getFrameworkPackageName,
  updateMainConfig,
} from '../helpers/mainConfigFile';
import { frameworkToDefaultBuilder } from '../../helpers';
import {
  CoreBuilder,
  CoreWebpackCompilers,
  builderNameToCoreBuilder,
  compilerNameToCoreCompiler,
} from '../../project_types';
import dedent from 'ts-dedent';
import chalk from 'chalk';
import { add } from '../../add';

type Options = {
  compiler: CoreWebpackCompilers;
  compilerPackageName: keyof typeof compilerNameToCoreCompiler | undefined;
  shouldRemoveSWCFlag: boolean;
  isNextJs: boolean;
};

export const webpack5Migration: Fix<Options> = {
  id: 'webpack5-compiler-setup',

  async check({ mainConfig, packageManager }) {
    const frameworkName = Object.entries(frameworkPackages).find(
      ([name]) => name === getFrameworkPackageName(mainConfig)
    )?.[1];

    const builderPackageName = getBuilderPackageName(mainConfig);
    const customCoreBuilder = builderPackageName
      ? builderNameToCoreBuilder[builderPackageName]
      : null;

    const defaultCoreBuilder = frameworkName
      ? frameworkToDefaultBuilder[frameworkName]
      : await (async () => {
          const webpackVersion = await packageManager.getPackageVersion('webpack');
          return !!webpackVersion ? CoreBuilder.Webpack5 : CoreBuilder.Vite;
        })();

    console.log(defaultCoreBuilder);

    const builder = customCoreBuilder || defaultCoreBuilder;

    if (builder !== CoreBuilder.Webpack5) {
      return null;
    }

    const excludedFrameworks: SupportedFrameworks[] = ['angular', 'ember'];

    const isExcludedFramework = frameworkName ? excludedFrameworks.includes(frameworkName) : false;

    console.log({ excludedFrameworks, frameworkName });

    // TODO detect react-scripts

    if (isExcludedFramework) {
      return null;
    }

    const frameworkOptions = getFrameworkOptions(mainConfig);

    const defaultCompiler = frameworkOptions?.builder?.useSWC
      ? CoreWebpackCompilers.SWC
      : CoreWebpackCompilers.Babel;

    const compiler: CoreWebpackCompilers =
      defaultCompiler === CoreWebpackCompilers.Babel
        ? await askUserForCompilerChoice()
        : CoreWebpackCompilers.SWC;

    const compilerPackageName = Object.entries(compilerNameToCoreCompiler).find(
      ([, coreCompiler]) => coreCompiler === compiler
    )?.[0];

    return {
      compiler,
      compilerPackageName,
      shouldRemoveSWCFlag: frameworkOptions?.builder ? 'useSWC' in frameworkOptions.builder : false,
      isNextJs: frameworkName === 'nextjs',
    };
  },

  prompt({ compiler, compilerPackageName, shouldRemoveSWCFlag, isNextJs }) {
    const message = [];

    if (shouldRemoveSWCFlag) {
      message.push(dedent`
      We need to update your Storybook configuration for Webpack 5.
      The ${chalk.yellow('framework.options.builder.useSWC')} flag will be removed.`);
    }

    if (isNextJs) {
      message.push(dedent`
      Storybook now detects whether it should use Babel or SWC as a compiler by applying the same logic as Next.js itself.
      If you have a ${chalk.yellow(
        'babel.config.js'
      )} file in your project, Storybook will use Babel as the compiler.
      If you have a ${chalk.yellow(
        'babel.config.js'
      )} file in your project and you have set ${chalk.yellow(
        'experimental.forceSwcTransforms = true'
      )} in your next.config.js file, Storybook will use SWC as the compiler.
      If you don't have a babel.config.js file in your project, Storybook will use SWC as the compiler.
      `);
    } else if (compilerPackageName) {
      message.push(dedent`
      The ${chalk.cyan(
        compilerPackageName
      )} addon will be added to your project. It adds ${compiler} as the compiler for your Storybook.
      After the migration, you can switch Webpack5 compilers by swapping the addon in your project.
      You can find more information here: ${chalk.yellow(
        'https://storybook.js.org/docs/8.0/builders/webpack#compiler-support'
      )}
      `);
    }

    return message.join('\n');
  },

  async run({ result, mainConfigPath, packageManager, skipInstall, dryRun }) {
    const { compilerPackageName, shouldRemoveSWCFlag, isNextJs } = result;

    if (shouldRemoveSWCFlag) {
      await updateMainConfig({ mainConfigPath, dryRun: !!dryRun }, (main) => {
        main.removeField(['framework', 'options', 'builder', 'useSWC']);
      });
    }

    if (!isNextJs && compilerPackageName) {
      await add(compilerPackageName, {
        packageManager: packageManager.type,
        skipPostinstall: !!skipInstall,
      });
    }
  },
};

async function askUserForCompilerChoice() {
  const response = await prompts<'compiler'>({
    type: 'select',
    name: 'compiler',
    message: `Storybook's Webpack5 builder is now compiler agnostic, meaning you can choose a compiler addon that best fits your project:
Babel - A vast ecosystem and is battle-tested. It's a robust choice if you have an extensive Babel setup or need specific Babel plugins for your project.
SWC - Fast and easy to configure. Ideal if you want faster builds and have a straightforward configuration without the need for Babel's extensibility.
Which compiler would you like to use?`,
    choices: [
      {
        title: 'Babel',
        description: 'Choose Babel for a vast ecosystem and battle-tested reliability.',
        value: CoreWebpackCompilers.Babel,
      },
      {
        title: 'SWC',
        description: 'Choose SWC for fast builds and simple configuration.',
        value: CoreWebpackCompilers.SWC,
      },
    ],
    initial: 0,
  });

  return response.compiler as CoreWebpackCompilers;
}
