import * as ts from 'typescript';
import * as plugin from './semanticDiagnosticPlugin';

const options: ts.CompilerOptions = {
  skipLibCheck: true,
};

const compilerHost = ts.createCompilerHost(options);
const program = ts.createProgram(['test_file.ts'], options, compilerHost);
const diags1 = ts.getPreEmitDiagnostics(program);
console.error(
    'Diagnostics from compiler\n', ts.formatDiagnostics(diags1, compilerHost));

// Wrap a readonly LanguageServiceHost around the program
const host: ts.LanguageServiceHost = {
  getCompilationSettings: () => program.getCompilerOptions(),
  getCurrentDirectory: () => program.getCurrentDirectory(),
  getDefaultLibFileName: () => 'lib.d.ts',
  getScriptFileNames: () => program.getSourceFiles().map((sf) => sf.fileName),
  getScriptSnapshot: (name: string) => {
    return ts.ScriptSnapshot.fromString(
        program.getSourceFile(name).getFullText());
  },
  getScriptVersion: (name: string) => '1',
  log: () => { /* */ },
};

let langSvc = ts.createLanguageService(host, ts.createDocumentRegistry());
langSvc = plugin.create({languageService: langSvc, languageServiceHost: host, config: options});
const diags2: ts.Diagnostic[] = [];
program.getSourceFiles().forEach(f => diags2.push(...langSvc.getSemanticDiagnostics(f.fileName)));
console.error('Diagnostics from language service\n', ts.formatDiagnostics(diags2, compilerHost));
