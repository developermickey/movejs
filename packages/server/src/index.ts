// MoveJS Server - API routes, middleware, and server-side rendering

export { createServer, default } from './core/server';
export type {
  MoveRequest,
  MoveResponse,
  Handler,
  Middleware,
  ServerConfig,
  ServerInstance,
  HttpMethod,
  CorsConfig,
  RateLimitConfig,
  StaticConfig,
  APIConfig,
  WebSocketMessage,
  WebSocketClient,
  WebSocketServer
} from './core/types';

export {
  cors,
  rateLimit,
  auth,
  bodyParser,
  logger,
  helmet,
  compression,
  staticFiles
} from './middleware/index';

// Version
export const VERSION = '0.1.0';
