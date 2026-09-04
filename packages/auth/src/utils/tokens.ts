import { createHmac, randomBytes } from 'crypto';

// Generate state token for OAuth
export function generateStateToken(): string {
  return randomBytes(16).toString('hex');
}

// Generate magic link token
export function generateMagicToken(email: string, secret: string): string {
  const data = `${email}:${Date.now()}:${randomBytes(8).toString('hex')}`;
  const hash = createHmac('sha256', secret).update(data).digest('hex');
  return `${Buffer.from(data).toString('base64url')}.${hash}`;
}

// Verify magic link token
export function verifyMagicToken(token: string, secret: string): { email: string; timestamp: number } | null {
  const [dataB64, sig] = token.split('.');
  if (!dataB64 || !sig) return null;

  const data = Buffer.from(dataB64, 'base64url').toString();
  const expectedSig = createHmac('sha256', secret).update(data).digest('hex');

  if (sig !== expectedSig) return null;

  const [email, timestampStr, ...rest] = data.split(':');
  return {
    email,
    timestamp: parseInt(timestampStr)
  };
}

// Create secret hash (used for internal operations)
export function createSecretHash(value: string, secret?: string): string {
  return createHmac('sha256', secret || 'movejs-secret').update(value).digest('hex');
}
