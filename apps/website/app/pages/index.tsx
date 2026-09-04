// MoveJS website - homepage

import { SiteHeader, SiteFooter } from './components/Site';
import { Code, Callout } from './components/ui';

export const config = {
  render: 'ssg',
  seo: {
    title: 'MoveJS - A Full-Stack JavaScript Framework',
    description: 'Build fast, secure, AI-powered full-stack applications with MoveJS. Signal-based reactivity, file-based routing with SSR/SSG/ISR, a built-in ORM, and automatic SEO.',
    ogType: 'website',
    ogImage: '/logo.svg',
    schema: 'WebSite',
    canonical: '/',
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

const FEATURES = [
  { icon: '⚡', title: 'Signal-based reactivity', desc: 'Surgical, sub-millisecond DOM updates. No Virtual DOM diffing overhead.' },
  { icon: '🗂️', title: 'File-based routing', desc: 'SSR, SSG, ISR, CSR and Edge modes — configured per page.' },
  { icon: '🗄️', title: 'Built-in ORM', desc: 'Database-agnostic data layer with auto migrations. No Prisma or Drizzle setup.' },
  { icon: '🧠', title: 'AI-native', desc: 'Content generation, image optimization and code generation built in.' },
  { icon: '🔍', title: 'Automatic SEO', desc: 'Meta tags, JSON-LD schema and sitemaps with zero configuration.' },
  { icon: '🔐', title: 'Secure by default', desc: 'CSRF protection, rate limiting, security headers and auth included.' },
  { icon: '♿', title: 'Accessible', desc: 'Accessibility engine with auto-fix targets WCAG compliance.' },
  { icon: '🖥️', title: 'Edge-ready', desc: 'Deploy to any serverless platform with edge runtime support.' }
];

const STATS = [
  { value: '<50ms', label: 'Cold start' },
  { value: '5', label: 'Render modes' },
  { value: '12', label: 'Packages' },
  { value: '100%', label: 'Type-safe' }
];

const HERO_CODE = `import { createSignal } from '@movejs/core';

export const config = {
  render: 'ssr',
  seo: { title: 'My App' }
};

export default function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count()}
    </button>
  );
}`;

export default function HomePage() {
  return (
    <div>
      <SiteHeader />

      <main id="main">
      {/* Hero */}
      <section className="hero" aria-label="Introduction">
        <div className="container">
          <div>
            <a className="badge" href="/learn/get-started">
              <span>✨</span> MoveJS v0.1.0 — Get started →
            </a>
          </div>
          <h1>Build the full stack<br /><span className="gradient">at the speed of thought</span></h1>
          <p className="lede">
            MoveJS is a full-stack JavaScript framework with signal-based reactivity,
            file-based routing, a built-in ORM, automatic SEO and AI — all out of the box.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="/learn/get-started">Get Started</a>
            <a className="btn btn-ghost" href="/learn">Read the Docs</a>
          </div>
          <p className="subtitle">
            <span className="inline-code">npx create-movejs@latest my-app</span>
          </p>

          <div className="code-stage">
            <div className="window">
              <div className="bar">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="file">app/pages/index.tsx</span>
              </div>
              <pre>
                <code>{HERO_CODE}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" aria-label="Features">
        <div className="container">
          <div className="section-header">
            <h2>Everything you need to build for the web</h2>
            <p>One framework for your UI, data, security, SEO and AI — designed to be fast by default.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="icon" aria-hidden="true">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why MoveJS */}
      <section className="section" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elev)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Why teams choose MoveJS</h2>
          </div>
          <div className="split">
            <div className="text">
              <h3>React-level DX, Svelte-level speed</h3>
              <p>
                Signals give you fine-grained reactivity without the overhead of a Virtual DOM.
                Components re-render exactly where they need to — nothing more.
              </p>
              <ul>
                <li>No diffing, no reconciliation, no wasted renders</li>
                <li>Familiar component model — your JSX knowledge transfers</li>
                <li>Batched updates and computed values built in</li>
                <li>Server-side rendering included for every mode</li>
              </ul>
              <a className="btn btn-ghost" href="/learn/signals">Learn about signals</a>
            </div>
            <div className="code">
              <Code lang="tsx" filename="counter.tsx">{`const [count, setCount] = createSignal(0);
const doubled = createComputed(() => count() * 2);

createEffect(() => {
  console.log("count is", count());
});

<button onClick={() => setCount(c => c + 1)}>
  {count()} × 2 = {doubled()}
</button>`}</Code>
            </div>
          </div>
        </div>
      </section>

      {/* Render modes */}
      <section className="section" aria-label="Rendering modes">
        <div className="container">
          <div className="split" style={{ direction: 'rtl' }}>
            <div className="text" style={{ direction: 'ltr' }}>
              <h3>One route, five render modes</h3>
              <p>
                Choose how each page is rendered by editing a single config object —
                from static generation to fully dynamic edge rendering.
              </p>
              <Code lang="ts" filename="config.ts">{`export const config = {
  render: 'ssr',   // 'ssr' | 'ssg' | 'isr' | 'csr' | 'edge'
  revalidate: 60,  // ISR cache time (seconds)
  seo: { title: 'Docs' }
};`}</Code>
              <p>
                <a className="btn btn-ghost" href="/learn/rendering">Explore render modes</a>
              </p>
            </div>
            <div className="code" style={{ direction: 'ltr' }}>
              <Code lang="txt" filename="mode map">{`/docs          → SSG   (static, immutable)
/app           → ISR   (revalidates every 60s)
/user/[id]     → SSR   (per-request)
/dashboard     → CSR   (client shell)
/edge-page     → Edge  (serverless runtime)`}</Code>
            </div>
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="section" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elev)' }}>
        <div className="container">
          <div className="split">
            <div className="text">
              <h3>Database without the ceremony</h3>
              <p>
                MoveJS ships with a type-safe ORM and query builder. Define a schema,
                run migrations, and query with full IntelliSense — no third-party setup.
              </p>
              <Code lang="ts" filename="api/users.ts">{`const users = db.user.findMany({
  where: { status: 'active' },
  orderBy: { id: 'desc' },
  take: 10
});`}</Code>
              <p>
                <a className="btn btn-ghost" href="/learn/data">Meet the ORM</a>
              </p>
            </div>
            <div className="code">
              <Code lang="json" filename="schema.ts">
{`const userSchema = {
  id:        { type: 'int', primary: true },
  name:      { type: 'string' },
  status:    { type: 'enum', enumValues: ['active', 'inactive'] },
  created_at: { type: 'datetime' }
};`}
              </Code>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats" aria-label="Performance stats">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s) => (
              <div className="stat" key={s.label}>
                <h3>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick start */}
      <section className="section" aria-label="Quick start">
        <div className="container">
          <div className="section-header">
            <h2>Start building in minutes</h2>
            <p>One command scaffolds a full-stack app with SSR pages, API routes, database and SEO.</p>
          </div>
          <div style={{ maxWidth: 620, margin: '0 auto' }}>
            <div className="terminal">
              <div className="bar">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <pre>
                <code>
                  <span className="prompt">$</span> npx create-movejs@latest my-app
                  {'\n'}
                  <span className="prompt">$</span> cd my-app
                  {'\n'}
                  <span className="prompt">$</span> npm run dev
                  {'\n'}
                  {'\u00a0'}
                  {'\n'}
                  <span className="dim">⚡ MoveJS Development Server</span>
                  {'\n'}
                  <span className="dim">🚀 http://localhost:3000</span>
                </code>
              </pre>
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Callout type="info">
                Prefer to learn by doing? The{' '}
                <a href="/learn/get-started">Get Started guide</a>{' '}
                walks through your first MoveJS app, step by step.
              </Callout>
            </div>
          </div>
        </div>
      </section>
      </main>

      <SiteFooter />
    </div>
  );
}