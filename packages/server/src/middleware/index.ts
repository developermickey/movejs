import type { Middleware, MoveRequest, MoveResponse } from '../core/types';

// CORS Middleware
export function cors(options: {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
} = {}): Middleware {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = false,
    maxAge = 86400
  } = options;

  return async (req: MoveRequest, res: MoveResponse, next: () => Promise<void> | void) => {
    const requestOrigin = req.header('origin') || '*';

    // Check if origin is allowed
    let allowOrigin = '*';
    if (origin !== '*') {
      if (Array.isArray(origin)) {
        if (origin.includes(requestOrigin)) {
          allowOrigin = requestOrigin;
        }
      } else if (origin === requestOrigin) {
        allowOrigin = requestOrigin;
      }
    }

    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    
    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (maxAge) {
      res.setHeader('Access-Control-Max-Age', String(maxAge));
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Continue the chain for regular requests
    await next();
  };
}

// Rate Limiting Middleware
export function rateLimit(options: {
  max?: number;
  window?: number | string;
  message?: string;
  headers?: boolean;
  keyGenerator?: (req: MoveRequest) => string;
} = {}): Middleware {
  const {
    max = 100,
    window = 60,
    message = 'Too Many Requests',
    headers = true,
    keyGenerator = (req) => req.header('x-forwarded-for') || req.socket.remoteAddress || 'unknown'
  } = options;

  const windowMs = typeof window === 'string' ? parseTime(window) : window * 1000;
  const clients = new Map<string, { count: number; resetTime: number }>();

  return async (req: MoveRequest, res: MoveResponse, next: () => Promise<void> | void) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let client = clients.get(key);

    if (!client || now > client.resetTime) {
      client = { count: 0, resetTime: now + windowMs };
      clients.set(key, client);
    }

    client.count++;

    if (headers) {
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - client.count)));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(client.resetTime / 1000)));
    }

    if (client.count > max) {
      res.status(429).json({ error: message });
      return;
    }

    await next();
  };
}

// Authentication Middleware
export function auth(options: {
  secret?: string;
  unauthorized?: (req: MoveRequest, res: MoveResponse) => void;
} = {}): Middleware {
  const {
    secret = process.env.JWT_SECRET || 'movejs-secret',
    unauthorized = (req, res) => {
      res.status(401).json({ error: 'Unauthorized' });
    }
  } = options;

  return async (req: MoveRequest, res: MoveResponse, next: () => Promise<void> | void) => {
    const authHeader = req.header('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      unauthorized(req, res);
      return;
    }

    const token = authHeader.slice(7);

    try {
      // Simple JWT verification (in production, use a proper JWT library)
      const payload = verifyToken(token, secret);
      (req as any).user = payload;
      await next();
    } catch {
      unauthorized(req, res);
    }
  };
}

// Body Parser Middleware
export function bodyParser(options: {
  limit?: number;
  type?: string;
} = {}): Middleware {
  const { limit = 1024 * 1024, type = 'application/json' } = options;

  return async (req: MoveRequest, res: MoveResponse, next: () => Promise<void> | void) => {
    const contentType = req.header('content-type') || '';

    if (!contentType.includes(type)) {
      await next();
      return;
    }

    let body = '';
    let size = 0;

    for await (const chunk of req) {
      size += chunk.length;
      if (size > limit) {
        res.status(413).json({ error: 'Payload Too Large' });
        return;
      }
      body += chunk.toString();
    }

    try {
      req.body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }

    await next();
  };
}

// Logger Middleware
export function logger(options: {
  format?: string;
  colorize?: boolean;
} = {}): Middleware {
  const { format = ':method :url :status :response-time ms', colorize = true } = options;

  return async (req: MoveRequest, res: MoveResponse, next: () => Promise<void> | void) => {
    const start = Date.now();

    // Capture response end
    const originalEnd = res.end.bind(res);
    res.end = function (this: MoveResponse, ...args: any[]) {
      const duration = Date.now() - start;
      const status = res.statusCode;

      const log = format
        .replace(':method', req.method || '')
        .replace(':url', req.parsedUrl?.pathname || '')
        .replace(':status', String(status))
        .replace(':response-time', String(duration));

      if (colorize) {
        const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : status >= 300 ? '\x1b[36m' : '\x1b[32m';
        console.log(`${color}${log}\x1b[0m`);
      } else {
        console.log(log);
      }

      return originalEnd(...args);
    } as any;

    await next();
  };
}

// Helmet (Security Headers) Middleware
export function helmet(): Middleware {
  return async (req: MoveRequest, res: MoveResponse, next: () => Promise<void> | void) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    await next();
  };
}

// Compression Middleware
export function compression(): Middleware {
  return async (req: MoveRequest, res: MoveResponse, next: () => Promise<void> | void) => {
    const acceptEncoding = req.header('accept-encoding') || '';

    if (acceptEncoding.includes('br')) {
      res.setHeader('Content-Encoding', 'br');
    } else if (acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
    }

    await next();
  };
}

// Static Files Middleware
export function staticFiles(root: string, options: {
  prefix?: string;
  maxAge?: number;
  etag?: boolean;
} = {}): Middleware {
  const { prefix = '', maxAge = 31536000, etag = true } = options;

  return async (req: MoveRequest, res: MoveResponse, next: () => Promise<void> | void) => {
    const { readFileSync, existsSync, statSync } = await import('fs');
    const { join, extname } = await import('path');

    let filePath = join(root, req.parsedUrl?.pathname.replace(prefix, '') || '');

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      await next();
      return;
    }

    const stat = statSync(filePath);
    const ext = extname(filePath);
    const mimeTypes: Record<string, string> = {
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

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    
    if (etag) {
      const etagValue = `"${stat.size}-${stat.mtimeMs}"`;
      res.setHeader('ETag', etagValue);

      if (req.header('if-none-match') === etagValue) {
        res.writeHead(304);
        res.end();
        return;
      }
    }

    const content = readFileSync(filePath);
    res.end(content);
  };
}

// Helper: Parse time string
function parseTime(time: string): number {
  const match = time.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 60000;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 60000;
  }
}

// Helper: Simple JWT verification
function verifyToken(token: string, secret: string): any {
  // In production, use a proper JWT library like jose or jsonwebtoken
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token');
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  
  // Check expiration
  if (payload.exp && payload.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  return payload;
}
