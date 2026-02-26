using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using Xunit;

namespace RunAm.UnitTests.Domain;

public class ApplicationUserTests
{
    [Fact]
    public void FullName_ReturnsFirstAndLastName()
    {
        var user = new ApplicationUser { FirstName = "John", LastName = "Doe" };
        Assert.Equal("John Doe", user.FullName);
    }

    [Fact]
    public void FullName_WithOnlyFirstName_ReturnsFirstName()
    {
        var user = new ApplicationUser { FirstName = "John", LastName = "" };
        Assert.Equal("John", user.FullName);
    }

    [Fact]
    public void NewUser_HasDefaultValues()
    {
        var user = new ApplicationUser();

        Assert.Equal(UserRole.Customer, user.Role);
        Assert.Equal(UserStatus.PendingVerification, user.Status);
        Assert.False(user.IsPhoneVerified);
        Assert.False(user.IsEmailVerified);
    }
}
