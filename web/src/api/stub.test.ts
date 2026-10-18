import { beforeAll, describe, expect, it } from 'vitest'
import { setStubDelays, stub, stubStream } from './stub.ts'

beforeAll(() => {
  setStubDelays({ valueMs: 0, chunkMs: 0 })
})

describe('stub', () => {
  it('resolves with its data', async () => {
    await expect(stub({ id: 'run-1', name: "Vaela's Run" })).resolves.toEqual({ id: 'run-1', name: "Vaela's Run" })
  })

  it('rejects with an AbortError when cancelled', async () => {
    const controller = new AbortController()
    const pending = stub('data', { signal: controller.signal, delayMs: 1000 })
    controller.abort()

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('stubStream', () => {
  it('yields every chunk in order', async () => {
    const received: string[] = []
    for await (const chunk of stubStream(['Nice, ', 'that second ', 'phase is a lot.'])) {
      received.push(chunk)
    }

    expect(received).toEqual(['Nice, ', 'that second ', 'phase is a lot.'])
  })

  it('stops early when cancelled', async () => {
    const controller = new AbortController()
    const received: string[] = []
    for await (const chunk of stubStream(['one', 'two', 'three'], { signal: controller.signal })) {
      received.push(chunk)
      controller.abort()
    }

    expect(received).toEqual(['one'])
  })
})
