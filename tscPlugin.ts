import * as ts from 'typescript';
import * as api from './plugin_api';

// As an example, just report a dummy diagnostic at the start of the file
function getDiagnostics(sourceFile: ts.SourceFile): ts.Diagnostic[] {
  return [{
    category: ts.DiagnosticCategory.Warning,
    file: sourceFile,
    code: 9999,
    length: 3,
    messageText: `TSC plugin diagnostic`,
    start: 0
  }];
}

// Expose as a diagnostic wrapper around a ts.Program
function wrap(d: ts.Program): ts.Program {
  const proxy = Object.create(null) as ts.Program;
  for (const k of Object.keys(d)) {
    proxy[k] = function() {
      return d[k].apply(d, arguments);
    }
  }
  proxy.getSemanticDiagnostics = function(sourceFile: ts.SourceFile) {
    const result = d.getSemanticDiagnostics(sourceFile);
    result.push(...getDiagnostics(sourceFile));
    return result;
  };
  return proxy;
}

export const PLUGIN: api.Plugin = {wrap};
