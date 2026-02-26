using MediatR;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Riders;

namespace RunAm.Application.Riders.Commands;

public record UpdateRiderStatusCommand(Guid UserId, bool IsOnline) : IRequest<RiderProfileDto>;

public class UpdateRiderStatusCommandHandler : IRequestHandler<UpdateRiderStatusCommand, RiderProfileDto>
{
    private readonly IRiderRepository _riderRepo;
    private readonly IUnitOfWork _uow;

    public UpdateRiderStatusCommandHandler(IRiderRepository riderRepo, IUnitOfWork uow)
    {
        _riderRepo = riderRepo;
        _uow = uow;
    }

    public async Task<RiderProfileDto> Handle(UpdateRiderStatusCommand command, CancellationToken cancellationToken)
    {
        var profile = await _riderRepo.GetByUserIdAsync(command.UserId, cancellationToken)
            ?? throw new NotFoundException("RiderProfile", command.UserId);

        if (profile.ApprovalStatus != Domain.Enums.ApprovalStatus.Approved)
            throw new InvalidOperationException("Rider must be approved before going online.");

        profile.IsOnline = command.IsOnline;
        profile.UpdatedAt = DateTime.UtcNow;

        await _riderRepo.UpdateAsync(profile, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new RiderProfileDto(
            profile.Id, profile.UserId, profile.User?.FullName ?? "", profile.VehicleType,
            profile.LicensePlate, profile.ApprovalStatus, profile.Rating, profile.TotalCompletedTasks,
            profile.IsOnline, profile.CurrentLatitude, profile.CurrentLongitude,
            profile.LastLocationUpdate, profile.CreatedAt
        );
    }
}
