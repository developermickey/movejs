// MoveJS website - docs page layout (sidebar + breadcrumb + prev/next)

import { SiteHeader, SiteFooter } from './Site';
import { SIDEBAR, docBySlug, prevNext } from './docs';

export default function LearnLayout(props: { slug: string; children: any }) {
  const { slug, children } = props;
  const doc = docBySlug(slug);
  const { prev, next } = prevNext(slug);

  const isActive = (href: string) =>
    href === `/learn/${slug}` || (slug === '' && href === '/learn');

  return (
    <div>
      <SiteHeader />
      <main className="container docs-grid">
        <aside className="docs-sidebar" aria-label="Documentation navigation">
          {SIDEBAR.map((group) => (
            <div className="group" key={group.title}>
              <p className="group-title">{group.title}</p>
              {group.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={isActive(link.href) ? 'active' : ''}
                >{link.label}</a>
              ))}
            </div>
          ))}
        </aside>
        <article className="docs-content">
          <p className="breadcrumb">
            <a href="/learn">Learn</a>
            {doc ? <span>{' / '}{doc.title}</span> : <span>{' / Overview'}</span>}
          </p>
          {children}
          <nav className="docs-nav" aria-label="Previous and next pages">
            {prev ? (
              <a className="card" href={`/learn/${prev.slug}`}>
                <div className="dir">Previous</div>
                <div className="tt">{prev.title}</div>
              </a>
            ) : <span />}
            {next ? (
              <a className="card next" href={`/learn/${next.slug}`}>
                <div className="dir">Next</div>
                <div className="tt">{next.title}</div>
              </a>
            ) : <span />}
          </nav>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}