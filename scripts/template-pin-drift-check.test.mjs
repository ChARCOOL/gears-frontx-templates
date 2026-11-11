// @cpt-dod:cpt-frontx-dod-unit-test-generation-and-agent-verification-standard-test-convention:p1
import { describe, expect, it } from 'vitest';
import { findDriftedSites, findUnverifiableSites } from './template-pin-drift-check.mjs';

/** @type {string | undefined} */
let rootDir;

describe('findDriftedSites', () => {
  const site = { file: 'package.json', field: 'dependencies', packageName: '@gears-frontx/api', pinnedVersion: '0.3.0-alpha.0' };

  it('flags a pinned site whose version no longer matches the ecosystem truth', () => {
    expect(findDriftedSites([site], { '@gears-frontx/api': '0.4.0-alpha.0' })).toEqual([
      { ...site, actualVersion: '0.4.0-alpha.0' },
    ]);
  });

  it('does not flag a pinned site that matches the ecosystem truth', () => {
    expect(findDriftedSites([site], { '@gears-frontx/api': '0.3.0-alpha.0' })).toEqual([]);
  });
});

// The classification that lets `findDriftedSites` stay as simple as it is: "no
// truth entry" is indistinguishable from "matches" to a comparison, so a name
// that leaves `packages/` would otherwise take every pin on it out of the check.
describe('findUnverifiableSites', () => {
  const site = { file: 'package.json', field: 'dependencies', packageName: '@gears-frontx/ghost', pinnedVersion: '1.0.0' };

  it('flags an ecosystem-scope pin with no truth entry and no local definition', () => {
    expect(findUnverifiableSites([site], {}, new Set())).toEqual([site]);
  });

  it('does not flag a pin the scanned tree defines itself - npm resolves it through a workspace', () => {
    expect(findUnverifiableSites([site], {}, new Set(['@gears-frontx/ghost']))).toEqual([]);
  });

  it('does not flag a pin that has a truth entry, drifted or not', () => {
    expect(findUnverifiableSites([site], { '@gears-frontx/ghost': '2.0.0' }, new Set())).toEqual([]);
  });
});

