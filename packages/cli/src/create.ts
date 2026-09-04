// MoveJS CLI - create-movejs entry point
import { createProjectFromTemplate } from './templates/project';
import { mkdir } from 'fs/promises';
import { argv } from 'process';

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

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
