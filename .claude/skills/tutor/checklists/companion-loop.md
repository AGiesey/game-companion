# Companion turn loop checklist

1. **Inputs gathered** — the run (character, progress), recent conversation, relevant run journal entries and game knowledge retrieved for this turn.
2. **Spoiler boundary** — what the player has reached is known before building the prompt; nothing past it is included.
3. **Prompt built** — the companion persona and rules, plus the turn's context, assembled in one place that's easy to read and test.
4. **Model call** — `IChatClient` (Microsoft.Extensions.AI, backed by Azure OpenAI) with the right model, options, limits and tools declared.
5. **Tool-use loop** — tool calls executed and results fed back until the model finishes, with a cap on iterations.
6. **Spoiler check on the answer** — the reply is checked against progress; if it would cross the line, warn and offer a hint instead.
7. **Streaming** — tokens streamed to the client as `IAsyncEnumerable` via Server-Sent Events, honoring cancellation.
8. **Persistence** — the turn saved to the conversation; any proposed game knowledge or run journal entries recorded for review.
9. **Observability** — tokens, latency and tool calls visible in the Aspire dashboard.
10. **Tests** — prompt building and the spoiler check covered; the model call faked.
