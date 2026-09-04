import type { SitemapEntry } from '../types';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// Sitemap Generator
export class SitemapGenerator {
  private entries: SitemapEntry[] = [];
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  // Add a URL to the sitemap
  add(entry: SitemapEntry): this {
    this.entries.push(entry);
    return this;
  }

  // Add multiple URLs
  addMany(entries: SitemapEntry[]): this {
    this.entries.push(...entries);
    return this;
  }

  // Remove a URL
  remove(url: string): this {
    this.entries = this.entries.filter(e => e.url !== url);
    return this;
  }

  // Generate XML sitemap
  generateXML(): string {
    const urls = this.entries.map(entry => {
      const url = entry.url.startsWith('http') ? entry.url : `${this.baseURL}${entry.url}`;
      
      let xml = `  <url>\n    <loc>${escapeXML(url)}</loc>\n`;
      
      if (entry.lastModified) {
        const lastmod = entry.lastModified instanceof Date 
          ? entry.lastModified.toISOString() 
          : new Date(entry.lastModified).toISOString();
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
      }
      
      if (entry.changeFrequency) {
        xml += `    <changefreq>${entry.changeFrequency}</changefreq>\n`;
      }
      
      if (entry.priority !== undefined) {
        xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
      }
      
      if (entry.images && entry.images.length > 0) {
        for (const image of entry.images) {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${escapeXML(image.url)}</image:loc>\n`;
          if (image.title) xml += `      <image:title>${escapeXML(image.title)}</image:title>\n`;
          if (image.caption) xml += `      <image:caption>${escapeXML(image.caption)}</image:caption>\n`;
          xml += `    </image:image>\n`;
        }
      }
      
      xml += `  </url>\n`;
      return xml;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('')}</urlset>`;
  }

  // Write sitemap to file
  async writeToFile(path: string = './public/sitemap.xml'): Promise<void> {
    const xml = this.generateXML();
    await writeFile(path, xml);
  }

  // Get entry count
  getCount(): number {
    return this.entries.length;
  }
}

// Robots.txt Generator
export function generateRobotsTxt(config: {
  allowAll?: boolean;
  disallow?: string[];
  allow?: string[];
  sitemap?: string;
  host?: string;
  crawlDelay?: number;
  userAgents?: string[];
}): string {
  const {
    allowAll = true,
    disallow = [],
    allow = [],
    sitemap,
    host,
    crawlDelay,
    userAgents = ['*']
  } = config;

  const lines: string[] = [];

  for (const userAgent of userAgents) {
    lines.push(`User-agent: ${userAgent}`);
    
    if (allowAll && disallow.length === 0) {
      lines.push('Allow: /');
    } else {
      for (const d of disallow) {
        lines.push(`Disallow: ${d}`);
      }
      for (const a of allow) {
        lines.push(`Allow: ${a}`);
      }
    }
    
    if (crawlDelay !== undefined) {
      lines.push(`Crawl-delay: ${crawlDelay}`);
    }
    
    lines.push('');
  }

  if (sitemap) {
    lines.push(`Sitemap: ${sitemap}`);
  }

  if (host) {
    lines.push(`Host: ${host}`);
  }

  return lines.join('\n');
}

// Sitemap Index Generator
export function generateSitemapIndex(sitemaps: Array<{ url: string; lastModified?: Date }>): string {
  const items = sitemaps.map(s => {
    const lastmod = s.lastModified ? s.lastModified.toISOString() : '';
    return `  <sitemap>\n    <loc>${escapeXML(s.url)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}  </sitemap>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</sitemapindex>`;
}

// Escape XML special characters
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export { escapeXML };
