namespace Mutils.Core.Helpers;

public static class KeyHelper {
    public static string? GetKeyTypeFromCount(int? keyCount) {
        if (keyCount is null or < 1)
            return null;

        return keyCount.Value switch {
            >= 10 => "chaoskey",
            >= 6 => "goldkey",
            >= 3 => "silverkey",
            _ => "bronzekey"
        };
    }
}
