// MoveJS website - Get Started guide

import LearnLayout from '../components/LearnLayout';
import { Code, Callout } from '../components/ui';

export const config = {
  render: 'ssg',
  seo: {
    title: 'Get Started - MoveJS Documentation',
    description: 'Install MoveJS, create your first full-stack app, and understand the project structure. Get from zero to your first SSR page in minutes.',
    ogType: 'article',
    ogImage: '/logo.svg',
    schema: 'TechArticle',
    canonical: '/learn/get-started'
  }
};

export default function GetStarted() {
  return (
    <LearnLayout slug="get-started">
      <h1>Get Started</h1>
      <p className="doc-lede">
        MoveJS is a full-stack JavaScript framework. You get a reactive UI layer with signal-based
        rendering, a file-based router, a built-in ORM, automatic SEO and more — in one package.
      </p>

      <h2>Requirements</h2>
      <p>
        MoveJS requires Node.js <code>18</code> or newer. You do not need any other global tools —
        the CLI, the compiler and the dev server are all included.
      </p>

      <h2>Create your first app</h2>
      <p>
        The fastest way to start is with{' '}
        <code>create-movejs</code>. It scaffolds a working full-stack project with pages,
        API routes and a database-ready setup.
      </p>
      <Code lang="bash" filename="terminal">{`npx create-movejs@latest my-app
cd my-app
npm install`}</Code>
      <p>Start the development server:</p>
      <Code lang="bash" filename="terminal">{`npm run dev`}</Code>
      <p>
        Open <code>http://localhost:3000</code>. The dev server bundles your pages, watches for
        changes, and serves your API routes alongside them.
      </p>

      <Callout type="tip">
        Prefer TypeScript? MoveJS is fully type-safe and every scaffolded project includes proper
        typings out of the box.
      </Callout>

      <h2>Project structure</h2>
      <p>A MoveJS project keeps your application in an <code>app/</code> directory:</p>
      <Code lang="txt" filename="project">{`my-app/
├── app/
│   ├── pages/          # File-based routes (SSR/SSG/ISR/CSR/Edge)
│   │   ├── index.tsx   # → /
│   │   ├── about.tsx   # → /about
│   │   └── components/ # Shared components (not routes)
│   ├── api/            # API route handlers
│   │   └── users.ts    # → /api/users
│   └── layouts/        # Shared page layouts
├── public/             # Static assets (served at /)
├── movejs.config.ts    # Optional framework config
└── package.json`}</Code>

      <h2>Your first page</h2>
      <p>
        Every file in <code>app/pages/</code> becomes a route. Create{' '}
        <code>app/pages/index.tsx</code>:
      </p>
      <Code lang="tsx" filename="app/pages/index.tsx">{`import { createSignal } from '@movejs/core';

export const config = {
  render: 'ssr',
  seo: {
    title: 'Home',
    description: 'My first MoveJS page'
  }
};

export default function Home() {
  const [count, setCount] = createSignal(0);

  return (
    <main>
      <h1>Hello, MoveJS</h1>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count()}
      </button>
    </main>
  );
}`}</Code>
      <p>
        The <code>config</code> export controls <em>how</em> the page is rendered and which SEO
        metadata is generated. Set <code>render</code> to <code>ssr</code>, <code>ssg</code>,{' '}
        <code>isr</code>, <code>csr</code> or <code>edge</code>.
      </p>

      <h2>Your first API route</h2>
      <p>
        Add a handler in <code>app/api/hello.ts</code>. The exported method names map to HTTP
        verbs, and each handler returns a <code>Response</code>:
      </p>
      <Code lang="ts" filename="app/api/hello.ts">{`export function GET(request: Request) {
  return Response.json({
    message: 'Hello from MoveJS',
    time: new Date().toISOString()
  });
}`}</Code>
      <p>
        Visit <code>http://localhost:3000/api/hello</code> to see the JSON response. You can use
        one file for multiple verbs — export <code>POST</code>, <code>PUT</code>,{' '}
        <code>DELETE</code>, <code>PATCH</code> alongside <code>GET</code>.
      </p>

      <h2>How it works</h2>
      <p>
        When you run <code>movejs dev</code>, the CLI:
      </p>
      <ol>
        <li>Scans <code>app/pages</code> and builds a route manifest.</li>
        <li>Bundles your pages and API routes with the MoveJS compiler.</li>
        <li>Starts a server that renders each route according to its <code>config</code> — Request headers, SEO tags and caching included.</li>
        <li>Serves <code>public/</code> files and <code>app/api</code> handlers at their mounted paths.</li>
      </ol>

      <Callout type="warn">
        Event handlers such as <code>onClick</code> render only on the server for now. For fully
        interactive islands, use the <code>csr</code> render mode or an inline client script.
        Interactive HTML like <code>details</code> and <code>input</code> works everywhere.
      </Callout>

      <h2>Next steps</h2>
      <ul>
        <li><a href="/learn/routing">Routing &amp; Pages</a> — dynamic segments, catch-alls and layouts</li>
        <li><a href="/learn/rendering">Rendering &amp; Data Fetching</a> — when to use SSR, SSG, ISR or Edge</li>
        <li><a href="/learn/data">Database &amp; ORM</a> — query your database with the built-in ORM</li>
        <li><a href="/learn/deploying">Build &amp; Deploy</a> — take your app to production</li>
      </ul>
    </LearnLayout>
  );
}