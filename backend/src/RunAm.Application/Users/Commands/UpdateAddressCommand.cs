using MediatR;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs;

namespace RunAm.Application.Users.Commands;

public record UpdateAddressCommand(Guid UserId, Guid AddressId, UpdateAddressRequest Request) : IRequest<UserAddressDto>;

public class UpdateAddressCommandHandler : IRequestHandler<UpdateAddressCommand, UserAddressDto>
{
    private readonly IUserAddressRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpdateAddressCommandHandler(IUserAddressRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<UserAddressDto> Handle(UpdateAddressCommand command, CancellationToken cancellationToken)
    {
        var address = await _repo.GetByIdAsync(command.AddressId, cancellationToken)
            ?? throw new NotFoundException("UserAddress", command.AddressId);

        if (address.UserId != command.UserId)
        {
            throw new UnauthorizedAccessException("You can only update your own saved addresses.");
        }

        var request = command.Request;
        var addresses = await _repo.GetByUserIdAsync(command.UserId, cancellationToken);
        var shouldBeDefault = request.IsDefault == true;

        if (shouldBeDefault)
        {
            foreach (var existing in addresses.Where(a => a.Id != address.Id && a.IsDefault))
            {
                existing.IsDefault = false;
                await _repo.UpdateAsync(existing, cancellationToken);
            }
        }

        address.Label = request.Label?.Trim() ?? address.Label;
        address.Address = request.Address?.Trim() ?? address.Address;
        address.Latitude = request.Latitude ?? address.Latitude;
        address.Longitude = request.Longitude ?? address.Longitude;

        if (request.IsDefault.HasValue)
        {
            address.IsDefault = request.IsDefault.Value;
        }

        if (!address.IsDefault)
        {
            var otherDefault = addresses.Any(a => a.Id != address.Id && a.IsDefault);
            if (!otherDefault)
            {
                var fallback = addresses.FirstOrDefault(a => a.Id != address.Id);
                if (fallback is not null)
                {
                    fallback.IsDefault = true;
                    await _repo.UpdateAsync(fallback, cancellationToken);
                }
            }
        }

        await _repo.UpdateAsync(address, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new UserAddressDto(address.Id, address.Label, address.Address, address.Latitude, address.Longitude, address.IsDefault);
    }
}
