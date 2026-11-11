// @cpt-dod:cpt-frontx-dod-unit-test-generation-and-agent-verification-standard-test-convention:p1
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEPENDENCY_FIELDS, ecosystemScopeMatcher, isExactRegistryVersionPin, resolveEcosystemDir } from './template-ecosystem-packages.mjs';

/** @type {string | undefined} */
let rootDir;

describe('ecosystemScopeMatcher', () => {
  it('recognises the ecosystem scope from the truth map\'s own names, never a written-down string', () => {
    const isEcosystemScopeName = ecosystemScopeMatcher(['@gears-frontx/api', '@gears-frontx/mfes']);

    expect(isEcosystemScopeName('@gears-frontx/telemetry')).toBe(true);
    expect(isEcosystemScopeName('@other-scope/api')).toBe(false);
    expect(isEcosystemScopeName('react')).toBe(false);
  });

  it('treats an unscoped ecosystem package as contributing no scope', () => {
    const isEcosystemScopeName = ecosystemScopeMatcher(['frontx-cli']);

    expect(isEcosystemScopeName('anything')).toBe(false);
  });
});

// The guard's own truth about what it governs. `isExactPin` (the ecosystem
// version policy's helper) answers a DIFFERENT question - "does this range carry
// a range operator" - which a monorepo-local `file:` specifier also answers "no"
// to, so reusing it made every `file:../../../packages/mfes` in template-mfe
// report as a pinned site drifted from a version it never expressed.
describe('isExactRegistryVersionPin', () => {
  it('accepts a bare exact registry version, prerelease included', () => {
    expect(isExactRegistryVersionPin('0.3.0-alpha.1')).toBe(true);
    expect(isExactRegistryVersionPin('1.2.3')).toBe(true);
  });

  it('rejects a local-path or protocol specifier, which expresses no version at all', () => {
    expect(isExactRegistryVersionPin('file:../../../packages/mfes')).toBe(false);
    expect(isExactRegistryVersionPin('link:../mfes')).toBe(false);
    expect(isExactRegistryVersionPin('workspace:*')).toBe(false);
    expect(isExactRegistryVersionPin('git+https://example.com/x.git')).toBe(false);
  });

  it('rejects a range - that is the ecosystem edge-compatibility policy\'s concern', () => {
    expect(isExactRegistryVersionPin('^0.3.0')).toBe(false);
    expect(isExactRegistryVersionPin('*')).toBe(false);
    expect(isExactRegistryVersionPin('>=0.2.0-0')).toBe(false);
  });
});

// #492 review finding 2's "unguarded duplicated literal" class. DEPENDENCY_FIELDS
// is deliberately a local literal here (not an import from
// `validate-content-self-containment.ts`) so no repo-script depends on the CLI
// package being built - a real property worth keeping.
//
// The cross-repo half of this guard - comparing against the canonical
// TypeScript source - no longer lives here: `validate-content-self-
// containment.ts` moved to `gears-frontx` with the rest of `packages/cli` when
// the templates split into their own repo, so there is nothing under this
// repo's `packages/cli/...` to read any more. That comparison does NOT now
// belong in `gears-frontx`'s own test suite either - that repo has no way to
// see a literal declared in this one, so nothing anywhere compares the two
// automatically any more. If the CLI's real dependency-field list ever
// changed, this copy would go silently stale for every script that reads it
// (`pinSitesIn`, and the pin-drift and version-bump-on-change checks built on
// it). The practical mitigation that remains is `validate-templates.mjs`: it
// never reads this local literal, importing the INSTALLED `@gears-frontx/cli`
// and running its own content-self-containment check against this repo's
// real template manifests directly - so a drift here still surfaces as
// validate:templates misbehaving against real content, not as a silent pass
// everywhere. What stays here is a confidence check that the four fields
// this repo's own guards act on are exactly the ones the ecosystem's
// dependency graph has - not a sync guard, just a name for what
// DEPENDENCY_FIELDS has to keep meaning if either repo edits it.
it('DEPENDENCY_FIELDS covers exactly the npm-resolved dependency kinds', () => {
  expect(DEPENDENCY_FIELDS).toEqual(['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']);
});

describe('resolveEcosystemDir', () => {
  const original = process.env.FRONTX_ECOSYSTEM_DIR;

  beforeEach(() => {
    delete process.env.FRONTX_ECOSYSTEM_DIR;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.FRONTX_ECOSYSTEM_DIR;
    else process.env.FRONTX_ECOSYSTEM_DIR = original;
  });

  it('defaults to the ../gears-frontx sibling when unset', () => {
    expect(resolveEcosystemDir('/repo')).toBe(path.resolve('/repo', '..', 'gears-frontx'));
  });

  it('defaults to the sibling when set to an empty/blank string', () => {
    process.env.FRONTX_ECOSYSTEM_DIR = '   ';
    expect(resolveEcosystemDir('/repo')).toBe(path.resolve('/repo', '..', 'gears-frontx'));
  });

  it('resolves an explicit FRONTX_ECOSYSTEM_DIR relative to repoRoot', () => {
    process.env.FRONTX_ECOSYSTEM_DIR = '../my-gears-frontx-checkout';
    expect(resolveEcosystemDir('/repo')).toBe(path.resolve('/repo', '..', 'my-gears-frontx-checkout'));
  });

  it('leaves an absolute FRONTX_ECOSYSTEM_DIR unchanged', () => {
    process.env.FRONTX_ECOSYSTEM_DIR = '/somewhere/else/gears-frontx';
    expect(resolveEcosystemDir('/repo')).toBe('/somewhere/else/gears-frontx');
  });
});

