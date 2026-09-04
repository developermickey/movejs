// MoveJS website - shared site chrome (header + footer)

export const GITHUB_URL = 'https://github.com/developermickey/movejs';

export function SiteHeader() {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/learn', label: 'Learn' },
    { href: '/learn/get-started', label: 'Docs' }
  ];
  return (
    <div>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container">
          <a className="brand" href="/">
            <img src="/logo.svg" alt="MoveJS logo" width={30} height={30} />
            <span>MoveJS</span>
            <span className="version">v0.1.0</span>
          </a>
          <nav className="site-nav" aria-label="Main navigation">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="nav-cta" href="/learn/get-started">Get Started</a>
          </nav>
          <details className="nav-drawer">
            <summary>Menu</summary>
            <div className="drawer-links">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href}>{l.label}</a>
              ))}
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="/learn/get-started">Get Started</a>
            </div>
          </details>
        </div>
      </header>
    </div>
  );
}

export function SiteFooter() {
  const cols = [
    {
      title: 'Framework',
      links: [
        { href: '/learn/get-started', label: 'Get Started' },
        { href: '/learn/rendering', label: 'Rendering' },
        { href: '/learn/routing', label: 'Routing' },
        { href: '/learn/data', label: 'Database & ORM' }
      ]
    },
    {
      title: 'Essentials',
      links: [
        { href: '/learn/signals', label: 'Signals & State' },
        { href: '/learn/seo', label: 'SEO' },
        { href: '/learn/ui', label: 'UI Components' },
        { href: '/learn/deploying', label: 'Deploying' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { href: '/learn', label: 'Learn Overview' },
        { href: GITHUB_URL, label: 'GitHub', external: true },
        { href: 'https://github.com/developermickey/movejs/releases', label: 'Releases', external: true },
        { href: 'https://github.com/developermickey/movejs/issues', label: 'Issues', external: true }
      ]
    }
  ];
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div className="about">
            <a className="brand" href="/">
              <img src="/logo.svg" alt="MoveJS logo" width={28} height={28} />
              <span>MoveJS</span>
            </a>
            <p>A full-stack JavaScript framework that is fast, secure, AI-powered, and enterprise-ready. React-level DX, Svelte-level speed.</p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="bottom">
          <span>© 2026 MoveJS. MIT License.</span>
          <span>Signal-based SSR · Built with MoveJS</span>
        </div>
      </div>
    </footer>
  );
}