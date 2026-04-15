using MediatR;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;

namespace RunAm.Application.Users.Commands;

public record DeleteAddressCommand(Guid UserId, Guid AddressId) : IRequest<Unit>;

public class DeleteAddressCommandHandler : IRequestHandler<DeleteAddressCommand, Unit>
{
    private readonly IUserAddressRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeleteAddressCommandHandler(IUserAddressRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<Unit> Handle(DeleteAddressCommand command, CancellationToken cancellationToken)
    {
        var address = await _repo.GetByIdAsync(command.AddressId, cancellationToken)
            ?? throw new NotFoundException("UserAddress", command.AddressId);

        if (address.UserId != command.UserId)
        {
            throw new UnauthorizedAccessException("You can only delete your own saved addresses.");
        }

        var remainingAddresses = (await _repo.GetByUserIdAsync(command.UserId, cancellationToken))
            .Where(a => a.Id != address.Id)
            .ToList();

        if (address.IsDefault)
        {
            var nextDefault = remainingAddresses.FirstOrDefault();
            if (nextDefault is not null)
            {
                nextDefault.IsDefault = true;
                await _repo.UpdateAsync(nextDefault, cancellationToken);
            }
        }

        await _repo.DeleteAsync(address, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
