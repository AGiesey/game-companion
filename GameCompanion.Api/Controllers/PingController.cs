using Microsoft.AspNetCore.Mvc;

namespace GameCompanion.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class PingController(TimeProvider timeProvider) : ControllerBase
{
    [HttpGet]
    public PingResponse Get() => new("pong", timeProvider.GetUtcNow());
}

public sealed record PingResponse(string Message, DateTimeOffset ServerTime);
