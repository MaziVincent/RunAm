using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using Xunit;

namespace RunAm.UnitTests.Domain;

public class ErrandTests
{
    [Fact]
    public void CanTransitionTo_PendingToAccepted_ReturnsTrue()
    {
        var errand = new Errand { Status = ErrandStatus.Pending };
        Assert.True(errand.CanTransitionTo(ErrandStatus.Accepted));
    }

    [Fact]
    public void CanTransitionTo_PendingToCancelled_ReturnsTrue()
    {
        var errand = new Errand { Status = ErrandStatus.Pending };
        Assert.True(errand.CanTransitionTo(ErrandStatus.Cancelled));
    }

    [Fact]
    public void CanTransitionTo_PendingToDelivered_ReturnsFalse()
    {
        var errand = new Errand { Status = ErrandStatus.Pending };
        Assert.False(errand.CanTransitionTo(ErrandStatus.Delivered));
    }

    [Fact]
    public void CanTransitionTo_AcceptedToEnRouteToPickup_ReturnsTrue()
    {
        var errand = new Errand { Status = ErrandStatus.Accepted };
        Assert.True(errand.CanTransitionTo(ErrandStatus.EnRouteToPickup));
    }

    [Fact]
    public void TransitionTo_ValidTransition_UpdatesStatusAndTimestamp()
    {
        var errand = new Errand { Status = ErrandStatus.Pending };

        errand.TransitionTo(ErrandStatus.Accepted);

        Assert.Equal(ErrandStatus.Accepted, errand.Status);
        Assert.NotNull(errand.AcceptedAt);
        Assert.Single(errand.StatusHistory);
    }

    [Fact]
    public void TransitionTo_InvalidTransition_ThrowsException()
    {
        var errand = new Errand { Status = ErrandStatus.Pending };

        Assert.Throws<InvalidOperationException>(() =>
            errand.TransitionTo(ErrandStatus.Delivered));
    }

    [Fact]
    public void TransitionTo_Cancel_SetsCancellationDetails()
    {
        var errand = new Errand { Status = ErrandStatus.Pending };

        errand.TransitionTo(ErrandStatus.Cancelled, notes: "User requested cancellation");

        Assert.Equal(ErrandStatus.Cancelled, errand.Status);
        Assert.NotNull(errand.CancelledAt);
        Assert.Equal("User requested cancellation", errand.CancellationReason);
    }

    [Fact]
    public void TransitionTo_FullLifecycle_WorksCorrectly()
    {
        var errand = new Errand { Status = ErrandStatus.Pending };

        errand.TransitionTo(ErrandStatus.Accepted);
        errand.TransitionTo(ErrandStatus.EnRouteToPickup);
        errand.TransitionTo(ErrandStatus.ArrivedAtPickup);
        errand.TransitionTo(ErrandStatus.PackageCollected);
        errand.TransitionTo(ErrandStatus.EnRouteToDropoff);
        errand.TransitionTo(ErrandStatus.ArrivedAtDropoff);
        errand.TransitionTo(ErrandStatus.Delivered);

        Assert.Equal(ErrandStatus.Delivered, errand.Status);
        Assert.NotNull(errand.AcceptedAt);
        Assert.NotNull(errand.PickedUpAt);
        Assert.NotNull(errand.DeliveredAt);
        Assert.Equal(7, errand.StatusHistory.Count);
    }
}
