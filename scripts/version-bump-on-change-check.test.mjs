// @cpt-dod:cpt-frontx-dod-unit-test-generation-and-agent-verification-standard-test-convention:p1
import { describe, expect, it } from 'vitest';
import { dependencyFieldsChanged, groupChangedFilesByPackageRoot, hasSubstantiveTemplateChange, isDocsOnlyPath } from './version-bump-on-change-check.mjs';

/** @type {string | undefined} */
let rootDir;

const MANIFEST_ONLY_DIR = 'template-design-guardrails';
const MANIFEST_ONLY_NAME = '@gears-frontx/template-design-guardrails';

describe('isDocsOnlyPath', () => {
  it('flags a markdown file', () => {
    expect(isDocsOnlyPath('packages/api/src/README.md')).toBe(true);
  });

  it('flags llms.txt regardless of directory', () => {
    expect(isDocsOnlyPath('packages/api/llms.txt')).toBe(true);
  });

  it('does not flag a source file', () => {
    expect(isDocsOnlyPath('packages/api/src/index.ts')).toBe(false);
  });
});

describe('groupChangedFilesByPackageRoot', () => {
  it('buckets each changed file under the package root that owns it, dropping files that match no root', () => {
    const roots = ['packages/api', 'template-shell/packages/react'];
    const files = [
      'packages/api/src/index.js',
      'packages/api/package.json',
      'template-shell/packages/react/src/hooks.ts',
      'README.md',
      'template-shell/package.json',
    ];

    const grouped = groupChangedFilesByPackageRoot(files, roots);

    expect(grouped.get('packages/api')).toEqual(['packages/api/src/index.js', 'packages/api/package.json']);
    expect(grouped.get('template-shell/packages/react')).toEqual(['template-shell/packages/react/src/hooks.ts']);
    expect(grouped.size).toBe(2);
  });

  // The nesting scenario change #1 introduces: template-shell is now ALSO a
  // governed root, so a file under its packages/react subdirectory matches
  // BOTH `template-shell/` and `template-shell/packages/react/` as prefixes.
  // The longer (more specific) root must win.
  it('attributes a nested file to the longer (more specific) root, not the also-matching parent', () => {
    const roots = ['template-shell', 'template-shell/packages/react'];
    const files = ['template-shell/packages/react/src/hooks.ts', 'template-shell/src/index.ts'];

    const grouped = groupChangedFilesByPackageRoot(files, roots);

    expect(grouped.get('template-shell/packages/react')).toEqual(['template-shell/packages/react/src/hooks.ts']);
    expect(grouped.get('template-shell')).toEqual(['template-shell/src/index.ts']);
  });
});

describe('dependencyFieldsChanged', () => {
  it('flags an added dependency', () => {
    expect(
      dependencyFieldsChanged({ dependencies: {} }, { dependencies: { '@gears-frontx/mfes': '0.3.0-alpha.0' } }),
    ).toBe(true);
  });

  it('does not flag a version-only edit', () => {
    expect(dependencyFieldsChanged({ version: '0.1.0' }, { version: '0.2.0' })).toBe(false);
  });

  it('does not flag identical dependency sets', () => {
    const deps = { dependencies: { '@gears-frontx/mfes': '0.3.0-alpha.0' } };
    expect(dependencyFieldsChanged(deps, { ...deps })).toBe(false);
  });

  // sort-package-json, `npm pkg fix` and npm itself all reorder dependency
  // entries without changing their meaning - a pure reorder must not read as
  // a dependency change. Built from JSON text (not object spread) so the two
  // manifests genuinely carry different key orders.
  it('does not flag a pure reorder of dependency entries', () => {
    const base = JSON.parse('{"dependencies": {"b": "1.0.0", "a": "2.0.0"}}');
    const head = JSON.parse('{"dependencies": {"a": "2.0.0", "b": "1.0.0"}}');
    expect(dependencyFieldsChanged(base, head)).toBe(false);
  });
});

describe('hasSubstantiveTemplateChange', () => {
  const templateRoot = MANIFEST_ONLY_DIR;

  it('exempts frontx-template.json itself - the bump edit must not force a second bump', () => {
    expect(hasSubstantiveTemplateChange(templateRoot, [`${templateRoot}/frontx-template.json`])).toBe(false);
  });

  it('exempts a docs-only file', () => {
    expect(hasSubstantiveTemplateChange(templateRoot, [`${templateRoot}/DESIGN.md`])).toBe(false);
  });

  it('counts any other file under the root', () => {
    expect(hasSubstantiveTemplateChange(templateRoot, [`${templateRoot}/.frontx/ai/x/extension.json`])).toBe(true);
  });
});

