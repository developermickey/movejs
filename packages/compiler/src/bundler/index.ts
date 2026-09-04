import * as esbuild from 'esbuild';
import { resolve, dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { glob } from 'glob';

export interface BundlerOptions {
  /** Entry points */
  entryPoints: string[];
  /** Output directory */
  outdir: string;
  /** Bundle for browser */
  bundle: boolean;
  /** Target environment */
  target: string;
  /** Minify output */
  minify: boolean;
  /** Generate source maps */
  sourcemap: boolean;
  /** Output format */
  format: 'esm' | 'cjs';
  /** External dependencies */
  external: string[];
  /** Define global constants */
  define: Record<string, string>;
  /** Alias imports */
  alias: Record<string, string>;
  /** Platform */
  platform: 'browser' | 'node' | 'neutral';
}

export const defaultBundlerOptions: BundlerOptions = {
  entryPoints: [],
  outdir: './dist',
  bundle: true,
  target: 'es2022',
  minify: true,
  sourcemap: true,
  format: 'esm',
  external: [],
  define: {},
  alias: {},
  platform: 'browser'
};

// Main bundler class
export class MoveJSBundler {
  private options: BundlerOptions;
  private context: esbuild.BuildContext | null = null;

  constructor(options: Partial<BundlerOptions> = {}) {
    this.options = { ...defaultBundlerOptions, ...options };
  }

  // Build for production
  async build(): Promise<esbuild.BuildResult> {
    const result = await esbuild.build({
      entryPoints: this.options.entryPoints,
      outdir: this.options.outdir,
      bundle: this.options.bundle,
      target: this.options.target,
      minify: this.options.minify,
      sourcemap: this.options.sourcemap,
      format: this.options.format,
      external: this.options.external,
      define: this.options.define,
      alias: this.options.alias,
      platform: this.options.platform,
      metafile: true,
      treeShaking: true,
      splitting: this.options.format === 'esm',
      chunkNames: 'chunks/[name]-[hash]'
    });

    // Generate build manifest
    if (result.metafile) {
      this.generateManifest(result.metafile);
    }

    return result;
  }

  // Watch mode for development
  async watch(callback?: (result: esbuild.BuildResult) => void): Promise<void> {
    this.context = await esbuild.context({
      entryPoints: this.options.entryPoints,
      outdir: this.options.outdir,
      bundle: true,
      target: this.options.target,
      minify: false,
      sourcemap: true,
      format: this.options.format,
      external: this.options.external,
      define: this.options.define,
      alias: this.options.alias,
      platform: this.options.platform,
      metafile: true,
      banner: {
        js: '(() => { /* MoveJS Dev Mode */ })();'
      }
    });

    await this.context.watch();

    if (callback) {
      (this.context as any).onEnd(callback);
    }
  }

  // Stop watching
  async stop(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
  }

  // Generate build manifest
  private generateManifest(metafile: esbuild.Metafile): void {
    const manifest: Record<string, any> = {
      version: '0.1.0',
      timestamp: Date.now(),
      inputs: {},
      outputs: {}
    };

    for (const [path, input] of Object.entries(metafile.inputs)) {
      manifest.inputs[path] = {
        bytes: input.bytes,
        imports: input.imports.map(i => ({
          path: i.path,
          kind: i.kind
        }))
      };
    }

    for (const [path, output] of Object.entries(metafile.outputs)) {
      manifest.outputs[path] = {
        bytes: output.bytes,
        inputs: Object.keys(output.inputs),
        imports: output.imports.map(i => ({
          path: i.path,
          kind: i.kind
        })),
        entryPoint: output.entryPoint
      };
    }

    const manifestPath = join(this.options.outdir, 'manifest.json');
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

// Create browser bundle
export async function createBrowserBundle(
  entryPoints: string[],
  outdir: string
): Promise<void> {
  const bundler = new MoveJSBundler({
    entryPoints,
    outdir,
    bundle: true,
    target: 'es2022',
    minify: true,
    sourcemap: true,
    format: 'esm',
    platform: 'browser',
    external: [],
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  await bundler.build();
}

// Create server bundle
export async function createServerBundle(
  entryPoints: string[],
  outdir: string
): Promise<void> {
  const bundler = new MoveJSBundler({
    entryPoints,
    outdir,
    bundle: true,
    target: 'node18',
    minify: false,
    sourcemap: true,
    format: 'esm',
    platform: 'node',
    external: ['@movejs/core', 'react', 'react-dom']
  });

  await bundler.build();
}

// Create library bundle
export async function createLibraryBundle(
  entryPoints: string[],
  outdir: string,
  packageName: string
): Promise<void> {
  const bundler = new MoveJSBundler({
    entryPoints,
    outdir,
    bundle: false,
    target: 'es2022',
    minify: false,
    sourcemap: true,
    format: 'esm',
    platform: 'neutral',
    external: []
  });

  await bundler.build();

  // Generate package.json exports
  const exports = {
    '.': {
      import: `./dist/${packageName}.js`,
      types: `./dist/${packageName}.d.ts`
    }
  };

  writeFileSync(
    join(outdir, 'package.json'),
    JSON.stringify({ exports }, null, 2)
  );
}

// Analyze bundle size
export async function analyzeBundle(
  entryPoints: string[]
): Promise<BundleAnalysis> {
  const result = await esbuild.build({
    entryPoints,
    bundle: true,
    minify: true,
    write: false,
    metafile: true
  });

  const analysis: BundleAnalysis = {
    totalBytes: 0,
    files: [],
    dependencies: []
  };

  if (result.metafile) {
    for (const [path, output] of Object.entries(result.metafile.outputs)) {
      analysis.totalBytes += output.bytes;
      analysis.files.push({
        path,
        bytes: output.bytes,
        entryPoint: output.entryPoint
      });
    }
  }

  return analysis;
}

export interface BundleAnalysis {
  totalBytes: number;
  files: Array<{
    path: string;
    bytes: number;
    entryPoint?: string;
  }>;
  dependencies: string[];
}
