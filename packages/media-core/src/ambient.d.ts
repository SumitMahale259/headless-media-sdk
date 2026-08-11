/**
 * media-core deliberately does NOT include the "DOM" lib in tsconfig — that's
 * what actually enforces "no document/window/localStorage in core", not just
 * a comment. But we do need `fetch`, `URL`, and `Response` (available as
 * globals in browsers, Node 18+, Cloudflare Workers, Deno, Bun — i.e.
 * everywhere this package is meant to run). Declare the minimal surface we
 * use so the compiler is happy without importing the whole browser API.
 */

declare function fetch(input: string | URL, init?: { headers?: Record<string, string> }): Promise<Response>;

declare class URL {
  constructor(url: string, base?: string | URL);
  searchParams: {
    set(name: string, value: string): void;
  };
  toString(): string;
}

declare interface Response {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

declare const console: { log(...args: unknown[]): void; error(...args: unknown[]): void };

