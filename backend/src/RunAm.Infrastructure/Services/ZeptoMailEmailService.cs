using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Services;

/// <summary>
/// Sends emails via Zoho ZeptoMail (Mail Send API).
/// Docs: https://zeptomail.zoho.com/portal/en/developer#MailSendAPI
/// </summary>
public class ZeptoMailEmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ZeptoMailEmailService> _logger;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public ZeptoMailEmailService(HttpClient httpClient, IConfiguration configuration, ILogger<ZeptoMailEmailService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        var section = configuration.GetSection("ZeptoMail");
        var apiKey = section["ApiKey"] ?? "";
        _fromEmail = section["FromEmail"] ?? "noreply@runam.app";
        _fromName = section["FromName"] ?? "RunAm";

        _httpClient.BaseAddress = new Uri("https://api.zeptomail.com/v1.1/");
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Zoho-enczapikey", apiKey);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                from = new { address = _fromEmail, name = _fromName },
                to = new[] { new { email_address = new { address = toEmail, name = toName } } },
                subject,
                htmlBody = htmlBody
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("email", content, ct);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("ZeptoMail send failed: {StatusCode} — {Error}", response.StatusCode, error);
            }
            else
            {
                _logger.LogInformation("Email sent to {Email} via ZeptoMail", toEmail);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email} via ZeptoMail", toEmail);
        }
    }

    public async Task SendBulkAsync(IEnumerable<(string Email, string Name)> recipients, string subject, string htmlBody, CancellationToken ct = default)
    {
        // ZeptoMail supports batch sending
        try
        {
            var toList = recipients.Select(r => new { email_address = new { address = r.Email, name = r.Name } }).ToArray();

            var payload = new
            {
                from = new { address = _fromEmail, name = _fromName },
                to = toList,
                subject,
                htmlBody = htmlBody
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("email", content, ct);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("ZeptoMail bulk send failed: {StatusCode} — {Error}", response.StatusCode, error);
            }
            else
            {
                _logger.LogInformation("Bulk email sent to {Count} recipients via ZeptoMail", toList.Length);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send bulk email via ZeptoMail");
        }
    }
}
