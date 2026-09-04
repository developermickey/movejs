import type {
  SEOConfig,
  PageSEOConfig,
  OpenGraphImage,
  SchemaNode
} from '../types';

// SEO Meta Generator
export class SEOMetaGenerator {
  private config: SEOConfig;

  constructor(config: SEOConfig = {}) {
    this.config = {
      viewport: 'width=device-width, initial-scale=1',
      ...config
    };
  }

  // Generate complete head tags for a page
  generatePageHead(page: PageSEOConfig = {}): HeadResult {
    const head: HeadResult = { title: '', meta: [], links: [], scripts: [], htmlAttrs: {} };

    // Title
    head.title = this.generateTitle(page.title);
    
    // Description
    if (page.description || this.config.description) {
      head.meta.push({ name: 'description', content: (page.description || this.config.description) as string });
    }

    // Keywords
    const keywords = [...(page.keywords || []), ...(this.config.keywords || [])];
    if (keywords.length > 0) {
      head.meta.push({ name: 'keywords', content: keywords.join(', ') });
    }

    // Canonical
    const canonical = page.canonical || this.config.canonical;
    if (canonical) {
      head.links.push({ rel: 'canonical', href: canonical });
    }

    // Open Graph
    const og = page.og || this.config.og;
    if (og) {
      this.generateOpenGraph(head, og);
    }

    // Twitter
    const twitter = page.twitter || this.config.twitter;
    if (twitter) {
      this.generateTwitter(head, twitter);
    }

    // Robots
    const robots = page.robots || this.config.robots;
    if (robots) {
      this.generateRobots(head, robots);
    }

    // Structured data
    if (page.schema) {
      for (const schema of page.schema) {
        head.scripts.push({
          type: 'application/ld+json',
          content: JSON.stringify(schema)
        });
      }
    }

    // Icons
    if (this.config.icons) {
      this.generateIcons(head, this.config.icons);
    }

    // Other config
    if (this.config.manifest) {
      head.links.push({ rel: 'manifest', href: this.config.manifest });
    }

    if (this.config.themeColor) {
      head.meta.push({ name: 'theme-color', content: this.config.themeColor });
    }

    if (this.config.viewport) {
      head.meta.push({ name: 'viewport', content: this.config.viewport });
    }

    // Default Open Graph tags
    if (!og && this.config.siteName) {
      head.meta.push({ property: 'og:site_name', content: this.config.siteName });
      head.meta.push({ property: 'og:type', content: 'website' });
    }

    return head;
  }

  // Generate title with template
  private generateTitle(title?: string): string {
    if (!title) return this.config.title || this.config.siteName || '';
    
    if (this.config.titleTemplate) {
      return this.config.titleTemplate.replace('%s', title);
    }
    
    if (this.config.siteName) {
      return `${title} | ${this.config.siteName}`;
    }
    
    return title;
  }

  // Generate Open Graph tags
  private generateOpenGraph(head: HeadResult, og: NonNullable<SEOConfig['og']>): void {
    const url = og.url || this.config.canonical || this.config.baseURL;
    
    head.meta.push({ property: 'og:title', content: og.title || this.config.title || '' });
    head.meta.push({ property: 'og:description', content: og.description || this.config.description || '' });
    head.meta.push({ property: 'og:type', content: og.type || 'website' });
    
    if (url) {
      head.meta.push({ property: 'og:url', content: url });
    }
    
    if (og.siteName || this.config.siteName) {
      head.meta.push({ property: 'og:site_name', content: (og.siteName || this.config.siteName) as string });
    }
    
    if (og.locale) {
      head.meta.push({ property: 'og:locale', content: og.locale });
    }
    
    for (const locale of og.localeAlternates || []) {
      head.meta.push({ property: 'og:locale:alternate', content: locale });
    }
    
    // Images
    const images = og.images || [];
    if (images.length === 0 && this.config.og?.images) {
      images.push(...this.config.og.images);
    }
    
    for (const image of images) {
      this.generateOGImage(head, image);
    }
  }

  // Generate Open Graph image tags
  private generateOGImage(head: HeadResult, image: OpenGraphImage): void {
    head.meta.push({ property: 'og:image', content: image.url });
    
    if (image.width) {
      head.meta.push({ property: 'og:image:width', content: String(image.width) });
    }
    if (image.height) {
      head.meta.push({ property: 'og:image:height', content: String(image.height) });
    }
    if (image.alt) {
      head.meta.push({ property: 'og:image:alt', content: image.alt });
    }
    if (image.type) {
      head.meta.push({ property: 'og:image:type', content: image.type });
    }
  }

  // Generate Twitter card tags
  private generateTwitter(head: HeadResult, twitter: NonNullable<SEOConfig['twitter']>): void {
    head.meta.push({ name: 'twitter:card', content: twitter.card || 'summary_large_image' });
    
    if (twitter.title) {
      head.meta.push({ name: 'twitter:title', content: twitter.title });
    }
    if (twitter.description) {
      head.meta.push({ name: 'twitter:description', content: twitter.description });
    }
    if (twitter.image) {
      head.meta.push({ name: 'twitter:image', content: twitter.image });
    }
    if (twitter.site) {
      head.meta.push({ name: 'twitter:site', content: twitter.site });
    }
    if (twitter.creator) {
      head.meta.push({ name: 'twitter:creator', content: twitter.creator });
    }
  }

  // Generate robots meta
  private generateRobots(head: HeadResult, robots: NonNullable<SEOConfig['robots']>): void {
    const directives: string[] = [];
    
    directives.push(robots.index === false ? 'noindex' : 'index');
    directives.push(robots.follow === false ? 'nofollow' : 'follow');
    
    if (robots.noarchive) directives.push('noarchive');
    if (robots.nosnippet) directives.push('nosnippet');
    if (robots.maxSnippet) directives.push(`max-snippet:${robots.maxSnippet}`);
    if (robots.maxImagePreview) directives.push(`max-image-preview:${robots.maxImagePreview}`);
    if (robots.maxVideoPreview) directives.push(`max-video-preview:${robots.maxVideoPreview}`);

    head.meta.push({ name: 'robots', content: directives.join(', ') });
  }

  // Generate icon links
  private generateIcons(head: HeadResult, icons: NonNullable<SEOConfig['icons']>): void {
    if (typeof icons.icon === 'string') {
      head.links.push({ rel: 'icon', href: icons.icon });
    } else if (Array.isArray(icons.icon)) {
      for (const icon of icons.icon) {
        head.links.push({
          rel: 'icon',
          href: icon.url,
          type: icon.type,
          sizes: icon.sizes
        });
      }
    }

    if (icons.shortcut) {
      head.links.push({ rel: 'shortcut icon', href: icons.shortcut });
    }

    if (typeof icons.apple === 'string') {
      head.links.push({ rel: 'apple-touch-icon', href: icons.apple });
    } else if (Array.isArray(icons.apple)) {
      for (const apple of icons.apple) {
        head.links.push({ rel: 'apple-touch-icon', href: apple.url, sizes: apple.sizes });
      }
    }
  }
}

export interface HeadResult {
  title: string;
  meta: Array<{ name?: string; property?: string; content: string }>;
  links: Array<{ rel: string; href: string; type?: string; sizes?: string }>;
  scripts: Array<{ type: string; content: string }>;
  htmlAttrs: Record<string, string>;
}

// Generate full HTML head string
export function renderHead(head: HeadResult): string {
  const parts: string[] = [];

  if (head.title) {
    parts.push(`<title>${escapeHtml(head.title)}</title>`);
  }

  for (const meta of head.meta) {
    if (meta.name) {
      parts.push(`<meta name="${escapeHtml(meta.name)}" content="${escapeHtml(meta.content)}">`);
    } else if (meta.property) {
      parts.push(`<meta property="${escapeHtml(meta.property)}" content="${escapeHtml(meta.content)}">`);
    }
  }

  for (const link of head.links) {
    let attrs = `rel="${escapeHtml(link.rel)}" href="${escapeHtml(link.href)}"`;
    if (link.type) attrs += ` type="${escapeHtml(link.type)}"`;
    if (link.sizes) attrs += ` sizes="${escapeHtml(link.sizes)}"`;
    parts.push(`<link ${attrs}>`);
  }

  for (const script of head.scripts) {
    if (script.type === 'application/ld+json') {
      parts.push(`<script type="${script.type}">${script.content}</script>`);
    }
  }

  return parts.join('\n  ');
}

// Escape HTML in strings
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export { escapeHtml };
