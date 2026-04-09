using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using RunAm.Application.Auth.Commands;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Auth;
using Xunit;

namespace RunAm.UnitTests.Services;

public class RegistrationOtpFlowTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManager;
    private readonly Mock<IOtpService> _otpService;
    private readonly Mock<ISmsService> _smsService;
    private readonly RegisterCommandHandler _handler;
    private readonly List<ApplicationUser> _users = [];

    public RegistrationOtpFlowTests()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        _userManager = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _userManager.SetupGet(x => x.Users).Returns(_users.AsQueryable());
        _otpService = new Mock<IOtpService>();
        _smsService = new Mock<ISmsService>();

        _handler = new RegisterCommandHandler(
            _userManager.Object,
            _otpService.Object,
            _smsService.Object);
    }

    [Fact]
    public async Task Register_CreatesUser_WithPendingVerificationStatus()
    {
        // Arrange
        ApplicationUser? createdUser = null;
        _userManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser?)null);
        _userManager.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .Callback<ApplicationUser, string>((u, _) =>
            {
                createdUser = u;
                _users.Add(u);
            })
            .ReturnsAsync(IdentityResult.Success);
        _userManager.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _otpService.Setup(x => x.GenerateAsync(It.IsAny<Guid>(), It.IsAny<string>(),
                VerificationCodeType.PhoneVerification, It.IsAny<CancellationToken>()))
            .ReturnsAsync("123456");

        var request = new RegisterRequest("test@runam.app", "+2348001234567", "Password1", "John", "Doe");
        var command = new RegisterCommand(request);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        createdUser.Should().NotBeNull();
        createdUser!.Status.Should().Be(UserStatus.PendingVerification);
        createdUser.IsEmailVerified.Should().BeFalse();
    }

    [Fact]
    public async Task Register_SendsOtpSms()
    {
        // Arrange
        _userManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser?)null);
        _userManager.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .Callback<ApplicationUser, string>((u, _) => _users.Add(u))
            .ReturnsAsync(IdentityResult.Success);
        _userManager.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _otpService.Setup(x => x.GenerateAsync(It.IsAny<Guid>(), "+2348001234567",
                VerificationCodeType.PhoneVerification, It.IsAny<CancellationToken>()))
            .ReturnsAsync("654321");

        var request = new RegisterRequest("test@runam.app", "+2348001234567", "Password1", "John", "Doe");

        // Act
        var result = await _handler.Handle(new RegisterCommand(request), CancellationToken.None);

        // Assert
        result.RequiresVerification.Should().BeTrue();
        result.PhoneNumber.Should().Be("+2348001234567");

        _smsService.Verify(s => s.SendAsync(
            "+2348001234567",
            It.Is<string>(msg => msg.Contains("654321")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Register_DoesNotReturnJwtTokens()
    {
        // Arrange
        _userManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser?)null);
        _userManager.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .Callback<ApplicationUser, string>((u, _) => _users.Add(u))
            .ReturnsAsync(IdentityResult.Success);
        _userManager.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _otpService.Setup(x => x.GenerateAsync(It.IsAny<Guid>(), It.IsAny<string>(),
                It.IsAny<VerificationCodeType>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("123456");

        var request = new RegisterRequest("test@runam.app", "+234800", "Password1", "A", "B");

        // Act
        var result = await _handler.Handle(new RegisterCommand(request), CancellationToken.None);

        // Assert — RegisterResponse has no tokens
        result.Should().BeOfType<RegisterResponse>();
        result.RequiresVerification.Should().BeTrue();
        result.Message.Should().Contain("verify");
    }

    [Fact]
    public async Task Register_ThrowsIfEmailAlreadyExists()
    {
        // Arrange
        _userManager.Setup(x => x.FindByEmailAsync("taken@runam.app"))
            .ReturnsAsync(new ApplicationUser { Email = "taken@runam.app" });

        var request = new RegisterRequest("taken@runam.app", "+234800", "Password1", "A", "B");

        // Act & Assert
        var act = () => _handler.Handle(new RegisterCommand(request), CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already exists*");
    }

    [Fact]
    public async Task Register_PreventsAdminRoleEscalation()
    {
        // Arrange
        ApplicationUser? createdUser = null;
        _userManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser?)null);
        _userManager.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .Callback<ApplicationUser, string>((u, _) =>
            {
                createdUser = u;
                _users.Add(u);
            })
            .ReturnsAsync(IdentityResult.Success);
        _userManager.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _otpService.Setup(x => x.GenerateAsync(It.IsAny<Guid>(), It.IsAny<string>(),
                It.IsAny<VerificationCodeType>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("123456");

        // Try to register as Admin
        var request = new RegisterRequest("hacker@evil.com", "+234800", "Password1", "H", "X", UserRole.Admin);

        // Act
        await _handler.Handle(new RegisterCommand(request), CancellationToken.None);

        // Assert — should be demoted to Customer
        createdUser.Should().NotBeNull();
        createdUser!.Role.Should().Be(UserRole.Customer);
    }

    [Fact]
    public async Task Register_ThrowsIfPhoneNumberAlreadyExists()
    {
        // Arrange
        _users.Add(new ApplicationUser
        {
            Email = "existing@runam.app",
            PhoneNumber = "+2348001234567"
        });

        _userManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser?)null);

        var request = new RegisterRequest("new@runam.app", "+234 800 123 4567", "Password1", "A", "B");

        // Act
        var act = () => _handler.Handle(new RegisterCommand(request), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*phone number already exists*");
    }
}
