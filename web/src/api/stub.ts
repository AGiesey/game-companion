// Helpers for stub API functions: stand-ins for endpoints the developer hasn't built yet.
// See README.md in this folder for the convention.

const delays = { valueMs: 400, chunkMs: 40 }

// Tests set both to 0 so stubs resolve immediately.
export function setStubDelays(next: Partial<typeof delays>): void {
  Object.assign(delays, next)
}

export interface StubOptions {
  signal?: AbortSignal
  delayMs?: number
}

// Resolves with data after a delay, like a real request. Rejects with the abort reason if cancelled, as fetch does.
export async function stub<T>(data: T, { signal, delayMs = delays.valueMs }: StubOptions = {}): Promise<T> {
  await wait(delayMs, signal)
  return data
}

// Yields each chunk after a delay, like a streamed response. Stops early if cancelled.
export async function* stubStream(
  chunks: readonly string[],
  { signal, delayMs = delays.chunkMs }: StubOptions = {},
): AsyncGenerator<string> {
  for (const chunk of chunks) {
    try {
      await wait(delayMs, signal)
    } catch {
      return
    }
    yield chunk
  }
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted()
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
