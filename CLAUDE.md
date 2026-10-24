# Game Companion

A personal AI gameplay companion: it feels like a friend who's played the game, hanging out while you play. It knows your character, tracks what you've discovered, helps with lore and decisions, and avoids spoilers. Elden Ring first, designed for multiple games, users and runs. Not a commercial product.

The full plan lives in the project plan doc: https://claude.ai/code/artifact/88431e2b-b9e8-4b58-b3ba-28294678710c

## Why this repo exists

Two goals, in this order:
1. **Relearn C# and .NET.** The developer is experienced but coming back to .NET after time away. Skip beginner explanations, but always flag what's changed in recent .NET and C# versions.
2. Build the app.

When speed and learning conflict, learning wins. Prefer approaches that teach modern C# and .NET well over shortcuts or extra frameworks.

## Terms

Use the plan's terms consistently in code, comments and conversation: **run** (not playthrough), **conversation**, **companion**, **game knowledge**, **run journal**, **Lore So Far**.

## Stack

- .NET 10 (required) and C# 14. SDK pinned in `global.json`.
- ASP.NET Core Web API with **controllers** (not minimal APIs).
- React + TypeScript + Vite front end, served as static files by the API.
- Azure Cosmos DB for NoSQL through EF Core 10, partitioned by user. Vector and hybrid search for game knowledge.
- Azure OpenAI for both the companion (a GPT model via `IChatClient`) and embeddings (via `IEmbeddingGenerator`), through Microsoft.Extensions.AI. One AI provider; the abstraction keeps the model swappable.
- Server-Sent Events (`TypedResults.ServerSentEvents`) for streaming replies.
- ASP.NET Core Identity with a custom Cosmos-backed user store.
- Aspire for local dev; one Azure Container App for hosting.

## Who writes what

- **The developer writes by hand, with the tutor** (`/tutor`): the core. That's the run and character model, the companion turn loop (prompt building, tool-use loop, streaming with `IAsyncEnumerable`), the spoiler check, the Cosmos data model and the Identity user store. **Do not write implementation code in these areas unless explicitly asked.** If asked to work here outside `/tutor`, stop and check first.
- **Claude drafts, the developer reviews line by line:** controllers, EF configuration, the Aspire AppHost and tests. Before handing over a draft, explain any idiom or API newer than roughly .NET 6 / C# 10 (for example primary constructors, collection expressions, `field`, extension members, `TypedResults`, `LeftJoin`).
- **Claude owns, spec-driven:** the React UI, styling and Azure setup. The front end is built with GitHub Spec Kit: specify → plan → tasks → implement → converge per feature, repeating implement and converge until the code matches the spec. Spec Kit work stays in the front end; it never touches the backend core. The developer may still choose to explore some React by hand; follow their lead.

## Conventions

- Nullable reference types on; warnings as errors; built-in .NET analyzers on. Fix warnings, don't suppress them without saying why.
- The API is organized by layer, not by feature (the developer's choice, matching their day job): `Controllers/`, `Models/` (entities such as the user), `Services/`, `Data/` (the `DbContext`, EF configuration, the Identity user store). Namespaces follow folders.
- File-scoped namespaces. Prefer records for immutable data, `required` members over constructor sprawl, pattern matching where it reads well.
- Async all the way down, with a `CancellationToken` passed through.
- API errors as ProblemDetails.

## Git

- Never push. The developer pushes.
- During Spec Kit implement/converge, commit locally after each completed task, with a message naming the feature and task.
- Otherwise, don't commit unless asked.
