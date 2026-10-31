using System.Collections.ObjectModel;
using Azure.Provisioning.CosmosDB;
using GameCompanion.Api.Data;
using GameCompanion.Api.Models;
using GameCompanion.Api.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;

namespace GameCompanion.Api.IntegrationTests.Services;

// Runs RunService against the Cosmos emulator. Each test uses fresh user ids, so tests don't depend on each other.
// A new AppDbContext stands in for a new request, as in AppUserStoreTests.
public sealed class RunServiceTests(CosmosFixture cosmos)
{
    private static readonly DateTimeOffset Start = new(2026, 10, 25, 12, 0, 0, TimeSpan.Zero);

    // xUnit creates a new instance of this class for every test, so each test gets its own player.
    private readonly string _userId = Guid.NewGuid().ToString();

    private static CancellationToken CancellationToken => TestContext.Current.CancellationToken;

    private AppDbContext CreateContext() => cosmos.CreateContext();

    // NullLogger logs nothing. A FakeTimeProvider lets a test set "now" and move it on with Advance.
    private static RunService CreateService(AppDbContext context, TimeProvider timeProvider) =>
        new(context, NullLogger<RunService>.Instance, timeProvider);

    [Fact]
    public async Task CreatedRunCanBeFoundByIdAndUser()
    {
        var time = new FakeTimeProvider(Start);
        Run created;
        await using (var context = CreateContext())
        {
            created = await CreateService(context, time)
                .CreateRunAsync(_userId, "Winston", Games.EldenRing, null, CancellationToken);
        }

        // A new context, so this reads from Cosmos rather than returning the tracked entity.
        await using var readContext = CreateContext();
        var found = await CreateService(readContext, time).GetRunAsync(_userId, created.Id, CancellationToken);

        Assert.NotNull(found);
        Assert.Equal(_userId, found.UserId);
        Assert.Equal("Winston", found.Name);
        Assert.Equal(Games.EldenRing, found.GameId);
        Assert.Null(found.ThemeId);
        Assert.Equal(Start, found.CreatedAt);
        Assert.Null(found.LastOpenedAt);
    }

    [Fact]
    public async Task CreateTrimsTheNameAndLeavesTheRunUnopened()
    {
        var time = new FakeTimeProvider(Start);
        Run created;
        await using (var context = CreateContext())
        {
            created = await CreateService(context, time)
                .CreateRunAsync(_userId, "  Vaela's Run ", Games.EldenRing, null, CancellationToken);
        }

        // A new context, so this reads from Cosmos rather than returning the tracked entity.
        await using var readContext = CreateContext();
        var found = await CreateService(readContext, time).GetRunAsync(_userId, created.Id, CancellationToken);

        Assert.NotNull(found);
        Assert.Equal(_userId, found.UserId);
        Assert.Equal("Vaela's Run", found.Name);
        Assert.Null(found.LastOpenedAt);
    }

    [Fact]
    public async Task GetReturnsNullForAMissingRun()
    {
        var time = new FakeTimeProvider(Start);
        var missingRunId = Guid.NewGuid().ToString();
        await using var readContext = CreateContext();
        var found = await CreateService(readContext, time).GetRunAsync(_userId, missingRunId, CancellationToken);

        Assert.Null(found);
    }

    [Fact]
    public async Task GetReturnsNullForAnotherPlayersRun()
    {
        var time = new FakeTimeProvider(Start);
        var otherUserId = Guid.NewGuid().ToString();

        Run created;
        await using (var context = CreateContext())
        {
            created = await CreateService(context, time)
                .CreateRunAsync(_userId, "Winston's Run", Games.EldenRing, null, CancellationToken);
        }

        await using var readContext = CreateContext();
        var found = await CreateService(readContext, time).GetRunAsync(otherUserId, created.Id, CancellationToken);

        Assert.Null(found);
    }

    [Fact]
    public async Task ListReturnsOnlyThePlayersRuns()
    {
        var time = new FakeTimeProvider(Start);
        var otherUserId = Guid.NewGuid().ToString();

        Run myRun;
        Run otherRun;
        await using (var context = CreateContext())
        {
            var service = CreateService(context, time);
            myRun = await service.CreateRunAsync(_userId, "Winston's Run", Games.EldenRing, null, CancellationToken);
            otherRun = await service.CreateRunAsync(otherUserId, "Other Run", Games.EldenRing, null, CancellationToken);
        }

        await using var readContext = CreateContext();
        var readService = CreateService(readContext, time);
        var myRuns = await readService.ListRunsAsync(_userId, CancellationToken);
        var otherRuns = await readService.ListRunsAsync(otherUserId, CancellationToken);

        // Exactly one run each, and it's that player's own.
        Assert.Equal(myRun.Id, Assert.Single(myRuns).Id);
        Assert.Equal(otherRun.Id, Assert.Single(otherRuns).Id);
    }

    [Fact]
    public async Task ListOrdersByMostRecentlyOpenedThenCreated()
    {
        var time = new FakeTimeProvider(Start);

        Run oldest;
        Run middle;
        Run newest;
        await using (var context = CreateContext())
        {
            var service = CreateService(context, time);
            oldest = await service.CreateRunAsync(_userId, "Oldest", Games.EldenRing, null, CancellationToken);
            time.Advance(TimeSpan.FromMinutes(1));
            middle = await service.CreateRunAsync(_userId, "Middle", Games.EldenRing, null, CancellationToken);
            time.Advance(TimeSpan.FromMinutes(1));
            newest = await service.CreateRunAsync(_userId, "Newest", Games.EldenRing, null, CancellationToken);
        }

        // Opening the oldest run puts it ahead of runs created after it.
        time.Advance(TimeSpan.FromMinutes(1));
        await using (var context = CreateContext())
        {
            Assert.True(await CreateService(context, time).RecordRunOpenedAsync(_userId, oldest.Id, CancellationToken));
        }

        await using var readContext = CreateContext();
        var runs = await CreateService(readContext, time).ListRunsAsync(_userId, CancellationToken);

        // The opened run first, then the never-opened ones newest first.
        Assert.Equal([oldest.Id, newest.Id, middle.Id], runs.Select(r => r.Id));
    }

    [Fact]
    public async Task RecordOpenedSetsLastOpenedAt()
    {
        var time = new FakeTimeProvider(Start);

        Run created;
        await using (var context = CreateContext())
        {
            created = await CreateService(context, time)
                .CreateRunAsync(_userId, "Winston's Run", Games.EldenRing, null, CancellationToken);
        }

        time.Advance(TimeSpan.FromMinutes(5));
        await using (var context = CreateContext())
        {
            Assert.True(await CreateService(context, time).RecordRunOpenedAsync(_userId, created.Id, CancellationToken));
        }

        await using var readContext = CreateContext();
        var found = await CreateService(readContext, time).GetRunAsync(_userId, created.Id, CancellationToken);

        Assert.NotNull(found);
        Assert.Equal(Start.AddMinutes(5), found.LastOpenedAt);
        // Opening a run doesn't change when it was created.
        Assert.Equal(Start, found.CreatedAt);
    }

    [Fact]
    public async Task RecordOpenedReturnsFalseForAnotherPlayersRun()
    {
        var time = new FakeTimeProvider(Start);
        var otherUserId = Guid.NewGuid().ToString();

        Run created;
        await using (var context = CreateContext())
        {
            created = await CreateService(context, time)
                .CreateRunAsync(_userId, "Winston's Run", Games.EldenRing, null, CancellationToken);
        }

        await using (var context = CreateContext())
        {
            Assert.False(await CreateService(context, time).RecordRunOpenedAsync(otherUserId, created.Id, CancellationToken));
        }

        // Read back as the owner: the other player's attempt changed nothing.
        await using var readContext = CreateContext();
        var found = await CreateService(readContext, time).GetRunAsync(_userId, created.Id, CancellationToken);

        Assert.NotNull(found);
        Assert.Null(found.LastOpenedAt);
    }
}
