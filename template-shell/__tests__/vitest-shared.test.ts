//
// Locks the rendered output of the standalone-scaffold helpers in
// `vitest.shared.ts` against the canonical constants they are built from.
// Without these assertions a drift in `TEST_INCLUDE_TSX`, `COVERAGE_EXCLUDE`,
// `COVERAGE_THRESHOLDS`, or the setup-file body could silently ship to every
// scaffolded project via `packages/cli/scripts/copy-templates.ts`.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { COLD_START_TIMEOUT_MS, COVERAGE_EXCLUDE, COVERAGE_THRESHOLDS, DEFAULT_TEST_EXCLUDE, HOST_SCRIPT_TEST_INCLUDE, TEST_INCLUDE_TSX, renderStandaloneVitestConfig } from '../vitest.shared';

const HERE = path.dirname(fileURLToPath(import.meta.url));
describe('renderStandaloneVitestConfig', () => {
  const rendered = renderStandaloneVitestConfig();

  it('emits every TEST_INCLUDE_TSX glob as a string literal', () => {
    for (const glob of TEST_INCLUDE_TSX) {
      expect(rendered).toContain(JSON.stringify(glob));
    }
  });

  it('wraps DEFAULT_TEST_EXCLUDE plus src/mfe_packages/** as host-app excludes', () => {
    expect(rendered).toContain(JSON.stringify('src/mfe_packages/**'));
    for (const glob of DEFAULT_TEST_EXCLUDE) {
      expect(rendered).toContain(JSON.stringify(glob));
    }
  });

  it('emits every COVERAGE_EXCLUDE glob', () => {
    for (const glob of COVERAGE_EXCLUDE) {
      expect(rendered).toContain(JSON.stringify(glob));
    }
  });

  it('emits the shared coverage thresholds', () => {
    for (const [key, value] of Object.entries(COVERAGE_THRESHOLDS)) {
      expect(rendered).toContain(`${JSON.stringify(key)}: ${value}`);
    }
  });

  it('keeps passWithNoTests strict, jsdom env, and shared setup wiring', () => {
    expect(rendered).toContain('passWithNoTests: false');
    expect(rendered).toContain("environment: 'jsdom'");
    expect(rendered).toContain('setupFiles: [sharedSetupFile]');
    expect(rendered).toContain(`testTimeout: ${COLD_START_TIMEOUT_MS}`);
    expect(rendered).toContain(`hookTimeout: ${COLD_START_TIMEOUT_MS}`);
    expect(rendered).toContain('@vitejs/plugin-react');
    expect(rendered).toContain('execArgv: vitestNodeWorkerExecArgv()');
    expect(rendered).toContain('--no-experimental-webstorage');
  });

  it('wires the @ and @frontx-test-utils aliases used by the host Vitest config', () => {
    expect(rendered).toContain("'@': fileURLToPath(new URL('./src'");
    expect(rendered).toContain(
      "'@frontx-test-utils': fileURLToPath(new URL('./src/__test-utils__'",
    );
  });

  it('includes the host scripts/**/*.test globs so scaffolds pick up logic-heavy script tests', () => {
    for (const glob of HOST_SCRIPT_TEST_INCLUDE) {
      expect(rendered).toContain(JSON.stringify(glob));
    }
  });
});

