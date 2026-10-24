using GameCompanion.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameCompanion.Api.Data;

internal sealed class RunConfiguration : IEntityTypeConfiguration<Run>
{
    public void Configure(EntityTypeBuilder<Run> builder)
    {
        builder.ToContainer("Runs");
        builder.HasPartitionKey(r => r.UserId);
        builder.UseETagConcurrency();
    }
}
