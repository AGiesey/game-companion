using System.Collections.Frozen;

namespace GameCompanion.Api.Models;

public static class Games
{
    public const string EldenRing = "elden-ring";

    private static readonly FrozenSet<string> Known = new[] { EldenRing }.ToFrozenSet();
    public static bool IsKnown(string gameId) => Known.Contains(gameId);
}
