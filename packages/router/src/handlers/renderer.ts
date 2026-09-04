import type { Route, RouteConfig, RenderMode, LoaderContext, LoaderResult } from '../core/types';
import { renderToString as coreRenderToString } from '@movejs/core';

// Rendering handlers for different modes

export interface RenderContext {
  route: Route;
  params: Record<string, string>;
  query: Record<string, string>;
  request?: Request;
  response?: Response;
}

export interface RenderResult {
  html: string;
  head: {
    title: string;
    meta: Array<{ name?: string; property?: string; content: string }>;
    links: Array<{ rel: string; href: string; type?: string }>;
    scripts: Array<{ src?: string; content?: string; type?: string }>;
  };
  status: number;
  headers: Record<string, string>;
}

// SSR Handler - Server-Side Rendering
export async function renderSSR(context: RenderContext): Promise<RenderResult> {
  const { route, params, query, request } = context;

  // Execute loader
  let data: any = null;
  const loader = route.config.loader;
  if (loader) {
    const loaderContext: LoaderContext = {
      params,
      request: request || new Request('http://localhost'),
      query
    };
    const result = await loader(loaderContext);
    data = result?.data;
  }

  // Render component to HTML
  const html = renderToString(route.component, { ...params, ...query, data });

  // Generate head tags
  const head = generateHead(route.config, params);

  return {
    html,
    head,
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  };
}

// SSG Handler - Static Site Generation
export async function renderSSG(context: RenderContext): Promise<RenderResult> {
  const { route, params, query } = context;

  // Execute loader
  let data: any = null;
  const loader = route.config.loader;
  if (loader) {
    const loaderContext: LoaderContext = {
      params,
      request: new Request('http://localhost'),
      query
    };
    const result = await loader(loaderContext);
    data = result?.data;
  }

  // Render component to HTML
  const html = renderToString(route.component, { ...params, ...query, data });

  // Generate head tags
  const head = generateHead(route.config, params);

  return {
    html,
    head,
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  };
}

// ISR Handler - Incremental Static Regeneration
export async function renderISR(context: RenderContext): Promise<RenderResult & { revalidate?: number }> {
  const { route, params, query } = context;

  // Check cache
  const cacheKey = `isr:${route.pattern}:${JSON.stringify(params)}`;
  const cached = await getCachedResult(cacheKey);
  
  if (cached) {
    return {
      ...cached,
      headers: {
        ...cached.headers,
        'x-movejs-isr': 'cached'
      }
    };
  }

  // Execute loader
  let data: any = null;
  const loader = route.config.loader;
  if (loader) {
    const loaderContext: LoaderContext = {
      params,
      request: new Request('http://localhost'),
      query
    };
    const result = await loader(loaderContext);
    data = result?.data;
  }

  // Render component to HTML
  const html = renderToString(route.component, { ...params, ...query, data });

  // Generate head tags
  const head = generateHead(route.config, params);

  const result: RenderResult & { revalidate?: number } = {
    html,
    head,
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    },
    revalidate: route.config.revalidate || 60
  };

  // Cache the result
  await cacheResult(cacheKey, result, result.revalidate);

  return result;
}

// CSR Handler - Client-Side Rendering
export async function renderCSR(context: RenderContext): Promise<RenderResult> {
  const { route, params, query } = context;

  // Generate shell HTML
  const html = generateShell(route, params);

  // Generate head tags
  const head = generateHead(route.config, params);

  return {
    html,
    head,
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  };
}

// Edge Handler - Edge Runtime
export async function renderEdge(context: RenderContext): Promise<RenderResult> {
  // Edge runtime has limited APIs
  // Similar to SSR but with edge-compatible APIs
  return renderSSR(context);
}

// Helper: Render component to string using core SSR
function renderToString(component: any, props: Record<string, any>): string {
  try {
    return coreRenderToString(component, props);
  } catch (error) {
    console.error('SSR Error:', error);
    return '<div>Error rendering component</div>';
  }
}

// Helper: Generate HTML head
function generateHead(config: RouteConfig, params: Record<string, string>): RenderResult['head'] {
  const seo = config.seo || {};
  
  const meta = [
    { name: 'description', content: seo.description || '' },
    { property: 'og:title', content: seo.title || '' },
    { property: 'og:description', content: seo.description || '' },
    { property: 'og:image', content: seo.ogImage || '' },
    { property: 'og:type', content: seo.ogType || 'website' },
    { name: 'twitter:card', content: seo.twitterCard || 'summary_large_image' }
  ];

  if (seo.noindex) {
    meta.push({ name: 'robots', content: 'noindex' });
  }

  if (seo.nofollow) {
    meta.push({ name: 'robots', content: 'nofollow' });
  }

  return {
    title: seo.title || '',
    meta: meta.filter(m => m.content),
    links: [
      { rel: 'canonical', href: seo.canonical || '' }
    ].filter(l => l.href),
    scripts: []
  };
}

// Helper: Generate shell HTML for CSR
function generateShell(route: Route, params: Record<string, string>): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading...</title>
</head>
<body>
  <div id="movejs-app">
    <noscript>JavaScript is required to run this application.</noscript>
  </div>
  <script type="module" src="/_movejs/client.js"></script>
</body>
</html>
  `.trim();
}

// Cache functions (simplified)
async function getCachedResult(key: string): Promise<RenderResult | null> {
  // In production, use Redis, filesystem, or CDN cache
  return null;
}

async function cacheResult(
  key: string, 
  result: RenderResult, 
  ttl?: number
): Promise<void> {
  // In production, use Redis, filesystem, or CDN cache
}

// Export render function based on mode
export function getRenderer(mode: RenderMode) {
  switch (mode) {
    case 'ssr':
      return renderSSR;
    case 'ssg':
      return renderSSG;
    case 'isr':
      return renderISR;
    case 'csr':
      return renderCSR;
    case 'edge':
      return renderEdge;
    default:
      return renderSSR;
  }
}
