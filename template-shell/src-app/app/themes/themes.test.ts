import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { frontxThemes } from './index';

/*
 * The shell's themes sit on top of the kit's theme.css, which is the one
 * palette. These checks read the installed kit's stylesheet, so a kit release
 * that adds or renames a token fails here instead of in a screen.
 */

// Read from disk, not through a `?raw` import: Vitest hands CSS imports back
// empty, which would let every check below pass on nothing.
const resolveFromHere = createRequire(import.meta.url);
const declaredNames = (css: string): Set<string> =>
  new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));

describe('shell themes over the ui-kit palette', () => {
    it('gives every theme an appearance, so the kit resolves the matching palette', () => {
    for (const theme of frontxThemes) {
      expect(theme.appearance, theme.id).toMatch(/^(light|dark)$/);
    }
  });

              });
