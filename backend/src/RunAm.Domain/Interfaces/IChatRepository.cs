using RunAm.Domain.Entities;

namespace RunAm.Domain.Interfaces;

public interface IChatRepository
{
    Task<IReadOnlyList<ChatMessage>> GetByErrandIdAsync(Guid errandId, int page, int pageSize, CancellationToken ct = default);
    Task AddAsync(ChatMessage message, CancellationToken ct = default);
    Task MarkAsReadAsync(Guid errandId, Guid userId, CancellationToken ct = default);
}
