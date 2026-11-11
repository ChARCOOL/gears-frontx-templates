/**
 * Tests for the strict preview ports of `dev:all` (`scripts/lib/preview-ports.ts`).
 *
 * The probe runs against a real listening socket, and one case runs the real
 * `dev-all.ts` over a fixture project whose package declares a taken port: the
 * run has to stop before it builds anything, naming the port and the package.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:net';
import { join } from 'node:path';

import { PREVIEW_HOST, isPortFree, previewCommand } from '../scripts/lib/preview-ports';

const holders: Server[] = [];

/** Holds a port on the host a preview listens on, the way another process would. */
function holdPort(): Promise<number> {
  return new Promise((resolvePromise, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen({ port: 0, host: PREVIEW_HOST }, () => {
      holders.push(server);
      const address = server.address();
      if (address === null || typeof address === 'string') {
        reject(new Error('no port'));
        return;
      }
      resolvePromise(address.port);
    });
  });
}

function release(server: Server): Promise<void> {
  return new Promise((done) => server.close(() => done()));
}

afterEach(async () => {
  await Promise.all(holders.splice(0).map(release));
});

describe('isPortFree', () => {
  it('reports a port another server listens on as taken, and free once it is released', async () => {
    const port = await holdPort();

    expect(await isPortFree(port)).toBe(false);

    await Promise.all(holders.splice(0).map(release));
    expect(await isPortFree(port)).toBe(true);
  });
});

describe('previewCommand', () => {
  it('starts the preview on a strict port, so a port taken after the check fails instead of moving', () => {
    expect(previewCommand({ name: 'orders-mfe', port: 3010 }).command).toBe('npm run preview -- --strictPort');
  });

  it('starts the preview in the package directory', () => {
    expect(previewCommand({ name: 'orders-mfe', port: 3010 }).cwd).toBe(
      join(process.cwd(), 'src-app', 'mfe_packages', 'orders-mfe'),
    );
  });
});

