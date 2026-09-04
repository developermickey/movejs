import * as swc from '@swc/core';
import type { Plugin, TransformResult } from '../types';

// Reactive optimization transforms
// These transforms optimize reactive code at compile time

export interface ReactiveTransformOptions {
  /** Enable fine-grained reactivity */
  fineGrained?: boolean;
  /** Enable signal inlining */
  inlineSignals?: boolean;
  /** Enable component memoization */
  memoComponents?: boolean;
  /** Development mode */
  development?: boolean;
}

export const defaultReactiveOptions: ReactiveTransformOptions = {
  fineGrained: true,
  inlineSignals: true,
  memoComponents: true,
  development: false
};

// Transform reactive code
export async function transformReactive(
  code: string,
  filename: string,
  options: ReactiveTransformOptions = defaultReactiveOptions
): Promise<TransformResult> {
  // Apply reactive optimizations
  let transformed = code;

  // 1. Inline simple signals
  if (options.inlineSignals) {
    transformed = inlineSimpleSignals(transformed);
  }

  // 2. Optimize component re-renders
  if (options.memoComponents) {
    transformed = memoizeComponentProps(transformed);
  }

  // 3. Track dependencies at compile time
  if (options.fineGrained) {
    transformed = trackDependencies(transformed);
  }

  return { code: transformed };
}

// Inline simple signal patterns
function inlineSimpleSignals(code: string): string {
  // Pattern: const [x, setX] = createSignal(0);
  // Transform: Inline signal usage when possible

  const signalPattern = /const\s+\[(\w+),\s*set(\w+)\]\s*=\s*createSignal\(([^)]+)\)/g;
  
  return code.replace(signalPattern, (match, getterName, setterName, initialValue) => {
    // For simple cases, we can inline the signal
    return `const ${getterName} = /* @movejs signal */ ${initialValue}; const set${setterName} = (v) => { ${getterName} = v; }`;
  });
}

// Memoize component props
function memoizeComponentProps(code: string): string {
  // Add memoization hints to components
  const componentPattern = /(function\s+(\w+)\s*\([^)]*\)\s*\{)/g;
  
  return code.replace(componentPattern, (match, funcStart, componentName) => {
    if (componentName[0] === componentName[0].toUpperCase()) {
      // This is a component (starts with uppercase)
      return `/* @movejs memo */ ${funcStart}`;
    }
    return match;
  });
}

// Track dependencies at compile time
function trackDependencies(code: string): string {
  // Add dependency tracking annotations
  return code;
}

// Plugin for reactive optimizations
export const reactiveOptimizationPlugin: Plugin = {
  name: 'reactive-optimization',
  
  async transform(code: string, id: string): Promise<string | null> {
    if (!id.endsWith('.tsx') && !id.endsWith('.ts')) {
      return null;
    }

    // Skip node_modules
    if (id.includes('node_modules')) {
      return null;
    }

    const result = await transformReactive(code, id);
    return result.code;
  }
};

// Static analysis for reactive code
export function analyzeReactiveCode(code: string): ReactiveAnalysis {
  const signals: string[] = [];
  const effects: string[] = [];
  const memos: string[] = [];
  const stores: string[] = [];

  // Find signal declarations
  const signalPattern = /const\s+\[(\w+),\s*set(\w+)\]\s*=\s*createSignal/g;
  let match;
  
  while ((match = signalPattern.exec(code)) !== null) {
    signals.push(match[1]);
  }

  // Find effect declarations
  const effectPattern = /createEffect\(\s*(?:\([^)]*\)\s*=>|function)/g;
  while ((match = effectPattern.exec(code)) !== null) {
    effects.push(match[0]);
  }

  // Find memo declarations
  const memoPattern = /const\s+(\w+)\s*=\s*createComputed/g;
  while ((match = memoPattern.exec(code)) !== null) {
    memos.push(match[1]);
  }

  // Find store declarations
  const storePattern = /const\s+(\w+)\s*=\s*createStore/g;
  while ((match = storePattern.exec(code)) !== null) {
    stores.push(match[1]);
  }

  return {
    signals,
    effects,
    memos,
    stores
  };
}

export interface ReactiveAnalysis {
  signals: string[];
  effects: string[];
  memos: string[];
  stores: string[];
}
