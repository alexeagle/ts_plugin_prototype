/**
 * @fileoverview
 * Provides APIs from TypeScript 2.3 lib/tsserverlibrary.d.ts
 */

import * as ts from 'typescript';

/**
 * The JSON configuration object from the plugins section of the tsconfig.
 */
export type PluginImport = {
  name: string
} & {[key: string]: any};

type CompilerOptionsWithPlugins = ts.CompilerOptions&{
  // Copy from src/compiler/types.ts
  /*@internal*/ plugins?: ts.PluginImport[];
}

/**
 * Provided to plugins upon creation.
 * from typescript/lib/tsserverlibrary.d.ts
 */
export interface PluginCreateInfo {
  languageService: ts.LanguageService;
  languageServiceHost: ts.LanguageServiceHost;
  config: PluginImport;
  project: /*ts.Project from tsserver.js*/ any;
}

export interface PluginModule {
    create(createInfo: PluginCreateInfo): ts.LanguageService;
    config: any;
}

export interface PluginModuleFactory {
    (mod: { typescript: typeof ts }): PluginModule;
}

/**
 * This API is simpler, for plugins that only target the command-line and never
 * run in an editor context.
 */
export interface TscPlugin {
  wrap(d: ts.Program): ts.Program;
}

export type Plugin = PluginModule | TscPlugin;
