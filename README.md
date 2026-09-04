# 🚀 MoveJS

**A full-stack JavaScript framework that's Fast, Secure, AI-powered, and Enterprise-ready.**

MoveJS combines the best of React, Next.js, Nuxt, and Svelte into one cohesive framework with built-in database management, AI capabilities, and automatic SEO/Core Web Vitals optimization.

## ✨ Features

- ⚡ **Signal-based reactivity** - Faster than Virtual DOM diffing
- 🗂️ **File-based routing** - SSR, SSG, ISR, CSR, Edge modes per page
- 🗄️ **Built-in ORM** - Database-agnostic, no Prisma/Drizzle setup needed
- 🧠 **AI-native** - Content generation, image optimization, code generation built-in
- 🔍 **Automatic SEO** - Meta tags, JSON-LD schema, sitemaps, zero-config
- 📈 **Core Web Vitals** - Automatic LCP/CLS/FID optimization
- ♿ **Accessibility** - Built-in a11y engine with auto-fix
- 🔐 **Authentication** - OAuth, credentials, magic links included
- 🖥️ **Edge-ready** - Deploy to any serverless platform
- 📦 **MoveJS UI** - Accessible component library included

## 🚀 Quick Start

```bash
# Create a new project
npx create-movejs@latest my-app

# Navigate to project
cd my-app

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📦 Project Structure

```
my-app/
├── app/
│   ├── pages/          # File-based routing
│   │   ├── index.tsx
│   │   └── about.tsx
│   ├── api/            # API routes
│   │   └── users.ts
│   ├── components/     # Reusable components
│   ├── layouts/        # Layout components
│   └── styles/         # Global styles
├── schema.movejs       # Database schema
├── movejs.config.ts    # Framework configuration
└── package.json
```

## 📚 Package Structure

| Package | Description |
|---------|-------------|
| [`@movejs/core`](packages/core) | Reactive signals, VDOM, component system |
| [`@movejs/compiler`](packages/compiler) | SWC-based compilation & optimization |
| [`@movejs/router`](packages/router) | File-based routing with SSR/SSG/ISR |
| [`@movejs/server`](packages/server) | HTTP server, API routes, middleware |
| [`@movejs/data`](packages/data) | Built-in ORM with query builder |
| [`@movejs/ai`](packages/ai) | Multi-provider AI integration |
| [`@movejs/seo`](packages/seo) | SEO meta, sitemaps, Core Web Vitals |
| [`@movejs/a11y`](packages/a11y) | Accessibility linting & fixes |
| [`@movejs/auth`](packages/auth) | Authentication with multiple providers |
| [`@movejs/ui`](packages/ui) | Accessible, optimized UI components |
| [`@movejs/cli`](packages/cli) | CLI tools for development & deployment |

## 🔧 Configuration

```typescript
// movejs.config.ts
import { defineConfig } from 'movejs';

export default defineConfig({
  render: 'hybrid',
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL
  },
  ai: {
    provider: 'openai',
    apiKey: process.env.AI_API_KEY
  },
  seo: {
    siteName: 'My MoveJS App',
    generateSitemap: true
  }
});
```

## 🧠 AI Features

```typescript
import { ai } from '@movejs/ai';

// Generate content
const blogPost = await ai.generate({
  prompt: 'Write a blog post about Web Components',
  system: 'You are a technical writer.'
});

// Generate SEO metadata
const seo = await ai.generateSEO({
  page: '/blog/post',
  content: blogPost,
  targetKeywords: ['web components', 'javascript']
});

// Semantic search
const results = await ai.search({
  query: 'How to implement auth',
  documents: knowledgeBase
});
```

## 🔒 Security Built-in

- CSRF protection
- Payload validation
- Rate limiting
- Security headers (Helmet)
- Secure session management
- Password hashing (PBKDF2)

## 🎯 Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Score | 95+ |
| LCP | < 2.5s |
| CLS | < 0.1 |
| FID | < 100ms |
| Bundle Size | < 50KB initial |

## 📄 License

MIT © MoveJS

## 🤝 Contributing

We welcome contributions! Please read our [contributing guidelines](CONTRIBUTING.md) first.

## 🌐 Documentation

Full documentation is available at [docs.movejs.dev](https://docs.movejs.dev)
