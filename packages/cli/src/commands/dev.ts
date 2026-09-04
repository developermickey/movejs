import { Command } from 'commander';
import { runMoveJS } from '../lib/runner';

// Dev command - start the development server
export async function devCommand(options: any): Promise<void> {
  const { port = '3000', host = 'localhost', open = false } = options;

  try {
    await runMoveJS({
      port: parseInt(port),
      host,
      mode: 'dev'
    });
  } catch (err) {
    console.error(`\n  ✖ ${(err as Error).message}\n`);
    process.exit(1);
  }
}