using RunAm.Domain.Entities;

namespace RunAm.Domain.Interfaces;

public interface IUserAddressRepository
{
    Task<IReadOnlyList<UserAddress>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<UserAddress?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(UserAddress address, CancellationToken ct = default);
    Task UpdateAsync(UserAddress address, CancellationToken ct = default);
    Task DeleteAsync(UserAddress address, CancellationToken ct = default);
}
