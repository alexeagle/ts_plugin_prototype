# ts_plugin_prototype
Proof of concept for using TS 2.3 plugins and transformers in tsc_wrapped

There are three ways to extend TSC:

1. Plugins that also work in an editor are written against the Language service
using the plugin API introduced in https://github.com/Microsoft/TypeScript/pull/12231
These require a LanguageService wrapper around the program, and are expected to
run in the `tsserver.js` editor helper, not in `typescript.js`
This demo uses the `@angular/language-service` plugin as an example.
2. Plugins written only for use with `tsc` can skip the LanguageService and just
wrap the ts.Program. This example is in `tscPlugin.ts`.
3. Emit transforms can mutate the AST before or after TypeScript lowers to the
`target` language. See example in `eraseDecoratorsTransform.ts`.

This will let us re-write chunks of `@angular/tsc-wrapped` as plugins.

## Demo

Here we see a diagnostic from TypeScript, a diagnostic from a plugin, and
the decorator was removed by a before transform.

```
alexeagle@alexeagle:~/Projects/ts_plugin_prototype$ node built/runner.js
test_file.ts(1,14): error TS2322: Type '1' is not assignable to type 'string'.
test_file.ts(1,1): warning TS9999: Plugin diagnostic

alexeagle@alexeagle:~/Projects/ts_plugin_prototype$ cat built/test_file.js
"use strict";
exports.__esModule = true;
exports.a = 1;
function Cool(c) {
    return c;
}
var Foo = (function () {
    function Foo() {
    }
    return Foo;
}());

```
