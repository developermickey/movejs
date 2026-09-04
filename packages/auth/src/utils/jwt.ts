import { createHmac, createHash, randomBytes } from 'crypto';
import type { Session, User } from '../types';

// JWT Token interface
export interface JWTData {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

// JWT Implementation (no external dependencies)
export class JWT {
  // Sign a JWT token
  static sign(payload: object, secret: string, options: { expiresIn?: string | number } = {}): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const exp = options.expiresIn
      ? typeof options.expiresIn === 'number'
        ? now + options.expiresIn
        : now + parseDuration(options.expiresIn)
      : now + 30 * 24 * 60 * 60; // Default 30 days

    const fullPayload = {
      ...payload,
      iat: now,
      exp
    };

    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
    const signature = createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  // Verify a JWT token
  static verify(token: string, secret: string): JWTData | null {
    const [headerB64, payloadB64, signature] = token.split('.');

    if (!headerB64 || !payloadB64 || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    try {
      const payload = JSON.parse(base64UrlDecode(payloadB64));

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  // Decode without verification
  static decode(token: string): JWTData | null {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;

    try {
      return JSON.parse(base64UrlDecode(payloadB64));
    } catch {
      return null;
    }
  }
}

// Password hashing (using PBKDF2 - no external deps)
export function hashPassword(password: string, salt?: string): string {
  const generatedSalt = salt || randomBytes(16).toString('hex');
  const hash = createHash('pbkdf2')
    .update(password + generatedSalt, 'utf8')
    .digest('hex');
  
  return `${generatedSalt}$${hash}`;
}

export function verifyPassword(password: string, hashed: string): boolean {
  const [salt] = hashed.split('$');
  if (!salt) return false;
  
  return hashed === hashPassword(password, salt);
}

// CSRF protection
export function generateCSRFToken(secret: string): string {
  const timestamp = Date.now().toString();
  const random = randomBytes(8).toString('hex');
  const value = `${timestamp}.${random}`;
  
  return `${value}.${createHmac('sha256', secret).update(value).digest('hex')}`;
}

export function verifyCSRFToken(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const value = `${parts[0]}.${parts[1]}`;
  const expectedSig = createHmac('sha256', secret).update(value).digest('hex');

  return parts[2] === expectedSig;
}

// Session helpers
export function createSessionToken(user: User, secret: string, maxAge?: number): string {
  return JWT.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.image
    },
    secret,
    { expiresIn: maxAge || 30 * 24 * 60 * 60 }
  );
}

export function parseSessionToken(token: string, secret: string): Session | null {
  const payload = JWT.verify(token, secret);
  if (!payload) return null;

  const user: User = {
    id: payload.sub || '',
    email: payload.email,
    name: payload.name,
    image: payload.picture
  };

  return {
    user,
    expires: new Date((payload.exp || 0) * 1000).toISOString()
  };
}

// Cookie helper
export function createCookie(name: string, value: string, options: {
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
} = {}): string {
  const {
    maxAge = 30 * 24 * 60 * 60,
    httpOnly = true,
    secure = false,
    sameSite = 'lax',
    path = '/',
    domain
  } = options;

  const parts = [
    `${name}=${value}`,
    `Max-Age=${maxAge}`,
    `Path=${path}`
  ];

  if (httpOnly) parts.push('HttpOnly');
  if (secure) parts.push('Secure');
  parts.push(`SameSite=${sameSite}`);
  if (domain) parts.push(`Domain=${domain}`);

  return parts.join('; ');
}

export function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  for (const cookie of header.split(';')) {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookies[name] = valueParts.join('=');
    }
  }
  
  return cookies;
}

// Token generation
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

// Magic link token
export function generateMagicToken(email: string, secret: string): string {
  const data = `${email}:${Date.now()}:${randomBytes(8).toString('hex')}`;
  return `${Buffer.from(data).toString('base64url')}.${createHmac('sha256', secret).update(data).digest('hex')}`;
}

export function verifyMagicToken(token: string, secret: string): { email: string; timestamp: number } | null {
  const [dataB64, sig] = token.split('.');
  if (!dataB64 || !sig) return null;

  const data = Buffer.from(dataB64, 'base64url').toString();
  const expectedSig = createHmac('sha256', secret).update(data).digest('hex');

  if (sig !== expectedSig) return null;

  const [email, timestampStr] = data.split(':');
  return {
    email,
    timestamp: parseInt(timestampStr)
  };
}

// Helper functions
function base64UrlEncode(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString();
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhdw])$/);
  if (!match) return 30 * 24 * 60 * 60;

  const value = parseInt(match[1]);
  switch (match[2]) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    case 'w': return value * 7 * 24 * 60 * 60;
    default: return 30 * 24 * 60 * 60;
  }
}
