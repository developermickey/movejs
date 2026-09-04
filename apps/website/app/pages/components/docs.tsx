// MoveJS website - documentation metadata (single source of truth for the learn section)

export interface Doc {
  slug: string;
  title: string;
  description: string;
  group: 'Guides';
}

export const DOCS: Doc[] = [
  {
    slug: 'get-started',
    title: 'Get Started',
    description: 'Install MoveJS, create your first app, and understand the project structure.'
  },
  {
    slug: 'rendering',
    title: 'Rendering & Data Fetching',
    description: 'SSR, SSG, ISR, CSR and Edge render modes, plus loaders for data fetching.'
  },
  {
    slug: 'routing',
    title: 'Routing & Pages',
    description: 'File-based routing, dynamic segments, catch-alls, layouts and API routes.'
  },
  {
    slug: 'signals',
    title: 'Signals & Reactivity',
    description: 'Signal-based state management with automatic, surgical DOM updates.'
  },
  {
    slug: 'data',
    title: 'Database & ORM',
    description: 'The built-in ORM, QueryBuilder and migrations - no external setup required.'
  },
  {
    slug: 'seo',
    title: 'SEO & Metadata',
    description: 'Zero-config metadata, Open Graph, JSON-LD schema and sitemaps.'
  },
  {
    slug: 'ui',
    title: 'UI Component Library',
    description: 'The accessible, performance-optimized @movejs/ui component library.'
  },
  {
    slug: 'deploying',
    title: 'Build & Deploy',
    description: 'Production builds and deployment targets for MoveJS applications.'
  }
];

export interface SidebarGroup {
  title: string;
  links: Array<{ href: string; label: string }>;
}

export const SIDEBAR: SidebarGroup[] = [
  {
    title: 'Learn',
    links: [{ href: '/learn', label: 'Learn Overview' }]
  },
  {
    title: 'Guides',
    links: DOCS.map((d) => ({ href: `/learn/${d.slug}`, label: d.title }))
  }
];

export function docBySlug(slug: string): Doc | undefined {
  return DOCS.find((d) => d.slug === slug);
}

export interface PrevNext {
  prev?: Doc;
  next?: Doc;
}

export function prevNext(slug: string): PrevNext {
  const i = DOCS.findIndex((d) => d.slug === slug);
  if (i === -1) return {};
  return {
    prev: i > 0 ? DOCS[i - 1] : undefined,
    next: i < DOCS.length - 1 ? DOCS[i + 1] : undefined
  };
}