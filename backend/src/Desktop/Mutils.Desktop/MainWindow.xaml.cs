using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using Mutils.Core.DTOs;

namespace Mutils.Desktop;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window {
    private readonly SettingsService _settingsService;
    private readonly DesktopAuthService _authService;
    private readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };

    public MainWindow() {
        InitializeComponent();
        _settingsService = new SettingsService();
        _authService = new DesktopAuthService(_settingsService);
        LoadSettings();
        _ = CheckConnectionAsync();
        UpdateUserUI();
    }

    private void UpdateUserUI() {
        var user = _settingsService.Current.User;
        if (user != null) {
            UserStatusText.Text = $"Logged in as {user.Username}";
            LoginButton.Visibility = Visibility.Collapsed;
            LogoutButton.Visibility = Visibility.Visible;
            LoginRequiredOverlay.Visibility = Visibility.Collapsed;
            CollectionListView.Visibility = Visibility.Visible;
        } else {
            UserStatusText.Text = "Not Logged In";
            LoginButton.Visibility = Visibility.Visible;
            LogoutButton.Visibility = Visibility.Collapsed;
            LoginRequiredOverlay.Visibility = Visibility.Visible;
            CollectionListView.Visibility = Visibility.Collapsed;
        }
    }

    private async void OnLoginClick(object sender, RoutedEventArgs e) {
        var user = await _authService.LoginWithDiscordAsync();
        if (user != null) {
            UpdateUserUI();
            await LoadCollectionAsync();
        }
    }

    private void OnLogoutClick(object sender, RoutedEventArgs e) {
        var settings = _settingsService.Current;
        settings.AccessToken = null;
        settings.RefreshToken = null;
        settings.User = null;
        _settingsService.Save(settings);
        UpdateUserUI();
    }

    private async Task LoadCollectionAsync() {
        if (_settingsService.Current.AccessToken == null) return;

        var baseUrl = _settingsService.Current.ApiBaseUrl.TrimEnd('/');
        try {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/api/collection?pageSize=100");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _settingsService.Current.AccessToken);
            
            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode) {
                var data = await response.Content.ReadFromJsonAsync<PaginatedResponse<CollectionEntryDto>>();
                if (data != null) {
                    CollectionListView.ItemsSource = data.Items;
                }
            }
        } catch (Exception ex) {
            // Log error
        }
    }

    private async void OnRefreshCollectionClick(object sender, RoutedEventArgs e) {
        await LoadCollectionAsync();
    }

    private void OnCollectionClick(object sender, RoutedEventArgs e) {
        DashboardView.Visibility = Visibility.Collapsed;
        CollectionView.Visibility = Visibility.Visible;
        SettingsView.Visibility = Visibility.Collapsed;

        SetActiveNav(CollectionNav);
        _ = LoadCollectionAsync();
    }

    private void SetActiveNav(Button active) {
        DashboardNav.Background = Brushes.Transparent;
        CollectionNav.Background = Brushes.Transparent;
        SettingsNav.Background = Brushes.Transparent;
        
        DashboardNav.Foreground = new SolidColorBrush((Color) ColorConverter.ConvertFromString("#BBB"));
        CollectionNav.Foreground = new SolidColorBrush((Color) ColorConverter.ConvertFromString("#BBB"));
        SettingsNav.Foreground = new SolidColorBrush((Color) ColorConverter.ConvertFromString("#BBB"));

        active.Background = new SolidColorBrush((Color) ColorConverter.ConvertFromString("#252525"));
        active.Foreground = Brushes.White;
    }

    private void OnDashboardClick(object sender, RoutedEventArgs e) {
        DashboardView.Visibility = Visibility.Visible;
        CollectionView.Visibility = Visibility.Collapsed;
        SettingsView.Visibility = Visibility.Collapsed;
        SetActiveNav(DashboardNav);
    }

    private void OnSettingsClick(object sender, RoutedEventArgs e) {
        DashboardView.Visibility = Visibility.Collapsed;
        CollectionView.Visibility = Visibility.Collapsed;
        SettingsView.Visibility = Visibility.Visible;
        SetActiveNav(SettingsNav);
    }

    private void LoadSettings() {
        var settings = _settingsService.Load();
        ApiUrlTextBox.Text = settings.ApiBaseUrl;
    }

    private async Task CheckConnectionAsync() {
        var url = ApiUrlTextBox.Text;
        if (string.IsNullOrEmpty(url)) return;

        bool connected = false;
        try {
            // Check health or common endpoint
            var response = await _httpClient.GetAsync(url.TrimEnd('/') + "/api/user/me");
            // If we get 401 Unauthorized, it means the server is UP but we're just not logged in.
            connected = response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.Unauthorized;
        } catch {
            connected = false;
        }

        UpdateStatusUI(connected, url);
    }

    private void UpdateStatusUI(bool connected, string url) {
        var brush = connected ? Brushes.LimeGreen : Brushes.Red;
        var text = connected ? "Connected" : "Disconnected";
        var settingsText = connected ? $"Connected to {url}" : "Cannot reach API server";

        StatusDot.Fill = brush;
        StatusText.Text = text;
        SettingsStatusDot.Fill = brush;
        SettingsStatusText.Text = settingsText;
    }

    private async void OnSaveSettingsClick(object sender, RoutedEventArgs e) {
        var settings = new AppSettings {
            ApiBaseUrl = ApiUrlTextBox.Text
        };
        _settingsService.Save(settings);
        await CheckConnectionAsync();
        MessageBox.Show("Settings saved. Verifying connection...", "Settings", MessageBoxButton.OK, MessageBoxImage.Information);
    }
}
