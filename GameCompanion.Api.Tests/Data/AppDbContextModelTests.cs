using GameCompanion.Api.Data;
using GameCompanion.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace GameCompanion.Api.Tests.Data;

// Checks the EF Core model says what the Cosmos mapping means. Building the model never connects to Cosmos,
// so these run without the emulator.
public sealed class AppDbContextModelTests
{
    // The emulator's well-known key. Any valid base64 works; nothing is sent.
    private const string ConnectionString =
        "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

    private static IEntityType EntityType<TEntity>()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseCosmos(ConnectionString, databaseName: "model-tests")
            .Options;

        using var context = new AppDbContext(options);

        return context.Model.FindEntityType(typeof(TEntity))
            ?? throw new InvalidOperationException($"{typeof(TEntity).Name} is not in the model.");
    }

    private static IEntityType UserEntityType() => EntityType<AppUser>();

    private static IEntityType RunEntityType() => EntityType<Run>();

    [Fact]
    public void UsersAreStoredInTheUsersContainer()
    {
        // Must match the container the AppHost creates.
        Assert.Equal("Users", UserEntityType().GetContainer());
    }

    [Fact]
    public void UsersArePartitionedByTheirId()
    {
        var user = UserEntityType();

        Assert.Equal([nameof(AppUser.Id)], user.GetPartitionKeyPropertyNames());
        // Stored as "id", so the AppHost's partition key path is "/id".
        Assert.Equal("id", user.FindProperty(nameof(AppUser.Id))?.GetJsonPropertyName());
    }

    [Fact]
    public void ConcurrencyStampIsTheCosmosETag()
    {
        var concurrencyStamp = UserEntityType().FindProperty(nameof(AppUser.ConcurrencyStamp));

        Assert.NotNull(concurrencyStamp);
        Assert.Equal("_etag", concurrencyStamp.GetJsonPropertyName());
        Assert.True(concurrencyStamp.IsConcurrencyToken);
    }

    [Fact]
    public void RunsAreStoredInTheRunsContainer()
    {
        // Must match the container the AppHost creates.
        Assert.Equal("Runs", RunEntityType().GetContainer());
    }

    [Fact]
    public void RunsArePartitionedByTheirUser()
    {
        var run = RunEntityType();

        Assert.Equal([nameof(Run.UserId)], run.GetPartitionKeyPropertyNames());
        // Stored as "UserId", so the AppHost's partition key path is "/UserId" (case-sensitive).
        Assert.Equal("UserId", run.FindProperty(nameof(Run.UserId))?.GetJsonPropertyName());
    }

    [Fact]
    public void RunKeyIncludesThePartitionKey()
    {
        // EF Core 9+ adds the partition key to the key, so finding a run takes both: FindAsync([runId, userId]).
        var key = RunEntityType().FindPrimaryKey();

        Assert.NotNull(key);
        Assert.Equal([nameof(Run.Id), nameof(Run.UserId)], key.Properties.Select(p => p.Name));
    }

    [Fact]
    public void RunsUseTheCosmosETagForConcurrency()
    {
        // A shadow property: Run has no ETag of its own.
        var concurrencyTokens = RunEntityType().GetProperties().Where(p => p.IsConcurrencyToken).ToList();

        var etag = Assert.Single(concurrencyTokens);
        Assert.Equal("_etag", etag.GetJsonPropertyName());
        Assert.True(etag.IsShadowProperty());
    }
}
