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

    private static IEntityType UserEntityType()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseCosmos(ConnectionString, databaseName: "model-tests")
            .Options;

        using var context = new AppDbContext(options);

        return context.Model.FindEntityType(typeof(AppUser))
            ?? throw new InvalidOperationException("AppUser is not in the model.");
    }

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
}
