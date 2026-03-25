using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using RunAm.Infrastructure.Services;
using Xunit;

namespace RunAm.UnitTests.Services;

public class ZeptoMailEmailServiceTests
{
    private readonly Mock<HttpMessageHandler> _httpHandler;
    private readonly ZeptoMailEmailService _service;
    private readonly List<HttpRequestMessage> _capturedRequests = new();

    public ZeptoMailEmailServiceTests()
    {
        _httpHandler = new Mock<HttpMessageHandler>();
        _httpHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) => _capturedRequests.Add(req))
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK));

        var httpClient = new HttpClient(_httpHandler.Object);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ZeptoMail:ApiKey"] = "test-api-key",
                ["ZeptoMail:FromEmail"] = "support@wegorunam.com",
                ["ZeptoMail:FromName"] = "RunAm"
            })
            .Build();

        _service = new ZeptoMailEmailService(
            httpClient,
            config,
            Mock.Of<ILogger<ZeptoMailEmailService>>());
    }

    [Fact]
    public async Task SendAsync_CallsZeptoMailApi()
    {
        // Act
        await _service.SendAsync(
            "user@example.com",
            "Test User",
            "Welcome to RunAm",
            "<h1>Welcome!</h1><p>Thanks for joining.</p>");

        // Assert
        _capturedRequests.Should().HaveCount(1);
        var request = _capturedRequests[0];
        request.RequestUri!.ToString().Should().Contain("email");

        var content = await request.Content!.ReadAsStringAsync();
        content.Should().Contain("user@example.com");
        content.Should().Contain("Welcome to RunAm");
        content.Should().Contain("Welcome!");
    }

    [Fact]
    public async Task SendAsync_SetsAuthorizationHeader()
    {
        // Act
        await _service.SendAsync("a@b.com", "A", "Subject", "<p>body</p>");

        // Assert
        _capturedRequests.Should().HaveCount(1);
        var request = _capturedRequests[0];
        request.Headers.Authorization.Should().NotBeNull();
        request.Headers.Authorization!.Scheme.Should().Be("Zoho-enczapikey");
        request.Headers.Authorization!.Parameter.Should().Be("test-api-key");
    }

    [Fact]
    public async Task SendAsync_DoesNotThrow_OnApiError()
    {
        // Arrange — override to return error
        _httpHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.InternalServerError)
            {
                Content = new StringContent("{\"error\": \"Internal error\"}")
            });

        // Act — should not throw, just log
        var act = () => _service.SendAsync("a@b.com", "A", "Test", "<p>x</p>");
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task SendBulkAsync_SendsToAllRecipients()
    {
        // Act
        var recipients = new List<(string Email, string Name)>
        {
            ("user1@example.com", "User 1"),
            ("user2@example.com", "User 2"),
        };

        await _service.SendBulkAsync(recipients, "Announcement", "<p>News</p>");

        // Assert — bulk sends in a single API call
        _capturedRequests.Should().HaveCount(1);
        var content = await _capturedRequests[0].Content!.ReadAsStringAsync();
        content.Should().Contain("user1@example.com");
        content.Should().Contain("user2@example.com");
    }
}
