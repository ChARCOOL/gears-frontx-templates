// @cpt-dod:cpt-frontx-dod-unit-test-generation-and-agent-verification-standard-test-convention:p1
import { describe, expect, it } from 'vitest';
import { FORBIDDEN_PATTERN, findViolationsInContent } from './token-format-check.mjs';

/** @type {string | undefined} */
let rootDir;

describe('FORBIDDEN_PATTERN', () => {
  it('matches hsl(var(, hsla(var(, and whitespace after the paren', () => {
    expect(FORBIDDEN_PATTERN.test("fill: hsl(var(--primary));")).toBe(true);
    expect(FORBIDDEN_PATTERN.test("color: hsla(var(--x) / 0.5);")).toBe(true);
    expect(FORBIDDEN_PATTERN.test("color: hsl( var(--x));")).toBe(true);
    // CSS function names are ASCII case-insensitive; the guard must be too.
    expect(FORBIDDEN_PATTERN.test("color: HSL(var(--x));")).toBe(true);
    expect(FORBIDDEN_PATTERN.test("color: Hsla(var(--x) / 0.5);")).toBe(true);
  });

  it('does not match the full-color vocabulary', () => {
    // Plain consumption, alpha via color-mix, and a full-color fallback
    // INSIDE var() — the three forms the migration standardized on.
    expect(FORBIDDEN_PATTERN.test("color: var(--primary);")).toBe(false);
    expect(FORBIDDEN_PATTERN.test("color: color-mix(in oklab, var(--x) 50%, transparent);")).toBe(false);
    expect(FORBIDDEN_PATTERN.test("background: var(--background, hsl(0 0% 100%));")).toBe(false);
    // Token DEFINITIONS as full colors are the point, not a violation.
    expect(FORBIDDEN_PATTERN.test("--primary: hsl(221 83% 53%);")).toBe(false);
  });
});

describe('findViolationsInContent', () => {
  it('reports 1-based line numbers with trimmed text', () => {
    const hits = findViolationsInContent('a\n  fill="hsl(var(--primary))"\nb');
    expect(hits).toEqual([{ line: 2, text: 'fill="hsl(var(--primary))"' }]);
  });

  it('catches a wrapper whose argument starts on the next line', () => {
    const hits = findViolationsInContent('a\ncolor: hsl(\n  var(--primary)\n);\nb');
    expect(hits).toEqual([{ line: 2, text: 'color: hsl(' }]);
  });

  it('reports one hit per line even with several matches on it', () => {
    const hits = findViolationsInContent('x: hsl(var(--a)) hsla(var(--b));');
    expect(hits).toHaveLength(1);
  });
});

