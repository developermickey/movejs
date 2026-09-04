// MoveJS website - Deployment guide

import LearnLayout from '../components/LearnLayout';
import { Code, Callout } from '../components/ui';

export const config = {
  render: 'ssg',
  seo: {
    title: 'Build & Deploy - MoveJS Documentation',
    description: 'Build a production MoveJS app with movejs build and start it anywhere — Node servers, Docker, or edge/serverless platforms.',
    ogType: 'article',
    ogImage: '/logo.svg',
    schema: 'TechArticle',
    canonical: '/learn/deploying'
  }
};

export default function Deploying() {
  return (
    <LearnLayout slug="deploying">
      <h1>Build &amp; Deploy</h1>
      <p className="doc-lede">
        When you're ready to ship, <code>movejs build</code> produces a self-contained production
        bundle, and <code>movejs start</code> runs it. The same app goes anywhere Node runs.
      </p>

      <h2>Build</h2>
      <Code lang="bash" filename="terminal">{`movejs build            # optimized production bundle
movejs build --minify  # additionally minify the output`}</Code>
      <p>During a build, MoveJS:</p>
      <ol>
        <li>Compiles all pages and API routes with the MoveJS compiler.</li>
        <li>Pre-renders every <code>ssg</code> page into static HTML.</li>
        <li>Emits a route manifest describing each pattern and its <code>config</code>.</li>
      </ol>

      <h2>Build output</h2>
      <Code lang="txt" filename=".movejs/">{`.movejs/
├── server/          # Bundled pages + API handlers
└── manifest.json    # Route patterns + config for each page`}</Code>
      <p>
        The manifest is what runtime modes (<code>ssr</code>, <code>isr</code>, <code>edge</code>)
        consult to know how to serve each route. The static assets in your <code>public/</code>{' '}
        directory stay where they are and are served at the root.
      </p>

      <h2>Start</h2>
      <Code lang="bash" filename="terminal">{`movejs start                       # serve the production build
movejs start --port 8080 --host 0.0.0.0`}</Code>

      <h2>Environment variables</h2>
      <p>Keep secrets out of the bundle — read them from the environment at runtime:</p>
      <Code lang="ts" filename="app/db.ts">{`import { createDatabase } from '@movejs/data';

export const db = await createDatabase({
  provider: 'postgresql',
  url: process.env.DATABASE_URL,
  ssl: !!process.env.DATABASE_SSL
});`}</Code>

      <h2>Deploying to a Node server</h2>
      <p>
        Build on your CI runner and run the server as a long-lived process. A minimal Dockerfile:
      </p>
      <Code lang="dockerfile" filename="Dockerfile">{`FROM node:22-alpine

WORKDIR /app

# Build
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

# Runtime
ENV NODE_ENV=production PORT=3000
EXPOSE 3000

CMD ["npm", "start"]`}</Code>

      <h2>Scaling with ISR</h2>
      <p>
        Pages with <code>render: 'isr'</code> revalidate in the background after{' '}
        <code>revalidate</code> seconds — no rebuild needed. This keeps your deployment immutable
        while content stays fresh:
      </p>
      <Code lang="ts" filename="app/pages/blog/[slug].tsx">{`export const config = {
  render: 'isr',
  revalidate: 60,
  loader: ({ params }) => fetchPost(params.slug)
};`}</Code>

      <h2>Edge runtime</h2>
      <p>
        Prefer running close to your users? Deploy the <code>server/</code> bundle to a
        serverless/edge runtime. Pages marked <code>render: 'edge'</code> are served per request
        without a long-lived process.
      </p>

      <Callout type="warn">
        Do not use Node-only APIs (filesystem, child processes) inside <code>edge</code> pages or
        their loaders — those run in a restricted runtime. Keep them in <code>ssr</code> handlers
        instead.
      </Callout>

      <h2>Health checks</h2>
      <p>
        Mount a health endpoint so your orchestrator can verify the app is serving requests:
      </p>
      <Code lang="ts" filename="app/api/health.ts">{`export function GET() {
  return Response.json({ status: 'ok' });
}`}</Code>
    </LearnLayout>
  );
}