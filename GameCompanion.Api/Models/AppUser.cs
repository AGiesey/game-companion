using Microsoft.AspNetCore.Identity;

namespace GameCompanion.Api.Models;

public sealed class AppUser : IdentityUser
{
    public required DateTimeOffset CreatedAt { get; init; }
}
