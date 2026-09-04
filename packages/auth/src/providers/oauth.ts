import { randomBytes, createHash } from 'crypto';
import type { ProviderConfig } from '../types';

// OAuth helper functions

// Generate OAuth state token
export function generateStateToken(): string {
  return randomBytes(16).toString('hex');
}

// Generate random string for PKCE
export function generatePKCEChallenge(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

// Exchange authorization code for tokens
export async function exchangeCode(
  provider: ProviderConfig,
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  idToken?: string;
  tokenType?: string;
}> {
  const tokenUrl = provider.token?.url || '';

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: provider.clientId || ''
  });

  if (provider.clientSecret) {
    params.set('client_secret', provider.clientSecret);
  }

  // Add provider-specific params
  for (const [key, value] of Object.entries(provider.token?.params || {})) {
    params.set(key, value);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    idToken: data.id_token,
    tokenType: data.token_type
  };
}

// Fetch user profile from provider
export async function fetchUserProfile(
  provider: ProviderConfig,
  accessToken: string
): Promise<any> {
  const userinfoUrl = provider.userinfo?.url || '';

  const response = await fetch(userinfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Userinfo request failed: ${response.status}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshAccessToken(
  provider: ProviderConfig,
  refreshToken: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}> {
  const tokenUrl = provider.token?.url || '';

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: provider.clientId || ''
  });

  if (provider.clientSecret) {
    params.set('client_secret', provider.clientSecret);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in
  };
}

// Generate a token for verification
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}
