## Current goal
None. Suggested next: the Identity user store for AppUser in Data/ (IUserStore, IUserPasswordStore, IUserEmailStore, IUserSecurityStampStore, IUserLockoutStore) over AppDbContext. Carry over:
- FindByEmailAsync: cross-partition query on NormalizedEmail, with the comment: if the app grows, replace with an email → user id lookup document (point read; also enforces unique emails, which Cosmos unique keys can't since pk is /id).
- UpdateAsync: don't regenerate ConcurrencyStamp (it's the _etag); catch DbUpdateConcurrencyException → IdentityResult.Failed(ErrorDescriber.ConcurrencyFailure()).
- Async only (EF Cosmos throws on sync I/O); pass CancellationToken through.
- Tests: round-trip save/load by id against the emulator, and a stale-stamp update that fails with a concurrency error.

## Learned / to revisit
- Cosmos partitioning: partition key = shard key; point read (id + pk) is cheapest; queries without pk fan out; transactions only within one logical partition; 20 GB per logical partition; hierarchical keys exist.
- Physical partitions are shards (each a 4-replica set); regions are full copies. Throughput splits evenly across physical partitions → beware hot keys.
- C# uses `:` not `extends`; redeclaring inherited props hides them (CS0108/CS0114) — only add what's new.
- `sealed` as the default for classes not designed for inheritance (CA1852, JIT devirtualization).
- DateTimeOffset + TimeProvider over DateTime.Now; Cosmos `_ts` already tracks last-modified.
- `required` (C# 11) + `init` (C# 9): set once at creation; compile-time only, EF materialization unaffected; `[SetsRequiredMembers]` for ctors.
- Properties vs fields; C# 14 `field` keyword.
- Object initializers (C# 3) and relatives: index initializers, target-typed new, `with`, collection expressions (C# 12).
- TimeProvider (.NET 8) + FakeTimeProvider.Advance for tests; DI can't reach `new`, so the creator supplies "now".
- DbContextOptions<T> is generic so each context gets its own options in DI; one base class, then interfaces.
- Optimistic concurrency on Cosmos = _etag + If-Match (412 → DbUpdateConcurrencyException); tutorial IsConcurrencyToken() on ConcurrencyStamp doesn't carry over (EF Cosmos validator rejects it: NonETagConcurrencyToken).
- Plain DbContext: no base.OnModelCreating needed (tutorials use IdentityDbContext, which does need it).
- Tested on the emulator (EF Cosmos 10.0.13): a missing JSON field loads as default(T) silently; property initializers are overwritten (int = 5 → 0); non-nullable string → null. Properties are stored PascalCase ("CreatedAt"), except id and $type → future partition key paths like /UserId. Rule for new properties: nullable or backfill.
- EF Cosmos on the Aspire emulator: Gateway mode; container names and partition key paths are case-sensitive and must match the EF mapping (model tests guard this).
- Tests run on Microsoft.Testing.Platform: `dotnet test --project GameCompanion.Api.Tests` (global.json opts in; .NET 10 SDK refuses VSTest with xUnit v3).
- To revisit: AppDbContext isn't sealed (optional).
- To revisit: when a second entity is mapped, move each mapping into its own IEntityTypeConfiguration<T> class in Data/ and use ApplyConfigurationsFromAssembly.

## Done
- 2026-10-24: AppUser : IdentityUser mapped to Cosmos (Users container, pk /id, ConcurrencyStamp = _etag), AppDbContext registered, container in AppHost, model tests.
