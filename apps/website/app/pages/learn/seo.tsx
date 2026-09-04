// MoveJS website - SEO guide

import LearnLayout from '../components/LearnLayout';
import { Code, Callout } from '../components/ui';

export const config = {
  render: 'ssg',
  seo: {
    title: 'SEO & Metadata - MoveJS Documentation',
    description: 'Declare SEO metadata per page in MoveJS and get meta tags, Open Graph, JSON-LD schema and sitemaps automatically.',
    ogType: 'article',
    ogImage: '/logo.svg',
    schema: 'TechArticle',
    canonical: '/learn/seo',
    themeColor: '#0b0f1a'
  },
  headLinks: [
    { rel: 'stylesheet', href: '/styles.css' },
    { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
    { rel: 'apple-touch-icon', href: '/logo.svg' }
  ],
  headScripts: [
    { src: '/app.js' }
  ]
};

export default function Seo() {
  return (
    <LearnLayout slug="seo">
      <h1>SEO &amp; Metadata</h1>
      <p className="doc-lede">
        MoveJS turns a small <code>seo</code> object on each page into the complete set of meta
        tags, Open Graph properties, Twitter cards, JSON-LD structured data and canonical URLs —
        generated at render time, per page.
      </p>

      <h2>Declaring metadata</h2>
      <Code lang="ts" filename="app/pages/products.tsx">{`export const config = {
  render: 'ssr',
  seo: {
    title: 'Products | ACME Store',
    description: 'Hand-picked products, shipped free.',
    keywords: ['shopping', 'deals'],
    author: 'ACME Team',
    ogType: 'website',
    ogImage: '/images/og-products.png',
    twitterCard: 'summary_large_image',
    schema: 'Product',
    canonical: '/products'
  }
};`}</Code>
      <p>
        That single object produces the <code>&lt;title&gt;</code>, meta description, Open Graph
        tags, Twitter card, a canonical link and a JSON-LD block with the matching schema.org type.
      </p>

      <h2>What gets generated</h2>
      <p>
        For the config above, the rendered <code>&lt;head&gt;</code> includes:
      </p>
      <Code lang="html" filename="rendered head"><span class="dim">{`<!-- basics -->
`}</span>{`<title>Products | ACME Store</title>
<meta name="description" content="Hand-picked products, shipped free." />
<meta name="keywords" content="shopping,deals" />
<meta name="author" content="ACME Team" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="Products | ACME Store" />
<meta property="og:description" content="Hand-picked products, shipped free." />
<meta property="og:image" content="/images/og-products.png" />
<meta property="og:url" content="http://localhost:3000/products" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />

<!-- Canonical -->
<link rel="canonical" href="/products" />

<!-- JSON-LD -->
<script type="application/ld+json">
  {"@type":"Product","title":"Products | ACME Store", "description":"Hand-picked products, shipped free."}
</script>`}</Code>

      <h2>SEO fields</h2>
      <table>
        <thead><tr><th scope="col">Field</th><th scope="col">Tag</th><th scope="col">Notes</th></tr></thead>
        <tbody>
          <tr><td><code>title</code></td><td><code>&lt;title&gt;</code> + <code>og:title</code></td><td>Required</td></tr>
          <tr><td><code>description</code></td><td><code>&lt;meta name="description"&gt;</code></td><td>Also used by JSON-LD</td></tr>
          <tr><td><code>keywords</code></td><td><code>&lt;meta name="keywords"&gt;</code></td><td>Array</td></tr>
          <tr><td><code>author</code></td><td><code>&lt;meta name="author"&gt;</code></td><td></td></tr>
          <tr><td><code>ogType</code></td><td><code>&lt;meta property="og:type"&gt;</code></td><td>website | article | product …</td></tr>
          <tr><td><code>ogImage</code></td><td><code>og:image</code> + <code>twitter:image</code></td><td></td></tr>
          <tr><td><code>twitterCard</code></td><td><code>&lt;meta name="twitter:card"&gt;</code></td><td></td></tr>
          <tr><td><code>schema</code></td><td>JSON-LD <code>@type</code></td><td>WebSite, TechArticle, Product…</td></tr>
          <tr><td><code>canonical</code></td><td><code>&lt;link rel="canonical"&gt;</code></td><td></td></tr>
          <tr><td><code>noindex</code></td><td><code>&lt;meta name="robots"&gt;</code></td><td><code>true</code> → <code>noindex, nofollow</code></td></tr>
        </tbody>
      </table>

      <h2>Setting defaults</h2>
      <p>
        Configure site-wide defaults in <code>movejs.config.ts</code> so every page inherits a base
        title, description and image unless it overrides them:
      </p>
      <Code lang="ts" filename="movejs.config.ts">{`export default {
  seo: {
    title: 'ACME Store',
    description: 'Shop the best products online.',
    ogImage: '/images/og-default.png',
    schema: 'WebSite'
  }
};`}</Code>

      <h2>Server-side enhancements</h2>
      <p>
        For <code>ssr</code> and <code>edge</code> pages, MoveJS also lets you read request
        metadata so SEO stays correct per request — useful for dynamic canonical URLs derived from
        the request:
      </p>
      <Code lang="ts" filename="app/pages/user/[id].tsx">{`export const config = {
  render: 'ssr',
  seo: { title: 'Profile' }
}`}</Code>
      <p>
        The canonical link is resolved against the request URL, so per-user pages get correct,
        shareable URLs automatically.
      </p>

      <h2>Sitemaps</h2>
      <p>
        During <code>movejs build</code>, SSG routes are collected into a{' '}
        <code>sitemap.xml</code> at the output root, keeping your static content discoverable:
      </p>
      <Code lang="xml" filename="output/sitemap.xml">{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/about</loc></url>
</urlset>`}</Code>

      <Callout type="tip">
        Use <code>noindex: true</code> for login pages, admin areas and any page that should never
        appear in search results.
      </Callout>
    </LearnLayout>
  );
}