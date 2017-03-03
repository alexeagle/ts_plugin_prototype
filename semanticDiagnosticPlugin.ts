import * as ts from 'typescript';

// Subset of ts.server.PluginCreateInfo
// from typescript/lib/tsserverlibrary.d.ts
interface PluginCreateInfo {
  languageService: ts.LanguageService;
  languageServiceHost: ts.LanguageServiceHost;
  config: any;
}

// Based on https://github.com/Microsoft/TypeScript/blob/87b780d641de2f24d177624f96c567d873b79ba6/src/harness/harnessLanguageService.ts#L796
export function create(info: PluginCreateInfo) {
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
    prev.push({
      category: ts.DiagnosticCategory.Warning,
      file: sourceFile,
      code: 9999,
      length: 3,
      messageText: `Plugin diagnostic`,
      start: 0
    });
    return prev;
  };
  return proxy;
}
