export type AIProvider = 'openai' | 'anthropic' | 'google' | 'local' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  cache?: boolean;
  retries?: number;
}

export interface AIGenerateOptions {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
  responseFormat?: 'text' | 'json' | 'json_object';
  stream?: boolean;
}

export interface AIGenerateResult {
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  latency: number;
}

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatOptions {
  messages: AIChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIImageGenerateOptions {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024';
  quality?: 'standard' | 'hd';
  n?: number;
  model?: string;
}

export interface AIImageResult {
  url: string;
  data?: Buffer;
  mimeType: string;
}

export interface AIImageOptimizeOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill';
}

export interface AISearchOptions {
  query: string;
  documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>;
  topK?: number;
}

export interface AISearchResult {
  id: string;
  score: number;
  text: string;
  metadata?: Record<string, any>;
}

export interface AIEmbeddingOptions {
  model?: string;
  dimensions?: number;
}

export interface AIError {
  code: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
}
