export interface SEOConfig {
  siteName?: string;
  title?: string;
  titleTemplate?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  baseURL?: string;
  og?: OpenGraphConfig;
  twitter?: TwitterConfig;
  robots?: RobotsConfig;
  alternates?: AlternatesConfig;
  icons?: IconsConfig;
  manifest?: string;
  themeColor?: string;
  viewport?: string;
  openGraph?: OpenGraphConfig;
}

export interface OpenGraphConfig {
  type?: 'website' | 'article' | 'product' | 'profile';
  title?: string;
  description?: string;
  url?: string;
  siteName?: string;
  images?: OpenGraphImage[];
  locale?: string;
  localeAlternates?: string[];
}

export interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string;
}

export interface TwitterConfig {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  title?: string;
  description?: string;
  image?: string;
  site?: string;
  creator?: string;
}

export interface RobotsConfig {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  maxSnippet?: number;
  maxImagePreview?: 'none' | 'standard' | 'large';
  maxVideoPreview?: number;
}

export interface AlternatesConfig {
  canonical?: string;
  languages?: Record<string, string>;
  types?: Record<string, string>;
}

export interface IconsConfig {
  icon?: string | Array<{ url: string; type?: string; sizes?: string }>;
  shortcut?: string;
  apple?: string | Array<{ url: string; sizes?: string }>;
}

export interface PageSEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  og?: OpenGraphConfig;
  twitter?: TwitterConfig;
  robots?: RobotsConfig;
  schema?: SchemaNode[];
}

export type SchemaNode = Record<string, any>;

export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{ url: string; title?: string; caption?: string }>;
}

export interface WebVitalMetric {
  name: 'LCP' | 'FCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
}

export interface WebVitalReport {
  metrics: Record<string, WebVitalMetric>;
  score: number;
  timestamp: number;
}
