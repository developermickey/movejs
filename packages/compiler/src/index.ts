// MoveJS Compiler - SWC-based compilation with reactive optimizations

export { transformJSX, jsxOptimizationPlugin, extractJSXMetadata } from './transforms/jsx';
export type { JSXTransformOptions, JSXMetadata } from './transforms/jsx';

export { transformReactive, reactiveOptimizationPlugin, analyzeReactiveCode } from './transforms/reactive';
export type { ReactiveTransformOptions, ReactiveAnalysis } from './transforms/reactive';

export { transformSSR, ssrTransformPlugin, analyzeSSRRequirements, generateSSREntry } from './transforms/ssr';
export type { SSRTransformOptions, SSRAnalysis } from './transforms/ssr';

export { MoveJSBundler, createBrowserBundle, createServerBundle, createLibraryBundle, analyzeBundle } from './bundler';
export type { BundlerOptions, BundleAnalysis } from './bundler';

export type { Plugin, TransformResult, CompilerOptions, FileContext, CompilerContext } from './types';
export { defaultCompilerOptions, parseDirectives, isClientComponent, isServerComponent, isIsland } from './types';

import { transformJSX } from './transforms/jsx';
import { transformReactive } from './transforms/reactive';
import { transformSSR } from './transforms/ssr';
import { MoveJSBundler } from './bundler';
import { defaultCompilerOptions } from './types';
import type { CompilerOptions, TransformResult } from './types';

// Main compiler class
export class MoveJSCompiler {
  private options: CompilerOptions;
  private bundler: MoveJSBundler;

  constructor(options: Partial<CompilerOptions> = {}) {
    this.options = { ...defaultCompilerOptions, ...options };
    this.bundler = new MoveJSBundler();
  }

  // Compile a single file
  async compile(code: string, filename: string): Promise<TransformResult> {
    let result = { code };

    // Apply JSX transform
    if (this.options.jsx && (filename.endsWith('.tsx') || filename.endsWith('.jsx'))) {
      const jsxResult = await transformJSX(result.code, filename, {
        automatic: this.options.jsxRuntime === 'automatic',
        sourceMaps: this.options.sourceMaps
      });
      result.code = jsxResult.code;
    }

    // Apply reactive optimizations
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) {
      const reactiveResult = await transformReactive(result.code, filename, {
        fineGrained: true,
        inlineSignals: true,
        memoComponents: true
      });
      result.code = reactiveResult.code;
    }

    // Apply SSR transforms if needed
    if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
      const ssrResult = await transformSSR(result.code, filename, {
        streaming: true,
        hydration: true,
        selectiveHydration: true
      });
      result.code = ssrResult.code;
    }

    return result;
  }

  // Compile multiple files
  async compileAll(
    files: Array<{ code: string; filename: string }>
  ): Promise<TransformResult[]> {
    const results = await Promise.all(
      files.map(file => this.compile(file.code, file.filename))
    );
    return results;
  }
}

// Version
export const VERSION = '0.1.0';
