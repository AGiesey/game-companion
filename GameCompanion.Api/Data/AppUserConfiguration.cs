using GameCompanion.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameCompanion.Api.Data;

internal sealed class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> user)
    {
        user.ToContainer("Users");
        user.HasPartitionKey(u => u.Id);
        user.Property(u => u.ConcurrencyStamp).IsETagConcurrency();
    }
}
