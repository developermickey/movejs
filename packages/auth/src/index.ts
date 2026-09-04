// MoveJS Auth - Built-in authentication

export { createAuth, default } from './core/client';
export type {
  AuthConfig,
  SessionConfig,
  JWTConfig,
  PagesConfig,
  ProviderConfig,
  User,
  Session,
  CallbacksConfig,
  AuthResult,
  AuthContextValue,
  Provider
} from './types';

export {
  JWT,
  hashPassword,
  verifyPassword,
  generateCSRFToken,
  verifyCSRFToken,
  createSessionToken,
  parseSessionToken
} from './utils/jwt';

export {
  generateStateToken,
  generateMagicToken,
  verifyMagicToken
} from './utils/tokens';

export {
  exchangeCode,
  fetchUserProfile,
  refreshAccessToken,
  generatePKCEChallenge
} from './providers/oauth';

// Version
export const VERSION = '0.1.0';
