using System.IO;
using System.Text.Json;

namespace Mutils.Desktop;

public class AppSettings {
    public string ApiBaseUrl { get; set; } = "http://localhost:5000";
}

public class SettingsService {
    private static readonly string SettingsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "Mutils",
        "settings.json"
    );

    public AppSettings Current { get; private set; }

    public SettingsService() {
        Current = Load();
    }

    public AppSettings Load() {
        try {
            if (File.Exists(SettingsPath)) {
                var json = File.ReadAllText(SettingsPath);
                return JsonSerializer.Deserialize<AppSettings>(json) ?? new AppSettings();
            }
        } catch {
            // Fallback to default
        }
        return new AppSettings();
    }

    public void Save(AppSettings settings) {
        try {
            Current = settings;
            var directory = Path.GetDirectoryName(SettingsPath);
            if (directory != null && !Directory.Exists(directory)) {
                Directory.CreateDirectory(directory);
            }
            var json = JsonSerializer.Serialize(settings, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(SettingsPath, json);
        } catch {
            // Log error in real app
        }
    }
}
