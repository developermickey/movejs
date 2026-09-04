// MoveJS Server Types

import { IncomingMessage, ServerResponse } from 'http';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface MoveRequest extends IncomingMessage {
  /** Parsed URL object */
  parsedUrl: URL;
  /** Route parameters */
  params: Record<string, string>;
  /** Query parameters */
  query: Record<string, string>;
  /** Request body */
  body: any;
  /** Parsed JSON body */
  json: () => Promise<any>;
  /** Parsed form data */
  formData: () => Promise<FormData>;
  /** Get header value */
  header: (name: string) => string | undefined;
}

export interface MoveResponse extends ServerResponse {
  /** Send JSON response */
  json: (data: any) => MoveResponse;
  /** Send text response */
  send: (data: string | Buffer) => MoveResponse;
  /** Send HTML response */
  html: (data: string) => MoveResponse;
  /** Send file */
  file: (path: string) => MoveResponse;
  /** Send status code */
  status: (code: number) => MoveResponse;
  /** Set header */
  set: (name: string, value: string) => MoveResponse;
  /** Redirect */
  redirect: (url: string, status?: number) => MoveResponse;
}

export type Handler = (req: MoveRequest, res: MoveResponse) => Promise<void> | void;

export type Middleware = (req: MoveRequest, res: MoveResponse, next: () => Promise<void> | void) => Promise<void> | void;

export interface ServerConfig {
  /** Port to listen on */
  port?: number;
  /** Host to bind to */
  host?: string;
  /** Enable HTTPS */
  https?: boolean;
  /** SSL certificate path */
  cert?: string;
  /** SSL key path */
  key?: string;
  /** Enable HTTP/2 */
  http2?: boolean;
  /** Enable compression */
  compression?: boolean;
  /** Enable CORS */
  cors?: CorsConfig;
  /** Enable rate limiting */
  rateLimit?: RateLimitConfig;
  /** Enable static file serving */
  static?: StaticConfig;
  /** Enable API routes */
  api?: APIConfig;
  /** Enable WebSocket */
  websocket?: boolean;
  /** Enable server-sent events */
  sse?: boolean;
  /** Environment variables */
  env?: Record<string, string>;
}

export interface CorsConfig {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export interface RateLimitConfig {
  max: number;
  window: string | number;
  message?: string;
  headers?: boolean;
  keyGenerator?: (req: MoveRequest) => string;
}

export interface StaticConfig {
  /** Root directory for static files */
  root: string;
  /** URL prefix */
  prefix?: string;
  /** Cache control */
  maxAge?: number;
  /** Enable etag */
  etag?: boolean;
  /** Enable last-modified */
  lastModified?: boolean;
}

export interface APIConfig {
  /** Base path for API routes */
  basePath?: string;
  /** Body parser options */
  bodyLimit?: number;
  /** Enable request logging */
  logging?: boolean;
}

export interface ServerInstance {
  /** HTTP server instance */
  server: any;
  /** Start listening */
  listen: (port?: number, host?: string) => Promise<void>;
  /** Stop the server */
  close: () => Promise<void>;
  /** Add route */
  route: (method: HttpMethod | '*', path: string, ...handlers: Handler[]) => void;
  /** Add middleware */
  use: (middleware: Middleware) => void;
  /** Add GET route */
  get: (path: string, ...handlers: Handler[]) => void;
  /** Add POST route */
  post: (path: string, ...handlers: Handler[]) => void;
  /** Add PUT route */
  put: (path: string, ...handlers: Handler[]) => void;
  /** Add DELETE route */
  delete: (path: string, ...handlers: Handler[]) => void;
  /** Add PATCH route */
  patch: (path: string, ...handlers: Handler[]) => void;
  /** Add middleware for all routes */
  all: (path: string, ...handlers: Handler[]) => void;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface WebSocketClient {
  id: string;
  send: (message: WebSocketMessage) => void;
  close: () => void;
  on: (type: string, handler: (data: any) => void) => void;
}

export interface WebSocketServer {
  on: (event: 'connection', handler: (client: WebSocketClient) => void) => void;
  broadcast: (message: WebSocketMessage) => void;
  close: () => void;
}
