import * as swc from '@swc/core';
import type { Plugin, TransformResult } from '../types';

// JSX transform for MoveJS
// Converts JSX to createElement calls with reactive optimizations

export interface JSXTransformOptions {
  /** Import source for createElement */
  jsxImportSource?: string;
  /** Use automatic JSX runtime */
  automatic?: boolean;
  /** Development mode */
  development?: boolean;
  /** Enable source maps */
  sourceMaps?: boolean;
}

export const defaultJSXOptions: JSXTransformOptions = {
  jsxImportSource: '@movejs/core',
  automatic: true,
  development: false,
  sourceMaps: true
};

// Transform JSX in source code
export async function transformJSX(
  code: string,
  filename: string,
  options: JSXTransformOptions = defaultJSXOptions
): Promise<TransformResult> {
  const result = await swc.transform(code, {
    filename,
    sourceMaps: options.sourceMaps,
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
        decorators: true
      },
      transform: {
        react: {
          runtime: options.automatic ? 'automatic' : 'classic',
          pragma: 'createElement',
          pragmaFrag: 'Fragment',
          importSource: options.jsxImportSource
        }
      },
      target: 'es2022',
      loose: true
    },
    module: {
      type: 'es6'
    },
    isModule: true
  });

  return {
    code: result.code,
    map: result.map ? JSON.parse(result.map) : undefined
  };
}

// Plugin that applies JSX optimizations
export const jsxOptimizationPlugin: Plugin = {
  name: 'jsx-optimization',
  
  async transform(code: string, id: string): Promise<string | null> {
    if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) {
      return null;
    }

    const result = await transformJSX(code, id);
    return result.code;
  }
};

// JSX pragma replacement for classic runtime
export function replaceJSXPragmas(code: string): string {
  // Replace React.createElement with @movejs/core createElement
  code = code.replace(/React\.createElement/g, 'createElement');
  code = code.replace(/React\.Fragment/g, 'Fragment');
  
  return code;
}

// Extract JSX metadata for optimization
export function extractJSXMetadata(code: string): JSXMetadata {
  const componentNames = new Set<string>();
  const dynamicProps = new Set<string>();
  const staticProps = new Set<string>();

  // Simple AST analysis for common patterns
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  let match;
  
  while ((match = componentRegex.exec(code)) !== null) {
    componentNames.add(match[1]);
  }

  // Detect dynamic vs static props
  const propRegex = /(\w+)=["'{]/g;
  while ((match = propRegex.exec(code)) !== null) {
    if (match[0].endsWith('{')) {
      dynamicProps.add(match[1]);
    } else {
      staticProps.add(match[1]);
    }
  }

  return {
    componentNames: Array.from(componentNames),
    dynamicProps: Array.from(dynamicProps),
    staticProps: Array.from(staticProps)
  };
}

export interface JSXMetadata {
  componentNames: string[];
  dynamicProps: string[];
  staticProps: string[];
}
