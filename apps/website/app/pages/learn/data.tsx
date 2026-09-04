// MoveJS website - Database & ORM guide

import LearnLayout from '../components/LearnLayout';
import { Code, Callout } from '../components/ui';

export const config = {
  render: 'ssg',
  seo: {
    title: 'Database & ORM - MoveJS Documentation',
    description: 'MoveJS ships a built-in ORM and query builder. Connect a database, define a schema, and query without external setup.',
    ogType: 'article',
    ogImage: '/logo.svg',
    schema: 'TechArticle',
    canonical: '/learn/data'
  }
};

export default function Data() {
  return (
    <LearnLayout slug="data">
      <h1>Database &amp; ORM</h1>
      <p className="doc-lede">
        MoveJS includes a database adapter and a type-safe ORM — no Prisma, Drizzle or Knex to
        install. Define your schema once and query with full IntelliSense.
      </p>

      <h2>Connect a database</h2>
      <p>
        Create a client from a connection string. Supported providers: PostgreSQL, MySQL, SQLite
        and MongoDB.
      </p>
      <Code lang="ts" filename="app/db.ts">{`import { createDatabase } from '@movejs/data';

export const db = await createDatabase({
  provider: 'postgresql',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
});`}</Code>

      <Callout type="info">
        Driver packages are loaded lazily, so you can run the same code in the browser bundle
        without pulling database drivers into the client.
      </Callout>

      <h2>Models</h2>
      <p>
        Access a table through a model property. The ORM converts <code>UserProfile</code> to
        <code>user_profile</code> automatically:
      </p>
      <Code lang="ts" filename="app/models/user.ts">{`const users = db.user.findMany({
  where: { status: 'active' },
  orderBy: { id: 'desc' },
  take: 10,
  skip: 0
});`}</Code>
      <p>Available model methods:</p>
      <table>
        <thead><tr><th>Method</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>findUnique</code></td><td>Find one row, or <code>null</code></td></tr>
          <tr><td><code>findFirst</code></td><td>Find the first matching row</td></tr>
          <tr><td><code>findMany</code></td><td>Find many rows with filters, order and pagination</td></tr>
          <tr><td><code>create</code> / <code>createMany</code></td><td>Insert one or many rows</td></tr>
          <tr><td><code>update</code> / <code>updateMany</code></td><td>Update matching rows</td></tr>
          <tr><td><code>upsert</code></td><td>Update or create</td></tr>
          <tr><td><code>delete</code> / <code>deleteMany</code></td><td>Remove matching rows</td></tr>
          <tr><td><code>count</code></td><td>Count matching rows</td></tr>
          <tr><td><code>aggregate</code></td><td>COUNT, SUM, AVG, MIN, MAX</td></tr>
          <tr><td><code>groupBy</code></td><td>Group with aggregations</td></tr>
        </tbody>
      </table>

      <h2>Writing data</h2>
      <Code lang="ts" filename="app/api/users.ts">{`export async function POST(request: Request) {
  const body = await request.json();

  const user = await db.user.create({
    data: {
      name: body.name,
      email: body.email
    }
  });

  return Response.json(user, { status: 201 });
}`}</Code>

      <h2>Queries with operators</h2>
      <p>
        Filter with rich operators — comparisons, <code>in</code>, string matching and null checks:
      </p>
      <Code lang="ts" filename="search.ts">{`const adults = db.user.findMany({
  where: {
    age: { gte: 18 },
    status: { in: ['active', 'pending'] },
    name: { contains: 'ada' },
    deletedAt: { isNull: true }
  },
  orderBy: [
    { age: 'desc' },
    { id: 'asc' }
  ],
  take: 50
});`}</Code>

      <h2>Advanced conditions</h2>
      <p>
        Combine clauses with <code>AND</code>, <code>OR</code> and <code>NOT</code>:
      </p>
      <Code lang="ts" filename="advanced.ts">{`db.user.findMany({
  where: {
    AND: [
      { status: 'active' },
      { NOT: { age: { lt: 18 } } }
    ],
    OR: [
      { plan: 'pro' },
      { plan: 'team' }
    ]
  }
});`}</Code>

      <h2>Pagination</h2>
      <p>
        Combine <code>take</code>/<code>skip</code> with a <code>count</code> query to page
        through results. This is exactly how the built-in helpers do it:
      </p>
      <Code lang="ts" filename="pagination.ts">{`const page = 2;
const pageSize = 25;

const [rows, total] = await Promise.all([
  db.post.findMany({
    where: { published: true },
    skip: (page - 1) * pageSize,
    take: pageSize
  }),
  db.post.count({ where: { published: true } })
]);

return {
  rows,
  total,
  page,
  pages: Math.ceil(total / pageSize)
};`}</Code>

      <h2>QueryBuilder</h2>
      <p>
        Drop down to the query builder for joins, grouping and free-form SQL generation:
      </p>
      <Code lang="ts" filename="qb.ts">{`import { QueryBuilder } from '@movejs/data';

const { sql, params } = QueryBuilder.from('users')
  .join('posts', 'posts.user_id = users.id')
  .leftJoin('comments', 'comments.post_id = posts.id')
  .where('users.status', 'active')
  .where({ posts: { status: { in: ['published', 'draft'] } } })
  .orderBy('users.created_at', 'desc')
  .limit(20)
  .toSQL();`}</Code>

      <h2>Migrations</h2>
      <p>
        Track schema changes with the migration runner, then apply them in order:
      </p>
      <Code lang="ts" filename="migrate.ts">{`import { MigrationRunner } from '@movejs/data';

const files = await runner.up();          // run pending migrations
await runner.down();                       // roll back the last one
const status = await runner.status();      // list applied/pending`}</Code>

      <Callout type="tip">
        Keep <code>db</code> in a single module (like <code>app/db.ts</code>) and import it from
        your API routes and loaders. The ORM lazily connects on first query.
      </Callout>
    </LearnLayout>
  );
}