using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;
using RunAm.Infrastructure.Persistence;

namespace RunAm.Infrastructure.Persistence.Repositories;

public class UserAddressRepository : IUserAddressRepository
{
    private readonly AppDbContext _db;

    public UserAddressRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<UserAddress>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
        => await _db.UserAddresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenBy(a => a.Label)
            .ToListAsync(ct);

    public async Task<UserAddress?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.UserAddresses.FindAsync(new object[] { id }, ct);

    public async Task AddAsync(UserAddress address, CancellationToken ct = default)
        => await _db.UserAddresses.AddAsync(address, ct);

    public Task UpdateAsync(UserAddress address, CancellationToken ct = default)
    {
        _db.UserAddresses.Update(address);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(UserAddress address, CancellationToken ct = default)
    {
        _db.UserAddresses.Remove(address);
        return Task.CompletedTask;
    }
}
