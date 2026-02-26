using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Services;

/// <summary>
/// Sends SMS via Termii API.
/// Docs: https://developer.termii.com/docs/messaging/send-message
/// </summary>
public class TermiiSmsService : ISmsService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<TermiiSmsService> _logger;
    private readonly string _apiKey;
    private readonly string _senderId;

    public TermiiSmsService(HttpClient httpClient, IConfiguration configuration, ILogger<TermiiSmsService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        var section = configuration.GetSection("Termii");
        _apiKey = section["ApiKey"] ?? "";
        _senderId = section["SenderId"] ?? "RunAm";

        _httpClient.BaseAddress = new Uri("https://api.ng.termii.com/api/");
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task SendAsync(string phoneNumber, string message, CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                to = phoneNumber,
                from = _senderId,
                sms = message,
                type = "plain",
                channel = "generic",
                api_key = _apiKey
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("sms/send", content, ct);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Termii SMS send failed: {StatusCode} — {Error}", response.StatusCode, error);
            }
            else
            {
                _logger.LogInformation("SMS sent to {Phone} via Termii", phoneNumber);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS to {Phone} via Termii", phoneNumber);
        }
    }

    public async Task SendBulkAsync(IEnumerable<string> phoneNumbers, string message, CancellationToken ct = default)
    {
        // Termii bulk send is done individually or via their bulk endpoint
        var tasks = phoneNumbers.Select(phone => SendAsync(phone, message, ct));
        await Task.WhenAll(tasks);
    }
}
