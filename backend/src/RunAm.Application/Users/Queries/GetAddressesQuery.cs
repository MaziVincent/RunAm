using MediatR;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs;

namespace RunAm.Application.Users.Queries;

public record GetAddressesQuery(Guid UserId) : IRequest<IReadOnlyList<UserAddressDto>>;

public class GetAddressesQueryHandler : IRequestHandler<GetAddressesQuery, IReadOnlyList<UserAddressDto>>
{
    private readonly IUserAddressRepository _repo;

    public GetAddressesQueryHandler(IUserAddressRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<UserAddressDto>> Handle(GetAddressesQuery query, CancellationToken cancellationToken)
    {
        var addresses = await _repo.GetByUserIdAsync(query.UserId, cancellationToken);
        return addresses.Select(a => new UserAddressDto(a.Id, a.Label, a.Address, a.Latitude, a.Longitude, a.IsDefault)).ToList();
    }
}
