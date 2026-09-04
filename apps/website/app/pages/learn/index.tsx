// MoveJS website - Learn overview

import LearnLayout from '../components/LearnLayout';
import { DOCS } from '../components/docs';

export const config = {
  render: 'ssg',
  seo: {
    title: 'Learn MoveJS - Documentation',
    description: 'Guides and documentation for MoveJS: get started, rendering modes, routing, signals, the ORM, SEO and deployment.',
    ogType: 'website',
    ogImage: '/logo.svg',
    schema: 'CollectionPage',
    canonical: '/learn',
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

export default function LearnOverview() {
  return (
    <LearnLayout slug="">
      <h1>Learn MoveJS</h1>
      <p className="doc-lede">
        Everything you need to go from first install to production. Start with{' '}
        <a href="/learn/get-started">Get Started</a> if you are new, or jump straight
        to the topic you care about.
      </p>

      <div className="features-grid" style={{ marginBottom: '2.5rem' }}>
        {DOCS.map((doc, i) => (
          <a
            href={`/learn/${doc.slug}`}
            className="feature-card"
            key={doc.slug}
            style={{ display: 'block' }}
          >
            <div className="icon" aria-hidden="true">{['🚀', '🖥️', '🗺️', '⚡', '🗄️', '🔍', '📦', '☁️'][i] || '•'}</div>
            <h3>{doc.title}</h3>
            <p>{doc.description}</p>
          </a>
        ))}
      </div>
    </LearnLayout>
  );
}