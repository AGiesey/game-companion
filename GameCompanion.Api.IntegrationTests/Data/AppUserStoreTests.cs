using GameCompanion.Api.Data;
using GameCompanion.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace GameCompanion.Api.IntegrationTests.Data;

// Runs AppUserStore against the Cosmos emulator. Each test uses fresh users, so tests don't depend on each other.
// A new AppDbContext stands in for a new request.
public sealed class AppUserStoreTests(CosmosFixture cosmos)
{
    private static readonly IdentityErrorDescriber Describer = new();
    private static readonly DateTimeOffset CreatedAt = new(2026, 10, 24, 12, 0, 0, TimeSpan.Zero);

    private static CancellationToken CancellationToken => TestContext.Current.CancellationToken;

    private static AppUser NewUser()
    {
        var email = $"{Guid.NewGuid():N}@example.com";
        return new AppUser
        {
            UserName = email,
            NormalizedUserName = email.ToUpperInvariant(),
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            CreatedAt = CreatedAt,
        };
    }

    private async Task<AppUser> CreateAsync()
    {
        var user = NewUser();
        await using var context = cosmos.CreateContext();
        using var store = new AppUserStore(context, Describer);

        var result = await store.CreateAsync(user, CancellationToken);

        Assert.True(result.Succeeded);
        return user;
    }

    [Fact]
    public async Task CreatedUserCanBeFoundById()
    {
        var user = await CreateAsync();

        await using var context = cosmos.CreateContext();
        using var store = new AppUserStore(context, Describer);
        var found = await store.FindByIdAsync(user.Id, CancellationToken);

        Assert.NotNull(found);
        Assert.Equal(user.Email, found.Email);
        Assert.Equal(CreatedAt, found.CreatedAt);
        // Create read the new _etag back into the user, and it matches what's stored. The emulator quotes the
        // ETag it returns from a create but not the stored _etag, so compare without quotes.
        Assert.NotNull(found.ConcurrencyStamp);
        Assert.Equal(user.ConcurrencyStamp?.Trim('"'), found.ConcurrencyStamp.Trim('"'));
    }

    [Fact]
    public async Task CreatedUserCanBeFoundByNormalizedEmailAndUserName()
    {
        var user = await CreateAsync();

        await using var context = cosmos.CreateContext();
        using var store = new AppUserStore(context, Describer);

        Assert.Equal(user.Id, (await store.FindByEmailAsync(user.NormalizedEmail!, CancellationToken))?.Id);
        Assert.Equal(user.Id, (await store.FindByNameAsync(user.NormalizedUserName!, CancellationToken))?.Id);
    }

    [Fact]
    public async Task UpdateSavesChanges()
    {
        var user = await CreateAsync();

        await using (var context = cosmos.CreateContext())
        {
            using var store = new AppUserStore(context, Describer);
            var loaded = await store.FindByIdAsync(user.Id, CancellationToken);
            await store.IncrementAccessFailedCountAsync(loaded!, CancellationToken);

            Assert.True((await store.UpdateAsync(loaded!, CancellationToken)).Succeeded);
        }

        await using var readContext = cosmos.CreateContext();
        using var readStore = new AppUserStore(readContext, Describer);
        var reloaded = await readStore.FindByIdAsync(user.Id, CancellationToken);

        Assert.Equal(1, reloaded?.AccessFailedCount);
    }

    [Fact]
    public async Task UpdateWithStaleConcurrencyStampFails()
    {
        var user = await CreateAsync();

        // Two requests load the same user.
        await using var first = cosmos.CreateContext();
        await using var second = cosmos.CreateContext();
        using var firstStore = new AppUserStore(first, Describer);
        using var secondStore = new AppUserStore(second, Describer);
        var firstCopy = await firstStore.FindByIdAsync(user.Id, CancellationToken);
        var secondCopy = await secondStore.FindByIdAsync(user.Id, CancellationToken);

        // The first saves; the second still holds the old _etag.
        await firstStore.IncrementAccessFailedCountAsync(firstCopy!, CancellationToken);
        Assert.True((await firstStore.UpdateAsync(firstCopy!, CancellationToken)).Succeeded);

        await secondStore.IncrementAccessFailedCountAsync(secondCopy!, CancellationToken);
        var result = await secondStore.UpdateAsync(secondCopy!, CancellationToken);

        Assert.False(result.Succeeded);
        Assert.Equal(Describer.ConcurrencyFailure().Code, Assert.Single(result.Errors).Code);
    }

    [Fact]
    public async Task DeletedUserIsGone()
    {
        var user = await CreateAsync();

        await using (var context = cosmos.CreateContext())
        {
            using var store = new AppUserStore(context, Describer);
            var loaded = await store.FindByIdAsync(user.Id, CancellationToken);

            Assert.True((await store.DeleteAsync(loaded!, CancellationToken)).Succeeded);
        }

        await using var readContext = cosmos.CreateContext();
        using var readStore = new AppUserStore(readContext, Describer);

        Assert.Null(await readStore.FindByIdAsync(user.Id, CancellationToken));
    }

    [Fact]
    public async Task DeleteWithStaleConcurrencyStampFails()
    {
        var user = await CreateAsync();

        await using var first = cosmos.CreateContext();
        await using var second = cosmos.CreateContext();
        using var firstStore = new AppUserStore(first, Describer);
        using var secondStore = new AppUserStore(second, Describer);
        var firstCopy = await firstStore.FindByIdAsync(user.Id, CancellationToken);
        var secondCopy = await secondStore.FindByIdAsync(user.Id, CancellationToken);

        await firstStore.IncrementAccessFailedCountAsync(firstCopy!, CancellationToken);
        Assert.True((await firstStore.UpdateAsync(firstCopy!, CancellationToken)).Succeeded);

        var result = await secondStore.DeleteAsync(secondCopy!, CancellationToken);

        Assert.False(result.Succeeded);
        Assert.Equal(Describer.ConcurrencyFailure().Code, Assert.Single(result.Errors).Code);
    }

    // Goes through UserManager with the same Identity registration as Program.cs, so the store is used the way
    // the account endpoints will use it: hashing, normalizing and validating included.
    [Fact]
    public async Task UserManagerCreatesUserChecksPasswordAndRejectsDuplicateEmail()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<AppDbContext>(cosmos.Configure);
        services.AddIdentityCore<AppUser>(options =>
        {
            options.User.RequireUniqueEmail = true;
        })
        .AddUserStore<AppUserStore>();

        await using var provider = services.BuildServiceProvider(validateScopes: true);
        await using var scope = provider.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var email = $"{Guid.NewGuid():N}@example.com";
        const string password = "Correct-horse-1";

        var created = await userManager.CreateAsync(
            new AppUser { UserName = email, Email = email, CreatedAt = CreatedAt },
            password);
        Assert.True(created.Succeeded);

        var found = await userManager.FindByEmailAsync(email.ToUpperInvariant());
        Assert.NotNull(found);
        Assert.True(await userManager.CheckPasswordAsync(found, password));
        Assert.False(await userManager.CheckPasswordAsync(found, "Wrong-password-1"));

        var duplicate = await userManager.CreateAsync(
            new AppUser { UserName = $"other-{email}", Email = email, CreatedAt = CreatedAt },
            password);
        Assert.False(duplicate.Succeeded);
        Assert.Contains(duplicate.Errors, error => error.Code == Describer.DuplicateEmail(email).Code);
    }
}
