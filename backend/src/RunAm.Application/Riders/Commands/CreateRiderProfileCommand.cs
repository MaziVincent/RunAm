using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Riders;

namespace RunAm.Application.Riders.Commands;

public record CreateRiderProfileCommand(Guid UserId, CreateRiderProfileRequest Request) : IRequest<RiderProfileDto>;

public class CreateRiderProfileCommandHandler : IRequestHandler<CreateRiderProfileCommand, RiderProfileDto>
{
    private readonly IRiderRepository _riderRepo;
    private readonly IUnitOfWork _uow;

    public CreateRiderProfileCommandHandler(IRiderRepository riderRepo, IUnitOfWork uow)
    {
        _riderRepo = riderRepo;
        _uow = uow;
    }

    public async Task<RiderProfileDto> Handle(CreateRiderProfileCommand command, CancellationToken cancellationToken)
    {
        var existing = await _riderRepo.GetByUserIdAsync(command.UserId, cancellationToken);
        if (existing != null)
            throw new InvalidOperationException("Rider profile already exists.");

        var profile = new RiderProfile
        {
            UserId = command.UserId,
            VehicleType = command.Request.VehicleType,
            LicensePlate = command.Request.LicensePlate,
            ApprovalStatus = Domain.Enums.ApprovalStatus.Pending
        };

        await _riderRepo.AddAsync(profile, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new RiderProfileDto(
            profile.Id, profile.UserId, "", profile.VehicleType, profile.LicensePlate,
            profile.ApprovalStatus, profile.Rating, profile.TotalCompletedTasks,
            profile.IsOnline, profile.CurrentLatitude, profile.CurrentLongitude,
            profile.LastLocationUpdate, profile.CreatedAt
        );
    }
}
