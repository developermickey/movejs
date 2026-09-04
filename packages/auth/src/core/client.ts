import { createSecretHash, generateStateToken, generateMagicToken } from '../utils/tokens';
import type { AuthConfig, User, ProviderConfig } from '../types';
import { createSessionToken as createJWTToken, parseCookies, JWT } from '../utils/jwt';
import { exchangeCode, fetchUserProfile } from '../providers/oauth';

// MoveJS Auth Client
export class MoveJSClient {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = {
      secret: process.env.MOVEJS_SECRET || process.env.AUTH_SECRET || 'movejs-secret-key-change-in-production',
      session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60
      },
      ...config
    };
  }

  // Get session from request
  async getSession(request: Request): Promise<any> {
    const cookies = parseCookies(request.headers.get('cookie') || '');
    const token = cookies['movejs.session-token'];

    if (!token) {
      return null;
    }

    try {
      const session = JWT.verify(token, this.getSecret());
      return session;
    } catch {
      return null;
    }
  }

  // Parse incoming auth request
  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Sign in endpoint
    if (path.endsWith('/signin') && request.method === 'POST') {
      return this.handleSignIn(request);
    }

    // Sign out endpoint
    if (path.endsWith('/signout') && request.method === 'GET') {
      return this.handleSignOut(request);
    }

    // Callback endpoint for OAuth
    if (path.endsWith('/callback')) {
      return this.handleCallback(request);
    }

    // Session endpoint
    if (path.endsWith('/session')) {
      const session = await this.getSession(request);
      return Response.json({ session });
    }

    // CSRF endpoint
    if (path.endsWith('/csrf')) {
      return Response.json({ csrfToken: generateStateToken() });
    }

    return Response.json({ error: 'Not Found' }, { status: 404 });
  }

  // Handle sign in
  private async handleSignIn(request: Request): Promise<Response> {
    const formData = await request.formData();
    const providerId = formData.get('provider') as string || 'credentials';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const provider = this.getProvider(providerId);

    if (!provider) {
      return Response.json({ error: 'Provider not found' }, { status: 400 });
    }

    // Handle credentials provider
    if (provider.type === 'credentials') {
      if (!email || !password) {
        return Response.json({ error: 'Email and password required' }, { status: 400 });
      }

      const user = await provider.authorize?.({ email, password }, request);

      if (!user) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const token = this.buildSessionToken(user);
      return this.createSessionResponse(token);
    }

    // Handle OAuth providers
    if (['github', 'google', 'facebook', 'twitter', 'apple'].includes(provider.type)) {
      return this.redirectToProvider(provider);
    }

    // Handle magic link
    if (provider.type === 'magic-link') {
      const token = generateMagicToken(email!, this.getSecret());
      const url = `${this.getBaseUrl()}/api/auth/callback?provider=${providerId}&token=${token}`;
      await provider.sendVerification?.({ identifier: email!, url, token });
      return Response.json({ message: 'Verification email sent' });
    }

    return Response.json({ error: 'Unsupported provider' }, { status: 400 });
  }

  // Redirect to OAuth provider
  private async redirectToProvider(provider: ProviderConfig): Promise<Response> {
    const state = generateStateToken();
    const authUrl = new URL(provider.authorization?.url || '');

    authUrl.searchParams.set('client_id', provider.clientId || '');
    authUrl.searchParams.set('redirect_uri', `${this.getBaseUrl()}/api/auth/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    // Add provider-specific params
    for (const [key, value] of Object.entries(provider.authorization?.params || {})) {
      authUrl.searchParams.set(key, value);
    }

    return Response.redirect(authUrl.toString());
  }

  // Handle OAuth callback
  private async handleCallback(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const providerId = url.searchParams.get('provider') || 'github';

    if (!code) {
      return Response.json({ error: 'Missing auth code' }, { status: 400 });
    }

    const provider = this.getProvider(providerId);
    if (!provider) {
      return Response.json({ error: 'Provider not found' }, { status: 400 });
    }

    try {
      // Exchange code for token
      const tokens = await exchangeCode(provider, code, `${this.getBaseUrl()}/api/auth/callback`);

      // Fetch user profile
      const profile = await fetchUserProfile(provider, tokens.accessToken);

      // Map profile to user
      const user = provider.profile ? provider.profile(profile) : this.mapDefaultProfile(providerId, profile);

      // Run signIn callback
      if (this.config.callbacks?.signIn) {
        const allowed = await this.config.callbacks.signIn({ user, account: { provider, ...tokens } });
        if (!allowed) {
          return Response.json({ error: 'Access denied' }, { status: 403 });
        }
      }

      // Create session
      const sessionToken = this.buildSessionToken(user);
      return this.createSessionResponse(sessionToken, `${this.getBaseUrl()}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return Response.json({ error: 'Authentication failed' }, { status: 500 });
    }
  }

  // Handle sign out
  private async handleSignOut(request: Request): Promise<Response> {
    const response = new Response(this.redirectToHome());
    response.headers.set(
      'Set-Cookie',
      'movejs.session-token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax'
    );
    return response;
  }

  // Create session response
  private createSessionResponse(token: string, redirectUrl?: string): Response {
    const response = new Response(
      redirectUrl ? `Redirecting to ${redirectUrl}...` : 'Authenticated',
      {
        status: redirectUrl ? 302 : 200,
        headers: redirectUrl ? { 'Location': redirectUrl } : {}
      }
    );

    response.headers.set(
      'Set-Cookie',
      createCookie('movejs.session-token', token, {
        maxAge: this.config.maxAge || this.config.session?.maxAge || 30 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
    );

    return response;
  }

  // Map default profile based on provider
  private mapDefaultProfile(provider: string, profile: any): User {
    switch (provider) {
      case 'github':
        return {
          id: String(profile.id),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url
        };
      case 'google':
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture
        };
      default:
        return {
          id: profile.id || profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture || profile.avatar_url
        };
    }
  }

  // Get provider by ID
  private getProvider(id: string): ProviderConfig | null {
    return this.config.providers.find(p => p.id === id) || null;
  }

  // Create session token
  private buildSessionToken(user: User): string {
    return createJWTToken(user, this.getSecret(), this.config.maxAge);
  }

  // Get session secret
  private getSecret(): string {
    return this.config.secret || '';
  }

  // Get base URL
  private getBaseUrl(): string {
    return this.config.baseURL || process.env.AUTH_URL || 'http://localhost:3000';
  }

  // Redirect to configured sign-in page or home
  private redirectToHome(): string {
    return this.config.pages?.signIn || this.getBaseUrl();
  }
}

// Cookie creation helper
function createCookie(name: string, value: string, options: {
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
} = {}): string {
  const { maxAge = 30 * 24 * 60 * 60, httpOnly = true, secure = false, sameSite = 'lax' } = options;

  return [
    `${name}=${value}`,
    `Max-Age=${maxAge}`,
    `Path=/`,
    httpOnly ? 'HttpOnly' : '',
    secure ? 'Secure' : '',
    `SameSite=${sameSite}`
  ].filter(Boolean).join('; ');
}

// Export createAuth function
export function createAuth(config: AuthConfig): MoveJSClient {
  return new MoveJSClient(config);
}

// Export default
export default MoveJSClient;
