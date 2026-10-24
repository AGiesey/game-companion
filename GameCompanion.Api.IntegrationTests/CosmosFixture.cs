using System.Data.Common;
using Aspire.Hosting;
using Aspire.Hosting.Testing;
using GameCompanion.Api.Data;
using Microsoft.Azure.Cosmos;
using Microsoft.EntityFrameworkCore;

[assembly: AssemblyFixture(typeof(GameCompanion.Api.IntegrationTests.CosmosFixture))]

namespace GameCompanion.Api.IntegrationTests;

// Starts the AppHost's Cosmos emulator once for the whole test run, with the database and Users container
// exactly as the AppHost defines them. The API and the Vite front end aren't needed, so they're left out.
public sealed class CosmosFixture : IAsyncLifetime
{
    private DistributedApplication? _app;
    private string _databaseName = "";

    // The AppHost's connection string for the gamecompanion database, as the API receives it.
    public string ConnectionString { get; private set; } = "";

    public async ValueTask InitializeAsync()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var builder = await DistributedApplicationTestingBuilder.CreateAsync<Projects.GameCompanion_AppHost>(cancellationToken);

        foreach (var unneeded in (string[])["web", "api"])
        {
            builder.Resources.Remove(builder.Resources.Single(resource => resource.Name == unneeded));
        }

        _app = await builder.BuildAsync(cancellationToken);
        await _app.StartAsync(cancellationToken);
        await _app.ResourceNotifications.WaitForResourceHealthyAsync("Users", cancellationToken);

        ConnectionString = await _app.GetConnectionStringAsync("gamecompanion", cancellationToken)
            ?? throw new InvalidOperationException("The AppHost gave no connection string for 'gamecompanion'.");

        // Same parsing as Program.cs.
        var settings = new DbConnectionStringBuilder { ConnectionString = ConnectionString };
        _databaseName = settings.TryGetValue("Database", out var value) && value is string name
            ? name
            : throw new InvalidOperationException("Connection string 'gamecompanion' has no Database.");
    }

    // Configures a context the way Program.cs does, for tests that build their own service collection.
    public void Configure(DbContextOptionsBuilder options)
        => options.UseCosmos(ConnectionString, _databaseName, cosmos => cosmos.ConnectionMode(ConnectionMode.Gateway));

    // A new context stands in for a new request: nothing is tracked yet.
    public AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>();
        Configure(options);
        return new AppDbContext(options.Options);
    }

    public async ValueTask DisposeAsync()
    {
        if (_app is not null)
        {
            await _app.DisposeAsync();
        }
    }
}
