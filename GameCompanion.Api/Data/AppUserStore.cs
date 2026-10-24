using GameCompanion.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Azure.Cosmos.Linq;
using Microsoft.EntityFrameworkCore;

namespace GameCompanion.Api.Data;

public sealed class AppUserStore(AppDbContext dbContext, IdentityErrorDescriber describer)
    : IUserStore<AppUser>,
      IUserPasswordStore<AppUser>,
      IUserEmailStore<AppUser>,
      IUserSecurityStampStore<AppUser>,
      IUserLockoutStore<AppUser>
{
    // IUserStore<AppUser>

    public Task<string> GetUserIdAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.Id);

    public Task<string?> GetUserNameAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.UserName);

    public Task SetUserNameAsync(AppUser user, string? userName, CancellationToken cancellationToken)
    {
        user.UserName = userName;
        return Task.CompletedTask;
    }

    public Task<string?> GetNormalizedUserNameAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.NormalizedUserName);

    public Task SetNormalizedUserNameAsync(AppUser user, string? normalizedName, CancellationToken cancellationToken)
    {
        user.NormalizedUserName = normalizedName;
        return Task.CompletedTask;
    }

    public async Task<AppUser?> FindByIdAsync(string userId, CancellationToken cancellationToken)
        => await dbContext.FindAsync<AppUser>([userId], cancellationToken);

    public Task<AppUser?> FindByNameAsync(string normalizedUserName, CancellationToken cancellationToken)
        => dbContext.Users
            .SingleOrDefaultAsync(u => u.NormalizedUserName == normalizedUserName, cancellationToken);

    public async Task<IdentityResult> CreateAsync(AppUser user, CancellationToken cancellationToken)
    {
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return IdentityResult.Success;
    }

    public async Task<IdentityResult> UpdateAsync(AppUser user, CancellationToken cancellationToken)
    {
        dbContext.Update(user);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return IdentityResult.Failed(describer.ConcurrencyFailure());
        }

        return IdentityResult.Success;
    }

    public async Task<IdentityResult> DeleteAsync(AppUser user, CancellationToken cancellationToken)
    {
        dbContext.Users.Remove(user);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return IdentityResult.Failed(describer.ConcurrencyFailure());
        }

        return IdentityResult.Success;
    }

    public void Dispose()
    {
    }

    // IUserPasswordStore<AppUser>

    public Task<string?> GetPasswordHashAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.PasswordHash);

    public Task SetPasswordHashAsync(AppUser user, string? passwordHash, CancellationToken cancellationToken)
    {
        user.PasswordHash = passwordHash;
        return Task.CompletedTask;
    }

    public Task<bool> HasPasswordAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.PasswordHash != null);

    // IUserEmailStore<AppUser>

    public Task<string?> GetEmailAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.Email);

    public Task SetEmailAsync(AppUser user, string? email, CancellationToken cancellationToken)
    {
        user.Email = email;
        return Task.CompletedTask;
    }

    public Task<string?> GetNormalizedEmailAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.NormalizedEmail);

    public Task SetNormalizedEmailAsync(AppUser user, string? normalizedEmail, CancellationToken cancellationToken)
    {
        user.NormalizedEmail = normalizedEmail;
        return Task.CompletedTask;
    }

    public Task<bool> GetEmailConfirmedAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.EmailConfirmed);

    public Task SetEmailConfirmedAsync(AppUser user, bool confirmed, CancellationToken cancellationToken)
    {
        user.EmailConfirmed = confirmed;
        return Task.CompletedTask;
    }

    // Cross-partition query: fine for a handful of users. If the app grows, replace it with an email → user id
    // lookup document (a point read, cheaper), which also enforces unique emails. A Cosmos unique key can't,
    // since each user is its own partition. FindByNameAsync is the same query on the user name (the email).
    public Task<AppUser?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken)
        => dbContext.Users.SingleOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

    // IUserSecurityStampStore<AppUser>

    public Task<string?> GetSecurityStampAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.SecurityStamp);

    public Task SetSecurityStampAsync(AppUser user, string stamp, CancellationToken cancellationToken)
    {
        user.SecurityStamp = stamp;
        return Task.CompletedTask;
    }

    // IUserLockoutStore<AppUser>

    public Task<DateTimeOffset?> GetLockoutEndDateAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.LockoutEnd);

    public Task SetLockoutEndDateAsync(AppUser user, DateTimeOffset? lockoutEnd, CancellationToken cancellationToken)
    {
        user.LockoutEnd = lockoutEnd;
        return Task.CompletedTask;
    }

    public Task<bool> GetLockoutEnabledAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.LockoutEnabled);

    public Task SetLockoutEnabledAsync(AppUser user, bool enabled, CancellationToken cancellationToken)
    {
        user.LockoutEnabled = enabled;
        return Task.CompletedTask;
    }

    public Task<int> GetAccessFailedCountAsync(AppUser user, CancellationToken cancellationToken)
        => Task.FromResult(user.AccessFailedCount);

    public Task<int> IncrementAccessFailedCountAsync(AppUser user, CancellationToken cancellationToken)
    {
        user.AccessFailedCount++;
        return Task.FromResult(user.AccessFailedCount);
    }

    public Task ResetAccessFailedCountAsync(AppUser user, CancellationToken cancellationToken)
    {
        user.AccessFailedCount = 0;
        return Task.CompletedTask;
    }
}
