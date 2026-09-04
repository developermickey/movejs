import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, staticFiles, helmet, cors, bodyParser } from '../src/index';
import type { ServerInstance } from '../src/types';
import { mkdtempSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Helper to start a server on an ephemeral port
async function startServer(config: any = {}): Promise<{ server: ServerInstance; port: number; url: string }> {
  const server = createServer(config);
  await server.listen(0, '127.0.0.1');
  const port = (server.server.address() as any).port;
  return { server, port, url: `http://127.0.0.1:${port}` };
}

describe('createServer routing', () => {
  it('serves a GET route and returns a string response body', async () => {
    const { server, url } = await startServer();
    server.get('/hello', (_req: any, res: any) => res.send('world'));
    const res = await fetch(`${url}/hello`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('world');
    await server.close();
  });

  it('supports JSON responses', async () => {
    const { server, url } = await startServer();
    server.get('/json', (_req: any, res: any) => res.json({ ok: true, n: 3 }));
    const res = await fetch(`${url}/json`);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ ok: true, n: 3 });
    await server.close();
  });

  it('sets the status code', async () => {
    const { server, url } = await startServer();
    server.get('/created', (_req: any, res: any) => res.status(201).json({ created: true }));
    const res = await fetch(`${url}/created`);
    expect(res.status).toBe(201);
    await server.close();
  });

  it('extracts URL params into req.params', async () => {
    const { server, url } = await startServer();
    server.get('/users/[id]', (req: any, res: any) => res.json({ id: req.params.id }));
    const res = await fetch(`${url}/users/42`);
    expect(await res.json()).toEqual({ id: '42' });
    await server.close();
  });

  it('exposes parsedUrl and query', async () => {
    const { server, url } = await startServer();
    server.get('/search', (req: any, res: any) =>
      res.json({ path: req.parsedUrl.pathname, q: req.query.q })
    );
    const res = await fetch(`${url}/search?q=movejs`);
    expect(await res.json()).toEqual({ path: '/search', q: 'movejs' });
    await server.close();
  });

  it('serves POST with a JSON body via req.json()', async () => {
    const { server, url } = await startServer();
    server.post('/echo', async (req: any, res: any) => {
      const body = await req.json();
      res.status(201).json({ received: body });
    });
    const res = await fetch(`${url}/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: 1 })
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ received: { a: 1 } });
    await server.close();
  });

  it('matches method-specific routes (GET vs POST on same path)', async () => {
    const { server, url } = await startServer();
    server.get('/item', (_req: any, res: any) => res.send('GET'));
    server.post('/item', (_req: any, res: any) => res.send('POST'));
    expect(await (await fetch(`${url}/item`)).text()).toBe('GET');
    expect(await (await fetch(`${url}/item`, { method: 'POST' })).text()).toBe('POST');
    await server.close();
  });

  it('returns 404 for unmatched routes', async () => {
    const { server, url } = await startServer();
    server.get('/known', (_req: any, res: any) => res.send('ok'));
    const res = await fetch(`${url}/unknown`);
    expect(res.status).toBe(404);
    await server.close();
  });
});

describe('catch-all routes', () => {
  it('matches a catch-all with method "*"', async () => {
    const { server, url } = await startServer();
    server.all('*', (_req: any, res: any) => res.status(404).send('fallback'));
    const res = await fetch(`${url}/anything`);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('fallback');
    await server.close();
  });
});

describe('middleware', () => {
  it('applies CORS headers', async () => {
    const { server, url } = await startServer();
    server.use(cors({ origin: 'example.com', credentials: true }));
    server.get('/cors', (_req: any, res: any) => res.send('ok'));
    const res = await fetch(`${url}/cors`, { headers: { Origin: 'example.com' } });
    expect(res.headers.get('access-control-allow-origin')).toBe('example.com');
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
    await server.close();
  });

  it('applies helmet security headers', async () => {
    const { server, url } = await startServer();
    server.use(helmet());
    server.get('/secure', (_req: any, res: any) => res.send('ok'));
    const res = await fetch(`${url}/secure`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    await server.close();
  });

  it('parses JSON bodies with bodyParser middleware', async () => {
    const { server, url } = await startServer();
    server.use(bodyParser());
    server.post('/parse', (req: any, res: any) => res.json({ body: req.body }));
    const res = await fetch(`${url}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: 1 })
    });
    expect(await res.json()).toEqual({ body: { x: 1 } });
    await server.close();
  });
});

describe('static file serving', () => {
  let staticDir: string;

  beforeAll(() => {
    staticDir = mkdtempSync(join(tmpdir(), 'movejs-static-'));
    writeFileSync(join(staticDir, 'hello.txt'), 'static text');
    writeFileSync(join(staticDir, 'data.json'), JSON.stringify({ ok: true }));
  });

  it('serves files with correct content type', async () => {
    const { server, url } = await startServer();
    server.use(staticFiles(staticDir));
    const txt = await fetch(`${url}/hello.txt`);
    expect(txt.status).toBe(200);
    expect(await txt.text()).toBe('static text');
    expect(txt.headers.get('content-type')).toBe('text/plain');
    await server.close();
  });

  it('serves JSON file content', async () => {
    const { server, url } = await startServer();
    server.use(staticFiles(staticDir));
    const json = await fetch(`${url}/data.json`);
    expect(json.status).toBe(200);
    expect(await json.json()).toEqual({ ok: true });
    await server.close();
  });

  it('calls next when a static file is missing (falls through)', async () => {
    const { server, url } = await startServer();
    server.use(staticFiles(staticDir));
    server.get('/missing.txt', (_req: any, res: any) => res.status(404).send('nope'));
    const res = await fetch(`${url}/missing.txt`);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('nope');
    await server.close();
  });
});