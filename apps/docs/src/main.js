import './styles.css';

// Simple docs landing page
const app = document.getElementById('app');

app.innerHTML = `
<!-- Header -->
<header class="site-header">
  <div class="container">
    <div class="logo">
      <img src="/logo.png" alt="MoveJS Logo" />
      <span>MoveJS</span>
    </div>
    <nav class="nav" aria-label="Main navigation">
      <a href="#features">Features</a>
      <a href="#quickstart">Quick Start</a>
      <a href="#docs">Docs</a>
      <a href="https://github.com/movejs/movejs">GitHub</a>
    </nav>
  </div>
</header>

<!-- Hero -->
<section class="hero" aria-label="Introduction">
  <div class="container">
    <img src="/logo.png" alt="" aria-hidden="true" />
    <span class="badge">🚀 v0.1.0 - Now in Beta</span>
    <h1>Build the impossible with MoveJS</h1>
    <p>A full-stack JavaScript framework that's fast, secure, AI-powered, and ready for the enterprise.</p>
    <div class="cta-group">
      <a class="cta cta-primary" href="#quickstart">Get Started</a>
      <a class="cta cta-secondary" href="#docs">Read the Docs</a>
    </div>
    <p class="subtitle">React-level DX · Svelte-level speed · Enterprise-level features</p>
  </div>
</section>

<!-- Features -->
<section class="features" id="features">
  <div class="container">
    <h2>Everything you need to build for the web</h2>
    <div class="features-grid">
      ${features.map(f => `
        <div class="feature-card">
          <div class="icon">${f.icon}</div>
          <h3>${f.title}</h3>
          <p>${f.desc}</p>
        </div>
      `).join('')}
    </div>
  </div>
</section>

<!-- Code -->
<section class="code-section" id="docs">
  <div class="container">
    <h2>Simple. Powerful. Type-safe.</h2>
    <div class="code-block">
<pre>
import { createSignal } from '@movejs/core';
import { ai } from '@movejs/ai';
import { db } from '@movejs/data';

export const config = {
  render: 'ssr',
  seo: { title: 'My App' }
};

export default function Home() {
  const [count, setCount] = createSignal(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count()}</button>;
}
</pre>
    </div>
  </div>
</section>

<!-- Stats -->
<section class="stats" aria-label="Performance stats">
  <div class="container stats-grid">
    ${stats.map(s => `
      <div class="stat">
        <h3>${s.value}</h3>
        <p>${s.label}</p>
      </div>
    `).join('')}
  </div>
</section>

<!-- Quick Start -->
<section class="quickstart" id="quickstart">
  <div class="container">
    <h2>Start building in minutes</h2>
    <p>Create a new MoveJS project and start building full-stack applications with SSR, API routes, database, and AI - all out of the box.</p>
    <div class="code-block" style="max-width: 600px; margin: 0 auto; text-align: left;">
<pre>
# Create your project
npx create-movejs@latest my-app

# Start developing
cd my-app && npm run dev
</pre>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="site-footer">
  <div class="container">
    <p>© 2026 MoveJS. Built with ♥ and TypeScript.</p>
    <p>MIT License</p>
    <div class="footer-links">
      <a href="#features">Features</a>
      <a href="#quickstart">Quick Start</a>
      <a href="#">Documentation</a>
      <a href="https://github.com/movejs/movejs">GitHub</a>
    </div>
  </div>
</footer>
`;

const features = [
  { icon: '⚡', title: 'Blazing Fast', desc: 'Signal-based reactivity for surgical, sub-millisecond DOM updates. No Virtual DOM overhead.' },
  { icon: '🔍', title: 'SEO Optimized', desc: 'Automatic meta tags, JSON-LD schema, and sitemaps. Core Web Vitals fixed automatically.' },
  { icon: '🧠', title: 'AI-Powered', desc: 'Built-in AI for content generation, image optimization, and component creation.' },
  { icon: '🗄️', title: 'Database Built-in', desc: 'Type-safe ORM with auto migrations. No Prisma or Drizzle setup needed.' },
  { icon: '🔐', title: 'Secure by Default', desc: 'CSRF protection, rate limiting, security headers, and secure sessions.' },
  { icon: '♿', title: 'Accessible', desc: 'Built-in accessibility engine with auto-fixing for WCAG compliance.' },
  { icon: '🖥️', title: 'Edge-Ready', desc: 'Deploy to any serverless platform with edge runtime support.' },
  { icon: '📦', title: 'Component Library', desc: 'Accessible, performance-optimized UI components included.' }
];

const stats = [
  { value: '<50ms', label: 'Cold Start' },
  { value: '95+', label: 'Lighthouse Score' },
  { value: '3+', label: 'Rendering Modes' },
  { value: '100%', label: 'Type-safe' }
];
