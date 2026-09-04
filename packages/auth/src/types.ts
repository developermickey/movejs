export type Provider = 'credentials' | 'github' | 'google' | 'facebook' | 'twitter' | 'apple' | 'magic-link' | 'email';

export interface AuthConfig {
  /** Session secret */
  secret?: string;
  /** Trust host */
  trustHost?: boolean;
  /** Base URL */
  baseURL?: string;
  /** Session strategy */
  session?: SessionConfig;
  /** JWT configuration */
  jwt?: JWTConfig;
  /** Pages */
  pages?: PagesConfig;
  /** Providers */
  providers: ProviderConfig[];
  /** Callbacks */
  callbacks?: CallbacksConfig;
  /** Custom session token TTL */
  maxAge?: number;
}

export interface SessionConfig {
  /** Session strategy */
  strategy?: 'jwt' | 'database';
  /** Session max age (seconds) */
  maxAge?: number;
  /** Update age threshold */
  updateAge?: number;
}

export interface JWTConfig {
  /** Secret for signing JWT */
  secret?: string;
  /** Encryption key */
  maxAge?: number;
  /** Token refresh threshold */
  refreshAge?: number;
}

export interface PagesConfig {
  signIn?: string;
  signUp?: string;
  error?: string;
  verifyRequest?: string;
  newUser?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: Provider;
  clientId?: string;
  clientSecret?: string;
  authorization?: {
    url: string;
    params?: Record<string, string>;
  };
  token?: {
    url: string;
    params?: Record<string, string>;
  };
  userinfo?: {
    url: string;
  };
  checks?: string[];
  profile?: (profile: any) => any;
  credentials?: {
    username?: {
      label: string;
      type: string;
      placeholder?: string;
    };
    password?: {
      label: string;
      type: string;
      placeholder?: string;
    };
  };
  authorize?: (credentials: any, req?: any) => Promise<User | null>;
  sendVerification?: (data: { identifier: string; url: string; token: string }) => Promise<void>;
}

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  [key: string]: any;
}

export interface Session {
  user: User;
  expires: string;
  accessToken?: string;
  [key: string]: any;
}

export interface JWT {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

export interface CallbacksConfig {
  signIn?: (params: any) => boolean | Promise<boolean>;
  redirect?: (params: { url: string; baseUrl: string }) => string | Promise<string>;
  jwt?: (params: { token: JWT; user?: any; account?: any; profile?: any }) => JWT | Promise<JWT>;
  session?: (params: { session: Session; token: JWT; user?: any }) => Session | Promise<Session>;
}

export interface AuthResult {
  user?: User;
  error?: string;
  session?: Session;
  url?: string;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  signIn: (provider: string, options?: any) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  update: (data?: any) => Promise<void>;
  getToken: () => Promise<string | null>;
}

export interface MiddlewareResult {
  token?: string;
  user?: User;
  redirect?: string;
}
