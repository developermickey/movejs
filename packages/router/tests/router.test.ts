import { describe, it, expect } from 'vitest';
import {
  Router,
  createRouter,
  FileScanner,
  generateRouteManifest,
  renderSSR,
  renderSSG,
  renderCSR,
  renderISR,
  renderEdge,
  getRenderer
} from '../src/index';
import { createElement } from '@movejs/core';

describe('Router.compilePattern / match', () => {
  it('matches static routes', () => {
    const router = createRouter();
    expect(router.match('/about', '/about')).toEqual({});
  });

  it('does not match when segments differ', () => {
    const router = createRouter();
    expect(router.match('/about', '/contact')).toBeNull();
  });

  it('extracts dynamic params [id]', () => {
    const router = createRouter();
    expect(router.match('/users/42', '/users/[id]')).toEqual({ id: '42' });
  });

  it('extracts multiple dynamic params', () => {
    const router = createRouter();
    expect(router.match('/users/42/posts/7', '/users/[userId]/posts/[postId]')).toEqual({
      userId: '42',
      postId: '7'
    });
  });

  it('matches catch-all [...rest]', () => {
    const router = createRouter();
    expect(router.match('/docs/guides/getting-started', '/docs/[...slug]')).toEqual({
      slug: 'guides/getting-started'
    });
  });

  it('returns null when no match', () => {
    const router = createRouter();
    expect(router.match('/nope/1/2', '/docs/[...slug]')).toBeNull();
  });
});

describe('Router.addRoute / findRoute', () => {
  it('routes to the registered static page component', () => {
    const router = createRouter();
    const component = () => createElement('h1', null, 'About');
    router.addRoute('/about', component);
    const route = router.getRoutes().find((r) => r.pattern === '/about');
    expect(route).toBeDefined();
    expect(route!.component).toBe(component);
  });

  it('respects config and layout', () => {
    const router = createRouter();
    router.addRoute('/x', () => null, { layout: 'MainLayout' });
    const route = router.getRoutes()[0];
    expect(route.config.layout).toBe('MainLayout');
    expect(route.layout).toBe('MainLayout');
  });
});

describe('Router.buildPath', () => {
  it('fills params into a pattern', () => {
    const router = createRouter();
    expect(router.buildPath('/users/[id]', { id: '7' })).toBe('/users/7');
  });
});

describe('FileScanner', () => {
  it('scans page files into routes', async () => {
    const scanner = new FileScanner(new URL('../tests/fixtures/app', import.meta.url).pathname);
    const routes = await scanner.scan();

    const expected = ['/about', '/users/[id]', '/docs/[...slug]'];
    const patterns = routes.map((r) => r.pattern);
    for (const p of expected) expect(patterns).toContain(p);
    expect(patterns).toContain('/');
  });

  it('extracts route config from export const config', async () => {
    const scanner = new FileScanner(new URL('../tests/fixtures/app', import.meta.url).pathname);
    const routes = await scanner.scan();
    const about = routes.find((r) => r.pattern === '/about');
    expect(about).toBeDefined();
    expect(about!.config.render).toBe('ssr');
    expect(about!.config.seo?.title).toBe('About');
  });
});

describe('generateRouteManifest', () => {
  it('produces a versioned manifest with route file paths', async () => {
    const manifest = await generateRouteManifest(
      new URL('../tests/fixtures/app', import.meta.url).pathname
    );
    expect(manifest.version).toBe('0.1.0');
    expect(manifest.routes.length).toBeGreaterThanOrEqual(4);
    expect(manifest.routes[0].filePath).toMatch(/pages/);
  });
});

describe('renderSSR', () => {
  it('renders a component to html with 200 status', async () => {
    const route: any = {
      pattern: '/',
      regex: /^\/$/,
      params: [],
      filePath: 'pages/index.tsx',
      config: {},
      component: ({ name }: any) => createElement('h1', null, `Hello ${name}`)
    };

    const result = await renderSSR({
      route,
      params: {},
      query: {}
    });

    expect(result.html).toBe('<h1>Hello undefined</h1>');
    expect(result.status).toBe(200);
    expect(result.headers['Content-Type']).toContain('text/html');
  });

  it('passes params + query to the component as props', async () => {
    const route: any = {
      pattern: '/users/[id]',
      regex: /^\/users\/([^/]+)$/,
      params: ['id'],
      filePath: 'pages/users/[id].tsx',
      config: {},
      component: (props: any) => createElement('main', null, `id=${props.id} q=${props.q}`)
    };

    const result = await renderSSR({
      route,
      params: { id: '42' },
      query: { q: 'test' }
    });

    expect(result.html).toBe('<main>id=42 q=test</main>');
  });

  it('runs a loader and passes its data to the component', async () => {
    const route: any = {
      pattern: '/',
      regex: /^\/$/,
      params: [],
      filePath: 'pages/index.tsx',
      config: {
        loader: async () => ({ data: { count: 7 } })
      },
      component: (props: any) => createElement('div', null, `count=${props.data.count}`)
    };

    const result = await renderSSR({ route, params: {}, query: {} });
    expect(result.html).toBe('<div>count=7</div>');
  });

  it('generates SEO head tags from config', async () => {
    const route: any = {
      pattern: '/',
      regex: /^\/$/,
      params: [],
      filePath: 'pages/index.tsx',
      config: {
        seo: { title: 'T', description: 'D', canonical: 'https://x.com/' }
      },
      component: () => createElement('p', null, 'x')
    };

    const result = await renderSSR({ route, params: {}, query: {} });
    expect(result.head.title).toBe('T');
    expect(result.head.meta.some((m) => m.name === 'description' && m.content === 'D')).toBe(true);
    expect(result.head.links.some((l) => l.rel === 'canonical' && l.href === 'https://x.com/')).toBe(true);
  });
});

describe('renderCSR', () => {
  it('returns a minimal client shell', async () => {
    const route: any = {
      pattern: '/',
      regex: /^\/$/,
      params: [],
      filePath: 'pages/index.tsx',
      config: {},
      component: () => createElement('p', null, 'x')
    };

    const result = await renderCSR({ route, params: {}, query: {} });
    expect(result.status).toBe(200);
    expect(result.html).toContain('id="movejs-app"');
    expect(result.html).toContain('/_movejs/client.js');
  });
});

describe('renderSSG / renderISR / renderEdge', () => {
  it('renderSSG produces immutable cache headers', async () => {
    const route: any = {
      pattern: '/',
      regex: /^\/$/,
      params: [],
      filePath: 'pages/s.md',
      config: {},
      component: () => createElement('p', null, 'static')
    };
    const result = await renderSSG({ route, params: {}, query: {} });
    expect(result.headers['Cache-Control']).toContain('public');
    expect(result.html).toContain('static');
  });

  it('renderISR returns ISR cache headers and revalidate', async () => {
    const route: any = {
      pattern: '/',
      regex: /^\/$/,
      params: [],
      filePath: 'pages/i.md',
      config: { revalidate: 30 },
      component: () => createElement('p', null, 'live')
    };
    const result = await renderISR({ route, params: {}, query: {} });
    expect((result as any).revalidate).toBe(30);
    expect(result.headers['Cache-Control']).toContain('s-maxage');
  });

  it('renderEdge delegates to SSR', async () => {
    const route: any = {
      pattern: '/',
      regex: /^\/$/,
      params: [],
      filePath: 'pages/e.md',
      config: {},
      component: () => createElement('p', null, 'edge')
    };
    const result = await renderEdge({ route, params: {}, query: {} });
    expect(result.html).toContain('edge');
  });
});

describe('getRenderer', () => {
  it('returns the SSR handler for ssr', () => {
    expect(getRenderer('ssr')).toBe(renderSSR);
  });

  it('returns the SSG handler for ssg', () => {
    expect(getRenderer('ssg')).toBe(renderSSG);
  });

  it('returns the CSR handler for csr', () => {
    expect(getRenderer('csr')).toBe(renderCSR);
  });

  it('returns the ISR handler for isr', () => {
    expect(getRenderer('isr')).toBe(renderISR);
  });

  it('returns the edge handler for edge', () => {
    expect(getRenderer('edge')).toBe(renderEdge);
  });

  it('falls back to SSR for unknown modes', () => {
    expect(getRenderer('wat' as any)).toBe(renderSSR);
  });
});