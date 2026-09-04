import type { Plugin, TransformResult } from '../types';

// SSR Transform for MoveJS
// Transforms components for server-side rendering

export interface SSRTransformOptions {
  /** Enable streaming SSR */
  streaming?: boolean;
  /** Enable hydration markers */
  hydration?: boolean;
  /** Enable selective hydration */
  selectiveHydration?: boolean;
  /** Enable island architecture */
  islands?: boolean;
  /** Development mode */
  development?: boolean;
}

export const defaultSSROptions: SSRTransformOptions = {
  streaming: true,
  hydration: true,
  selectiveHydration: true,
  islands: false,
  development: false
};

// Transform for SSR
export async function transformSSR(
  code: string,
  filename: string,
  options: SSRTransformOptions = defaultSSROptions
): Promise<TransformResult> {
  let transformed = code;

  // Add hydration markers
  if (options.hydration) {
    transformed = addHydrationMarkers(transformed);
  }

  // Add streaming markers
  if (options.streaming) {
    transformed = addStreamingMarkers(transformed);
  }

  // Mark islands (client-only components)
  if (options.islands) {
    transformed = markIslands(transformed);
  }

  return { code: transformed };
}

// Add hydration markers to components
function addHydrationMarkers(code: string): string {
  // Add data-movejs-hydration attribute markers
  const componentPattern = /<([A-Z][a-zA-Z0-9]*)\s/g;
  
  return code.replace(componentPattern, (match, componentName) => {
    return `<${componentName} data-movejs-hydration="pending" `;
  });
}

// Add streaming markers
function addStreamingMarkers(code: string): string {
  // Add suspense boundaries for streaming
  return code.replace(
    /<Suspense\s+fallback={([^}]+)}>/g,
    '<Suspense fallback={$1} data-movejs-stream="true">'
  );
}

// Mark islands (client-only components)
function markIslands(code: string): string {
  // Add 'use client' directive for island architecture
  if (code.includes("'use client'") || code.includes('"use client"')) {
    return `/* @movejs island */ ${code}`;
  }
  return code;
}

// Plugin for SSR transforms
export const ssrTransformPlugin: Plugin = {
  name: 'ssr-transform',
  
  async transform(code: string, id: string): Promise<string | null> {
    // Only transform components, not utilities
    if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) {
      return null;
    }

    const result = await transformSSR(code, id);
    return result.code;
  }
};

// Analyze SSR requirements
export function analyzeSSRRequirements(code: string): SSRAnalysis {
  const hasSuspense = code.includes('Suspense');
  const hasLazy = code.includes('lazy(') || code.includes('Lazy(');
  const hasStream = code.includes('data-movejs-stream');
  const hasIsland = code.includes("'use client'") || code.includes('"use client"');
  const hasErrorBoundary = code.includes('ErrorBoundary');

  return {
    hasSuspense,
    hasLazy,
    hasStream,
    hasIsland,
    hasErrorBoundary,
    needsStreaming: hasSuspense || hasLazy,
    needsSelectiveHydration: hasIsland
  };
}

export interface SSRAnalysis {
  hasSuspense: boolean;
  hasLazy: boolean;
  hasStream: boolean;
  hasIsland: boolean;
  hasErrorBoundary: boolean;
  needsStreaming: boolean;
  needsSelectiveHydration: boolean;
}

// Generate SSR entry point
export function generateSSREntry(
  componentName: string,
  props: Record<string, any> = {}
): string {
  return `
import { ${componentName} } from './${componentName}';
import { renderToString } from '@movejs/core/server';

export default async function SSR() {
  const html = renderToString(
    <${componentName} {...${JSON.stringify(props)}} />
  );
  
  return {
    html,
    head: {
      title: '${componentName}',
      meta: []
    }
  };
}
`;
}
