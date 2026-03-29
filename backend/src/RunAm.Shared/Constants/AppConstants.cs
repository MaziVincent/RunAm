namespace RunAm.Shared.Constants;

public static class AppConstants
{
    public const string ApiVersion = "v1";
    public const string ApiBasePath = $"/api/{ApiVersion}";

    public static class Roles
    {
        public const string Customer = "Customer";
        public const string Rider = "Rider";
        public const string Merchant = "Merchant";
        public const string Admin = "Admin";
        public const string SupportAgent = "SupportAgent";
    }

    public static class Pricing
    {
        public static decimal BaseFare { get; set; } = 500m;             // Overridden by DELIVERY_BASE_FARE env var
        public static decimal PerKmRate { get; set; } = 100m;            // Overridden by DELIVERY_PER_KM_RATE env var
        public const decimal PerMinuteRate = 15m;         // Per minute rate
        public const decimal ExpressMultiplier = 1.5m;    // Express priority multiplier
        public const decimal SmallPackageSurcharge = 0m;
        public const decimal MediumPackageSurcharge = 200m;
        public const decimal LargePackageSurcharge = 500m;
        public const decimal ExtraLargePackageSurcharge = 1000m;
        public const decimal WeightSurchargePerKg = 50m;
        public const decimal FragileSurcharge = 300m;
        public const decimal MinimumFare = 800m;
        public const decimal CommissionRate = 0.20m;      // 20% commission
    }

    public static class Matching
    {
        public const double InitialRadiusKm = 3.0;
        public const double MaxRadiusKm = 15.0;
        public const double RadiusIncrementKm = 2.0;
        public const int OfferTimeoutSeconds = 30;
        public const int MaxReassignmentAttempts = 5;
        public const decimal MinRiderRating = 3.5m;
    }

    public static class Auth
    {
        public const int AccessTokenExpirationMinutes = 60;
        public const int RefreshTokenExpirationDays = 7;
        public const int MaxLoginAttempts = 5;
        public const int LockoutDurationMinutes = 15;
    }
}
