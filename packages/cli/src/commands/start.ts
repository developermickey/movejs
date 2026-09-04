import { Command } from 'commander';
import { runMoveJS } from '../lib/runner';

// Start production server
export async function startCommand(options: any): Promise<void> {
  const { port = '3000', host = '0.0.0.0' } = options;

  try {
    await runMoveJS({
      port: parseInt(port),
      host,
      mode: 'production'
    });
  } catch (err) {
    console.error(`\n  ✖ ${(err as Error).message}\n`);
    process.exit(1);
  }
}