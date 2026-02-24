using System.Net.Http;
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

namespace Mutils.Desktop;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window {
    private readonly SettingsService _settingsService;
    private readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };

    public MainWindow() {
        InitializeComponent();
        _settingsService = new SettingsService();
        LoadSettings();
        _ = CheckConnectionAsync();
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

    private void OnDashboardClick(object sender, RoutedEventArgs e) {
        DashboardView.Visibility = Visibility.Visible;
        SettingsView.Visibility = Visibility.Collapsed;
        
        DashboardNav.Background = new SolidColorBrush((Color) ColorConverter.ConvertFromString("#252525"));
        DashboardNav.Foreground = Brushes.White;
        
        SettingsNav.Background = Brushes.Transparent;
        SettingsNav.Foreground = new SolidColorBrush((Color) ColorConverter.ConvertFromString("#BBB"));
    }

    private void OnSettingsClick(object sender, RoutedEventArgs e) {
        DashboardView.Visibility = Visibility.Collapsed;
        SettingsView.Visibility = Visibility.Visible;

        SettingsNav.Background = new SolidColorBrush((Color) ColorConverter.ConvertFromString("#252525"));
        SettingsNav.Foreground = Brushes.White;

        DashboardNav.Background = Brushes.Transparent;
        DashboardNav.Foreground = new SolidColorBrush((Color) ColorConverter.ConvertFromString("#BBB"));
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
