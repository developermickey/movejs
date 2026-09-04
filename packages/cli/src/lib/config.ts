// MoveJS Config - defineConfig helper

export interface MoveJSConfig {
  render?: 'ssr' | 'ssg' | 'hybrid' | 'edge' | 'csr';
  database?: {
    provider: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
    url?: string;
  };
  ai?: {
    provider: 'openai' | 'anthropic' | 'local';
    apiKey?: string;
    model?: string;
  };
  seo?: {
    siteName?: string;
    titleTemplate?: string;
    description?: string;
    generateSitemap?: boolean;
    generateRobots?: boolean;
    defaultOgImage?: string;
  };
  auth?: {
    providers?: string[];
    sessionStrategy?: 'jwt' | 'database';
  };
  performance?: {
    imageOptimization?: boolean;
    fontOptimization?: boolean;
    compression?: string;
  };
  server?: {
    port?: number;
    host?: string;
  };
  middleware?: string[];
}

export function defineConfig(config: MoveJSConfig): MoveJSConfig {
  return config;
}
