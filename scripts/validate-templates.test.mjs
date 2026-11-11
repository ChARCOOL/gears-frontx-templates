// @cpt-dod:cpt-frontx-dod-unit-test-generation-and-agent-verification-standard-test-convention:p1
import { describe, expect, it } from 'vitest';
import { loadCliModule } from './validate-templates.mjs';

/** @type {string | undefined} */
let rootDir;

describe('loadCliModule', () => {
  it('returns the loaded module on success', async () => {
    const fakeModule = { MANIFEST_FILENAME: 'frontx-template.json' };
    const result = await loadCliModule(async () => fakeModule);

    expect(result).toEqual({ ok: true, module: fakeModule });
  });

  it('maps ERR_MODULE_NOT_FOUND to a clear, actionable message instead of the raw error', async () => {
    const moduleNotFound = Object.assign(new Error("Cannot find module '@gears-frontx/cli'"), {
      code: 'ERR_MODULE_NOT_FOUND',
    });

    const result = await loadCliModule(async () => {
      throw moduleNotFound;
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain('run `npm ci` at the repo root first');
  });

  it('rethrows any other import error unchanged - only a missing build gets the friendly message', async () => {
    const otherError = new Error('unexpected syntax error in dist/index.js');

    await expect(loadCliModule(async () => {
      throw otherError;
    })).rejects.toThrow(otherError);
  });
});
