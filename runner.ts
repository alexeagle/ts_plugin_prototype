import * as ts from 'typescript';

import * as before from './eraseDecoratorsTransform';
import * as api from './plugin_api';
import * as tscPlugin from './tscPlugin';

function loadPlugins(configs?: api.PluginImport[]): api.Plugin[] {
  if (!configs) return [];

  return configs.map(c => {
    const factory: api.PluginModuleFactory = require(c.name);
    const result = factory({typescript: ts});
    result.config = c;
    return result;
  });
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

function isLanguageServicePlugin(p: api.Plugin): p is api.PluginModule {
  return 'create' in p;
}

/**
 * Downgrade a LanguageService plugin to work in `tsc` by mocking the
 * LanguageService and LanguageServiceHost to work against a static ts.Program.
 */
function wrapLanguageServicePlugin(p: api.PluginModule): api.TscPlugin {
  return {
    wrap: (program: ts.Program) => {
      const languageService: ts.LanguageService = {
        getSemanticDiagnostics: (fileName: string) => [],
        getSyntacticDiagnostics: (fileName: string) => [],
        getCompilerOptionsDiagnostics: () => [],
        getProgram: () => program,
      } as any;
      const languageServiceHost: ts.LanguageServiceHost = {
        getScriptFileNames: () =>
                                program.getSourceFiles().map(sf => sf.fileName),
        getScriptSnapshot: (name: string) => {
          const file = program.getSourceFile(name);
          if (!file) return null;
          return ts.ScriptSnapshot.fromString(file.getFullText());
        },
        getScriptVersion: () => "1",
      } as any;
      const project = {projectService: {logger: console}};
      const langSvc = p.create({
        languageService,
        languageServiceHost,
        project,
        config: p.config,
      });
      const proxy = Object.create(null) as ts.Program;
      for (const k of Object.keys(program)) {
        proxy[k] = function() {
          return program[k].apply(program, arguments);
        }
      }
      proxy.getSemanticDiagnostics = (sourceFile: ts.SourceFile) =>
          langSvc.getSemanticDiagnostics(sourceFile.fileName);
      proxy.getSyntacticDiagnostics = (sourceFile: ts.SourceFile) =>
          langSvc.getSyntacticDiagnostics(sourceFile.fileName);
      proxy.getOptionsDiagnostics = () =>
          langSvc.getCompilerOptionsDiagnostics();
      return proxy;
    }
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
    plugins: [{name: '@angular/language-service'}],
  };

  const beforeTransforms = [before.transformer];
  const afterTransforms: ts.TransformerFactory<ts.SourceFile>[] = [];
  const plugins = loadPlugins(options.plugins);
  // Independent of the tsconfig, we can also hard-code some plugins
  plugins.push(tscPlugin.PLUGIN);

  // Do the normal compilation flow
  const compilerHost = ts.createCompilerHost(options);
  const program = ts.createProgram(['example/main.ts'], options, compilerHost);
  let diagnoser = program;
  plugins.forEach(p => {
    if (isLanguageServicePlugin(p)) {
      diagnoser = wrapLanguageServicePlugin(p).wrap(diagnoser);
    } else {
      diagnoser = p.wrap(diagnoser);
    }
  });

  let diags: ts.Diagnostic[] = [];

  diags.push(...diagnoser.getOptionsDiagnostics());
  diags.push(...diagnoser.getGlobalDiagnostics());
  for (let sf of program.getSourceFiles().filter(
           sf => !/\.d\.ts$/.test(sf.fileName))) {
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
