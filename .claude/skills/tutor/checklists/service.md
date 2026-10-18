# Service checklist

1. **Single responsibility** — one clear job, named for it.
2. **Interface only if needed** — an interface when there's a real second implementation or a test seam, not by reflex.
3. **Dependencies** — constructor injection (primary constructor is fine); registered in DI with the right lifetime (singleton / scoped / transient) and a reason.
4. **Async and cancellation** — async all the way, `CancellationToken` passed through.
5. **User scoping** — every data access is scoped to the current user.
6. **Errors** — expected failures returned as results the caller can handle; exceptions for the truly exceptional.
7. **Logging** — structured logging (`ILogger<T>`) at meaningful points, no secrets or full prompts in logs.
8. **Test** — unit tests for the logic, with fakes for external services.
