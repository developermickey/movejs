declare module 'glob' {
  interface GlobOptions {
    cwd?: string;
    root?: string;
    dot?: boolean;
    nodir?: boolean;
    ignore?: string | string[];
    absolute?: boolean;
    follow?: boolean;
    dotRelative?: boolean;
    matchBase?: boolean;
    nocase?: boolean;
    noext?: boolean;
    noglobstar?: boolean;
    silent?: boolean;
    stat?: boolean;
    statCache?: Record<string, any>;
    symlinks?: Record<string, boolean>;
    realpath?: boolean;
    nosort?: boolean;
    nounicode?: boolean;
    nounique?: boolean;
    nonull?: boolean;
    cache?: Record<string, any>;
    platform?: string;
  }

  interface Glob {
    (pattern: string, options?: GlobOptions): string[];
    (pattern: string, callback: (err: Error | null, matches: string[]) => void): void;
    (pattern: string, options: GlobOptions, callback: (err: Error | null, matches: string[]) => void): void;
    sync(pattern: string, options?: GlobOptions): string[];
    stream(pattern: string, options?: GlobOptions): NodeJS.ReadableStream;
    hasMagic(pattern: string, options?: GlobOptions): boolean;
  }

  const glob: Glob;
  export { glob };
}
