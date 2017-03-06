import * as ts from 'typescript';
import * as api from './plugin_api';

// As an example, just report a dummy diagnostic at the start of the file
function getDiagnostics(sourceFile: ts.SourceFile): ts.Diagnostic[] {
  return [{
      category: ts.DiagnosticCategory.Warning,
      file: sourceFile,
      code: 9999,
      length: 3,
      messageText: `Plugin diagnostic`,
      start: 0
    }];
}

// Expose the getDiagnostics as a LanguageService plugin
// Based on https://github.com/Microsoft/TypeScript/blob/87b780d641de2f24d177624f96c567d873b79ba6/src/harness/harnessLanguageService.ts#L796
function create(info: api.PluginCreateInfo) {
  const proxy = Object.create(null);
  const langSvc = info.languageService;
  for (const k of Object.keys(langSvc)) {
    proxy[k] = function() {
      return langSvc[k].apply(langSvc, arguments);
    };
  }
  proxy.getSemanticDiagnostics = function(filename) {
    const prev = info.languageService.getSemanticDiagnostics(filename);
    const sourceFile =
        info.languageService.getProgram().getSourceFile(filename);
    prev.push(...getDiagnostics(sourceFile));
    return prev;
  };
  return proxy;
}

// Also expose as a simpler diagnostic wrapper around a ts.Program
function wrap(d: api.DiagnosticsProducer): api.DiagnosticsProducer {
  const proxy = Object.create(null) as api.DiagnosticsProducer;
  for (const k of Object.keys(d)) {
    proxy[k] = function() {
      return d[k].apply(d, arguments);
    }
  }
  proxy.getSemanticDiagnostics = function(sourceFile: ts.SourceFile) {
    const result = d.getSemanticDiagnostics();
    result.push(...getDiagnostics(sourceFile));
    return result;
  }
  return proxy;
}

export const PLUGIN: api.Plugin = {create, wrap};
