import { Command } from 'commander';
import { buildApp } from '../lib/runner';

// Build command
export async function buildCommand(options: any): Promise<void> {
  const { output = '.movejs', analyze = false, minify = true, ssg = false } = options;

  console.log(`
  🔨 Building MoveJS project
  ──────────────────────────
  ${analyze ? '📊 Bundle analysis enabled' : ''}
  ${minify ? '🗜️ Minification enabled' : ''}
  ${ssg ? '⚡ Static generation enabled (beta)' : ''}
  `);

  try {
    const result = await buildApp({
      output,
      minify: !!minify
    });

    console.log(`  📦 Output: ${result.output}`);
    console.log(`  🗂️  Routes: ${result.routes.length}`);
    console.log('✅ Build complete');
  } catch (err) {
    console.error(`\n  ✖ ${(err as Error).message}\n`);
    process.exit(1);
  }
}