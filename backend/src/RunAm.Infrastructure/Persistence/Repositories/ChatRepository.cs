using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Persistence.Repositories;

public class ChatRepository : IChatRepository
{
    private readonly AppDbContext _db;

    public ChatRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<ChatMessage>> GetByErrandIdAsync(Guid errandId, int page, int pageSize, CancellationToken ct = default)
        => await _db.ChatMessages
            .Include(m => m.Sender)
            .Where(m => m.ErrandId == errandId)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task<int> GetCountByErrandIdAsync(Guid errandId, CancellationToken ct = default)
        => await _db.ChatMessages.CountAsync(m => m.ErrandId == errandId, ct);

    public async Task AddAsync(ChatMessage message, CancellationToken ct = default)
        => await _db.ChatMessages.AddAsync(message, ct);

    public async Task MarkAsReadAsync(Guid errandId, Guid userId, CancellationToken ct = default)
        => await _db.ChatMessages
            .Where(m => m.ErrandId == errandId && m.SenderId != userId && !m.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsRead, true), ct);
}
