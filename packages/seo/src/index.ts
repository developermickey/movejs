// MoveJS SEO - Automatic optimization engine

export type {
  SEOConfig,
  PageSEOConfig,
  OpenGraphConfig,
  OpenGraphImage,
  TwitterConfig,
  RobotsConfig,
  AlternatesConfig,
  IconsConfig,
  SchemaNode,
  SitemapEntry,
  WebVitalMetric,
  WebVitalReport
} from './types';

export { SEOMetaGenerator, renderHead, escapeHtml } from './meta/generator';
export type { HeadResult } from './meta/generator';

export { generateSchema, Schema, schemaToScriptTag } from './structured/schema';

export {
  WebVitalsMonitor,
  getWebVitalsMonitor,
  enableDevReporting,
  useWebVitals
} from './vitals/monitor';

export {
  SitemapGenerator,
  generateRobotsTxt,
  generateSitemapIndex,
  escapeXML
} from './build/sitemap';

// Version
export const VERSION = '0.1.0';
