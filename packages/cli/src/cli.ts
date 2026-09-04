import { argv } from 'process';
import { realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { createProgram } from './commands';

// CLI entry point
export async function main(): Promise<void> {
  const program = createProgram();
  
  try {
    await program.parseAsync(argv);
  } catch (error) {
    console.error('MoveJS CLI error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
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
