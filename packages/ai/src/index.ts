import { OpenAIProvider, AnthropicProvider, type AIProvider } from './providers';
import type {
  AIConfig,
  AIGenerateOptions,
  AIGenerateResult,
  AIChatOptions
} from './types';

// Main AI Client
export class MoveAIClient {
  private provider: AIProvider;
  private config: AIConfig;
  private cache: Map<string, AIGenerateResult>;
  private defaultProvider!: {
    generate(options: AIGenerateOptions): Promise<AIGenerateResult>;
    chat(options: AIChatOptions): Promise<AIGenerateResult>;
  };

  constructor(config: AIConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
    this.cache = new Map();
  }

  private createProvider(config: AIConfig): AIProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      default:
        return new OpenAIProvider(config);
    }
  }

  // Generate text
  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    // Check cache
    if (this.config.cache) {
      const cacheKey = this.getCacheKey(options.prompt, options.model);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    // Add retry logic
    const retries = this.config.retries || 2;
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      try {
        const result = await this.provider.generate(options);

        // Cache result
        if (this.config.cache) {
          const cacheKey = this.getCacheKey(options.prompt, options.model);
          this.cache.set(cacheKey, result);
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        if ((error as any).retryable && i < retries) {
          // Exponential backoff
          await this.sleep(Math.pow(2, i) * 1000);
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  // Chat interface
  async chat(options: AIChatOptions): Promise<AIGenerateResult> {
    return this.provider.chat(options);
  }

  // Stream text generation
  async *streamGenerate(options: AIGenerateOptions): AsyncGenerator<string> {
    const result = await this.generate({ ...options, maxTokens: options.maxTokens || 4096 });
    yield result.text;
  }

  // Generate JSON
  async generateJSON<T>(
    prompt: string,
    schema?: string,
    system?: string
  ): Promise<T> {
    const result = await this.generate({
      prompt,
      system: system || 'You are a helpful assistant. Always respond with valid JSON.',
      responseFormat: 'json'
    });

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonStr = result.text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch {
      throw new Error('Failed to parse JSON response from AI');
    }
  }

  // Embed text
  async embed(text: string): Promise<number[]> {
    return this.provider.embed ? this.provider.embed(text) : [];
  }

  // Generate image
  async generateImage(prompt: string, options: any = {}): Promise<string> {
    if (this.provider.generateImage) {
      return this.provider.generateImage(prompt, options);
    }
    throw new Error('Image generation not supported by current provider');
  }

  // Semantic search
  async search(options: {
    query: string;
    documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>;
    topK?: number;
  }): Promise<Array<{ id: string; score: number; text: string }>> {
    const queryEmbedding = await this.embed(options.query);
    
    const results = [];
    
    for (const doc of options.documents) {
      const docEmbedding = await this.embed(doc.text);
      const score = this.cosineSimilarity(queryEmbedding, docEmbedding);
      results.push({ ...doc, score });
    }

    results.sort((a, b) => b.score - a.score);
    
    const topK = options.topK || 5;
    return results.slice(0, topK).map(r => ({
      id: r.id,
      score: r.score,
      text: r.text
    }));
  }

  // Generate SEO content
  async generateSEO(options: {
    page: string;
    content: string;
    targetKeywords: string[];
  }): Promise<any> {
    const result = await this.generateJSON(
      `Generate SEO metadata for the page "${options.page}" with this content:
      
${options.content}

Target keywords: ${options.targetKeywords.join(', ')}

Generate title, meta description, and JSON-LD schema.`,
      undefined,
      'You are an SEO expert. Return JSON with title, description, keywords, and schema.'
    );

    return result;
  }

  // Generate code
  async generateCode(options: {
    description: string;
    language?: string;
    framework?: string;
  }): Promise<string> {
    const result = await this.generate({
      prompt: `Generate ${options.language || 'TypeScript'} code for: ${options.description}
Framework: ${options.framework || 'MoveJS'}

Return only the code, no explanations.`,
      system: 'You are an expert software engineer. Write clean, well-structured code.'
    });

    // Clean code blocks
    return result.text.replace(/^```[a-z]*\n?/gm, '').replace(/```$/gm, '').trim();
  }

  // Generate component
  async generateComponent(options: {
    description: string;
    style?: string;
    framework?: string;
  }): Promise<string> {
    const result = await this.generate({
      prompt: `Generate a UI component for: ${options.description}
Style: ${options.style || 'modern, clean'}
Framework: ${options.framework || 'MoveJS'}

Return only the component code.`,
      system: 'You are an expert UI developer. Create accessible, responsive components.'
    });

    return result.text.replace(/^```[a-z]*\n?/gm, '').replace(/```$/gm, '').trim();
  }

  // Analyze code
  async analyzeCode(code: string): Promise<any> {
    return this.generateJSON(
      `Analyze this code for issues, improvements, and potential bugs:
      
${code}`,
      undefined,
      'You are a code reviewer. Return JSON with issues, suggestions, and severity.'
    );
  }

  // Translate content
  async translate(text: string, targetLanguage: string): Promise<string> {
    const result = await this.generate({
      prompt: `Translate this text to ${targetLanguage}:
      
${text}`,
      system: 'You are a professional translator. Return only the translated text.'
    });

    return result.text.trim();
  }

  // Summarize content
  async summarize(text: string, maxLength?: number): Promise<string> {
    const result = await this.generate({
      prompt: `Summarize this content${maxLength ? ` in under ${maxLength} words` : ''}:
      
${text}`,
      system: 'You are a professional writer. Create concise, accurate summaries.'
    });

    return result.text.trim();
  }

  // Get cache key
  private getCacheKey(prompt: string, model?: string): string {
    return `${model || this.config.model}:${prompt}`;
  }

  // Cosine similarity for embeddings
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Sleep helper
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Convenience factory
export function createAI(config: AIConfig): MoveAIClient {
  return new MoveAIClient(config);
}

// Default singleton
let defaultClient: MoveAIClient | null = null;

export function initAI(config: AIConfig): MoveAIClient {
  defaultClient = new MoveAIClient(config);
  return defaultClient;
}

export function getAI(): MoveAIClient {
  if (!defaultClient) {
    const config: AIConfig = {
      provider: (process.env.AI_PROVIDER as any) || 'openai',
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL || 'gpt-4o'
    };
    defaultClient = new MoveAIClient(config);
  }
  return defaultClient;
}

// Export AI instance
export const ai = {
  generate: (options: AIGenerateOptions) => getAI().generate(options),
  chat: (options: AIChatOptions) => getAI().chat(options),
  generateJSON: <T>(prompt: string, schema?: string) => getAI().generateJSON<T>(prompt, schema),
  search: (options: any) => getAI().search(options),
  generateSEO: (options: any) => getAI().generateSEO(options),
  generateCode: (options: any) => getAI().generateCode(options),
  generateComponent: (options: any) => getAI().generateComponent(options),
  analyzeCode: (code: string) => getAI().analyzeCode(code),
  translate: (text: string, lang: string) => getAI().translate(text, lang),
  summarize: (text: string, len?: number) => getAI().summarize(text, len),
  embed: (text: string) => getAI().embed(text)
};
