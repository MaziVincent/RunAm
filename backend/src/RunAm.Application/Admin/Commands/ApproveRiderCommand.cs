using MediatR;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Riders;

namespace RunAm.Application.Admin.Commands;

public record ApproveRiderCommand(Guid RiderId, ApproveRiderRequest Request) : IRequest<RiderProfileDto>;

public class ApproveRiderCommandHandler : IRequestHandler<ApproveRiderCommand, RiderProfileDto>
{
    private readonly IRiderRepository _riderRepo;
    private readonly IUnitOfWork _uow;

    public ApproveRiderCommandHandler(IRiderRepository riderRepo, IUnitOfWork uow)
    {
        _riderRepo = riderRepo;
        _uow = uow;
    }

    public async Task<RiderProfileDto> Handle(ApproveRiderCommand command, CancellationToken cancellationToken)
    {
        var rider = await _riderRepo.GetByIdAsync(command.RiderId, cancellationToken)
            ?? throw new NotFoundException("RiderProfile", command.RiderId);

        rider.ApprovalStatus = command.Request.Status;
        rider.UpdatedAt = DateTime.UtcNow;

        await _riderRepo.UpdateAsync(rider, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new RiderProfileDto(
            rider.Id, rider.UserId, rider.User?.FullName ?? "", rider.VehicleType,
            rider.LicensePlate, rider.ApprovalStatus, rider.Rating, rider.TotalCompletedTasks,
            rider.IsOnline, rider.CurrentLatitude, rider.CurrentLongitude,
            rider.LastLocationUpdate, rider.CreatedAt
        );
    }
}
