using GameCompanion.Api.Data;
using GameCompanion.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameCompanion.Api.Services;

public sealed partial class RunService(AppDbContext dbContext, ILogger<RunService> logger, TimeProvider timeProvider)
{
    [LoggerMessage(Level = LogLevel.Information, Message = "Run {RunId} created for user {UserId}")]
    private partial void LogRunCreated(string runId, string userId);

    [LoggerMessage(Level = LogLevel.Debug, Message = "Run {RunId} was opened concurrently; keeping the other write")]
    private partial void LogRunOpenedConcurrently(string runId);



    // Most recently opened first; a run never opened counts from when it was created. Sorted in memory because
    // Cosmos ORDER BY takes only plain property paths, not LastOpenedAt ?? CreatedAt, and a player has few runs.
    public async Task<IReadOnlyList<Run>> ListRunsAsync(string userId, CancellationToken cancellationToken)
    {
        var runs = await dbContext.Runs
            .Where(r => r.UserId == userId)
            .ToListAsync(cancellationToken);

        return [.. runs.OrderByDescending(r => r.LastOpenedAt ?? r.CreatedAt)];
    }

    // Validation (name present and short enough, known game) happens on the request before this is called.
    public async Task<Run> CreateRunAsync(
        string userId, string name, string gameId, string? themeId, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var run = new Run
        {
            // Version 7 GUIDs start with a timestamp, so ids sort roughly by creation time.
            Id = Guid.CreateVersion7(now).ToString(),
            UserId = userId,
            Name = name.Trim(),
            GameId = gameId,
            ThemeId = themeId,
            CreatedAt = now,
        };

        dbContext.Runs.Add(run);
        await dbContext.SaveChangesAsync(cancellationToken);
        LogRunCreated(run.Id, userId);
        return run;
    }

    public async Task<Run?> GetRunAsync(string userId, string runId, CancellationToken cancellationToken) =>
        await dbContext.Runs.FindAsync([runId, userId], cancellationToken);

    public async Task<bool> RecordRunOpenedAsync(string userId, string runId, CancellationToken cancellationToken)
    {
        var run = await GetRunAsync(userId, runId, cancellationToken);

        if (run is null)
        {
            return false;
        }

        run.LastOpenedAt = timeProvider.GetUtcNow();

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            LogRunOpenedConcurrently(runId);
        }

        return true;
    }
}
