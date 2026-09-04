import { resolve, join, extname, basename, relative, dirname } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';
import { createServer, staticFiles } from '@movejs/server';
import { FileScanner, getRenderer } from '@movejs/router';

const require = createRequire(import.meta.url);

// Find the monorepo/node_modules root that holds the @movejs packages
// Walk up from the CLI location until we find node_modules/@movejs
function findMoveJSSRoot(start: string): string | null {
  let dir = start;
  for (let i = 0; i < 12; i++) {
    const nm = join(dir, 'node_modules', '@movejs');
    if (existsSync(nm)) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// Map @movejs/* and subpaths to their real dist files so esbuild can resolve them
function buildAliases(): Record<string, string> {
  const root = findMoveJSSRoot(fileURLToPath(import.meta.url));
  if (!root) return {};

  const pkgs = ['core', 'router', 'server', 'data', 'ai', 'auth', 'seo', 'a11y', 'ui', 'shared'];
  const alias: Record<string, string> = {};
  for (const pkg of pkgs) {
    const base = join(root, 'node_modules', '@movejs', pkg, 'dist', pkg === 'cli' ? 'cli.js' : 'index.js');
    if (existsSync(base)) {
      alias[`@movejs/${pkg}`] = base;
    }
  }
  const jsx = join(root, 'node_modules', '@movejs', 'core', 'dist', 'jsx-runtime.js');
  if (existsSync(jsx)) {
    alias['@movejs/core/jsx-runtime'] = jsx;
  }
  return alias;
}

// Build and run a MoveJS app
// This is used by both `movejs dev` and `movejs start`.

export interface RunnerOptions {
  appDir?: string; // defaults to cwd or cwd/app
  port?: number;
  host?: string;
  mode?: 'dev' | 'production';
}

export async function runMoveJS(options: RunnerOptions = {}): Promise<void> {
  const { port = 3000, host = 'localhost', mode = 'dev' } = options;
  const appDir = findAppDir(options.appDir || process.cwd());

  if (!appDir) {
    throw new Error(
      'No MoveJS app found. Make sure you have an `app/` directory with `app/pages/`.'
    );
  }

  console.log(`\n  ⚡ MoveJS ${mode === 'dev' ? 'Development' : 'Production'} Server`);
  console.log(`  📁 App: ${appDir}`);
  console.log(`  🚀 http://${host}:${port}\n`);

  // Bundle the app's pages + api routes to temp ESM files that Node can import
  const tempOut = await bundleApp(appDir, mode);

  // Scan routes (imports the bundled ESM components)
  const scanner = new FileScanner(appDir);
  const routes = await scanner.scan();

  if (routes.length === 0) {
    console.log('  ⚠️  No page components found in app/pages/');
  }

  const server = createServer({
    port,
    host,
    compression: true
  });

  // Serve static files from public/ (project root, or app/public as fallback)
  const publicDir = [join(dirname(appDir), 'public'), join(appDir, 'public')]
    .find((p) => existsSync(p));
  if (publicDir) {
    server.use(staticFiles(publicDir, { maxAge: mode === 'dev' ? 0 : 86400 }));
  }

  // Register API routes
  await registerAPIRoutes(server, appDir, tempOut);

  // Register page routes (SSR)
  for (const route of routes) {
    const renderMode = ((route.config as any).render || 'ssr') as string;
    const handler = getRenderer(renderMode as any);

    // Load the bundled page component (the scanner reads raw .tsx source which Node can't import)
    const builtPage = join(tempOut, relative(appDir, route.filePath).split('\\').join('/').replace(/\.(tsx|jsx|ts|js)$/, '.js')).replace(/\\/g, '/');
    let pageComponent: any = route.component;
    try {
      const mod = await import(`file://${builtPage}`);
      pageComponent = mod.default || mod;
      route.component = pageComponent;
    } catch (err) {
      console.error(`  ⚠️  Failed to load page ${route.pattern}:`, (err as Error).message);
    }

    server.all(route.pattern, async (req: any, res: any) => {
      try {
        const params = matchParams(route.pattern, req.parsedUrl?.pathname || '/');
        const result = await handler({
          route: route as any,
          params,
          query: Object.fromEntries(req.parsedUrl?.searchParams || new URLSearchParams()),
          request: req
        });

        res.status(result.status || 200);
        for (const [k, v] of Object.entries(result.headers || {})) {
          res.set(k, v);
        }
        res.html(wrapDocument(result.html, result.head));
      } catch (err) {
        res.status(500).html(
          `<pre>MoveJS render error:\n${(err as Error).message}\n${(err as Error).stack || ''}</pre>`
        );
      }
    });
  }

  // 404 fallback
  server.all('*', async (_req: any, res: any) => {
    res.status(404).html('<!DOCTYPE html><html><body><h1>404</h1><p>Page Not Found</p></body></html>');
  });

  await server.listen(port, host);
  console.log(`  ✅ Server ready on http://${host}:${port}`);
}

// Find the app directory
export function findAppDir(cwd: string): string | null {
  const candidates = [cwd, join(cwd, 'app')];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'pages'))) {
      return dir;
    }
  }
  return null;
}

// Build a production bundle to a persistent output directory and write a route manifest
export async function buildApp(options: { appDir?: string; output?: string; minify?: boolean } = {}): Promise<{
  appDir: string | null;
  output: string;
  routes: any[];
}> {
  const appDir = findAppDir(options.appDir || process.cwd());
  if (!appDir) {
    throw new Error('No MoveJS app found. Make sure you have an `app/` directory with `app/pages/`.');
  }

  const output = resolve(options.output || join(process.cwd(), '.movejs'));
  const outRoot = join(output, 'server');
  mkdirSync(outRoot, { recursive: true });

  // Bundle pages + API routes (with minify if requested)
  await bundleAppTo(appDir, 'production', outRoot, options.minify);

  // Scan routes for the manifest
  const scanner = new FileScanner(appDir);
  const routes = await scanner.scan();

  const manifest = {
    version: '0.1.0',
    appDir,
    generatedAt: new Date().toISOString(),
    routes: routes.map((r) => ({
      pattern: r.pattern,
      filePath: relative(appDir, r.filePath).split('\\').join('/').replace(/\.(tsx|jsx|ts|js)$/, '.js'),
      config: (r as any).config || {}
    }))
  };

  writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));

  return { appDir, output, routes };
}

async function bundleAppTo(
  appDir: string,
  mode: 'dev' | 'production',
  outRoot: string,
  minify = false
): Promise<void> {
  const pagesDir = join(appDir, 'pages');
  const apiDir = join(appDir, 'api');

  mkdirSync(outRoot, { recursive: true });

  const entries: string[] = [];
  collectSourceFiles(pagesDir, entries);
  collectSourceFiles(apiDir, entries);

  if (entries.length === 0) {
    return;
  }

  await esbuild.build({
    entryPoints: entries,
    outdir: outRoot,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    jsx: 'automatic',
    jsxImportSource: '@movejs/core',
    sourcemap: false,
    minify,
    outbase: appDir,
    alias: buildAliases(),
    external: ['pg', 'mysql2/promise', 'mysql2', 'better-sqlite3', 'mongodb', 'sqlite3', 'tedious', 'oracledb', 'knex'],
    define: {
      'process.env.NODE_ENV': `"${mode}"`
    }
  });
}


// Bundle all pages + api routes to ESM files that Node can import
async function bundleApp(
  appDir: string,
  mode: 'dev' | 'production',
  outRoot?: string
): Promise<string> {
  const resolved = outRoot || join(tmpdir(), 'movejs', hash(appDir));
  await bundleAppTo(appDir, mode, resolved, false);
  return resolved;
}

function collectSourceFiles(dir: string, out: string[]): void {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(full, out);
    } else {
      const ext = extname(entry.name);
      if (['.tsx', '.jsx', '.ts', '.js'].includes(ext)) {
        if (!entry.name.startsWith('_') && !entry.name.startsWith('.')) {
          out.push(full);
        }
      }
    }
  }
}

// Register API routes from the api/ directory
async function registerAPIRoutes(server: any, appDir: string, outRoot: string): Promise<void> {
  const apiDir = join(appDir, 'api');
  if (!existsSync(apiDir)) return;

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  for (const file of collectApiFiles(apiDir)) {
    const rel = relative(appDir, file).split('\\').join('/');
    const routePath = '/' + (rel
      .replace(/\.(tsx|jsx|ts|js)$/, '')
      .replace(/\[(\w+)\]/g, ':$1') || '');

    const builtPath = join(outRoot, rel.replace(extname(file), '.js')).replace(/\\/g, '/');

    try {
      const mod = await import(`file://${builtPath}`);
      for (const method of methods) {
        const handler = mod[method];
        if (typeof handler === 'function') {
          server[method.toLowerCase()](routePath, async (_req: any, res: any) => {
            try {
              const response = await handler(_req);
              const text = await response.text();
              res
                .status(response.status || 200)
                .set('Content-Type', response.headers?.get?.('content-type') || 'application/json')
                .send(text);
            } catch (err) {
              res.status(500).json({ error: (err as Error).message });
            }
          });
        }
      }
    } catch (err) {
      console.error(`  ⚠️  Failed to load API route ${routePath}:`, (err as Error).message);
    }
  }
}

function collectApiFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectApiFiles(full));
    } else if (['.ts', '.js', '.tsx', '.jsx'].includes(extname(full))) {
      out.push(full);
    }
  }
  return out;
}

// Match params from a route pattern against a pathname
function matchParams(pattern: string, pathname: string): Record<string, string> {
  const params: Record<string, string> = {};
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  patternParts.forEach((part, i) => {
    const dyn = part.match(/^\[(.+)\]$/);
    if (dyn) {
      params[dyn[1]] = pathParts[i] || '';
    } else if (part.startsWith('[...')) {
      const key = part.replace('[...', '').replace(']', '');
      params[key] = pathParts.slice(i).join('/');
    }
  });

  return params;
}

// Wrap rendered body + head into a full HTML document
function wrapDocument(body: string, head: any): string {
  const h = head || {};
  const title = h.title ? `<title>${h.title}</title>` : '';
  const meta = (h.meta || [])
    .map((m: any) => `<meta ${Object.entries(m).map(([k, v]) => `${k}="${v}"`).join(' ')} />`)
    .join('');
  const links = (h.links || [])
    .map((l: any) => `<link ${Object.entries(l).map(([k, v]) => `${k}="${v}"`).join(' ')} />`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${title}${meta}${links}
</head>
<body>${body}</body>
</html>`;
}

function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return String(Math.abs(h));
}

// Export a helper to report if the app can run
export function checkApp(appDir?: string): { ok: boolean; appDir: string | null; reason?: string } {
  const dir = findAppDir(appDir || process.cwd());
  if (!dir) {
    return { ok: false, appDir: null, reason: 'No app/pages directory found' };
  }
  return { ok: true, appDir: dir };
}