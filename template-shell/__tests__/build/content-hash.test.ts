// @vitest-environment node

/**
 * Tests for the two functions that make a published `contentHash` mean
 * anything: `normalizeEmbeddedModulePathsInSource` canonicalizes the
 * package-manager-layout differences esbuild bakes into a shared chunk's
 * bytes, and `computeContentHash` hashes those (already-normalized) bytes.
 * If normalization misses a shape, two builds of the same dependency hash
 * differently and cross-MFE chunk reuse silently never happens — so the
 * case that matters most here is `computeContentHash` agreeing across two
 * inputs that only differ in the shapes normalization is meant to handle.
 *
 * Both are exported from `../../src/build/mf-gts` as the minimal pure seam:
 * `normalizeEmbeddedModulePathsInSource` is the string transform underlying
 * the file-I/O wrapper `StandaloneEsmBuilder.normalizeEmbeddedModulePaths`
 * actually calls, and `computeContentHash` is the same hashing helper
 * `MfeJsonEnricher` calls, promoted to a free function.
 */

import { describe, expect, it } from 'vitest';
import { normalizeEmbeddedModulePathsInSource } from '../../src/build/mf-gts';

describe('normalizeEmbeddedModulePathsInSource', () => {
  it('collapses pnpm\'s content-addressed store segment to the flat layout', () => {
    const pnpm =
      '// node_modules/.pnpm/react-dom@19.2.8/node_modules/react-dom/cjs/react-dom.development.js\n' +
      '"node_modules/.pnpm/react-dom@19.2.8/node_modules/react-dom/cjs/react-dom.development.js"(exports, module) {}';
    const flat =
      '// node_modules/react-dom/cjs/react-dom.development.js\n' +
      '"node_modules/react-dom/cjs/react-dom.development.js"(exports, module) {}';
    expect(normalizeEmbeddedModulePathsInSource(pnpm)).toBe(flat);
  });

  it('handles the pnpm store segment with a peer-suffixed store folder', () => {
    const withPeers =
      '// node_modules/.pnpm/react-dom@19.2.8_react@19.2.8/node_modules/react-dom/index.js\n';
    const flat = '// node_modules/react-dom/index.js\n';
    expect(normalizeEmbeddedModulePathsInSource(withPeers)).toBe(flat);
  });

  it('collapses leading ../ depth hops before node_modules/', () => {
    const deep = '// ../../node_modules/react/index.js\n';
    const shallow = '// node_modules/react/index.js\n';
    expect(normalizeEmbeddedModulePathsInSource(deep)).toBe(shallow);
  });

  it('collapses both the pnpm segment and leading depth hops together', () => {
    const deepPnpm =
      '// ../../node_modules/.pnpm/react@19.2.8/node_modules/react/index.js\n';
    const flat = '// node_modules/react/index.js\n';
    expect(normalizeEmbeddedModulePathsInSource(deepPnpm)).toBe(flat);
  });

  it('normalizes both occurrence forms: the provenance comment and the __commonJS registry key', () => {
    const source =
      '// node_modules/.pnpm/scheduler@0.27.0/node_modules/scheduler/cjs/scheduler.production.js\n' +
      'var require_scheduler_production = __commonJS({\n' +
      '  "node_modules/.pnpm/scheduler@0.27.0/node_modules/scheduler/cjs/scheduler.production.js"(exports, module) {\n' +
      '    // body\n' +
      '  }\n' +
      '});\n';
    const normalized = normalizeEmbeddedModulePathsInSource(source);
    expect(normalized).toBe(
      '// node_modules/scheduler/cjs/scheduler.production.js\n' +
        'var require_scheduler_production = __commonJS({\n' +
        '  "node_modules/scheduler/cjs/scheduler.production.js"(exports, module) {\n' +
        '    // body\n' +
        '  }\n' +
        '});\n'
    );
  });

  it('leaves a workspace-linked path with no node_modules segment untouched', () => {
    // Measured counter-example: a workspace-linked dependency emits a path
    // like this, with neither the pnpm-store nor the depth-hop shape this
    // function handles — it must pass through unchanged rather than being
    // silently mis-normalized.
    const linked = '// ../packages/mfes/dist/index.js\n';
    expect(normalizeEmbeddedModulePathsInSource(linked)).toBe(linked);
  });

  it('leaves source with no embedded module paths untouched', () => {
    const plain = 'export default function App() {}\n';
    expect(normalizeEmbeddedModulePathsInSource(plain)).toBe(plain);
  });
});

