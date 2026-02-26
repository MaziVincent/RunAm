namespace RunAm.Domain.Enums;

public enum ErrandStatus
{
    Pending = 0,
    Accepted = 1,
    EnRouteToPickup = 2,
    ArrivedAtPickup = 3,
    PackageCollected = 4,
    EnRouteToDropoff = 5,
    ArrivedAtDropoff = 6,
    Delivered = 7,
    Cancelled = 8,
    Failed = 9
}
