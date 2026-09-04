// MoveJS website - Routing guide

import LearnLayout from '../components/LearnLayout';
import { Code, Callout } from '../components/ui';

export const config = {
  render: 'ssg',
  seo: {
    title: 'Routing & Pages - MoveJS Documentation',
    description: 'File-based routing in MoveJS: static routes, dynamic segments, catch-alls, layouts and API routes.',
    ogType: 'article',
    ogImage: '/logo.svg',
    schema: 'TechArticle',
    canonical: '/learn/routing',
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

export default function Routing() {
  return (
    <LearnLayout slug="routing">
      <h1>Routing &amp; Pages</h1>
      <p className="doc-lede">
        MoveJS uses file-based routing. The files in your <code>app/pages</code> directory — and
        their folder names — define your URL structure.
      </p>

      <h2>Pages map to files</h2>
      <Code lang="txt" filename="app/pages">{`app/pages/
├── index.tsx          → /
├── about.tsx          → /about
├── blog/
│   ├── index.tsx      → /blog
│   └── hello-world.tsx → /blog/hello-world
└── docs.tsx           → /docs`}</Code>
      <p>
        The file scan excludes <code>components/</code>, <code>layouts/</code> and{' '}
        <code>api/</code> directories, and ignores files prefixed with <code>_</code> or{' '}
        <code>.</code>.
      </p>

      <Callout type="info">
        <code>index.tsx</code> at the root of any folder becomes that folder's index route.
      </Callout>

      <h2>Dynamic segments</h2>
      <p>
        Wrap part of the filename in brackets to make it dynamic. The value is passed to the page
        as a prop named after the segment:
      </p>
      <Code lang="tsx" filename="app/pages/users/[id].tsx">{`export default function User(props) {
  return <h1>User #{props.id}</h1>;
}`}</Code>
      <p>
        A folder can also be dynamic: <code>app/pages/users/[id]/profile.tsx</code> becomes{' '}
        <code>/users/:id/profile</code>.
      </p>

      <h2>Catch-all segments</h2>
      <p>
        Use <code>[...slug]</code> for a catch-all that matches remaining path segments. The value
        arrives as a slash-joined string:
      </p>
      <Code lang="tsx" filename="app/pages/docs/[...slug].tsx">{`export default function Doc(props) {
  // /docs/getting-started/install → props.slug === "getting-started/install"
  return <p>Reading: {props.slug}</p>;
}`}</Code>

      <h2>Route config</h2>
      <p>
        Export <code>config</code> from any page to control rendering, SEO, caching and more:
      </p>
      <Code lang="ts" filename="app/pages/about.tsx">{`export const config = {
  render: 'ssr',        // ssr | ssg | isr | csr | edge
  revalidate: 60,       // ISR only
  layout: 'marketing',  // optional named layout
  auth: false,          // require auth (when configured)
  seo: {
    title: 'About',
    description: 'Learn about MoveJS',
    ogType: 'website'
  }
};`}</Code>

      <h2>Layouts</h2>
      <p>
        Keep shared chrome (navigation, footers) in reusable components. The{' '}
        <code>app/pages/components/</code> directory is reserved for these — files there never
        become routes.
      </p>
      <Code lang="tsx" filename="app/pages/components/Marketing.tsx">{`export default function Marketing(props) {
  return (
    <div>
      <header>…site nav…</header>
      <div className="content">{props.children}</div>
      <footer>…site footer…</footer>
    </div>
  );
}`}</Code>
      <p>Now any page can wrap itself:</p>
      <Code lang="tsx" filename="app/pages/about.tsx">{`import Marketing from './components/Marketing';

export default function About() {
  return (
    <Marketing>
      <h1>About us</h1>
    </Marketing>
  );
}`}</Code>

      <h2>API routes</h2>
      <p>
        Files in <code>app/api/</code> become REST-like endpoints mounted under{' '}
        <code>/api</code>. Export handlers named after HTTP methods:
      </p>
      <Code lang="ts" filename="app/api/todos.ts">{`// app/api/todos.ts
const todos = [];

export function GET() {
  return Response.json(todos);
}

export async function POST(request: Request) {
  const body = await request.json();
  todos.push({ id: todos.length + 1, ...body });
  return Response.json(body, { status: 201 });
}`}</Code>
      <p>
        The file layout mirrors page routing, so nested API files work too:{' '}
        <code>app/api/users/[id].ts</code> → <code>/api/users/:id</code>.
      </p>

      <Callout type="tip">
        Request objects follow the <em>Fetch API</em> — <code>request.json()</code>,{' '}
        <code>request.headers</code> and <code>Response.json()</code> all work as expected.
      </Callout>
    </LearnLayout>
  );
}