using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Riders;

namespace RunAm.Application.Riders.Commands;

public record UpdateRiderLocationCommand(Guid UserId, BatchLocationUpdate Request) : IRequest<Unit>;

public class UpdateRiderLocationCommandHandler : IRequestHandler<UpdateRiderLocationCommand, Unit>
{
    private readonly IRiderRepository _riderRepo;
    private readonly IUnitOfWork _uow;

    public UpdateRiderLocationCommandHandler(IRiderRepository riderRepo, IUnitOfWork uow)
    {
        _riderRepo = riderRepo;
        _uow = uow;
    }

    public async Task<Unit> Handle(UpdateRiderLocationCommand command, CancellationToken cancellationToken)
    {
        var profile = await _riderRepo.GetByUserIdAsync(command.UserId, cancellationToken)
            ?? throw new NotFoundException("RiderProfile", command.UserId);

        var lastPoint = command.Request.Points.OrderByDescending(p => p.RecordedAt).First();
        profile.CurrentLatitude = lastPoint.Latitude;
        profile.CurrentLongitude = lastPoint.Longitude;
        profile.LastLocationUpdate = DateTime.UtcNow;

        await _riderRepo.UpdateAsync(profile, cancellationToken);

        // Store location history
        var locations = command.Request.Points.Select(p => new RiderLocation
        {
            RiderId = command.UserId,
            Latitude = p.Latitude,
            Longitude = p.Longitude,
            Heading = p.Heading,
            Speed = p.Speed,
            RecordedAt = p.RecordedAt
        });

        await _riderRepo.AddLocationsAsync(locations, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
