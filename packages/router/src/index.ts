// MoveJS Router - File-based routing with SSR/SSG/ISR support

export { Router, createRouter, useRouter, useParams, useQuery, Link } from './core/router';
export { FileScanner, generateRouteManifest } from './core/filesystem';
export type { RouteManifest } from './core/filesystem';

export {
  renderSSR,
  renderSSG,
  renderISR,
  renderCSR,
  renderEdge,
  getRenderer
} from './handlers/renderer';
export type { RenderContext, RenderResult } from './handlers/renderer';

export type {
  HttpMethod,
  RenderMode,
  Runtime,
  RouteConfig,
  SEOConfig,
  CacheConfig,
  Route,
  ParsedRoute,
  RouterContext,
  NavigateOptions,
  RouteMatch,
  LoaderContext,
  LoaderResult,
  Loader,
  Action
} from './core/types';

// Version
export const VERSION = '0.1.0';
