import { Command } from 'commander';
import { createApp } from './create';
import { devCommand } from './dev';
import { buildCommand } from './build';
import { startCommand } from './start';
import { dbCommand } from './db';
import { aiCommand } from './ai';

// Create the CLI program
export function createProgram(): Command {
  const program = new Command();

  program
    .name('movejs')
    .description('MoveJS - Full-stack JavaScript framework CLI')
    .version('0.1.0')
    .usage('<command> [options]');

  // Create new project
  program
    .command('create [directory]')
    .alias('new')
    .description('Create a new MoveJS project')
    .option('-t, --template <template>', 'Project template (default, api, ai, blog, fullstack)')
    .option('-ts, --typescript', 'Use TypeScript')
    .option('--no-ts', 'Use JavaScript instead of TypeScript')
    .option('-p, --package-manager <manager>', 'Package manager (npm, yarn, pnpm, bun)')
    .option('--git', 'Initialize git repository')
    .option('--no-install', 'Skip installing dependencies')
    .action(createApp);

  // Development server
  program
    .command('dev')
    .alias('develop')
    .description('Start the development server')
    .option('-p, --port <port>', 'Port to listen on', '3000')
    .option('-h, --host <host>', 'Host to bind to', 'localhost')
    .option('--turbo', 'Enable turbo mode for faster development')
    .option('--https', 'Enable HTTPS')
    .option('--open', 'Open browser on startup')
    .action(devCommand);

  // Build project
  program
    .command('build')
    .description('Build the project for production')
    .option('-o, --output <dir>', 'Output directory', '.movejs')
    .option('--analyze', 'Analyze bundle size')
    .option('--no-minify', 'Don\'t minify output')
    .option('--ssg', 'Pre-render all pages for static export')
    .action(buildCommand);

  // Start production server
  program
    .command('start')
    .description('Start the production server')
    .option('-p, --port <port>', 'Port to listen on', '3000')
    .option('--host <host>', 'Host to bind to', '0.0.0.0')
    .action(startCommand);

  // Database commands
  program
    .command('db')
    .description('Database operations')
    .addCommand(dbCommand());

  // AI commands
  program
    .command('ai')
    .description('AI operations')
    .addCommand(aiCommand());

  // Other commands
  program
    .command('generate <type> [name]')
    .alias('g')
    .description('Generate a new file (page, component, api, model)')
    .option('-t, --type <type>', 'Type of file to generate')
    .action((type: string, name: string, options: any) => {
      console.log(`Generated ${type} ${name || ''}`);
    });

  // Version command
  program
    .command('version')
    .description('Show version information')
    .action(() => {
      console.log(`MoveJS v0.1.0`);
    });

  return program;
}
