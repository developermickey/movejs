import { createServer as createHTTPServer, IncomingMessage, ServerResponse } from 'http';
import { createServer as createHTTPSServer } from 'https';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { URL } from 'url';
import type {
  MoveRequest,
  MoveResponse,
  Handler,
  Middleware,
  ServerConfig,
  ServerInstance,
  HttpMethod
} from './types';

// MIME types
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip'
};

// Create MoveJS server
export function createServer(config: ServerConfig = {}): ServerInstance {
  const {
    port = 3000,
    host = 'localhost',
    https = false,
    cert,
    key,
    compression = true,
    cors,
    static: staticConfig,
    websocket = false,
    sse = false
  } = config;

  // Route storage
  const routes: Array<{
    method: HttpMethod | '*';
    path: string;
    handlers: Handler[];
    regex: RegExp;
    paramNames: string[];
  }> = [];

  const middlewares: Middleware[] = [];

  // Create HTTP server
  const httpServer = https
    ? createHTTPSServer(
        {
          cert: cert ? readFileSync(cert) : undefined,
          key: key ? readFileSync(key) : undefined
        },
        handleRequest
      )
    : createHTTPServer(handleRequest);

  // Handle incoming requests
  async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const moveReq = req as unknown as MoveRequest;
    const moveRes = res as unknown as MoveResponse;

    // Parse URL
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    moveReq.parsedUrl = url;
    moveReq.params = {};
    moveReq.query = Object.fromEntries(url.searchParams);

    // Add helper methods
    moveReq.header = (name: string) => req.headers[name.toLowerCase()] as string | undefined;
    
    moveReq.json = async () => {
      const body = await getBody(req);
      return JSON.parse(body);
    };

    moveReq.formData = async () => {
      const body = await getBody(req);
      const formData = new FormData();
      const params = new URLSearchParams(body);
      params.forEach((value, key) => {
        formData.append(key, value);
      });
      return formData;
    };

    // Add response helpers
    moveRes.json = (data: any) => {
      moveRes.setHeader('Content-Type', 'application/json');
      moveRes.end(JSON.stringify(data));
      return moveRes;
    };

    moveRes.send = (data: string | Buffer) => {
      moveRes.end(data);
      return moveRes;
    };

    moveRes.html = (data: string) => {
      moveRes.setHeader('Content-Type', 'text/html');
      moveRes.end(data);
      return moveRes;
    };

    moveRes.file = (filePath: string) => {
      if (!existsSync(filePath)) {
        moveRes.status(404).send('Not Found');
        return moveRes;
      }

      const stat = statSync(filePath);
      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      moveRes.setHeader('Content-Type', contentType);
      moveRes.setHeader('Content-Length', stat.size);
      moveRes.setHeader('Cache-Control', 'public, max-age=31536000');

      const stream = readFileSync(filePath);
      moveRes.end(stream);
      return moveRes;
    };

    moveRes.status = (code: number) => {
      moveRes.statusCode = code;
      return moveRes;
    };

    moveRes.set = (name: string, value: string) => {
      moveRes.setHeader(name, value);
      return moveRes;
    };

    moveRes.redirect = (url: string, status = 302) => {
      moveRes.writeHead(status, { Location: url });
      moveRes.end();
      return moveRes;
    };

    try {
      // Run middleware stack
      const middlewareStack = [...middlewares];

      // Find matching route
      const matchedRoute = findRoute(req.method as HttpMethod, url.pathname);

      if (matchedRoute) {
        moveReq.params = matchedRoute.params;
        
        // Add route handlers to middleware stack
        for (const handler of matchedRoute.handlers) {
          middlewareStack.push(handler as Middleware);
        }
      } else if (staticConfig && url.pathname.startsWith(staticConfig.prefix || '')) {
        // Serve static files
        const staticPath = join(
          staticConfig.root,
          url.pathname.replace(staticConfig.prefix || '', '')
        );
        
        if (existsSync(staticPath) && statSync(staticPath).isFile()) {
          moveRes.file(staticPath);
          return;
        }
      }

      // Execute middleware stack
      let index = 0;
      const next = async (): Promise<void> => {
        if (index < middlewareStack.length) {
          const middleware = middlewareStack[index++];
          await middleware(moveReq, moveRes, next);
        } else {
          // No handler found
          if (!moveRes.headersSent) {
            moveRes.status(404).json({ error: 'Not Found' });
          }
        }
      };

      await next();
    } catch (error) {
      console.error('Server error:', error);
      if (!moveRes.headersSent) {
        moveRes.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }

  // Find matching route
  function findRoute(method: HttpMethod, pathname: string) {
    for (const route of routes) {
      if (route.method !== '*' && route.method !== method) {
        continue;
      }

      const match = pathname.match(route.regex);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return { ...route, params };
      }
    }

    return null;
  }

  // Parse route pattern
  function parsePattern(pattern: string): { regex: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];

    // Catch-all
    if (pattern === '*') {
      return { regex: /^.*$/, paramNames: [] };
    }

    let regexStr = pattern
      .replace(/\[([^\]]+)\]/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\[\.\.\.([^\]]+)\]/g, (_, name) => {
        paramNames.push(name);
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
      paramNames
    };
  }

  // Get request body
  function getBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
      req.on('error', reject);
    });
  }

  // Server instance
  const server: ServerInstance = {
    server: httpServer,

    listen: async (listenPort = port, listenHost = host) => {
      return new Promise<void>((resolve) => {
        httpServer.listen(listenPort, listenHost, () => {
          console.log(`MoveJS Server running at http://${listenHost}:${listenPort}`);
          resolve();
        });
      });
    },

    close: async () => {
      return new Promise<void>((resolve, reject) => {
        httpServer.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },

    route: (method, path, ...handlers) => {
      const { regex, paramNames } = parsePattern(path);
      routes.push({ method: method as HttpMethod, path, handlers, regex, paramNames });
    },

    use: (middleware) => {
      middlewares.push(middleware);
    },

    get: (path, ...handlers) => {
      server.route('GET', path, ...handlers);
    },

    post: (path, ...handlers) => {
      server.route('POST', path, ...handlers);
    },

    put: (path, ...handlers) => {
      server.route('PUT', path, ...handlers);
    },

    delete: (path, ...handlers) => {
      server.route('DELETE', path, ...handlers);
    },

    patch: (path, ...handlers) => {
      server.route('PATCH', path, ...handlers);
    },

    all: (path, ...handlers) => {
      server.route('*', path, ...handlers);
    }
  };

  return server;
}

// Export createServer as default
export default createServer;
