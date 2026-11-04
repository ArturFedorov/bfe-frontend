/**
 * ReadableStream<Uint8Array> helpers for jsdom tests.
 * jest-environment-jsdom 29 does not expose ReadableStream / TextEncoder /
 * TextDecoder as globals, so we pull them from Node and install them.
 */
import { ReadableStream as NodeReadableStream } from 'node:stream/web';
import {
  TextDecoder as NodeTextDecoder,
  TextEncoder as NodeTextEncoder,
} from 'node:util';

export function installStreamGlobals(): void {
  const g = globalThis as Record<string, unknown>;
  if (typeof g.ReadableStream === 'undefined')
    g.ReadableStream = NodeReadableStream;
  if (typeof g.TextEncoder === 'undefined') g.TextEncoder = NodeTextEncoder;
  if (typeof g.TextDecoder === 'undefined') g.TextDecoder = NodeTextDecoder;
}

installStreamGlobals();

const encoder = new NodeTextEncoder();

export function encode(text: string): Uint8Array {
  return encoder.encode(text);
}

/** A finished stream that yields the given chunks (strings are UTF-8 encoded) in order. */
export function streamFromChunks(
  chunks: Array<string | Uint8Array>,
): ReadableStream<Uint8Array> {
  let i = 0;
  return new (globalThis as any).ReadableStream({
    pull(controller: ReadableStreamDefaultController<Uint8Array>) {
      if (i >= chunks.length) {
        controller.close();
        return;
      }
      const c = chunks[i++];
      controller.enqueue(typeof c === 'string' ? encode(c) : c);
    },
  }) as ReadableStream<Uint8Array>;
}

export interface ControllableStream {
  stream: ReadableStream<Uint8Array>;
  /** Enqueue a chunk (string is UTF-8 encoded). */
  push: (chunk: string | Uint8Array) => void;
  /** Close the stream normally. */
  end: () => void;
  /** Error the stream. */
  fail: (error: unknown) => void;
}

/** A stream the test drives chunk by chunk. */
export function controllableStream(): ControllableStream {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new (globalThis as any).ReadableStream({
    start(c: ReadableStreamDefaultController<Uint8Array>) {
      controller = c;
    },
  }) as ReadableStream<Uint8Array>;
  return {
    stream,
    push: (chunk) =>
      controller.enqueue(typeof chunk === 'string' ? encode(chunk) : chunk),
    end: () => controller.close(),
    fail: (error) => controller.error(error),
  };
}

/** Split a UTF-8 byte array at arbitrary byte offsets (to simulate mid-character chunking). */
export function splitBytes(
  bytes: Uint8Array,
  ...offsets: number[]
): Uint8Array[] {
  const out: Uint8Array[] = [];
  let start = 0;
  for (const off of [...offsets, bytes.length]) {
    out.push(bytes.slice(start, off));
    start = off;
  }
  return out;
}
