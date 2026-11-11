// @cpt-dod:cpt-frontx-dod-unit-test-generation-and-agent-verification-standard-test-convention:p1
import { describe, expect, it } from 'vitest';
import { findMissingSelfLinks, isSelfLinkSpec, selfLinkDependenciesOf } from './template-lockfile-selflink-check.mjs';

/** @type {string | undefined} */
let rootDir;

// The exact shapes from the tree this guard protects: template-shell's root
// manifest declares its self-link in `overrides` (the workspace packages
// depend on the name; the override pins it to the template root), and the
// lockfile entry below is what npm's reconciliation drops (#524).
const SELF_NAME = '@gears-frontx/frontx-template-shell';
const manifestWithSelfLink = {
  name: SELF_NAME,
  version: '0.1.0-alpha.2',
  overrides: { [SELF_NAME]: 'file:.' },
};
const lockfileWithSelfLink = {
  lockfileVersion: 3,
  packages: {
    '': { name: SELF_NAME, version: '0.1.0-alpha.2' },
    [`node_modules/${SELF_NAME}`]: { resolved: '', link: true },
  },
};

describe('isSelfLinkSpec', () => {
  it('accepts the declared shape and its normalised variants', () => {
    expect(isSelfLinkSpec('file:.')).toBe(true);
    expect(isSelfLinkSpec('file:./')).toBe(true);
    expect(isSelfLinkSpec('file:')).toBe(true);
  });

  it('rejects file: paths that leave the directory and non-file specs', () => {
    expect(isSelfLinkSpec('file:../..')).toBe(false);
    expect(isSelfLinkSpec('file:./packages/framework')).toBe(false);
    expect(isSelfLinkSpec('0.3.0-alpha.1')).toBe(false);
    expect(isSelfLinkSpec('workspace:*')).toBe(false);
  });
});

describe('selfLinkDependenciesOf', () => {
  it('finds a self-link in any installed-dependency field, with its field named', () => {
    const manifest = {
      dependencies: { a: 'file:.' },
      devDependencies: { b: 'file:./' },
      optionalDependencies: { c: 'file:.' },
    };
    expect(selfLinkDependenciesOf(manifest)).toEqual([
      { name: 'a', field: 'dependencies', spec: 'file:.' },
      { name: 'b', field: 'devDependencies', spec: 'file:./' },
      { name: 'c', field: 'optionalDependencies', spec: 'file:.' },
    ]);
  });

  it('finds the real tree\'s shape: a self-link declared in overrides', () => {
    expect(selfLinkDependenciesOf(manifestWithSelfLink)).toEqual([
      { name: SELF_NAME, field: 'overrides', spec: 'file:.' },
    ]);
  });

  it('finds a self-link in a nested override object under its "." key', () => {
    expect(selfLinkDependenciesOf({ overrides: { a: { '.': 'file:.', b: '1.0.0' } } })).toEqual([
      { name: 'a', field: 'overrides', spec: 'file:.' },
    ]);
  });

  it('ignores overrides that redirect elsewhere', () => {
    expect(selfLinkDependenciesOf({ overrides: { a: '2.0.0', b: 'file:../out', c: { d: 'file:.' } } })).toEqual([]);
  });

  it('ignores peerDependencies - a peer declaration installs no entry to lose', () => {
    expect(selfLinkDependenciesOf({ peerDependencies: { a: 'file:.' } })).toEqual([]);
  });

  it('returns nothing for a manifest with no self-link', () => {
    expect(selfLinkDependenciesOf({ dependencies: { a: '1.0.0', b: 'file:../sibling' } })).toEqual([]);
  });
});

describe('findMissingSelfLinks', () => {
  const base = { templateName: 'template-shell', lockfilePath: 'template-shell/package-lock.json' };

  it('passes when the lockfile carries the link entry', () => {
    expect(
      findMissingSelfLinks({ ...base, manifest: manifestWithSelfLink, lockfile: lockfileWithSelfLink }),
    ).toEqual([]);
  });

  it('reports entry-missing when npm reconciliation dropped it (#524)', () => {
    const lockfile = { lockfileVersion: 3, packages: { '': { name: SELF_NAME } } };
    const findings = findMissingSelfLinks({ ...base, manifest: manifestWithSelfLink, lockfile });
    expect(findings).toHaveLength(1);
    expect(findings[0].problem).toBe('entry-missing');
    expect(findings[0].dependency.name).toBe(SELF_NAME);
  });

  it('reports entry-not-link when the entry exists but would install from the registry', () => {
    const lockfile = {
      lockfileVersion: 3,
      packages: {
        '': { name: SELF_NAME },
        [`node_modules/${SELF_NAME}`]: { version: '0.1.0-alpha.2', resolved: 'https://registry.npmjs.org/...' },
      },
    };
    const findings = findMissingSelfLinks({ ...base, manifest: manifestWithSelfLink, lockfile });
    expect(findings).toHaveLength(1);
    expect(findings[0].problem).toBe('entry-not-link');
  });

  it('has nothing to assert for a manifest without a self-link', () => {
    expect(
      findMissingSelfLinks({ ...base, manifest: { dependencies: { x: '1.0.0' } }, lockfile: { packages: {} } }),
    ).toEqual([]);
  });
});

