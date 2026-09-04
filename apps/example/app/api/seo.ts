import { generateSchema, Schema } from '@movejs/seo';

export async function GET() {
  // Generate structured data for the page
  const articleSchema = Schema.Article({
    headline: 'Getting Started with MoveJS',
    description: 'Learn how to build full-stack applications with MoveJS',
    author: 'MoveJS Team',
    datePublished: new Date().toISOString(),
    publisher: 'MoveJS'
  });

  const schemaScript = generateSchema(articleSchema);

  return Response.json({
    schema: schemaScript,
    sitemap: 'https://example.com/sitemap.xml',
    robots: 'https://example.com/robots.txt',
    meta: {
      title: 'Getting Started with MoveJS',
      description: 'Learn how to build full-stack applications with MoveJS',
      keywords: ['movejs', 'framework', 'javascript']
    }
  });
}
