## Current goal
Working style (developer asked, 2026-10-25): Claude writes skeletons (signatures + TODO comments, no implementations), developer fills them in, Claude reviews.
RunsController (checklist: endpoint), developer writes it: list, create (request DTO with [Required] [MaxLength(Run.MaxNameLength)] + known-game check), get, record opened; [Authorize], user id from the cookie, 404 for null/false, CancellationToken. Then swap the runs.ts stubs and mark the 004-runs needs done.

## Learned / to revisit
- `new Guid()` is Guid.Empty (all zeros); `Guid.NewGuid()` makes a new one. xUnit makes a new test-class instance per test, so an instance field is fresh per test.
- FakeTimeProvider: package Microsoft.Extensions.TimeProvider.Testing, namespace Microsoft.Extensions.Time.Testing. Read back through a new context to hit Cosmos, not the change tracker.
- ValueTask<T> (struct, .NET Core 2.1): no allocation when the result is synchronous (FindAsync hits the change tracker); await once only, .AsTask() to store. Task stays the default.
- FindAsync key values go in key order: (Id, UserId) → [runId, userId]; the wrong order compiles and silently returns null.
- Attributes decorate declarations only; [LoggerMessage] sits directly above its partial method, and you call the method from the code.
- Guid.CreateVersion7(timestamp) (.NET 9): time-ordered GUIDs. `[.. list]` spread (C# 12) to build a list from a sequence.
- EF Cosmos (EF 9+) blocks sync I/O: always ToListAsync etc. Cosmos ORDER BY takes plain paths only (no ??), so sort small results in memory.
- .NET 10 ships System.Linq.AsyncEnumerable in the BCL; without `using Microsoft.EntityFrameworkCore;` ToListAsync binds to that and fails (CS0411) on a DbSet.
- `partial`: generated half + your half; `partial` goes right before `class`; [LoggerMessage] methods are declarations only.
- Games registry: `const` (implicitly static) + `FrozenSet<string>` (.NET 8, System.Collections.Frozen; not an implicit using) via `.ToFrozenSet()`; collection expressions don't build FrozenSet. Default string comparer is ordinal.
- `sealed` = can't be inherited (Java final class), not immutability; immutability is init/readonly/records. CA1852 only flags internal types.
- AnalysisLevel latest-recommended: CA1725 (param names match base) is off, so renaming Configure's `builder` is fine.
- UseETagConcurrency(): shadow _etag, If-Match on save, 412 → DbUpdateConcurrencyException; real property + IsETagConcurrency() if the client must send it back.
- `required string?`: the creator must set it, even to null (explicit "no theme"). Empty primary ctor `class Run()` adds nothing.
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
- Tests run on Microsoft.Testing.Platform (global.json opts in; .NET 10 SDK refuses VSTest with xUnit v3). Unit tests: `dotnet test --project GameCompanion.Api.Tests`; emulator/API tests: `GameCompanion.Api.IntegrationTests`.
- Store getters/setters only touch the in-memory user; find methods fetch, Create/Update/Delete save; EF change tracking in the scoped AppDbContext links them.
- FindAsync = lookup by primary key only; returns ValueTask. Expression-bodied member ≠ lambda.
- async/await go together; try/catch only catches awaited calls; interface signatures are fixed, dependencies go on the class (primary ctor).
- FindAsync(key, token) compiles but treats the token as a second key (params object[]); use FindAsync([key], token).
- Identity registration: AddIdentityCore (not AddIdentity: no roles, no cookie redirects) + AddUserStore (scoped; singleton would capture the scoped context). One registration covers every store interface. RequireUniqueEmail = true.
- The vnext emulator returns the ETag quoted from a create but stores _etag unquoted; If-Match accepts either. Tests compare with quotes trimmed.
- Store tests run against a real emulator via Aspire.Hosting.Testing (CosmosFixture in GameCompanion.Api.IntegrationTests starts the AppHost without api/web, once per run).
- To revisit: AppDbContext isn't sealed (optional).
- Each entity's EF mapping is its own IEntityTypeConfiguration<T> class in Data/; OnModelCreating calls ApplyConfigurationsFromAssembly, which also finds internal classes. (Claude split AppUser's out, 2026-10-24.)

## Done
- 2026-10-31: RunService (list, create, get, record opened; last write wins on a concurrent open) + 8 emulator tests; CosmosFixture waits for Runs. Developer wrote the service methods and the first four tests; Claude wrote the last four tests on request. Not committed yet.
- 2026-10-24: Run entity (sealed class, required/init, nullable ThemeId/LastOpenedAt, MaxNameLength), Games registry, RunConfiguration (Runs, /UserId, shadow ETag), DbSet<Run>, Runs container in the AppHost. Claude split AppUser's mapping into AppUserConfiguration and wrote the Run model tests on request.
- 2026-10-24: AppUserStore (user, password, email, security stamp, lockout stores) registered with AddIdentityCore; store + UserManager tests against the emulator. Developer wrote IUserStore, password and email groups; Claude wrote Delete, security stamp and lockout bodies, the registration and the tests on request.
- 2026-10-24: AppUser : IdentityUser mapped to Cosmos (Users container, pk /id, ConcurrencyStamp = _etag), AppDbContext registered, container in AppHost, model tests.
