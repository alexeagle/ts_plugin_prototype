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
}

/**
 * A TypeScript language service plugin.
 */
export interface Plugin {
  create?(info: PluginCreateInfo): ts.LanguageService;
  wrap?(d: DiagnosticsProducer): DiagnosticsProducer;
}

// Partial copy of ts.Program (not in TypeScript upstream)
interface DiagnosticsProducer {
    getOptionsDiagnostics(cancellationToken?: ts.CancellationToken): ts.Diagnostic[];
    getGlobalDiagnostics(cancellationToken?: ts.CancellationToken): ts.Diagnostic[];
    getSyntacticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): ts.Diagnostic[];
    getSemanticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): ts.Diagnostic[];
    getDeclarationDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): ts.Diagnostic[];
}

/**
 * A TypeScript program diagnostics plugin (not in TypeScript upstream)
 */
export interface TscPlugin {}
