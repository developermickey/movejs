import { Command } from 'commander';

// AI commands
export function aiCommand(): Command {
  const ai = new Command('ai');

  ai
    .command('generate')
    .description('Generate code/content with AI')
    .option('-t, --type <type>', 'Type: code, component, content, seo')
    .option('-p, --prompt <prompt>', 'Description of what to generate')
    .action(async (options: any) => {
      const { type = 'code', prompt } = options;

      if (!prompt) {
        console.error('Please provide a prompt: movejs ai generate -p "your request"');
        return;
      }

      console.log(`Generating ${type}...`);
      
      // Stub: call AI provider
      console.log(`Prompt: ${prompt}`);
      console.log('(AI generation requires an API key configured in .env)');
    });

  ai
    .command('optimize')
    .description('Optimize code with AI')
    .action(async () => {
      console.log('Analyzing and optimizing code...');
      // Stub
    });

  return ai;
}
