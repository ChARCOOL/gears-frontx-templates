// @cpt-dod:cpt-frontx-dod-unit-test-generation-and-agent-verification-standard-test-convention:p1
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { builtEntryPointOf, symlinkSpecFor, templateDirName } from './link-template-ecosystem.mjs';

/** @typedef {import('./link-template-ecosystem.mjs').FileSystemLike} FileSystemLike */
/** @typedef {import('./link-template-ecosystem.mjs').LinkResult} LinkResult */

const repoRoot = '/repo';

/**
 * The set a run is handed, as a FIXTURE rather than as production knowledge.
 * The script no longer declares one: `runCli` derives it from what the template
 * pins (`templatePinnedPackageDirs`, covered in
 * `template-ecosystem-packages.test.mjs` against a real fixture tree), and
 * everything below tests what `linkEcosystemPackages` does with a set it is
 * given - which is why these cases can run against a fake filesystem at all.
 * Three entries, because the interesting rollback states need a middle one.
 */
const linkedPackageDirs = ['api', 'mfes', 'gts-plugin'];
const scopeDir = path.join(repoRoot, templateDirName, 'node_modules', '@gears-frontx');

/** Tarball content npm wrote: the thing a failed run must not destroy. */
const installedDir = Object.freeze({ kind: 'installed' });

/** A built artifact whose bytes no assertion reads. */
const builtArtifact = Object.freeze({ kind: 'file' });

/**
 * A `node:fs` stand-in over a map of path to the entry that lives there, where
 * an entry is `installedDir`, a `{ kind: 'link' }` record the fake writes, or a
 * file. Modelling what an entry *is* rather than only that the path exists is
 * what lets a test prove a rollback put the original directory back instead of
 * leaving a hole where it used to be.
 *
 * Only the five members the script uses are provided, so a call to anything else
 * fails the test loudly instead of silently touching the real filesystem.
 *
 * @param {Record<string, { kind: string; json?: unknown; text?: string; target?: string }>} initial
 */
function fakeFs(initial) {
  const tree = new Map(Object.entries(initial));
  /** @type {{ links: { target: string; linkPath: string; type: string }[] }} */
  const calls = { links: [] };

  /** @param {string} target */
  const subtreeOf = (target) =>
    [...tree.keys()].filter((key) => key === target || key.startsWith(target + path.sep));

  /**
   * @param {string} code
   * @param {string} target
   */
  const fsError = (code, target) =>
    Object.assign(new Error(`${code}: ${target}`), { code });

  /** @type {FileSystemLike} */
  const fs = {
      existsSync: (target) => tree.has(target),
      readFileSync: (target) => {
        const entry = tree.get(target);

        // `text` is read back verbatim, which is the only way to reach the
        // parse refusal: a manifest that does not parse has no object form to
        // stringify from.
        if (typeof entry?.text === 'string') {
          return entry.text;
        }

        if (entry?.json === undefined) {
          throw fsError('ENOENT', target);
        }
        return JSON.stringify(entry.json);
      },
      rmSync: (target) => {
        for (const key of subtreeOf(target)) {
          tree.delete(key);
        }
      },
      renameSync: (from, to) => {
        const entry = tree.get(from);
        if (entry === undefined) {
          throw fsError('ENOENT', from);
        }
        tree.delete(from);
        tree.set(to, entry);
      },
      // Refuses an occupied path the way the real call does, so a run that
      // forgot to clear a directory before linking fails here rather than
      // passing on a fake that overwrites.
      symlinkSync: (target, linkPath, type) => {
        if (tree.has(linkPath)) {
          throw fsError('EEXIST', linkPath);
        }
        calls.links.push({ target, linkPath, type });
        tree.set(linkPath, { kind: 'link', target });
      },
  };

  return { tree, calls, fs };
}

describe('builtEntryPointOf', () => {
  it('prefers the ESM condition of the root export over main and module', () => {
    const entry = builtEntryPointOf({
      main: './dist/index.cjs',
      module: './dist/module.js',
      exports: { '.': { import: './dist/index.js' } },
    });

    expect(entry).toBe('./dist/index.js');
  });

  it('falls back to module then main when the package declares no exports map', () => {
    expect(builtEntryPointOf({ module: './dist/m.js', main: './dist/index.cjs' })).toBe(
      './dist/m.js',
    );
    expect(builtEntryPointOf({ main: './dist/index.cjs' })).toBe('./dist/index.cjs');
  });

  it('reports no entry point for a manifest that declares none', () => {
    expect(builtEntryPointOf({ name: 'x' })).toBeNull();
    expect(builtEntryPointOf(null)).toBeNull();
  });
});

describe('symlinkSpecFor', () => {
  it('links relatively on posix so the tree survives a moved checkout', () => {
    const spec = symlinkSpecFor(scopeDir, path.join(repoRoot, 'packages/api'), 'linux');

    expect(spec).toEqual({ target: path.join('..', '..', '..', 'packages', 'api'), type: 'dir' });
  });

  it('uses an absolute junction on win32, which needs no elevated privilege', () => {
    const source = path.join(repoRoot, 'packages/api');
    const spec = symlinkSpecFor(scopeDir, source, 'win32');

    expect(spec).toEqual({ target: source, type: 'junction' });
  });
});

