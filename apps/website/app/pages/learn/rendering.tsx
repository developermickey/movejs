// MoveJS website - Rendering & Data Fetching guide

import LearnLayout from '../components/LearnLayout';
import { Code, Callout } from '../components/ui';

export const config = {
  render: 'ssg',
  seo: {
    title: 'Rendering & Data Fetching - MoveJS Documentation',
    description: 'SSR, SSG, ISR, CSR and Edge render modes in MoveJS, plus loaders for data fetching and revalidation.',
    ogType: 'article',
    ogImage: '/logo.svg',
    schema: 'TechArticle',
    canonical: '/learn/rendering',
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

export default function Rendering() {
  return (
    <LearnLayout slug="rendering">
      <h1>Rendering &amp; Data Fetching</h1>
      <p className="doc-lede">
        Every page in MoveJS declares <em>how</em> it should be rendered. Change one line in your
        page config to move between static generation, server-side rendering and edge delivery.
      </p>

      <h2>Render modes</h2>
      <p>
        Set the <code>render</code> field on a page's <code>config</code> export to choose its mode:
      </p>
      <table>
        <thead>
          <tr><th scope="col">Mode</th><th scope="col">Render time</th><th scope="col">Cache</th><th scope="col">Best for</th></tr>
        </thead>
        <tbody>
          <tr><td><code>ssr</code></td><td>Per request</td><td>None</td><td>Personalized, always-fresh pages</td></tr>
          <tr><td><code>ssg</code></td><td>Build time</td><td>Immutable</td><td>Docs, landing pages, marketing</td></tr>
          <tr><td><code>isr</code></td><td>Build + revalidate</td><td>Stale-while-revalidate</td><td>Content that changes occasionally</td></tr>
          <tr><td><code>csr</code></td><td>In the browser</td><td>None</td><td>Interactive dashboards, apps</td></tr>
          <tr><td><code>edge</code></td><td>Per request</td><td>None</td><td>Globally distributed routes</td></tr>
        </tbody>
      </table>

      <Code lang="ts" filename="app/pages/docs.tsx">{`export const config = {
  render: 'ssg',          // ← choose the mode
  seo: {
    title: 'Documentation'
  }
};`}</Code>

      <h2>Static Site Generation (SSG)</h2>
      <p>
        SSG renders your page once at build time and serves it with immutable caching headers —
        the fastest option for content that does not change per visitor.
      </p>
      <Code lang="txt" filename="response headers">{`Cache-Control: public, max-age=31536000, immutable`}</Code>
      <p>
        Build your app with <code>movejs build</code>; every <code>ssg</code> page is generated
        into the production output.
      </p>

      <h2>Server-Side Rendering (SSR)</h2>
      <p>
        SSR renders the HTML for every request on the server. Use it when the response depends on
        the request — cookies, headers, or per-user data.
      </p>
      <Code lang="ts" filename="app/pages/user/[id].tsx">{`export const config = { render: 'ssr' };

export default function User(props) {
  const id = props.id;         // ↑ dynamic segment from the URL
  const tab = props.tab;       // query params are spread in too
  const data = props.data;     // from the loader
  return <p>User #{id} ({tab})</p>;
}`}</Code>

      <h2>Loading data</h2>
      <p>
        Add a <code>loader</code> to your config to fetch data before rendering. The result is
        passed to the page component as <code>props.data</code>:
      </p>
      <Code lang="ts" filename="app/pages/products.tsx">{`export const config = {
  render: 'isr',
  revalidate: 300,   // seconds
  async loader({ params, query }) {
    const res = await fetch('https://api.example.com/products');
    const products = await res.json();
    return { data: products };
  }
};

export default function Products(props) {
  return (
    <ul>
      {props.data.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}`}</Code>

      <h2>Incremental Static Regeneration (ISR)</h2>
      <p>
        ISR renders at build time, then revalidates in the background once{' '}
        <code>revalidate</code> seconds have passed. Visitors always get a cached page, and the
        cache is refreshed without a rebuild.
      </p>
      <Code lang="ts" filename="app/pages/blog/[slug].tsx">{`export const config = {
  render: 'isr',
  revalidate: 60,
  loader: ({ params }) => fetchBlogPost(params.slug).then(r => ({ data: r }))
};`}</Code>

      <h2>Client-Side Rendering (CSR)</h2>
      <p>
        CSR serves a minimal shell and renders in the browser. Use it for highly interactive
        applications where the HTML shell adds little value.
      </p>
      <Code lang="ts" filename="app/pages/dashboard.tsx">{`export const config = { render: 'csr' };`}</Code>

      <h2>Edge Rendering</h2>
      <p>
        The Edge mode renders per request but is tuned for serverless/edge runtimes, so it can run
        close to your users around the world.
      </p>
      <Code lang="ts" filename="app/pages/pricing.tsx">{`export const config = {
  render: 'edge',
  runtime: 'node'   // 'node' | 'edge'
};`}</Code>

      <Callout type="tip">
        The same page structure works in every mode. Only the <code>config.render</code> value
        changes — your components stay the same.
      </Callout>

      <Callout type="warn">
        Loaders run on the server only (SSR, SSG, ISR, Edge). They should be assumed to run in a
        Node or edge context, never in the browser.
      </Callout>
    </LearnLayout>
  );
}