import { describe, expect, it } from 'vitest';
import { anchorKitThemeOnShadowHost } from './anchorKitThemeOnShadowHost';

// The two shapes the kit's theme.css reaches this code in: verbatim source in
// dev and tests, one minified line in a production build.
const EXPANDED_THEME_CSS = `/*
 * Tokens declared on :root, per the comment above.
 */
:root {
  --radius-md: 0.5rem;
}

:root,
[data-theme='light'] {
  --background: #f8fafc;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --background: #090b10;
  }
}
`;

const MINIFIED_THEME_CSS =
  ':root{--radius-md: 0.5rem}:root,[data-theme=light]{--background: #f8fafc}' +
  '@media (prefers-color-scheme: dark){:root:not([data-theme=light]){--background: #090b10}}';

describe('anchorKitThemeOnShadowHost', () => {
  it('rewrites every root selector of an expanded stylesheet, including the one behind a comment', () => {
    const anchored = anchorKitThemeOnShadowHost(EXPANDED_THEME_CSS);

    expect(anchored).not.toContain(':root');
    expect(anchored.match(/:host/g)).toHaveLength(3);
  });

  it('rewrites every root selector of a minified stylesheet, where no selector starts a line', () => {
    const anchored = anchorKitThemeOnShadowHost(MINIFIED_THEME_CSS);

    expect(anchored).not.toContain(':root');
    expect(anchored.match(/:host/g)).toHaveLength(3);
  });

  it('leaves the theme scopes the kit selects on untouched, so an explicit scope still overrides the host', () => {
    const anchored = anchorKitThemeOnShadowHost(MINIFIED_THEME_CSS);

    expect(anchored).toContain(':host,[data-theme=light]');
    expect(anchored).toContain(':host(:not([data-theme=light]))');
  });

  // A shadow host is featureless: `:host` matches it, and a compound such as
  // `:host:not(...)` matches nothing at all. The kit hangs its whole
  // prefers-color-scheme dark block off `:root:not([data-theme='light'])`, so
  // the tail has to move inside the functional form or dark mode disappears in
  // a shadow root with nothing to see in the rewritten text.
  it('moves a compound tail inside :host() rather than leaving it in the compound', () => {
    expect(anchorKitThemeOnShadowHost(":root:not([data-theme='light']){--background:#090b10}")).toBe(
      ":host(:not([data-theme='light'])){--background:#090b10}"
    );
    expect(anchorKitThemeOnShadowHost(':root[dir=rtl] .a{margin:0}')).toBe(
      ':host([dir=rtl]) .a{margin:0}'
    );
  });

  // A pseudo-element is the one tail that must stay outside the parentheses:
  // `:host::before` is valid, `:host(::before)` is not.
  it('keeps a pseudo-element outside :host()', () => {
    expect(anchorKitThemeOnShadowHost(':root::before{content:""}')).toBe(
      ':host::before{content:""}'
    );
  });

  // A selector list may put :root anywhere, not only first; a rewrite that
  // recognised selector positions would drop this one and leave the rule
  // matching nothing in a shadow tree.
  it('rewrites a root selector that trails another selector in the same list', () => {
    const anchored = anchorKitThemeOnShadowHost("[data-theme='light'],:root{--background:#fff}");

    expect(anchored).toBe("[data-theme='light'],:host{--background:#fff}");
  });

        // A documented limitation, pinned rather than fixed: the rewrite is textual,
  // so a `:root` inside a quoted value is data it cannot recognise, and it is
  // rewritten like any other. The pinned kit stylesheet contains no such value
  // (the test above is what checks that), so no parser is warranted here. This
  // case exists so that changing the transform is a deliberate act: whoever
  // makes the rewrite selector-aware will see this expectation fail and can
  // then update it on purpose.
  it('rewrites a root inside a quoted value too, which is the known limitation', () => {
    const anchored = anchorKitThemeOnShadowHost(':host::after{content:":root"}');

    expect(anchored).toBe(':host::after{content:":host"}');
  });
});
