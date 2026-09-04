import { Command } from 'commander';

// Create a new project
export async function createApp(directory: string, options: any): Promise<void> {
  const dir = directory || 'my-movejs-app';
  
  console.log(`\n🚀 Creating MoveJS app in "${dir}"...\n`);

  // Determine TypeScript
  const useTypeScript = options.typescript !== false;

  // Determine template
  const template = options.template || 'default';

  const config = {
    directory: dir,
    template,
    useTypeScript,
    packageManager: options.packageManager || 'npm',
    git: options.git,
    install: options.install !== false
  };

  // Import template creator
  const { createProject } = await import('../templates');
  await createProject(config);
}
