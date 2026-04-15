using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Shared.Constants;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Application.Errands.Commands;

public record CreateErrandCommand(Guid CustomerId, CreateErrandRequest Request) : IRequest<ErrandDto>;

public class CreateErrandCommandHandler : IRequestHandler<CreateErrandCommand, ErrandDto>
{
    private readonly IErrandRepository _errandRepo;
    private readonly IUnitOfWork _uow;

    public CreateErrandCommandHandler(IErrandRepository errandRepo, IUnitOfWork uow)
    {
        _errandRepo = errandRepo;
        _uow = uow;
    }

    public async Task<ErrandDto> Handle(CreateErrandCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;

        // Calculate pricing
        var pricing = CalculatePrice(req);

        var errand = new Errand
        {
            CustomerId = command.CustomerId,
            Category = req.Category,
            Description = req.Description,
            SpecialInstructions = req.SpecialInstructions,
            Priority = req.Priority,
            ScheduledAt = req.ScheduledAt,
            PickupAddress = req.PickupAddress,
            PickupLatitude = req.PickupLatitude,
            PickupLongitude = req.PickupLongitude,
            DropoffAddress = req.DropoffAddress,
            DropoffLatitude = req.DropoffLatitude,
            DropoffLongitude = req.DropoffLongitude,
            PackageSize = req.PackageSize,
            PackageWeight = req.PackageWeight,
            IsFragile = req.IsFragile,
            RequiresPhotoProof = req.RequiresPhotoProof,
            RecipientName = req.RecipientName,
            RecipientPhone = req.RecipientPhone,
            EstimatedDistance = pricing.EstimatedDistanceKm * 1000,
            EstimatedDuration = pricing.EstimatedDurationMinutes * 60,
            TotalAmount = pricing.EstimatedPrice,
            CommissionAmount = pricing.EstimatedPrice * AppConstants.Pricing.CommissionRate,
            PricingBreakdown = System.Text.Json.JsonSerializer.Serialize(pricing),
            Status = ErrandStatus.Pending
        };

        // Add initial status history
        errand.StatusHistory.Add(new ErrandStatusHistory
        {
            ErrandId = errand.Id,
            Status = ErrandStatus.Pending,
            Notes = "Errand created"
        });

        // Add stops if multi-stop
        if (req.Stops?.Any() == true)
        {
            foreach (var stop in req.Stops)
            {
                errand.Stops.Add(new ErrandStop
                {
                    ErrandId = errand.Id,
                    StopOrder = stop.StopOrder,
                    Address = stop.Address,
                    Latitude = stop.Latitude,
                    Longitude = stop.Longitude,
                    ContactName = stop.ContactName,
                    ContactPhone = stop.ContactPhone,
                    Instructions = stop.Instructions
                });
            }
        }

        await _errandRepo.AddAsync(errand, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return MapToDto(errand);
    }

    private static PriceEstimateResponse CalculatePrice(CreateErrandRequest req)
    {
        var distanceKm = CalculateRouteDistance(req);
        var durationMinutes = (int)Math.Ceiling(distanceKm * 3); // Rough estimate: 3 min per km

        var baseFare = AppConstants.Pricing.BaseFare;
        var distanceFare = (decimal)distanceKm * AppConstants.Pricing.PerKmRate;

        var weightSurcharge = (req.PackageWeight ?? 0) * AppConstants.Pricing.WeightSurchargePerKg;

        var sizeSurcharge = req.PackageSize switch
        {
            PackageSize.Small => AppConstants.Pricing.SmallPackageSurcharge,
            PackageSize.Medium => AppConstants.Pricing.MediumPackageSurcharge,
            PackageSize.Large => AppConstants.Pricing.LargePackageSurcharge,
            PackageSize.ExtraLarge => AppConstants.Pricing.ExtraLargePackageSurcharge,
            _ => 0m
        };

        var fragileSurcharge = req.IsFragile ? AppConstants.Pricing.FragileSurcharge : 0m;

        var subtotal = baseFare + distanceFare + weightSurcharge + sizeSurcharge + fragileSurcharge;

        var prioritySurcharge = req.Priority == ErrandPriority.Express
            ? subtotal * (AppConstants.Pricing.ExpressMultiplier - 1)
            : 0m;

        var total = Math.Max(subtotal + prioritySurcharge, AppConstants.Pricing.MinimumFare);

        return new PriceEstimateResponse(
            EstimatedPrice: Math.Round(total, 2),
            BaseFare: baseFare,
            DistanceFare: Math.Round(distanceFare, 2),
            WeightSurcharge: Math.Round(weightSurcharge + sizeSurcharge + fragileSurcharge, 2),
            PrioritySurcharge: Math.Round(prioritySurcharge, 2),
            EstimatedDistanceKm: Math.Round(distanceKm, 2),
            EstimatedDurationMinutes: durationMinutes
        );
    }

    private static double CalculateRouteDistance(CreateErrandRequest req)
    {
        var points = new List<(double Latitude, double Longitude)>
        {
            (req.PickupLatitude, req.PickupLongitude)
        };

        if (req.Stops?.Any() == true)
        {
            points.AddRange(req.Stops
                .OrderBy(stop => stop.StopOrder)
                .Select(stop => (stop.Latitude, stop.Longitude)));
        }

        points.Add((req.DropoffLatitude, req.DropoffLongitude));

        double totalDistance = 0;
        for (var i = 0; i < points.Count - 1; i++)
        {
            totalDistance += CalculateDistance(
                points[i].Latitude,
                points[i].Longitude,
                points[i + 1].Latitude,
                points[i + 1].Longitude);
        }

        return totalDistance;
    }

    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Earth radius in km
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;

    private static ErrandDto MapToDto(Errand e) => new(
        e.Id, e.CustomerId, "", e.RiderId, null, e.Category, e.Status,
        e.Description, e.SpecialInstructions, e.Priority, e.ScheduledAt,
        e.PickupAddress, e.PickupLatitude, e.PickupLongitude,
        e.DropoffAddress, e.DropoffLatitude, e.DropoffLongitude,
        e.EstimatedDistance, e.EstimatedDuration, e.PackageSize, e.PackageWeight,
        e.IsFragile, e.RequiresPhotoProof, e.RecipientName, e.RecipientPhone,
        e.TotalAmount, e.AcceptedAt, e.PickedUpAt, e.DeliveredAt, e.CancelledAt,
        e.CancellationReason, e.CreatedAt,
        e.StatusHistory.Select(s => new ErrandStatusHistoryDto(s.Id, s.Status, s.Latitude, s.Longitude, s.Notes, s.ImageUrl, s.CreatedAt)).ToList(),
        e.Stops.Select(s => new ErrandStopDto(s.Id, s.StopOrder, s.Address, s.Latitude, s.Longitude, s.ContactName, s.ContactPhone, s.Instructions, s.Status, s.ArrivedAt, s.CompletedAt)).ToList()
    );
}
