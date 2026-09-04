// MoveJS Router Types

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type RenderMode = 'ssr' | 'ssg' | 'isr' | 'csr' | 'edge';

export type Runtime = 'node' | 'edge' | 'deno' | 'bun';

export interface RouteConfig {
  /** Rendering mode */
  render?: RenderMode;
  /** ISR revalidation time in seconds */
  revalidate?: number;
  /** Runtime environment */
  runtime?: Runtime;
  /** Require authentication */
  auth?: boolean;
  /** Rate limit */
  rateLimit?: {
    max: number;
    window: string;
  };
  /** SEO configuration */
  seo?: SEOConfig;
  /** Middleware to run */
  middleware?: string[];
  /** Prefetch strategy */
  prefetch?: 'hover' | 'viewport' | 'none';
  /** Cache configuration */
  cache?: CacheConfig;
  /** Data loader for SSR/SSG/ISR */
  loader?: Loader;
  /** Parent layout name */
  layout?: string;
  /** Extra <link> tags to inject into <head> (stylesheets, icons, preloads) */
  headLinks?: Array<{ rel: string; href: string; type?: string; sizes?: string }>;
  /** Extra <script> tags to inject before </body> */
  headScripts?: Array<{ src?: string; content?: string; type?: string; defer?: boolean }>;
}

export interface SEOConfig {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  schema?: string | Record<string, any>;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  themeColor?: string;
  alternates?: Array<{ lang: string; href: string }>;
}

export interface CacheConfig {
  /** Cache duration in seconds */
  maxAge?: number;
  /** Stale-while-revalidate duration */
  staleWhileRevalidate?: number;
  /** Cache tags for invalidation */
  tags?: string[];
  /** Private cache (per user) */
  private?: boolean;
}

export interface Route {
  /** Route path pattern */
  pattern: string;
  /** Compiled regex pattern */
  regex: RegExp;
  /** Route parameters */
  params: string[];
  /** Page component */
  component: any;
  /** Route configuration */
  config: RouteConfig;
  /** File path */
  filePath: string;
  /** Parent layout */
  layout?: string;
}

export interface ParsedRoute {
  /** Original path */
  pathname: string;
  /** Matched route */
  route: Route | null;
  /** Route parameters */
  params: Record<string, string>;
  /** Query parameters */
  query: Record<string, string>;
  /** Hash */
  hash: string;
}

export interface RouterContext {
  /** Current route */
  route: ParsedRoute;
  /** Navigation function */
  navigate: (to: string, options?: NavigateOptions) => void;
  /** Replace current route */
  replace: (to: string, options?: NavigateOptions) => void;
  /** Go back */
  back: () => void;
  /** Go forward */
  forward: () => void;
  /** Push state */
  push: (state: any, title: string, url?: string) => void;
}

export interface NavigateOptions {
  /** Replace current history entry */
  replace?: boolean;
  /** Scroll to top */
  scrollToTop?: boolean;
  /** Preserve scroll position */
  preserveScroll?: boolean;
  /** State to pass */
  state?: any;
  /** Prefetch the route */
  prefetch?: boolean;
}

export interface RouteMatch {
  /** Route pattern */
  pattern: string;
  /** Matched segments */
  segments: string[];
  /** Route parameters */
  params: Record<string, string>;
}

export interface LoaderContext {
  /** Route parameters */
  params: Record<string, string>;
  /** Request object */
  request: Request;
  /** Query parameters */
  query: Record<string, string>;
}

export interface LoaderResult<T = any> {
  data: T;
  headers?: Record<string, string>;
  status?: number;
  revalidate?: number;
}

export type Loader<T = any> = (context: LoaderContext) => Promise<LoaderResult<T>> | LoaderResult<T>;

export type Action<T = any> = (context: LoaderContext & { formData: FormData }) => Promise<T> | T;
