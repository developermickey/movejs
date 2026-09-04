// MoveJS CLI - create-movejs entry point
import { createProjectFromTemplate } from './templates/project';
import { mkdir } from 'fs/promises';
import { argv } from 'process';
import { realpathSync } from 'fs';
import { fileURLToPath } from 'url';

export async function main(): Promise<void> {
  const args = argv.slice(2);
  const directory = args[0] || 'my-movejs-app';

  console.log(`
  🚀 MoveJS Project Creator
  ─────────────────────────
  `);

  await mkdir(directory, { recursive: true }).catch(() => {});

  await createProjectFromTemplate({
    directory,
    template: 'default',
    useTypeScript: true,
    packageManager: 'npm',
    git: true,
    install: false
  });
}

// Run if this is the main module (compare real paths so symlinked bins work)
function isMainModule(): boolean {
  if (!process.argv[1]) return false;
  try {
    const entry = realpathSync(process.argv[1]);
    return fileURLToPath(import.meta.url) === entry;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main();
}
