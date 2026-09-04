// MoveJS Shared utilities

// Deep merge
export function deepMerge<T>(target: T, source: any): T {
  if (Array.isArray(target) && Array.isArray(source)) {
    return source as T;
  }

  if (typeof target === 'object' && target !== null && typeof source === 'object') {
    const result: any = { ...target };
    for (const key of Object.keys(source)) {
      if (typeof source[key] === 'object' && source[key] !== null && key in result) {
        result[key] = deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result as T;
  }

  return source as T;
}

// Deep clone
export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

// Deep equality
export function deepEquals(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEquals(item, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(key => deepEquals(a[key], b[key]));
  }

  return false;
}

// Debounce
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

// Throttle
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

// Memoize
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Retry with exponential backoff
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    baseDelay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { retries = 3, baseDelay = 1000, maxDelay = 10000, factor = 2, onRetry } = options;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        throw error;
      }

      const delay = Math.min(maxDelay, baseDelay * Math.pow(factor, attempt));
      onRetry?.(error as Error, attempt);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Format relative time
export function timeAgo(date: Date | string | number): string {
  const ms = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

// Format bytes
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

// Slugify
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Truncate text
export function truncate(text: string, length: number = 100, suffix: string = '...'): string {
  if (text.length <= length) return text;
  return text.slice(0, length - suffix.length) + suffix;
}

// Random ID
export function randomId(prefix: string = ''): string {
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}-${id}` : id;
}

// Clamp
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Percentage
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Pipe / compose
export function pipe<A, B>(fn1: (a: A) => B): (a: A) => B;
export function pipe<A, B, C>(fn1: (a: A) => B, fn2: (b: B) => C): (a: A) => C;
export function pipe(...fns: Function[]): Function {
  return (input: any) => fns.reduce((acc, fn) => fn(acc), input);
}

// Async pipe
export function pipeAsync<A, B>(fn1: (a: A) => Promise<B> | B): (a: A) => Promise<B>;
export function pipeAsync(...fns: Function[]): Function {
  return (input: any) => fns.reduce((acc, fn) => Promise.resolve(acc).then(fn as (value: any) => any), input);
}

// Try/catch wrapper for async functions
export function to<T, E = Error>(promise: Promise<T>): Promise<[E | null, T | null]> {
  return promise
    .then<[null, T]>((data) => [null, data])
    .catch<[E, null]>((error) => [error, null]);
}

// Compose class names (re-export)
export function cx(...classes: Array<string | undefined | false | null>): string {
  return classes.filter(Boolean).join(' ');
}

// String utilities
export const str = {
  capitalize: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
  titleCase: (s: string) => s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()),
  camelCase: (s: string) => s.toLowerCase().replace(/[-_\s](.)/g, (_, c) => c.toUpperCase()),
  kebabCase: (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase(),
  snakeCase: (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[\s-]+/g, '_').toLowerCase(),
  pascalCase: (s: string) => s.toLowerCase().replace(/(^\w|[-_\s]\w)/g, (c) => c.toUpperCase()).replace(/[-_\s]/g, ''),
  isEmail: (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),
  isURL: (s: string) => /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(s),
  isPhone: (s: string) => /^[\d\s()+-]{7,15}$/.test(s),
  removeWhitespace: (s: string) => s.replace(/\s+/g, ''),
  countWords: (s: string) => s.trim().split(/\s+/).filter(Boolean).length
};

export { cx as classNames };
