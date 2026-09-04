// Compiler types for MoveJS

export interface Plugin {
  name: string;
  transform?(code: string, id: string): Promise<string | null> | string | null;
  load?(id: string): Promise<string | null> | string | null;
  resolveId?(id: string, importer?: string): Promise<string | null> | string | null;
}

export interface TransformResult {
  code: string;
  map?: {
    version: number;
    sources: string[];
    names: string[];
    mappings: string;
    file?: string;
    sourcesContent?: string[];
  };
}

export interface CompilerOptions {
  /** Target environment */
  target: 'es5' | 'es2015' | 'es2017' | 'es2020' | 'es2022';
  /** Enable JSX */
  jsx: boolean;
  /** JSX runtime */
  jsxRuntime: 'classic' | 'automatic';
  /** JSX import source */
  jsxImportSource: string;
  /** Enable TypeScript */
  typescript: boolean;
  /** Enable decorators */
  decorators: boolean;
  /** Enable source maps */
  sourceMaps: boolean;
  /** Minify output */
  minify: boolean;
  /** Enable tree shaking */
  treeShaking: boolean;
  /** Enable code splitting */
  codeSplitting: boolean;
  /** Output format */
  format: 'esm' | 'cjs' | 'iife';
  /** Target platform */
  platform: 'browser' | 'node' | 'neutral';
}

export const defaultCompilerOptions: CompilerOptions = {
  target: 'es2022',
  jsx: true,
  jsxRuntime: 'automatic',
  jsxImportSource: '@movejs/core',
  typescript: true,
  decorators: true,
  sourceMaps: true,
  minify: true,
  treeShaking: true,
  codeSplitting: true,
  format: 'esm',
  platform: 'browser'
};

export interface FileContext {
  id: string;
  code: string;
  map?: string;
  ast?: any;
  meta: Record<string, any>;
}

export interface CompilerContext {
  files: Map<string, FileContext>;
  options: CompilerOptions;
  plugins: Plugin[];
  warnings: CompilerWarning[];
  errors: CompilerError[];
}

export interface CompilerWarning {
  message: string;
  line?: number;
  column?: number;
  file?: string;
}

export interface CompilerError {
  message: string;
  line?: number;
  column?: number;
  file?: string;
  stack?: string;
}

// Directive types
export type Directive = 
  | 'use client'
  | 'use server'
  | 'use strict'
  | 'use memo'
  | 'use island';

// Parse directives from source code
export function parseDirectives(code: string): Directive[] {
  const directives: Directive[] = [];
  const directivePattern = /^['"]use\s+(client|server|strict|memo|island)['"]/gm;
  
  let match;
  while ((match = directivePattern.exec(code)) !== null) {
    directives.push(`use ${match[1]}` as Directive);
  }
  
  return directives;
}

// Check if file is a client component
export function isClientComponent(code: string): boolean {
  return code.includes("'use client'") || code.includes('"use client"');
}

// Check if file is a server component
export function isServerComponent(code: string): boolean {
  return code.includes("'use server'") || code.includes('"use server"');
}

// Check if file is an island
export function isIsland(code: string): boolean {
  return code.includes("'use island'") || code.includes('"use island"') ||
         code.includes("'use client'") || code.includes('"use client"');
}
