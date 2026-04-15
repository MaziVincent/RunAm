using MediatR;
using RunAm.Domain.Enums;
using RunAm.Shared.Constants;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Application.Errands.Queries;

public record GetPriceEstimateQuery(PriceEstimateRequest Request) : IRequest<PriceEstimateResponse>;

public class GetPriceEstimateQueryHandler : IRequestHandler<GetPriceEstimateQuery, PriceEstimateResponse>
{
    public Task<PriceEstimateResponse> Handle(GetPriceEstimateQuery query, CancellationToken cancellationToken)
    {
        var req = query.Request;
        var distanceKm = CalculateRouteDistance(req);
        var durationMinutes = (int)Math.Ceiling(distanceKm * 3);

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

        var fragileSurcharge = 0m; // Not included in estimate request

        var subtotal = baseFare + distanceFare + weightSurcharge + sizeSurcharge + fragileSurcharge;

        var prioritySurcharge = req.Priority == ErrandPriority.Express
            ? subtotal * (AppConstants.Pricing.ExpressMultiplier - 1)
            : 0m;

        var total = Math.Max(subtotal + prioritySurcharge, AppConstants.Pricing.MinimumFare);

        var result = new PriceEstimateResponse(
            EstimatedPrice: Math.Round(total, 2),
            BaseFare: baseFare,
            DistanceFare: Math.Round(distanceFare, 2),
            WeightSurcharge: Math.Round(weightSurcharge + sizeSurcharge, 2),
            PrioritySurcharge: Math.Round(prioritySurcharge, 2),
            EstimatedDistanceKm: Math.Round(distanceKm, 2),
            EstimatedDurationMinutes: durationMinutes
        );

        return Task.FromResult(result);
    }

    private static double CalculateRouteDistance(PriceEstimateRequest req)
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
        const double R = 6371;
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}
