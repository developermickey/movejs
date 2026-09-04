import { mkdir, writeFile, access } from 'fs/promises';
import { join } from 'path';
import { execa } from 'execa';
import { fileURLToPath } from 'url';

interface CreateProjectOptions {
  directory: string;
  template: string;
  useTypeScript: boolean;
  packageManager: string;
  git: boolean;
  install: boolean;
}

// Create a project from template
export async function createProjectFromTemplate(options: CreateProjectOptions): Promise<void> {
  const { directory, useTypeScript, packageManager, git, install } = options;
  const ext = useTypeScript ? 'tsx' : 'jsx';

  // Create directory
  await mkdir(directory, { recursive: true });

  // Create app structure
  const dirs = ['app/pages', 'app/api', 'app/components', 'app/layouts', 'app/styles', 'public'];
  for (const dir of dirs) {
    await mkdir(join(directory, dir), { recursive: true });
  }

  // package.json
  await writeFile(
    join(directory, 'package.json'),
    JSON.stringify({
      name: directory,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'movejs dev',
        build: 'movejs build',
        start: 'movejs start',
        'db:migrate': 'movejs db migrate',
        'ai:generate': 'movejs ai generate'
      },
      dependencies: {
        '@movejs/core': '^0.1.0',
        '@movejs/router': '^0.1.0',
        '@movejs/server': '^0.1.0',
        '@movejs/data': '^0.1.0',
        '@movejs/ai': '^0.1.0',
        '@movejs/auth': '^0.1.0',
        '@movejs/seo': '^0.1.0',
        '@movejs/a11y': '^0.1.0',
        '@movejs/ui': '^0.1.0'
      },
      devDependencies: {
        '@movejs/cli': '^0.1.0',
        typescript: '^5.4.0',
        '@types/node': '^20.0.0'
      }
    }, null, 2),
    'utf-8'
  );

  // movejs.config
  await writeFile(
    join(directory, 'movejs.config.ts'),
    DEFAULT_CONFIG,
    'utf-8'
  );

  // tsconfig
  await writeFile(
    join(directory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        jsx: 'react-jsx',
        jsxImportSource: '@movejs/core',
        esModuleInterop: true
      }
    }, null, 2),
    'utf-8'
  );

  // Index page
  await writeFile(
    join(directory, 'app', 'pages', `index.${ext}`),
    INDEX_PAGE,
    'utf-8'
  );

  // About page (linked from the default layout)
  await writeFile(
    join(directory, 'app', 'pages', `about.${ext}`),
    ABOUT_PAGE,
    'utf-8'
  );

  // API route
  await writeFile(
    join(directory, 'app', 'api', 'hello.ts'),
    API_ROUTE,
    'utf-8'
  );

  // App layout
  await writeFile(
    join(directory, 'app', 'layouts', `default.${ext}`),
    LAYOUT,
    'utf-8'
  );

  // Global styles
  await writeFile(
    join(directory, 'app', 'styles', 'global.css'),
    GLOBAL_CSS,
    'utf-8'
  );

  // .gitignore
  await writeFile(
    join(directory, '.gitignore'),
    GITIGNORE,
    'utf-8'
  );

  // .env.example
  await writeFile(
    join(directory, '.env.example'),
    `# MoveJS Environment Configuration
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# AI
AI_PROVIDER=openai
AI_API_KEY=
AI_MODEL=gpt-4o

# Authentication
MOVEJS_SECRET=change-this-in-production
`,
    'utf-8'
  );

  console.log('✅ Project structure created!');

  // Initialize git
  if (git) {
    try {
      await execa('git', ['init'], { cwd: directory });
      console.log('✅ Git initialized');
    } catch {
      // Git not available
    }
  }

  // Install dependencies
  if (install) {
    console.log(`\n📦 Installing dependencies with ${packageManager}...\n`);
    try {
      await execa(packageManager, ['install'], { cwd: directory, stdio: 'inherit' });
      console.log('✅ Dependencies installed');
    } catch (error) {
      console.error('Failed to install dependencies:', error);
    }
  }

  console.log(`
🎉 MoveJS project created successfully!

Next steps:
  cd ${directory}
  ${packageManager} run dev

Visit http://localhost:3000 to see your app.
`);
}

const DEFAULT_CONFIG = `export default {
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
};
`;

const INDEX_PAGE = `import { createSignal } from '@movejs/core';

export const config = {
  render: 'ssr',
  seo: {
    title: 'Welcome to MoveJS',
    description: 'A fast, secure, full-stack JavaScript framework'
  }
};

export default function IndexPage() {
  const [count, setCount] = createSignal(0);

  return (
    <main>
      <h1>Welcome to MoveJS 🚀</h1>
      <p>A fast, secure, full-stack JavaScript framework</p>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count()}
      </button>
    </main>
  );
}
`;

const ABOUT_PAGE = `export const config = {
  render: 'ssr',
  seo: {
    title: 'About | My MoveJS App',
    description: 'About this MoveJS app'
  }
};

export default function AboutPage() {
  return (
    <main>
      <h1>About</h1>
      <p>This page was scaffolded by create-movejs.</p>
    </main>
  );
}
`;

const API_ROUTE = `export async function GET(req: any) {
  return Response.json({
    name: 'MoveJS',
    message: 'Hello from the MoveJS API!',
    timestamp: new Date().toISOString()
  });
}
`;

const LAYOUT = `export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
        </nav>
      </header>
      {children}
    </div>
  );
}
`;

const GLOBAL_CSS = `:root {
  --movejs-bg: #ffffff;
  --movejs-text: #1a1a1a;
  --movejs-primary: #6366f1;
  --movejs-border: #e5e7eb;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--movejs-bg);
  color: var(--movejs-text);
  line-height: 1.6;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: #f9fafb;
  border-bottom: 1px solid var(--movejs-border);
  padding: 1rem 2rem;
}

nav {
  display: flex;
  gap: 1.5rem;
}

nav a {
  color: var(--movejs-primary);
  text-decoration: none;
  font-weight: 500;
}

main {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 1rem;
}

button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--movejs-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  opacity: 0.9;
}

button:focus-visible {
  outline: 2px solid var(--movejs-primary);
  outline-offset: 2px;
}
`;

const GITIGNORE = `# dependencies
node_modules/

# build output
.movejs/
dist/
.next/
out/

# environment
.env
.env.local
.env.*.local

# database
*.db
*.sqlite

# logs
logs/
*.log
npm-debug.log*

# misc
.DS_Store
.vscode/
.idea/
`;
