import type { AIGenerateOptions, AIGenerateResult, AIConfig, AIChatOptions, AIChatMessage } from '../types';

// Base Provider Interface
export interface AIProvider {
  readonly name: string;
  generate(options: AIGenerateOptions): Promise<AIGenerateResult>;
  chat(options: AIChatOptions): Promise<AIGenerateResult>;
  embed?(text: string): Promise<number[]>;
  generateImage?(prompt: string, options?: any): Promise<string>;
}

// OpenAI Provider
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = {
      model: 'gpt-4o',
      baseUrl: 'https://api.openai.com/v1',
      temperature: 0.7,
      maxTokens: 4096,
      ...config
    };
  }

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const startTime = Date.now();

    const messages: AIChatMessage[] = [];
    if (options.system) {
      messages.push({ role: 'system', content: options.system });
    }
    messages.push({ role: 'user', content: options.prompt });

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || this.config.model,
        messages,
        temperature: options.temperature ?? this.config.temperature,
        max_tokens: options.maxTokens || this.config.maxTokens,
        response_format: options.responseFormat === 'json' 
          ? { type: 'json_object' } 
          : undefined,
        stream: false
      })
    });

    if (!response.ok) {
      throw this.handleError(response);
    }

    const data = await response.json();

    return {
      text: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      finishReason: data.choices?.[0]?.finish_reason || 'stop',
      latency: Date.now() - startTime
    };
  }

  async chat(options: AIChatOptions): Promise<AIGenerateResult> {
    const startTime = Date.now();

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || this.config.model,
        messages: options.messages,
        temperature: options.temperature ?? this.config.temperature,
        max_tokens: options.maxTokens || this.config.maxTokens,
        stream: options.stream ?? false
      })
    });

    if (!response.ok) {
      throw this.handleError(response);
    }

    const data = await response.json();

    return {
      text: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      finishReason: data.choices?.[0]?.finish_reason || 'stop',
      latency: Date.now() - startTime
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    if (!response.ok) {
      throw this.handleError(response);
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  }

  private handleError(response: Response): Error {
    const status = response.status;
    let message = `OpenAI API error: ${status}`;

    if (status === 429) {
      message = 'Rate limit exceeded for OpenAI API';
    } else if (status === 401) {
      message = 'Invalid OpenAI API key';
    } else if (status === 500) {
      message = 'OpenAI server error';
    }

    const error = new Error(message) as any;
    error.code = 'OPENAI_ERROR';
    error.statusCode = status;
    error.retryable = status === 429 || status === 500;
    return error;
  }
}

// Anthropic Provider
export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = {
      model: 'claude-3-5-sonnet-20241022',
      baseUrl: 'https://api.anthropic.com/v1',
      temperature: 0.7,
      maxTokens: 4096,
      ...config
    };
  }

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const startTime = Date.now();

    const messages: AIChatMessage[] = [];
    if (options.system) {
      messages.push({ role: 'system', content: options.system });
    }
    messages.push({ role: 'user', content: options.prompt });

    const response = await fetch(`${this.config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: options.model || this.config.model,
        messages: messages.filter(m => m.role !== 'system'),
        system: options.system,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature
      })
    });

    if (!response.ok) {
      throw this.handleError(response);
    }

    const data = await response.json();

    return {
      text: data.content?.[0]?.text || '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      },
      finishReason: data.stop_reason || 'end_turn',
      latency: Date.now() - startTime
    };
  }

  async chat(options: AIChatOptions): Promise<AIGenerateResult> {
    const startTime = Date.now();

    const system = options.messages.find(m => m.role === 'system')?.content;
    const messages = options.messages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: options.model || this.config.model,
        messages,
        system,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature
      })
    });

    if (!response.ok) {
      throw this.handleError(response);
    }

    const data = await response.json();

    return {
      text: data.content?.[0]?.text || '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      },
      finishReason: data.stop_reason || 'end_turn',
      latency: Date.now() - startTime
    };
  }

  private handleError(response: Response): Error {
    const status = response.status;
    let message = `Anthropic API error: ${status}`;

    if (status === 429) {
      message = 'Rate limit exceeded for Anthropic API';
    } else if (status === 401) {
      message = 'Invalid Anthropic API key';
    }

    const error = new Error(message) as any;
    error.code = 'ANTHROPIC_ERROR';
    error.statusCode = status;
    error.retryable = status === 429 || status === 500;
    return error;
  }
}

// Provider factory
export function createProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'google':
      // Google provider would be implemented here
      throw new Error('Google provider not yet implemented');
    case 'local':
      // Local LLM provider
      throw new Error('Local LLM provider not yet implemented');
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}
