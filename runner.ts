import * as ts from 'typescript';

import * as before from './eraseDecoratorsTransform';
import * as api from './plugin_api';
import * as plugin from './semanticDiagnosticPlugin';

function loadPlugins(configs?: api.PluginImport[]): api
    .Plugin[] {  // TODO: load Language Service plugins from node_modules like
  // tsserver.js does
  return [];
}

function check(diagnostics: ts.Diagnostic[]) {
  if (diagnostics && diagnostics.length > 0) {
    console.error(ts.formatDiagnostics(diagnostics, {
      getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
      getNewLine: () => ts.sys.newLine,
      // Print filenames including their rootDir, so they can be located on disk
      getCanonicalFileName: (f: string) => f
    }));
  }
}

function main() {
  // Normally these would be parsed from tsconfig.json
  const options: api.CompilerOptionsWithPlugins = {
    skipLibCheck: true,
    experimentalDecorators: true,
    outDir: 'built',
    module: ts.ModuleKind.CommonJS,
    noEmitOnError: false,
    plugins: [{name: 'plugin-that-also-works-in-editors'}],
  };

  const beforeTransforms = [before.transformer];
  const afterTransforms: ts.TransformerFactory<ts.SourceFile>[] = [];
  const plugins = loadPlugins(options.plugins);
  // Independent of the tsconfig, we can also hard-code some plugins
  plugins.push(plugin.PLUGIN);

  // Do the normal compilation flow
  const compilerHost = ts.createCompilerHost(options);
  const program = ts.createProgram(['test_file.ts'], options, compilerHost);
  let diagnoser: api.DiagnosticsProducer = program;
  plugins.forEach(p => {
    if ('wrap' in p) {
      diagnoser = p.wrap!(diagnoser);
    } else {
      throw new Error('No support for LanguageService plugins yet');
    }
  });

  let diags: ts.Diagnostic[] = [];

  diags.push(...diagnoser.getOptionsDiagnostics());
  diags.push(...diagnoser.getGlobalDiagnostics());
  for (let sf of program.getSourceFiles().filter(sf => !/\.d\.ts$/.test(sf.fileName))) {
    diags.push(...diagnoser.getSyntacticDiagnostics(sf));
    diags.push(...diagnoser.getSemanticDiagnostics(sf));
  }
  check(diags);

  const {diagnostics} = program.emit(
      undefined, undefined, undefined, undefined,
      {before: beforeTransforms, after: afterTransforms});
  check(diagnostics);
}

if (require.main === module) {
  main();
}
