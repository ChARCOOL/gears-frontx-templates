// @cpt-dod:cpt-frontx-dod-unit-test-generation-and-agent-verification-standard-test-convention:p1
import { describe, expect, it } from 'vitest';
import { CONCRETE_EXPORT_DENYLIST, findConsumerViolations, findMfesImportSites, isConcreteImplementationName, parseImportedNames, stripComments } from './template-mfes-import-boundary-check.mjs';

/** @type {string | undefined} */
let rootDir;

// The forbidden set is a naming rule, not a list (see the guard's docblock):
// a class list would leave the next DefaultFooManager born unguarded.
describe('isConcreteImplementationName', () => {
  it('matches Default-prefixed class names, including ones that do not exist yet', () => {
    for (const name of ['DefaultMfeRegistry', 'DefaultMfeRegistryFactory', 'DefaultLifecycleManager', 'DefaultFooManager']) {
      expect(isConcreteImplementationName(name)).toBe(true);
    }
  });

  it('matches the Default-suffixed bridge factory', () => {
    expect(isConcreteImplementationName('MfeBridgeFactoryDefault')).toBe(true);
  });

  it('leaves contract and creation-function names alone', () => {
    for (const name of ['MfeRegistry', 'createMfeRegistryFactory', 'MfeHandlerMF', 'ConcurrentMountStrategy', 'ExtensionManager']) {
      expect(isConcreteImplementationName(name)).toBe(false);
    }
  });

  it('flags a name seeded into CONCRETE_EXPORT_DENYLIST, on the consumer half', () => {
    CONCRETE_EXPORT_DENYLIST.add('OperationSerializer');
    try {
      expect(isConcreteImplementationName('OperationSerializer')).toBe(true);
      const sites = findMfesImportSites(
        "import { OperationSerializer } from '@gears-frontx/mfes'",
        'app.ts',
      );
      expect(findConsumerViolations(sites)).toEqual([
        { file: 'app.ts', kind: 'concrete-name', detail: 'OperationSerializer' },
      ]);
    } finally {
      CONCRETE_EXPORT_DENYLIST.delete('OperationSerializer');
    }
  });
});

describe('findMfesImportSites', () => {
  it('captures a multi-line named-import block whole and strips aliases and type keywords', () => {
    const content = [
      "import {",
      "  type MfeRegistry,",
      "  DefaultMfeRegistry as Registry,",
      "  createMfeRegistryFactory,",
      "} from '@gears-frontx/mfes'",
    ].join('\n');
    const [site] = findMfesImportSites(content, 'a.ts');
    expect(site.specifier).toBe('@gears-frontx/mfes');
    expect(site.names).toEqual(['MfeRegistry', 'DefaultMfeRegistry', 'createMfeRegistryFactory']);
  });

  it('captures deep-subpath specifiers', () => {
    const [site] = findMfesImportSites(
      "import { DefaultMfeRegistry } from '@gears-frontx/mfes/dist/runtime/DefaultMfeRegistry'",
      'a.ts',
    );
    expect(site.specifier).toBe('@gears-frontx/mfes/dist/runtime/DefaultMfeRegistry');
  });

  it('ignores mentions with no from-clause: eslint groups, bundler externals, prose', () => {
    const content = [
      "const groups = ['@gears-frontx/mfes', '@gears-frontx/mfes/*'];",
      "// exported from @gears-frontx/mfes for convenience",
      "export default { external: ['@gears-frontx/mfes'] };",
    ].join('\n');
    expect(findMfesImportSites(content, 'a.ts')).toEqual([]);
  });

  it('captures side-effect and dynamic imports, which carry no from-clause', () => {
    const sideEffect = findMfesImportSites("import '@gears-frontx/mfes/runtime/DefaultMfeRegistry'", 'a.ts');
    expect(sideEffect).toHaveLength(1);
    expect(sideEffect[0].specifier).toBe('@gears-frontx/mfes/runtime/DefaultMfeRegistry');
    const dynamic = findMfesImportSites("const m = await import('@gears-frontx/mfes/internal/wiring')", 'a.ts');
    expect(dynamic).toHaveLength(1);
    expect(dynamic[0].specifier).toBe('@gears-frontx/mfes/internal/wiring');
  });

  it('backtracks past a substring match on the keyword: importManifest does not fool the statement start', () => {
    const [site] = findMfesImportSites(
      "import { DefaultMfeRegistry, importManifest } from '@gears-frontx/mfes'",
      'a.ts',
    );
    expect(site.names).toEqual(['DefaultMfeRegistry', 'importManifest']);
    expect(findConsumerViolations([site])).toEqual([
      { file: 'a.ts', kind: 'concrete-name', detail: 'DefaultMfeRegistry' },
    ]);
  });

  it('backtracks past a substring match inside a comment, and does not launder the following name into the comment text', () => {
    const content = [
      'import {',
      '  type MfeRegistry,',
      '  // imported for typing only',
      '  DefaultLifecycleManager,',
      "} from '@gears-frontx/mfes'",
    ].join('\n');
    const [site] = findMfesImportSites(content, 'a.ts');
    expect(site.names).toEqual(['MfeRegistry', 'DefaultLifecycleManager']);
    expect(findConsumerViolations([site])).toEqual([
      { file: 'a.ts', kind: 'concrete-name', detail: 'DefaultLifecycleManager' },
    ]);
  });

  // Round 3: a comment that reads as a real import could previously LAUNDER
  // that import past the guard when a comment landed between the `import`
  // keyword and the specifier (see the reverted keyword-backtrack repro
  // below). Comments are now stripped before matching, so a fully
  // commented-out import is no longer reported at all — a false negative
  // here (missing a real import) is never acceptable, but a false negative
  // is exactly what letting comments launder a name produces; the guard
  // would rather risk the opposite, narrower false positive of matching
  // statement-shaped text inside a string literal (see the test below).
  it('no longer reports a fully commented-out import statement', () => {
    const content = "// import { DefaultMfeRegistry } from '@gears-frontx/mfes'";
    expect(findMfesImportSites(content, 'a.ts')).toEqual([]);
  });

  // Round 4: the exact end-to-end shape the reviewer reproduced on
  // template-shell/vitest.shared.ts — a glob string carrying `/*` above a
  // real import, an ordinary JSDoc below it. The round-3 strip deleted
  // everything between the two as one giant "comment", import included.
  it('reports a concrete import sitting between a glob string literal and a real block comment', () => {
    const content = [
      "const globs = ['src/**'];",
      "import { DefaultMfeRegistry } from '@gears-frontx/mfes';",
      '/** a perfectly ordinary JSDoc */',
    ].join('\n');
    const [site] = findMfesImportSites(content, 'a.ts');
    expect(site.names).toEqual(['DefaultMfeRegistry']);
    expect(findConsumerViolations([site])).toEqual([
      { file: 'a.ts', kind: 'concrete-name', detail: 'DefaultMfeRegistry' },
    ]);
  });

  // Round 5, end-to-end: the exact consumer-half exploit — a nested template
  // used to swallow the import line into the outer "literal"'s strip-scan.
  it('reports a concrete import following a nested template literal carrying a URL', () => {
    const content = [
      'const u = `${`https://a.b`}`;',
      "import { DefaultMfeRegistry } from '@gears-frontx/mfes';",
    ].join('\n');
    const [site] = findMfesImportSites(content, 'a.ts');
    expect(site.names).toEqual(['DefaultMfeRegistry']);
    expect(findConsumerViolations([site])).toEqual([
      { file: 'a.ts', kind: 'concrete-name', detail: 'DefaultMfeRegistry' },
    ]);
  });

  it('still reports a statement-shaped string literal — the guard does not parse JS', () => {
    const content = "const example = \"import { DefaultMfeRegistry } from '@gears-frontx/mfes'\";";
    const [site] = findMfesImportSites(content, 'a.ts');
    expect(site.names).toEqual(['DefaultMfeRegistry']);
    expect(findConsumerViolations([site])).toEqual([
      { file: 'a.ts', kind: 'concrete-name', detail: 'DefaultMfeRegistry' },
    ]);
  });

  // The repro the reviewer asked to close: a comment INSIDE the brace block
  // that itself contains a whole-word `import` becomes, under the old
  // last-keyword backtrack, the statement start — the slice from there to
  // the specifier has no opening brace, `parseImportedNames` returns `[]`,
  // and the concrete import walks through unreported. Stripping comments
  // first removes the false keyword match entirely, so the backtrack lands
  // on the statement's real `import` and the name is still caught.
  it('reports a concrete name even when a comment inside the block contains a whole-word import/export keyword', () => {
    const content = [
      'import {',
      '  MfeRegistry,',
      '  // do not import DefaultLifecycleManager elsewhere',
      '  DefaultLifecycleManager,',
      "} from '@gears-frontx/mfes'",
    ].join('\n');
    const [site] = findMfesImportSites(content, 'a.ts');
    expect(site.names).toEqual(['MfeRegistry', 'DefaultLifecycleManager']);
    expect(findConsumerViolations([site])).toEqual([
      { file: 'a.ts', kind: 'concrete-name', detail: 'DefaultLifecycleManager' },
    ]);
  });
});

describe('stripComments', () => {
  it('replaces a block comment with a single space', () => {
    expect(stripComments('const x = /* keep out */ 1;')).toBe('const x =   1;');
  });

  it('removes a line comment without eating the trailing newline', () => {
    expect(stripComments('const x = 1; // trailing\nconst y = 2;')).toBe('const x = 1;  \nconst y = 2;');
  });

  it('leaves code outside comments untouched', () => {
    const code = "import { MfeRegistry } from '@gears-frontx/mfes';";
    expect(stripComments(code)).toBe(code);
  });

  it('preserves the newlines of a multi-line block comment, so line-anchored patterns keep their lines', () => {
    expect(stripComments('a; /* one\ntwo */ b;')).toBe('a;  \n b;');
  });

  // Round 4: the round-3 strip was not string-aware, so a `/*` inside an
  // ordinary string opened a strip that ran to the next `*/` anywhere in the
  // file and silently DELETED the real code in between — a false negative,
  // the failure mode the guard's contract forbids. These pin the three
  // literal kinds the reviewer probed: string, template literal, regex.
  it('does not treat comment markers inside a string literal as comments', () => {
    const code = "const globs = ['src/**', 'src/*.ts']; // real comment";
    expect(stripComments(code)).toBe("const globs = ['src/**', 'src/*.ts'];  ");
  });

  it('does not treat comment markers inside a template literal as comments', () => {
    const code = 'const t = `/* not a comment */ // neither`;';
    expect(stripComments(code)).toBe(code);
  });

  it('does not treat comment markers inside a regex literal as comments', () => {
    const code = 'const re = /[/*]+/; const div = a / b;';
    expect(stripComments(code)).toBe(code);
  });

  it('a /* inside a string cannot swallow the code between it and a later real comment', () => {
    const source = [
      "const globs = ['src/**'];",
      "import { DefaultMfeRegistry } from '@gears-frontx/mfes';",
      '/** a perfectly ordinary JSDoc */',
    ].join('\n');
    expect(stripComments(source)).toContain("import { DefaultMfeRegistry } from '@gears-frontx/mfes';");
  });

  it('an unterminated single-quote string stops shielding at its newline', () => {
    const stripped = stripComments("const broken = 'oops\n// gone\ncode;");
    expect(stripped).not.toContain('// gone');
    expect(stripped).toContain('code;');
  });

  // Round 5: `scanStringLiteral` used to return at the FIRST backtick it met
  // — for a template nested inside `${…}` that was the inner template's
  // OPENING backtick, so everything after scanned as code and a `//` inside
  // the nested template (a URL is enough) started a strip that deleted real
  // code. These pin the reviewer's probes: nested-template boundary, comment
  // markers kept verbatim inside `${…}`, brace depth, regex-in-expression,
  // and the unterminated-expression fail-closed path.
  it('tracks ${} nesting: a nested template carrying a URL cannot end the outer literal early', () => {
    const source = [
      'const u = `${`https://a.b`}`;',
      "import { DefaultMfeRegistry } from '@gears-frontx/mfes';",
    ].join('\n');
    expect(stripComments(source)).toContain("import { DefaultMfeRegistry } from '@gears-frontx/mfes';");
  });

  it('a comment inside a ${} expression is kept verbatim and cannot end the expression early', () => {
    const code = 'const t = `${x /* } */ + 1}`; const y = 2;';
    expect(stripComments(code)).toBe(code);
  });

  it('tracks brace depth inside ${}: an object literal does not end the expression', () => {
    const code = 'const t = `${ { a: 1 }.a }`; // real comment';
    expect(stripComments(code)).toBe('const t = `${ { a: 1 }.a }`;  ');
  });

  it('a backtick inside a regex within ${} does not open a nested string', () => {
    const code = 'const t = `${/`/.test(x)}`; const y = 1;';
    expect(stripComments(code)).toBe(code);
  });

  it('an unterminated ${ expression shields the rest of the file rather than deleting any of it', () => {
    const source = 'const t = `${ oops\n// inside the still-open expression\ncode;';
    expect(stripComments(source)).toBe(source);
  });

  // Round 5, second class: with the slash after `if (…)` read as division,
  // the regex body scanned as code and its `[/*]` character class opened a
  // block-comment strip. Condition parens are now tracked.
  it('a [/*] character class in a regex after an if-condition cannot open a comment strip', () => {
    const source = [
      'if (x) /[/*]/.test(y);',
      "import { DefaultMfeRegistry } from '@gears-frontx/mfes';",
      '/** a perfectly ordinary JSDoc */',
    ].join('\n');
    expect(stripComments(source)).toContain("import { DefaultMfeRegistry } from '@gears-frontx/mfes';");
  });

  it('a slash after a call or grouping paren is still division', () => {
    const code = 'const half = f(x) / 2; const t = (a + b) / c;';
    expect(stripComments(code)).toBe(code);
  });
});

describe('parseImportedNames', () => {
  it('yields no names for namespace imports — the barrel half guards those', () => {
    expect(parseImportedNames("import * as mfes from '@gears-frontx/mfes'")).toEqual([]);
  });
});

describe('findConsumerViolations', () => {
  it('reports a deep import once, without also parsing its names', () => {
    const sites = findMfesImportSites(
      "import { DefaultMfeRegistry } from '@gears-frontx/mfes/dist/runtime/DefaultMfeRegistry'",
      'app.ts',
    );
    expect(findConsumerViolations(sites)).toEqual([
      { file: 'app.ts', kind: 'deep-import', detail: '@gears-frontx/mfes/dist/runtime/DefaultMfeRegistry' },
    ]);
  });

  it('reports a side-effect deep import — no bindings needed to reach past the barrel', () => {
    const sites = findMfesImportSites("import '@gears-frontx/mfes/runtime/DefaultMfeRegistry'", 'app.ts');
    expect(findConsumerViolations(sites)).toEqual([
      { file: 'app.ts', kind: 'deep-import', detail: '@gears-frontx/mfes/runtime/DefaultMfeRegistry' },
    ]);
  });

  it('reports concrete names imported from the barrel, type imports included', () => {
    const sites = findMfesImportSites(
      "import { createMfeRegistryFactory, type DefaultLifecycleManager } from '@gears-frontx/mfes'",
      'app.ts',
    );
    expect(findConsumerViolations(sites)).toEqual([
      { file: 'app.ts', kind: 'concrete-name', detail: 'DefaultLifecycleManager' },
    ]);
  });
});

