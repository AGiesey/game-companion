namespace GameCompanion.Api.Models;

public sealed class Run
{
    public const int MaxNameLength = 60;

    public required string Id { get; init; }
    public required string UserId { get; init; }
    public required string Name { get; init; }
    public required string GameId { get; init; }
    public required string? ThemeId { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? LastOpenedAt { get; set; }
}
