
using GameCompanion.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameCompanion.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(user =>
        {
            user.ToContainer("Users");
            user.HasPartitionKey(u => u.Id);
            user.Property(u => u.ConcurrencyStamp).IsETagConcurrency();
        });
    }
}
