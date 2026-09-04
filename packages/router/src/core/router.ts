import { createSignal, createEffect, batch } from '@movejs/core';
import type { Route, ParsedRoute, RouterContext, NavigateOptions, Loader, Action } from './types';

// Route matching
function compilePattern(pattern: string): { regex: RegExp; params: string[] } {
  const params: string[] = [];
  
  // Convert route pattern to regex
  let regexStr = pattern
    // Convert [param] to named groups
    .replace(/\[([^\]]+)\]/g, (_, param) => {
      params.push(param);
      return '([^/]+)';
    })
    // Convert [...rest] to catch-all
    .replace(/\[\.\.\.([^\]]+)\]/g, (_, param) => {
      params.push(param);
      return '(.*)';
    })
    // Convert [[optional]] to optional groups
    .replace(/\[\[([^\]]+)\]\]/g, (_, param) => {
      params.push(param);
      return '([^/]*)?';
    });

  // Add start and end anchors
  if (!regexStr.startsWith('^')) {
    regexStr = '^' + regexStr;
  }
  if (!regexStr.endsWith('$')) {
    regexStr = regexStr + '$';
  }

  return {
    regex: new RegExp(regexStr),
    params
  };
}

function matchRoute(pathname: string, route: Route): ParsedRoute | null {
  const { regex, params } = route;
  const match = pathname.match(regex);

  if (!match) {
    return null;
  }

  // Extract params
  const paramsObj: Record<string, string> = {};
  params.forEach((param, index) => {
    paramsObj[param] = match[index + 1] || '';
  });

  // Parse query string
  const url = new URL(pathname, 'http://localhost');
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    pathname,
    route,
    params: paramsObj,
    query,
    hash: url.hash
  };
}

// Router class
export class Router {
  private routes: Route[] = [];
  private currentRoute = createSignal<ParsedRoute | null>(null);
  private history: string[] = [];
  private historyIndex = createSignal(0);
  private loaders: Map<string, Loader> = new Map();
  private actions: Map<string, Action> = new Map();

  constructor() {
    this.setupBrowserNavigation();
  }

  // Add a route
  addRoute(
    pattern: string,
    component: any,
    config: any = {},
    filePath: string = ''
  ): void {
    const { regex, params } = compilePattern(pattern);

    this.routes.push({
      pattern,
      regex,
      params,
      component,
      config,
      filePath,
      layout: config.layout
    });
  }

  // Register loader for a route
  loader(pattern: string, loader: Loader): void {
    this.loaders.set(pattern, loader);
  }

  // Register action for a route
  action(pattern: string, action: Action): void {
    this.actions.set(pattern, action);
  }

  // Find matching route
  private findRoute(pathname: string): ParsedRoute | null {
    // Sort routes by specificity
    const sortedRoutes = [...this.routes].sort((a, b) => {
      // More specific routes first
      const aSegments = a.pattern.split('/').length;
      const bSegments = b.pattern.split('/').length;
      return bSegments - aSegments;
    });

    for (const route of sortedRoutes) {
      const match = matchRoute(pathname, route);
      if (match) {
        return match;
      }
    }

    return null;
  }

  // Navigate to a path
  navigate(path: string, options: NavigateOptions = {}): void {
    const { replace = false, scrollToTop = true, state = null } = options;

    if (replace) {
      window.history.replaceState(state, '', path);
    } else {
      window.history.pushState(state, '', path);
    }

    this.historyIndex[1](this.history.length - 1);
    
    this.updateRoute();

    if (scrollToTop) {
      window.scrollTo(0, 0);
    }
  }

  // Replace current route
  replace(path: string, options: NavigateOptions = {}): void {
    this.navigate(path, { ...options, replace: true });
  }

  // Go back
  back(): void {
    window.history.back();
  }

  // Go forward
  forward(): void {
    window.history.forward();
  }

  // Update current route
  private updateRoute(): void {
    const pathname = window.location.pathname;
    const route = this.findRoute(pathname);

    batch(() => {
      this.currentRoute[1](route);
      this.history.push(pathname);
      this.historyIndex[1](this.history.length - 1);
    });
  }

  // Setup browser navigation listeners
  private setupBrowserNavigation(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Handle popstate
    window.addEventListener('popstate', () => {
      this.updateRoute();
    });

    // Handle link clicks
    document.addEventListener('click', (e) => {
      const link = (e.target as HTMLElement).closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) {
        return;
      }

      e.preventDefault();
      this.navigate(href);
    });

    // Initial route
    this.updateRoute();
  }

  // Get current route signal
  getCurrentRoute(): ParsedRoute | null {
    return this.currentRoute[0]();
  }

  // Get route signal for reactive access
  getRouteSignal() {
    return this.currentRoute[0];
  }

  // Get all routes
  getRoutes(): Route[] {
    return this.routes;
  }

  // Get loader for a route
  getLoader(pattern: string): Loader | undefined {
    return this.loaders.get(pattern);
  }

  // Get action for a route
  getAction(pattern: string): Action | undefined {
    return this.actions.get(pattern);
  }

  // Generate route path from pattern and params
  buildPath(pattern: string, params: Record<string, string> = {}): string {
    let path = pattern;

    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`[${key}]`, value);
    }

    return path;
  }

  // Check if a path matches a pattern
  match(path: string, pattern: string): Record<string, string> | null {
    const { regex, params } = compilePattern(pattern);
    const match = path.match(regex);

    if (!match) {
      return null;
    }

    const paramsObj: Record<string, string> = {};
    params.forEach((param, index) => {
      paramsObj[param] = match[index + 1] || '';
    });

    return paramsObj;
  }
}

// Create a new router instance
export function createRouter(): Router {
  return new Router();
}

// Hook for using router in components
export function useRouter(): RouterContext {
  const router = (window as any).__movejs_router as Router;
  
  if (!router) {
    throw new Error('useRouter must be used within a RouterProvider');
  }

  return {
    route: router.getCurrentRoute()!,
    navigate: router.navigate.bind(router),
    replace: router.replace.bind(router),
    back: router.back.bind(router),
    forward: router.forward.bind(router),
    push: window.history.pushState.bind(window.history)
  };
}

// Hook for accessing route params
export function useParams(): Record<string, string> {
  const router = (window as any).__movejs_router as Router;
  const route = router?.getCurrentRoute();
  return route?.params || {};
}

// Hook for accessing query params
export function useQuery(): Record<string, string> {
  const router = (window as any).__movejs_router as Router;
  const route = router?.getCurrentRoute();
  return route?.query || {};
}

// Link component
export function Link(props: {
  href: string;
  children: any;
  class?: string;
  activeClassName?: string;
  prefetch?: boolean;
  replace?: boolean;
  state?: any;
  onClick?: (e: MouseEvent) => void;
}) {
  const router = (window as any).__movejs_router as Router;
  const currentRoute = router?.getRouteSignal();
  const isActive = currentRoute?.()?.pathname === props.href;

  const handleClick = (e: MouseEvent) => {
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return {
    type: 'a',
    props: {
      href: props.href,
      class: `${props.class || ''} ${isActive ? props.activeClassName || 'active' : ''}`.trim(),
      onClick: handleClick,
      'data-movejs-link': ''
    },
    children: [props.children]
  };
}
