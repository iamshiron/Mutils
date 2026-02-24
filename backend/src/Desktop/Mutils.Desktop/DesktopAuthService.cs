using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Windows;
using Mutils.Core.DTOs;

namespace Mutils.Desktop;

public class DesktopAuthService {
    private readonly SettingsService _settingsService;
    private readonly HttpClient _httpClient;
    private const string RedirectUrl = "http://localhost:5001/auth/callback";

    public DesktopAuthService(SettingsService settingsService) {
        _settingsService = settingsService;
        _httpClient = new HttpClient();
    }

    public async Task<UserDto?> LoginWithDiscordAsync() {
        var baseUrl = _settingsService.Current.ApiBaseUrl.TrimEnd('/');
        var clientId = "1474073927511965807"; // Hardcoded for this project context based on appsettings.Development.json

        var authUrl = $"https://discord.com/oauth2/authorize?client_id={clientId}&redirect_uri={Uri.EscapeDataString(RedirectUrl)}&response_type=code&scope=identify";

        // Start local listener
        using var listener = new HttpListener();
        listener.Prefixes.Add("http://localhost:5001/auth/callback/");
        listener.Start();

        // Open browser
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo {
            FileName = authUrl,
            UseShellExecute = true
        });

        // Wait for callback
        var context = await listener.GetContextAsync();
        var code = context.Request.QueryString["code"];

        if (string.IsNullOrEmpty(code)) {
            SendResponse(context.Response, "Auth failed. No code received.");
            return null;
        }

        SendResponse(context.Response, "Auth successful! You can close this window and return to Mutils Desktop.");

        // Exchange code for token via our API
        try {
            var response = await _httpClient.GetAsync($"{baseUrl}/api/auth/callback?code={code}&redirect_uri={Uri.EscapeDataString(RedirectUrl)}");
            if (response.IsSuccessStatusCode) {
                var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
                if (authResponse != null) {
                    var settings = _settingsService.Current;
                    settings.AccessToken = authResponse.AccessToken;
                    settings.RefreshToken = authResponse.RefreshToken;
                    settings.User = authResponse.User;
                    _settingsService.Save(settings);
                    return authResponse.User;
                }
            } else {
                var error = await response.Content.ReadAsStringAsync();
                MessageBox.Show($"Token exchange failed: {error}");
            }
        } catch (Exception ex) {
            MessageBox.Show($"Error during token exchange: {ex.Message}");
        }

        return null;
    }

    private void SendResponse(HttpListenerResponse response, string message) {
        var buffer = System.Text.Encoding.UTF8.GetBytes($"<html><body><h2>{message}</h2><script>window.close();</script></body></html>");
        response.ContentLength64 = buffer.Length;
        response.OutputStream.Write(buffer, 0, buffer.Length);
        response.OutputStream.Close();
    }
}
