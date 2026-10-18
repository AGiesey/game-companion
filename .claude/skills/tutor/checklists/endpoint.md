# Endpoint checklist

A controller action is done when it has:

1. **Controller** — `[ApiController]`, a route (`[Route("api/...")]`), inherits `ControllerBase`, dependencies via constructor injection (primary constructor is fine).
2. **Action and route** — the right HTTP verb attribute and route template; route values and query parameters bound with the right attributes or conventions.
3. **Authentication / authorization** — `[Authorize]` on the controller or action (or an explicit, intentional `[AllowAnonymous]`). Data is scoped to the signed-in user (the user id is the Cosmos partition key).
4. **Input validation** — request types with validation (data annotations or explicit checks); invalid input returns 400 ProblemDetails.
5. **Status codes and results** — typed results for success and failure paths (200/201/204, 404, 400, 409…); errors as ProblemDetails. `ActionResult<T>` or `Results<...>` union types so the possible responses are explicit.
6. **Cancellation** — a `CancellationToken` parameter passed through to every async call.
7. **Thin controller** — business logic lives in a service, not the action.
8. **Test** — at least one test covering the happy path and one failure path.
