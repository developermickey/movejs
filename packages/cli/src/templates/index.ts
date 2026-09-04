export { createProjectFromTemplate } from './project';

export async function createProject(options: {
  directory: string;
  template?: string;
  useTypeScript?: boolean;
  packageManager?: string;
  git?: boolean;
  install?: boolean;
}): Promise<void> {
  const { createProjectFromTemplate } = await import('./project');
  await createProjectFromTemplate(options);
}