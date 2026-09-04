declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: Record<string, any>);
    readonly window: {
      document: Document;
      [key: string]: any;
    };
  }
}