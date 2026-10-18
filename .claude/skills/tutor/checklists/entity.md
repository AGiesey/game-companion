# Entity / domain type checklist

1. **Shape** — record vs class chosen deliberately (immutable data → record). File-scoped namespace.
2. **Required members** — `required` for properties that must be set; nullable annotations accurate.
3. **Identity and partitioning** — an id, and the partition key (user id) where it's stored in Cosmos.
4. **Invariants** — rules that must always hold are enforced in one place, not scattered.
5. **EF Core mapping** — container, partition key, owned/complex types and any vector or full-text properties configured in the model, not ad hoc.
6. **Evolution** — new properties have sensible defaults so older documents still load.
7. **Terms** — named with the plan's terms (run, conversation, run journal, game knowledge, Lore So Far).
8. **Test** — invariants covered by a test.
