using MediatR;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs;

namespace RunAm.Application.Users.Commands;

public record SetDefaultAddressCommand(Guid UserId, Guid AddressId) : IRequest<UserAddressDto>;

public class SetDefaultAddressCommandHandler : IRequestHandler<SetDefaultAddressCommand, UserAddressDto>
{
    private readonly IUserAddressRepository _repo;
    private readonly IUnitOfWork _uow;

    public SetDefaultAddressCommandHandler(IUserAddressRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<UserAddressDto> Handle(SetDefaultAddressCommand command, CancellationToken cancellationToken)
    {
        var address = await _repo.GetByIdAsync(command.AddressId, cancellationToken)
            ?? throw new NotFoundException("UserAddress", command.AddressId);

        if (address.UserId != command.UserId)
        {
            throw new UnauthorizedAccessException("You can only update your own saved addresses.");
        }

        var addresses = await _repo.GetByUserIdAsync(command.UserId, cancellationToken);
        foreach (var existing in addresses.Where(a => a.Id != address.Id && a.IsDefault))
        {
            existing.IsDefault = false;
            await _repo.UpdateAsync(existing, cancellationToken);
        }

        address.IsDefault = true;
        await _repo.UpdateAsync(address, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new UserAddressDto(address.Id, address.Label, address.Address, address.Latitude, address.Longitude, address.IsDefault);
    }
}
