/**
 * The framework's only routing code is the router injection in the
 * microfrontends plugin: `import { router } from '@gears-frontx/routing'` and
 * `mfeRegistryFactory.build({ typeSystem, mfeHandlers, router })`. Which
 * modules may import `@gears-frontx/routing` or `@gears-frontx/routing-tanstack`
 * is enforced by `arch:deps` (`.dependency-cruiser.cjs`,
 * `framework-routing-only-in-microfrontends-plugin` and
 * `framework-and-react-no-routing-tanstack`); this checks what that cannot
 * see, the package manifest.
 *
 * @vitest-environment node
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface PackageJson {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, unknown>;
}

describe('@gears-frontx/framework — the router injection is its only routing code', () => {
  it('carries no @gears-frontx/routing-tanstack dependency, peer dependency or peer metadata', () => {
    const pkg = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as PackageJson;
    expect(Object.keys(pkg.dependencies ?? {})).not.toContain('@gears-frontx/routing-tanstack');
    expect(Object.keys(pkg.peerDependencies ?? {})).not.toContain('@gears-frontx/routing-tanstack');
    expect(Object.keys(pkg.peerDependenciesMeta ?? {})).not.toContain('@gears-frontx/routing-tanstack');
  });
});
