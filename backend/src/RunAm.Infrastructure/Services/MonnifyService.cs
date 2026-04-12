using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Services;

public class MonnifyService : IMonnifyService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<MonnifyService> _logger;
    private string? _accessToken;
    private DateTime _tokenExpiry = DateTime.MinValue;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public MonnifyService(HttpClient http, IConfiguration config, ILogger<MonnifyService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;

        var baseUrl = _config["Monnify:BaseUrl"] ?? "https://sandbox.monnify.com";
        _http.BaseAddress = new Uri(baseUrl);
    }

    // ── Authentication ──────────────────────────────────

    private async Task EnsureAuthenticatedAsync(CancellationToken ct)
    {
        if (_accessToken is not null && DateTime.UtcNow < _tokenExpiry) return;

        var apiKey = _config["Monnify:ApiKey"]
            ?? throw new InvalidOperationException("Monnify:ApiKey is not configured.");
        var secretKey = _config["Monnify:SecretKey"]
            ?? throw new InvalidOperationException("Monnify:SecretKey is not configured.");

        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{apiKey}:{secretKey}"));

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<MonnifyApiResponse<MonnifyAuthData>>(JsonOpts, ct);
        _accessToken = result?.ResponseBody?.AccessToken
            ?? throw new InvalidOperationException("Failed to authenticate with Monnify.");
        _tokenExpiry = DateTime.UtcNow.AddMinutes(4); // Monnify tokens last ~5 min, refresh early

        _logger.LogDebug("Monnify authentication successful");
    }

    private async Task<HttpRequestMessage> CreateAuthedRequestAsync(HttpMethod method, string url, CancellationToken ct)
    {
        await EnsureAuthenticatedAsync(ct);
        var req = new HttpRequestMessage(method, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
        return req;
    }

    // ── Reserve Virtual Account ─────────────────────────

    public async Task<MonnifyReservedAccount> ReserveAccountAsync(Guid userId, string name, string email, string nin, CancellationToken ct)
    {
        var contractCode = _config["Monnify:ContractCode"]
            ?? throw new InvalidOperationException("Monnify:ContractCode is not configured.");

        var accountReference = $"RUNAM-{userId}";

        var body = new
        {
            accountReference,
            accountName = name,
            currencyCode = "NGN",
            contractCode,
            customerEmail = email,
            customerName = name,
            nin,
            getAllAvailableBanks = false,
            preferredBanks = new[] { "035" } // Wema Bank — commonly used for reserved accounts
        };

        var request = await CreateAuthedRequestAsync(HttpMethod.Post, "/api/v2/bank-transfer/reserved-accounts", ct);
        request.Content = JsonContent.Create(body, options: JsonOpts);

        var response = await _http.SendAsync(request, ct);
        var content = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Monnify reserve account failed: {StatusCode} {Content}", response.StatusCode, content);
            throw new InvalidOperationException($"Failed to reserve Monnify account: {content}");
        }

        var result = JsonSerializer.Deserialize<MonnifyApiResponse<MonnifyReserveAccountData>>(content, JsonOpts);
        var account = result?.ResponseBody?.Accounts?.FirstOrDefault()
            ?? throw new InvalidOperationException("No account returned from Monnify.");

        return new MonnifyReservedAccount(
            account.AccountNumber,
            account.AccountName,
            account.BankName,
            account.BankCode,
            accountReference
        );
    }

    // ── Initialize Transaction (Card / Bank Transfer / USSD) ──

    public async Task<MonnifyInitTransactionResult> InitializeTransactionAsync(
        decimal amount, string customerName, string customerEmail, string paymentReference, string paymentDescription, string redirectUrl, CancellationToken ct)
    {
        var contractCode = _config["Monnify:ContractCode"]
            ?? throw new InvalidOperationException("Monnify:ContractCode is not configured.");

        var body = new
        {
            amount,
            customerName,
            customerEmail,
            paymentReference,
            paymentDescription,
            currencyCode = "NGN",
            contractCode,
            redirectUrl,
            paymentMethods = new[] { "CARD", "ACCOUNT_TRANSFER" }
        };

        var request = await CreateAuthedRequestAsync(HttpMethod.Post, "/api/v1/merchant/transactions/init-transaction", ct);
        request.Content = JsonContent.Create(body, options: JsonOpts);

        var response = await _http.SendAsync(request, ct);
        var content = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Monnify init transaction failed: {StatusCode} {Content}", response.StatusCode, content);
            return new MonnifyInitTransactionResult(false, null, null, content);
        }

        var result = JsonSerializer.Deserialize<MonnifyApiResponse<MonnifyInitTransactionData>>(content, JsonOpts);
        var data = result?.ResponseBody;

        return new MonnifyInitTransactionResult(
            data is not null,
            data?.TransactionReference,
            data?.CheckoutUrl,
            result?.ResponseMessage
        );
    }

    // ── Initiate Transfer (Payout) ──────────────────────

    public async Task<MonnifyTransferResult> InitiateTransferAsync(
        decimal amount, string bankCode, string accountNumber, string accountName, string reference, CancellationToken ct)
    {
        var sourceAccountNumber = _config["Monnify:SourceAccountNumber"]
            ?? throw new InvalidOperationException("Monnify:SourceAccountNumber is not configured.");

        var body = new
        {
            amount,
            reference,
            narration = $"RunAm payout - {reference}",
            destinationBankCode = bankCode,
            destinationAccountNumber = accountNumber,
            destinationAccountName = accountName,
            currency = "NGN",
            sourceAccountNumber,
            async = true
        };

        var request = await CreateAuthedRequestAsync(HttpMethod.Post, "/api/v2/disbursements/single", ct);
        request.Content = JsonContent.Create(body, options: JsonOpts);

        var response = await _http.SendAsync(request, ct);
        var content = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Monnify transfer failed: {StatusCode} {Content}", response.StatusCode, content);
            return new MonnifyTransferResult(false, null, null, content);
        }

        var result = JsonSerializer.Deserialize<MonnifyApiResponse<MonnifyTransferData>>(content, JsonOpts);
        var status = result?.ResponseBody?.Status;

        return new MonnifyTransferResult(
            status == "SUCCESS" || status == "PENDING" || status == "PENDING_AUTHORIZATION",
            result?.ResponseBody?.Reference,
            status,
            result?.ResponseMessage
        );
    }

    public async Task<MonnifyTransferStatus> GetTransferStatusAsync(string reference, CancellationToken ct)
    {
        var encodedRef = Uri.EscapeDataString(reference);
        var request = await CreateAuthedRequestAsync(HttpMethod.Get, $"/api/v2/disbursements/single/summary?reference={encodedRef}", ct);

        var response = await _http.SendAsync(request, ct);
        var content = await response.Content.ReadAsStringAsync(ct);

        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return new MonnifyTransferStatus(false, null, null, "Transfer not found.");
        }

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Monnify transfer status lookup failed: {StatusCode} {Content}", response.StatusCode, content);
            return new MonnifyTransferStatus(false, null, null, content);
        }

        var result = JsonSerializer.Deserialize<MonnifyApiResponse<MonnifyTransferSummaryData>>(content, JsonOpts);
        return new MonnifyTransferStatus(
            true,
            result?.ResponseBody?.Status,
            result?.ResponseBody?.TransactionReference,
            result?.ResponseBody?.TransactionDescription
        );
    }

    // ── Verify Transaction ──────────────────────────────

    public async Task<MonnifyTransactionStatus> VerifyTransactionAsync(string transactionReference, CancellationToken ct)
    {
        var encodedRef = Uri.EscapeDataString(transactionReference);
        var request = await CreateAuthedRequestAsync(HttpMethod.Get, $"/api/v2/transactions/{encodedRef}", ct);

        var response = await _http.SendAsync(request, ct);
        var content = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Monnify transaction verify failed: {StatusCode}", response.StatusCode);
            return new MonnifyTransactionStatus(false, 0, null, null, null);
        }

        var result = JsonSerializer.Deserialize<MonnifyApiResponse<MonnifyTransactionData>>(content, JsonOpts);
        var body = result?.ResponseBody;

        return new MonnifyTransactionStatus(
            body?.PaymentStatus == "PAID",
            body?.AmountPaid ?? 0,
            body?.PaymentReference,
            body?.TransactionReference ?? transactionReference,
            body?.Product?.Reference
        );
    }

    // ── Validate Bank Account ────────────────────────────

    public async Task<MonnifyBankAccountInfo> ValidateBankAccountAsync(string bankCode, string accountNumber, CancellationToken ct)
    {
        var request = await CreateAuthedRequestAsync(HttpMethod.Get,
            $"/api/v1/disbursements/account/validate?accountNumber={Uri.EscapeDataString(accountNumber)}&bankCode={Uri.EscapeDataString(bankCode)}", ct);

        var response = await _http.SendAsync(request, ct);
        var content = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Monnify bank account validation failed: {StatusCode} {Content}", response.StatusCode, content);
            return new MonnifyBankAccountInfo(false, null, null, null);
        }

        var result = JsonSerializer.Deserialize<MonnifyApiResponse<MonnifyBankValidationData>>(content, JsonOpts);
        var body = result?.ResponseBody;

        return new MonnifyBankAccountInfo(
            body?.AccountName is not null,
            body?.AccountNumber,
            body?.AccountName,
            body?.BankCode
        );
    }

    // ── Internal DTOs for Monnify API responses ─────────

    private record MonnifyApiResponse<T>(bool RequestSuccessful, string ResponseMessage, T? ResponseBody);
    private record MonnifyAuthData(string AccessToken, long ExpiresIn);
    private record MonnifyReserveAccountData(List<MonnifyAccountInfo>? Accounts);
    private record MonnifyAccountInfo(string AccountNumber, string AccountName, string BankName, string BankCode);
    private record MonnifyTransferData(string? Reference, string? Status);
    private record MonnifyTransferSummaryData(string? Status, string? TransactionReference, string? TransactionDescription);
    private record MonnifyInitTransactionData(string? TransactionReference, string? PaymentReference, string? CheckoutUrl);
    private record MonnifyTransactionData(
        string? PaymentStatus,
        decimal AmountPaid,
        string? PaymentReference,
        string? TransactionReference,
        MonnifyTransactionProductData? Product);
    private record MonnifyTransactionProductData(string? Reference);
    private record MonnifyBankValidationData(string? AccountNumber, string? AccountName, string? BankCode);
}
