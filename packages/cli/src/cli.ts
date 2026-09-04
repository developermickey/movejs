import { argv } from 'process';
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

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
