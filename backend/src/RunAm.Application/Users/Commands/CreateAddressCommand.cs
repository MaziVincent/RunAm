using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs;

namespace RunAm.Application.Users.Commands;

public record CreateAddressCommand(Guid UserId, CreateAddressRequest Request) : IRequest<UserAddressDto>;

public class CreateAddressCommandHandler : IRequestHandler<CreateAddressCommand, UserAddressDto>
{
    private readonly IUserAddressRepository _repo;
    private readonly IUnitOfWork _uow;

    public CreateAddressCommandHandler(IUserAddressRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<UserAddressDto> Handle(CreateAddressCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var existing = await _repo.GetByUserIdAsync(command.UserId, cancellationToken);
        var shouldBeDefault = request.IsDefault || existing.Count == 0;

        if (shouldBeDefault)
        {
            foreach (var addr in existing.Where(a => a.IsDefault))
            {
                addr.IsDefault = false;
                await _repo.UpdateAsync(addr, cancellationToken);
            }
        }

        var address = new UserAddress
        {
            UserId = command.UserId,
            Label = request.Label,
            Address = request.Address,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            IsDefault = shouldBeDefault
        };

        await _repo.AddAsync(address, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new UserAddressDto(address.Id, address.Label, address.Address, address.Latitude, address.Longitude, address.IsDefault);
    }
}
