# ts_plugin_prototype
Proof of concept for using TS 2.3 LanguageService plugins in tsc_wrapped

Each plugin is compatible with the `tsserver.js` editor plugin API recently added to TS@next.
But we load only a hardcoded list of plugins, from a tsc wrapper.

This will let us re-write chunks of `@angular/tsc-wrapped` as plugins.

```
$ node ./built/runner.js
Diagnostics from compiler
 test_file.ts(1,14): error TS2322: Type '1' is not assignable to type 'string'.

Diagnostics from language service
 node_modules/typescript/lib/lib.d.ts(1,1): warning TS9999: Plugin diagnostic
test_file.ts(1,14): error TS2322: Type '1' is not assignable to type 'string'.
test_file.ts(1,1): warning TS9999: Plugin diagnostic
node_modules/@types/node/index.d.ts(1,1): warning TS9999: Plugin diagnostic
```
