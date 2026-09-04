import { readdir, stat, readFile } from 'fs/promises';
import { join, relative, basename, extname } from 'path';
import type { Route, RouteConfig } from './types';

// File system route scanner
export class FileScanner {
  private appDir: string;
  private routes: Route[] = [];

  constructor(appDir: string) {
    this.appDir = appDir;
  }

  // Scan the app directory for routes
  async scan(): Promise<Route[]> {
    this.routes = [];
    const pagesDir = join(this.appDir, 'pages');
    
    try {
      await this.scanDirectory(pagesDir, '');
    } catch (error) {
      // pages directory might not exist
      console.warn('No pages directory found');
    }

    return this.routes;
  }

  // Recursively scan directory
  private async scanDirectory(dir: string, prefix: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(this.appDir, fullPath);

      if (entry.isDirectory()) {
        // Handle special directories
        if (entry.name === 'api') {
          // API routes - not page routes
          continue;
        }
        
        if (entry.name.startsWith('[')) {
          // Dynamic segment
          const paramName = entry.name.replace(/[[\]]/g, '');
          const newPrefix = `${prefix}/[${paramName}]`;
          await this.scanDirectory(fullPath, newPrefix);
        } else if (entry.name === 'layouts') {
          // Layouts directory - skip
          continue;
        } else if (entry.name === 'components') {
          // Components directory - skip
          continue;
        } else {
          // Regular directory
          await this.scanDirectory(fullPath, `${prefix}/${entry.name}`);
        }
      } else if (this.isPageFile(entry.name)) {
        // Page file
        const route = await this.createRoute(fullPath, prefix, entry.name);
        if (route) {
          this.routes.push(route);
        }
      }
    }
  }

  // Check if file is a page file
  private isPageFile(filename: string): boolean {
    const validExtensions = ['.tsx', '.jsx', '.ts', '.js'];
    const name = basename(filename, extname(filename));
    
    return validExtensions.includes(extname(filename)) && 
           !name.startsWith('_') && 
           !name.startsWith('.');
  }

  // Create route from file
  private async createRoute(
    filePath: string,
    prefix: string,
    filename: string
  ): Promise<Route | null> {
    const name = basename(filename, extname(filename));
    
    // Convert filename to route pattern
    let pattern = prefix;

    if (name === 'index') {
      // index files don't add to the path
      pattern = prefix || '/';
    } else if (name.startsWith('[')) {
      // Dynamic segment
      const paramName = name.replace(/[[\]]/g, '');
      pattern = `${prefix}/[${paramName}]`;
    } else if (name.startsWith('[') && name.includes('...')) {
      // Catch-all segment
      const paramName = name.replace(/[[\]]/g, '').replace('...', '');
      pattern = `${prefix}/[...${paramName}]`;
    } else {
      pattern = `${prefix}/${name}`;
    }

    // Normalize pattern
    pattern = this.normalizePattern(pattern);

    // Read config from file
    const config = await this.readConfig(filePath);

    // Import the component
    const component = await this.importComponent(filePath);

    const { regex, params } = this.compilePattern(pattern);

    return {
      pattern,
      regex,
      params,
      component,
      config,
      filePath,
      layout: config.layout
    };
  }

  // Read route config from file
  private async readConfig(filePath: string): Promise<RouteConfig> {
    try {
      const content = await readFile(filePath, 'utf-8');
      
      // Extract config from export const config = { ... }
      const configMatch = content.match(/export\s+const\s+config\s*=\s*(\{[^}]+\})/s);
      if (configMatch) {
        try {
          // Simple eval for config extraction
          const config = new Function(`return ${configMatch[1]}`)();
          return config;
        } catch {
          // Fallback to default config
        }
      }

      return {};
    } catch {
      return {};
    }
  }

  // Import component from file
  private async importComponent(filePath: string): Promise<any> {
    try {
      const mod = await import(filePath);
      return mod.default || mod;
    } catch {
      return null;
    }
  }

  // Compile pattern to regex
  private compilePattern(pattern: string): { regex: RegExp; params: string[] } {
    const params: string[] = [];
    
    let regexStr = pattern
      .replace(/\[([^\]]+)\]/g, (_, param) => {
        params.push(param);
        return '([^/]+)';
      })
      .replace(/\[\.\.\.([^\]]+)\]/g, (_, param) => {
        params.push(param);
        return '(.*)';
      });

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

  // Normalize pattern
  private normalizePattern(pattern: string): string {
    // Remove trailing slash except for root
    if (pattern !== '/' && pattern.endsWith('/')) {
      pattern = pattern.slice(0, -1);
    }

    // Ensure leading slash
    if (!pattern.startsWith('/')) {
      pattern = '/' + pattern;
    }

    return pattern;
  }
}

// Generate route manifest
export async function generateRouteManifest(appDir: string): Promise<RouteManifest> {
  const scanner = new FileScanner(appDir);
  const routes = await scanner.scan();

  const manifest: RouteManifest = {
    version: '0.1.0',
    routes: routes.map(route => ({
      pattern: route.pattern,
      filePath: route.filePath,
      config: route.config,
      layout: route.layout
    })),
    layouts: [],
    errorBoundary: null,
    notFound: null
  };

  // Check for special files
  const layoutsDir = join(appDir, 'layouts');
  try {
    const layoutFiles = await readdir(layoutsDir);
    for (const file of layoutFiles) {
      manifest.layouts.push({
        pattern: file.replace(/\.(tsx|jsx|ts|js)$/, ''),
        filePath: join(layoutsDir, file)
      });
    }
  } catch {
    // No layouts directory
  }

  // Check for error boundary
  try {
    await stat(join(appDir, 'error.tsx'));
    manifest.errorBoundary = { filePath: join(appDir, 'error.tsx') };
  } catch {
    // No error boundary
  }

  // Check for not found page
  try {
    await stat(join(appDir, 'not-found.tsx'));
    manifest.notFound = { filePath: join(appDir, 'not-found.tsx') };
  } catch {
    // No not-found page
  }

  return manifest;
}

export interface RouteManifest {
  version: string;
  routes: Array<{
    pattern: string;
    filePath: string;
    config: RouteConfig;
    layout?: string;
  }>;
  layouts: Array<{
    pattern: string;
    filePath: string;
  }>;
  errorBoundary: { filePath: string } | null;
  notFound: { filePath: string } | null;
}
