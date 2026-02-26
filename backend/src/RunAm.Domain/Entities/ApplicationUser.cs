using Microsoft.AspNetCore.Identity;
using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
    public UserStatus Status { get; set; } = UserStatus.PendingVerification;
    public bool IsPhoneVerified { get; set; }
    public bool IsEmailVerified { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public RiderProfile? RiderProfile { get; set; }
    public ICollection<UserAddress> Addresses { get; set; } = new List<UserAddress>();
    public ICollection<Errand> CustomerErrands { get; set; } = new List<Errand>();
    public ICollection<Errand> RiderErrands { get; set; } = new List<Errand>();
    public ICollection<Review> ReviewsGiven { get; set; } = new List<Review>();
    public ICollection<Review> ReviewsReceived { get; set; } = new List<Review>();
    public NotificationPreference? NotificationPreference { get; set; }

    public string FullName => $"{FirstName} {LastName}".Trim();
}
